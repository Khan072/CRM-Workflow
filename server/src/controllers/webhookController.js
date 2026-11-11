const Lead = require('../models/Lead');
const aiService = require('../services/aiService');
const { calculateScore, scoreToPriority, scoreToStage } = require('../services/leadScoringService');
const { findDuplicates } = require('../services/duplicateDetectionService');

/**
 * Verify Make.com webhook secret to prevent unauthorized calls.
 */
function verifyWebhookSecret(req, res, next) {
  const secret = req.headers['x-webhook-secret'];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    // If no secret configured, skip verification (dev mode)
    console.warn('[Webhook] WEBHOOK_SECRET not set — skipping secret verification');
    return next();
  }

  if (!secret || secret !== expectedSecret) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid webhook secret',
    });
  }

  next();
}

/**
 * Normalize payload from Make.com for WhatsApp messages.
 *
 * Make.com sends WhatsApp data in this format:
 * {
 *   "from": "919876543210",
 *   "name": "Rahul Sharma",
 *   "message": "Hello, I want to buy 10 boxes of product",
 *   "channel": "whatsapp"          // optional, defaults to "whatsapp"
 * }
 */
function normalizeWhatsAppPayload(body) {
  return {
    customerName: body.name || body.customerName || 'Unknown',
    customerContact: body.from || body.phone || body.customerContact || '',
    channel: 'whatsapp',
    messageText: body.message || body.text || body.messageText || '',
  };
}

/**
 * Normalize payload from Make.com for Instagram messages.
 *
 * Make.com sends Instagram data in this format:
 * {
 *   "username": "rahul_sharma",
 *   "message": "Hi, I saw your product. Is it available?",
 *   "channel": "instagram"         // optional, defaults to "instagram"
 * }
 */
function normalizeInstagramPayload(body) {
  return {
    customerName: body.name || body.username || body.customerName || 'Unknown',
    customerContact: body.username || body.instagram_id || body.customerContact || '',
    channel: 'instagram',
    messageText: body.message || body.text || body.messageText || '',
  };
}

/**
 * Normalize payload from Make.com or Meta Webhook for Facebook messages.
 *
 * Supported formats:
 * {
 *   "name": "Anil Kapoor",
 *   "from": "anil.k@facebook.com", // or phone or facebook_id
 *   "message": "Interested in bulk ordering corporate t-shirts",
 *   "channel": "facebook"
 * }
 */
function normalizeFacebookPayload(body) {
  return {
    customerName: body.name || body.customerName || body.sender_name || body.full_name || 'Unknown',
    customerContact: body.from || body.phone || body.email || body.facebook_id || body.sender_id || body.customerContact || '',
    channel: 'facebook',
    messageText: body.message || body.text || body.messageText || '',
  };
}

/**
 * Normalize payload from Website contact forms, lead widgets, or live chats.
 *
 * Supported formats:
 * {
 *   "name": "Sarah Jenkins",
 *   "email": "sarah@company.com",
 *   "phone": "+91-9876543210",
 *   "message": "Looking for custom hoodies with our company logo",
 *   "channel": "website"
 * }
 */
function normalizeWebsitePayload(body) {
  return {
    customerName: body.name || body.customerName || body.fullName || 'Unknown',
    customerContact: body.email || body.phone || body.contact || body.from || body.customerContact || '',
    channel: 'website',
    messageText: body.message || body.text || body.messageText || body.inquiry || '',
  };
}

/**
 * Core logic: Create or update a lead from normalized data.
 * Shared by all webhook handlers (WhatsApp, Instagram, Facebook, Website).
 */
async function processIncomingMessage({ customerName, customerContact, channel, messageText, _makecomMessageId, _makecomTimestamp, _source }) {
  // Coerce messageText to string — guards against nested objects slipping through normalizers
  const text = typeof messageText === 'object'
    ? (messageText?.text || messageText?.body || JSON.stringify(messageText))
    : String(messageText || '');

  if (!text || text.trim() === '') {
    throw new Error('Empty message — skipped');
  }

  // Use normalised text from here on
  const resolvedText = text;

  // Check for duplicate lead by contact
  if (customerContact) {
    const dupes = await findDuplicates(customerContact, customerName, channel);
    if (dupes.exactMatch) {
      const existingLead = dupes.exactMatch;

      // Append new message to existing lead
      existingLead.activities.push({
        type: 'message_received',
        content: { text: resolvedText, channel },
        actor: 'customer',
      });

      // Re-analyze with latest message
      const aiAnalysis = await aiService.analyzeMessage(resolvedText, channel, customerName);
      const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

      existingLead.aiAnalysis = cleanAnalysis;
      existingLead.activities.push({
        type: 'ai_analysis',
        content: {
          ...cleanAnalysis,
          provider: _aiProvider,
          ...(_aiError && { error: _aiError }),
        },
        actor: 'system',
      });

      // Recalculate score
      const { score, breakdown } = calculateScore(cleanAnalysis, resolvedText, channel, !!customerContact);
      existingLead.leadScore = score;
      existingLead.scoreBreakdown = breakdown;
      existingLead.priority = scoreToPriority(score);

      await existingLead.save();

      return { lead: existingLead, isDuplicate: true };
    }
  }

  // AI Analysis for new lead
  const aiAnalysis = await aiService.analyzeMessage(resolvedText, channel, customerName);
  const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

  // Calculate lead score
  const { score, breakdown } = calculateScore(cleanAnalysis, resolvedText, channel, !!customerContact);
  const priority = scoreToPriority(score);
  const stage = scoreToStage(score, cleanAnalysis.intent);

  // Create new lead
  const lead = new Lead({
    customerName,
    customerContact: customerContact || '',
    channel,
    stage,
    priority,
    leadScore: score,
    scoreBreakdown: breakdown,
    aiAnalysis: cleanAnalysis,
    originalMessage: resolvedText,
    activities: [
      {
        type: 'lead_created',
        content: { channel, source: 'make_com_webhook' },
        actor: 'system',
      },
      {
        type: 'message_received',
        content: { text: resolvedText, channel },
        actor: 'customer',
      },
      {
        type: 'ai_analysis',
        content: {
          ...cleanAnalysis,
          provider: _aiProvider,
          ...(_aiError && { error: _aiError }),
        },
        actor: 'system',
      },
    ],
  });

  await lead.save();

  return { lead, isDuplicate: false };
}

