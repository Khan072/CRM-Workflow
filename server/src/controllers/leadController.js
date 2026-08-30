const Lead = require('../models/Lead');
const aiService = require('../services/aiService');
const { calculateScore, scoreToPriority, scoreToStage } = require('../services/leadScoringService');
const { findDuplicates } = require('../services/duplicateDetectionService');

/**
 * POST /api/leads — Create a new lead from an incoming message.
 * Triggers AI analysis, scoring, and stage assignment.
 */
async function createLead(req, res, next) {
  try {
    const { customerName, customerContact, channel, messageText } = req.body;

    // Check for duplicates
    if (customerContact) {
      const dupes = await findDuplicates(customerContact, customerName, channel);
      if (dupes.exactMatch) {
        // Append message to existing lead instead of creating duplicate
        const existingLead = dupes.exactMatch;
        existingLead.activities.push({
          type: 'message_received',
          content: { text: messageText, channel },
          actor: 'customer',
        });

        // Re-analyze with latest message for updated insights
        const aiAnalysis = await aiService.analyzeMessage(messageText, channel, customerName);
        const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

        existingLead.aiAnalysis = cleanAnalysis;
        existingLead.activities.push({
          type: 'ai_analysis',
          content: {
            ...cleanAnalysis,
            provider: _aiProvider,
            ..._aiError && { error: _aiError },
          },
          actor: 'system',
        });

        // Recalculate score
        const { score, breakdown } = calculateScore(cleanAnalysis, messageText, channel, !!customerContact);
        existingLead.leadScore = score;
        existingLead.scoreBreakdown = breakdown;
        existingLead.priority = scoreToPriority(score);

        await existingLead.save();

        return res.status(200).json({
          success: true,
          data: existingLead,
          isDuplicate: true,
          message: 'Message added to existing lead',
        });
      }
    }

    // AI Analysis
    const aiAnalysis = await aiService.analyzeMessage(messageText, channel, customerName);
    const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

    // Calculate lead score
    const { score, breakdown } = calculateScore(cleanAnalysis, messageText, channel, !!customerContact);
    const priority = scoreToPriority(score);
    const stage = scoreToStage(score, cleanAnalysis.intent);

    // Create lead
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
          content: { channel },
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

    res.status(201).json({
      success: true,
      data: lead,
      isDuplicate: false,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/leads — List all leads with optional filtering.
 */
async function getLeads(req, res, next) {
  try {
    const { stage, priority, channel, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = {};
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (channel) filter.channel = channel;
    if (search) {
      filter.$or = [
        { customerName: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { originalMessage: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'leadScore', 'customerName'].includes(sortBy) ? sortBy : 'createdAt';

    const leads = await Lead.find(filter)
      .sort({ [sortField]: sortOrder })
      .select('-activities') // Exclude activities for list view performance
      .lean();

    res.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/leads/:id — Get a single lead with full activity history.
 */
async function getLeadById(req, res, next) {
  try {
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/leads/:id — Update lead fields (stage, priority, AI overrides).
 */
async function updateLead(req, res, next) {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { stage, priority, aiAnalysis, customerName, customerContact } = req.body;

    // Track changes for activity log
    if (stage && stage !== lead.stage) {
      lead.activities.push({
        type: 'stage_change',
        content: { from: lead.stage, to: stage },
        actor: 'salesperson',
      });
      lead.stage = stage;
    }

    if (priority && priority !== lead.priority) {
      lead.activities.push({
        type: 'field_edited',
        content: { field: 'priority', from: lead.priority, to: priority },
        actor: 'salesperson',
      });
      lead.priority = priority;
    }

    if (aiAnalysis) {
      // Human override of AI fields
      const changes = [];
      for (const [key, value] of Object.entries(aiAnalysis)) {
        if (lead.aiAnalysis[key] !== undefined && JSON.stringify(lead.aiAnalysis[key]) !== JSON.stringify(value)) {
          changes.push({ field: key, from: lead.aiAnalysis[key], to: value });
          lead.aiAnalysis[key] = value;
        }
      }
      if (changes.length > 0) {
        lead.isAiOverridden = true;
        lead.activities.push({
          type: 'field_edited',
          content: { fields: changes, overrideType: 'ai_analysis' },
          actor: 'salesperson',
        });
      }
    }

    if (customerName) lead.customerName = customerName;
    if (customerContact !== undefined) lead.customerContact = customerContact;

    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/leads/:id/messages — Add a follow-up message to an existing lead.
 */
async function addMessage(req, res, next) {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { messageText, sender = 'customer' } = req.body;

    lead.activities.push({
      type: 'message_received',
      content: { text: messageText, channel: lead.channel },
      actor: sender,
    });

    // Re-analyze if customer message
    if (sender === 'customer') {
      const aiAnalysis = await aiService.analyzeMessage(messageText, lead.channel, lead.customerName);
      const { _aiProvider, _aiError, ...cleanAnalysis } = aiAnalysis;

      lead.aiAnalysis = cleanAnalysis;
      lead.isAiOverridden = false; // Reset override flag since we have new AI analysis

      lead.activities.push({
        type: 'ai_analysis',
        content: {
          ...cleanAnalysis,
          provider: _aiProvider,
          ...(_aiError && { error: _aiError }),
        },
        actor: 'system',
      });

      // Recalculate score
      const { score, breakdown } = calculateScore(cleanAnalysis, messageText, lead.channel, !!lead.customerContact);
      lead.leadScore = score;
      lead.scoreBreakdown = breakdown;
      lead.priority = scoreToPriority(score);
      lead.stage = scoreToStage(score, cleanAnalysis.intent);
    }

    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/leads/:id/reply — Save a sent reply to the activity log.
 */
async function sendReply(req, res, next) {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const { replyText } = req.body;
    if (!replyText || replyText.trim() === '') {
      return res.status(400).json({ success: false, error: 'Reply text is required' });
    }

    lead.activities.push({
      type: 'reply_sent',
      content: { text: replyText.trim(), channel: lead.channel },
      actor: 'salesperson',
    });

    // Auto-advance stage if still "new"
    if (lead.stage === 'new') {
      lead.activities.push({
        type: 'stage_change',
        content: { from: 'new', to: 'contacted', reason: 'Reply sent to customer' },
        actor: 'system',
      });
      lead.stage = 'contacted';
    }

    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/leads/check-duplicate — Check for duplicate before creation.
 */
async function checkDuplicate(req, res, next) {
  try {
    const { customerContact, customerName, channel } = req.query;
    const result = await findDuplicates(customerContact, customerName, channel);

    res.json({
      success: true,
      data: {
        hasDuplicate: !!result.exactMatch,
        exactMatch: result.exactMatch ? {
          _id: result.exactMatch._id,
          customerName: result.exactMatch.customerName,
          stage: result.exactMatch.stage,
        } : null,
        possibleMatches: result.possibleMatches.map((m) => ({
          _id: m._id,
          customerName: m.customerName,
          stage: m.stage,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  addMessage,
  sendReply,
  checkDuplicate,
};
