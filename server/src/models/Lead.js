const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'message_received',
      'ai_analysis',
      'stage_change',
      'reply_sent',
      'note_added',
      'field_edited',
      'lead_created',
    ],
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  actor: {
    type: String,
    enum: ['customer', 'system', 'salesperson'],
    default: 'system',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const aiAnalysisSchema = new mongoose.Schema({
  intent: {
    type: String,
    default: 'unknown',
  },
  products: {
    type: [String],
    default: [],
  },
  quantity: {
    type: String,
    default: '',
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  urgencyReason: {
    type: String,
    default: '',
  },
  keyRequirements: {
    type: [String],
    default: [],
  },
  suggestedReply: {
    type: String,
    default: '',
  },
  nextAction: {
    type: String,
    default: '',
  },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
}, { _id: false });

const scoreBreakdownSchema = new mongoose.Schema({
  hasProduct: { type: Number, default: 0 },
  hasQuantity: { type: Number, default: 0 },
  hasTimeline: { type: Number, default: 0 },
  intentSignal: { type: Number, default: 0 },
  hasContactInfo: { type: Number, default: 0 },
  messageRichness: { type: Number, default: 0 },
  channelQuality: { type: Number, default: 0 },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  customerContact: {
    type: String,
    trim: true,
    default: '',
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'instagram', 'facebook', 'website'],
    required: [true, 'Channel is required'],
  },
  stage: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
    default: 'new',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  scoreBreakdown: {
    type: scoreBreakdownSchema,
    default: () => ({}),
  },
  aiAnalysis: {
    type: aiAnalysisSchema,
    default: () => ({}),
  },
  isAiOverridden: {
    type: Boolean,
    default: false,
  },
  originalMessage: {
    type: String,
    required: [true, 'Original message is required'],
  },
  activities: {
    type: [activitySchema],
    default: [],
  },
}, {
  timestamps: true,
});

// Index for duplicate detection and common queries
leadSchema.index({ customerContact: 1 });
leadSchema.index({ stage: 1, priority: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
