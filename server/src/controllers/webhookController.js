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
 * Core logic: Create or update a lead from normalized data.
 * Shared by both WhatsApp and Instagram webhook handlers.
 */
async function processIncomingMessage({ customerName, customerContact, channel, messageText }) {
  if (!messageText || messageText.trim() === '') {
    throw new Error('Empty message — skipped');
  }

  // Check for duplicate lead by contact
  if (customerContact) {
    const dupes = await findDuplicates(customerContact, customerName, channel);
    if (dupes.exactMatch) {
      const existingLead = dupes.exactMatch;

      // Append new message to existing lead
      existingLead.activities.push({
        type: 'message_received',
        content: { text: messageText, channel },
        actor: 'customer',
      });

      // Re-analyze with latest message
      const aiAnalysis = await aiService.analyzeMessage(messageText, channel, customerName);
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
      const { score, breakdown } = calculateScore(cleanAnalysis, messageText, channel, !!customerContact);
      existingLead.leadScore = score;
      existingLead.scoreBreakdown = breakdown;
      existingLead.priority = scoreToPriority(score);

      await existingLead.save();

      return { lead: existingLead, isDuplicate: true };
    }
  }

  // AI Analysis for new lead
  const aiAnalysis = await aiService.analyzeMessage(messageText, channel, customerName);
  const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

  // Calculate lead score
  const { score, breakdown } = calculateScore(cleanAnalysis, messageText, channel, !!customerContact);
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
    originalMessage: messageText,
    activities: [
      {
        type: 'lead_created',
        content: { channel, source: 'make_com_webhook' },
        actor: 'system',
      },
      {
        type: 'message_received',
        content: { text: messageText, channel },
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
 * GET /api/webhook/health
 * Make.com connection test endpoint.
 */
function webhookHealth(req, res) {
  res.json({
    success: true,
    message: 'CRM Webhook is active and ready',
    endpoints: {
      whatsapp: 'POST /api/webhook/whatsapp',
      instagram: 'POST /api/webhook/instagram',
    },
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  verifyWebhookSecret,
  handleWhatsApp,
  handleInstagram,
  webhookHealth,
};
