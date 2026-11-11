/**
 * Lead Scoring Service — Transparent, configurable scoring logic.
 *
 * Score 0-100, calculated from weighted factors.
 * Each factor's contribution is visible in the scoreBreakdown.
 * Business owners can adjust weights to match their sales process.
 *
 * Tuned for Worth Prime Global — B2B international trade & consulting.
 * Key signals: service/solution interest, budget/project size, decision-maker contact,
 * business context, and timeline. Quantity is less relevant; replaced by project scope.
 */

// Weights tuned for B2B professional services / international trade
const WEIGHTS = {
  hasProduct: 20,      // Customer mentioned a specific service or solution area
  hasQuantity: 10,     // Project scale/scope mentioned (team size, volume, budget range)
  hasTimeline: 15,     // Project deadline or start date mentioned
  intentSignal: 25,    // Inquiry/proposal/partnership intent vs. support/greeting (higher weight for B2B)
  hasContactInfo: 15,  // Business email / phone / company name (higher weight — B2B lead quality signal)
  messageRichness: 10, // Message detail level (B2B buyers write longer, more specific messages)
  channelQuality: 5,   // Channel signal (website/email = higher intent for B2B)
};

// Intent → signal strength mapping (B2B: partnership/consultation = high value)
const INTENT_SCORES = {
  purchase_request: 1.0,       // Direct request for service/solution
  pricing_inquiry: 0.85,       // Asking for quotes/proposals
  product_inquiry: 0.65,       // Exploring services/solutions
  partnership_inquiry: 0.9,    // B2B partnership / collaboration interest
  consultation_request: 0.95,  // Requesting a call/meeting — very high B2B signal
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

  // Factor 2: Project scope / scale mentioned (replaces raw "quantity" for B2B)
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

  // Factor 7: Channel quality — for B2B, website form = highest intent signal
  if (channel === 'website') {
    breakdown.channelQuality = WEIGHTS.channelQuality;        // Website form = most deliberate B2B action
  } else if (channel === 'whatsapp') {
    breakdown.channelQuality = Math.round(WEIGHTS.channelQuality * 0.9); // Direct messaging = high intent
  } else if (channel === 'facebook' || channel === 'instagram') {
    breakdown.channelQuality = Math.round(WEIGHTS.channelQuality * 0.6); // Social = lower B2B intent
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
 * Logic for B2B consulting / company formation:
 * - Greeting/no info     → "new"       (not enough to act on)
 * - General service ask  → "contacted" (needs qualification call)
 * - Specific service +
 *   company context      → "qualified" (ready for proposal)
 * - Explicit consultation/
 *   proposal request     → "proposal"  (send formal proposal / schedule meeting)
 */
function scoreToStage(score, intent) {
  if (intent === 'greeting' || intent === 'unknown') return 'new';
  if (intent === 'support') return 'new';
  if ((intent === 'consultation_request' || intent === 'purchase_request') && score >= 50) return 'proposal';
  if (intent === 'partnership_inquiry' && score >= 40) return 'qualified';
  if (score >= 50) return 'qualified';
  if (score >= 25) return 'contacted';
  return 'new';
}

module.exports = { calculateScore, scoreToPriority, scoreToStage, WEIGHTS };