/**
 * POST /api/webhook/whatsapp
 * Receives WhatsApp messages forwarded by Make.com.
 */
async function handleWhatsApp(req, res, next) {
  try {
    console.log('[Webhook] WhatsApp message received from Make.com:', JSON.stringify(req.body));

    const normalized = normalizeWhatsAppPayload(req.body);

    if (!normalized.messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required (field: message or text)',
      });
    }

    const { lead, isDuplicate } = await processIncomingMessage(normalized);

    console.log(`[Webhook] WhatsApp lead ${isDuplicate ? 'updated' : 'created'}: ${lead._id}`);

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      data: {
        leadId: lead._id,
        customerName: lead.customerName,
        stage: lead.stage,
        leadScore: lead.leadScore,
        priority: lead.priority,
      },
      isDuplicate,
      message: isDuplicate
        ? 'New message added to existing lead'
        : 'New lead created from WhatsApp message',
    });
  } catch (error) {
    console.error('[Webhook] WhatsApp error:', error.message);
    next(error);
  }
}

/**
 * POST /api/webhook/instagram
 * Receives Instagram DM messages forwarded by Make.com.
 */
async function handleInstagram(req, res, next) {
  try {
    console.log('[Webhook] Instagram message received from Make.com:', JSON.stringify(req.body));

    const normalized = normalizeInstagramPayload(req.body);

    if (!normalized.messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required (field: message or text)',
      });
    }

    const { lead, isDuplicate } = await processIncomingMessage(normalized);

    console.log(`[Webhook] Instagram lead ${isDuplicate ? 'updated' : 'created'}: ${lead._id}`);

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      data: {
        leadId: lead._id,
        customerName: lead.customerName,
        stage: lead.stage,
        leadScore: lead.leadScore,
        priority: lead.priority,
      },
      isDuplicate,
      message: isDuplicate
        ? 'New message added to existing lead'
        : 'New lead created from Instagram message',
    });
  } catch (error) {
    console.error('[Webhook] Instagram error:', error.message);
    next(error);
  }
}

/**
 * POST /api/webhook/facebook
 * Receives Facebook Messenger / Lead Ad messages forwarded by Make.com or Meta Webhooks.
 */
async function handleFacebook(req, res, next) {
  try {
    console.log('[Webhook] Facebook message received from Make.com/Meta:', JSON.stringify(req.body));

    const normalized = normalizeFacebookPayload(req.body);

    if (!normalized.messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required (field: message or text)',
      });
    }

    const { lead, isDuplicate } = await processIncomingMessage(normalized);

    console.log(`[Webhook] Facebook lead ${isDuplicate ? 'updated' : 'created'}: ${lead._id}`);

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      data: {
        leadId: lead._id,
        customerName: lead.customerName,
        stage: lead.stage,
        leadScore: lead.leadScore,
        priority: lead.priority,
      },
      isDuplicate,
      message: isDuplicate
        ? 'New message added to existing lead'
        : 'New lead created from Facebook message',
    });
  } catch (error) {
    console.error('[Webhook] Facebook error:', error.message);
    next(error);
  }
}

/**
 * POST /api/webhook/website
 * Receives Website contact forms or chat widget submissions forwarded by Make.com or web form.
 */
async function handleWebsite(req, res, next) {
  try {
    console.log('[Webhook] Website inquiry received:', JSON.stringify(req.body));

    const normalized = normalizeWebsitePayload(req.body);

    if (!normalized.messageText) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required (field: message, text, or inquiry)',
      });
    }

    const { lead, isDuplicate } = await processIncomingMessage(normalized);

    console.log(`[Webhook] Website lead ${isDuplicate ? 'updated' : 'created'}: ${lead._id}`);

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      data: {
        leadId: lead._id,
        customerName: lead.customerName,
        stage: lead.stage,
        leadScore: lead.leadScore,
        priority: lead.priority,
      },
      isDuplicate,
      message: isDuplicate
        ? 'New message added to existing lead'
        : 'New lead created from Website inquiry',
    });
  } catch (error) {
    console.error('[Webhook] Website error:', error.message);
    next(error);
  }
}

/**
 * GET /api/webhook/health
 * Make.com connection test endpoint.
 */
function webhookHealth(req, res) {
  res.json({
    success: true,
    message: 'Worth Prime Global CRM Webhook is active and ready',
    client: 'Worth Prime Global — Business Setup & Consulting | UAE & Saudi Arabia',
    endpoints: {
      whatsapp: 'POST /api/webhook/whatsapp',
      instagram: 'POST /api/webhook/instagram',
      facebook: 'POST /api/webhook/facebook',
      website: 'POST /api/webhook/website',
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  verifyWebhookSecret,
  handleWhatsApp,
  handleInstagram,
  handleFacebook,
  handleWebsite,
  webhookHealth,
};
