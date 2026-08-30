/**
 * Lead Scoring Service — Transparent, configurable scoring logic.
 *
 * Score 0-100, calculated from weighted factors.
 * Each factor's contribution is visible in the scoreBreakdown.
 * Business owners can adjust weights to match their sales process.
 */

// Weights are configurable — these are sensible defaults for a B2B custom product business
const WEIGHTS = {
  hasProduct: 20,      // Customer mentioned a specific product/service
  hasQuantity: 15,     // Customer mentioned a quantity
  hasTimeline: 15,     // Customer mentioned a deadline or timeline
  intentSignal: 20,    // Purchase/pricing intent vs. support/greeting
  hasContactInfo: 10,  // Customer provided phone/email
  messageRichness: 10, // Message length and detail level
  channelQuality: 10,  // Channel signal (WhatsApp tends to be more direct)
};

// Intent → signal strength mapping
const INTENT_SCORES = {
  purchase_request: 1.0,
  pricing_inquiry: 0.85,
  product_inquiry: 0.6,
  follow_up: 0.5,
  general_inquiry: 0.3,
  support: 0.15,
  greeting: 0.0,
  unknown: 0.0,
};

/**
 * Calculate a lead score with transparent breakdown.
 */
function calculateScore(aiAnalysis, messageText, channel, hasContactInfo = false) {
  const breakdown = {
    hasProduct: 0,
    hasQuantity: 0,
    hasTimeline: 0,
    intentSignal: 0,
    hasContactInfo: 0,
    messageRichness: 0,
    channelQuality: 0,
  };

  // Factor 1: Product specificity
  if (aiAnalysis.products && aiAnalysis.products.length > 0) {
    breakdown.hasProduct = WEIGHTS.hasProduct;
  }

  // Factor 2: Quantity mentioned
  if (aiAnalysis.quantity && aiAnalysis.quantity.trim() !== '') {
    breakdown.hasQuantity = WEIGHTS.hasQuantity;
  }

  // Factor 3: Timeline/urgency
  if (aiAnalysis.urgency === 'high') {
    breakdown.hasTimeline = WEIGHTS.hasTimeline;
  } else if (aiAnalysis.urgency === 'medium') {
    breakdown.hasTimeline = Math.round(WEIGHTS.hasTimeline * 0.6);
  }

  // Factor 4: Intent signal
  const intentStrength = INTENT_SCORES[aiAnalysis.intent] ?? INTENT_SCORES.unknown;
  breakdown.intentSignal = Math.round(WEIGHTS.intentSignal * intentStrength);

  // Factor 5: Contact info
  if (hasContactInfo) {
    breakdown.hasContactInfo = WEIGHTS.hasContactInfo;
  }

  // Factor 6: Message richness (word count heuristic)
  const wordCount = (messageText || '').split(/\s+/).filter(Boolean).length;
  if (wordCount >= 30) {
    breakdown.messageRichness = WEIGHTS.messageRichness;
  } else if (wordCount >= 15) {
    breakdown.messageRichness = Math.round(WEIGHTS.messageRichness * 0.6);
  } else if (wordCount >= 5) {
    breakdown.messageRichness = Math.round(WEIGHTS.messageRichness * 0.3);
  }

  // Factor 7: Channel quality
  if (channel === 'whatsapp') {
    breakdown.channelQuality = WEIGHTS.channelQuality;
  } else if (channel === 'instagram') {
    breakdown.channelQuality = Math.round(WEIGHTS.channelQuality * 0.7);
  }

  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    score: Math.min(totalScore, 100),
    breakdown,
  };
}

/**
 * Map score to priority level.
 */
function scoreToPriority(score) {
  if (score >= 61) return 'high';
  if (score >= 31) return 'medium';
  return 'low';
}

/**
 * Map score + intent to an appropriate CRM stage.
 * Logic:
 * - Greeting/no info → "new" (not enough to act on)
 * - Product interest but missing details → "contacted" (need more info)
 * - Product + quantity + timeline → "qualified" (sales-ready)
 * - Explicit purchase intent with details → "proposal" (ready to quote)
 */
function scoreToStage(score, intent) {
  if (intent === 'greeting' || intent === 'unknown') return 'new';
  if (intent === 'support') return 'new'; // Support ≠ sales lead, but track it
  if (intent === 'purchase_request' && score >= 50) return 'proposal';
  if (score >= 50) return 'qualified';
  if (score >= 25) return 'contacted';
  return 'new';
}

module.exports = { calculateScore, scoreToPriority, scoreToStage, WEIGHTS };
