

const PRODUCT_KEYWORDS = {
  't-shirt': 'Custom T-Shirts',
  'tshirt': 'Custom T-Shirts',
  'shirt': 'Shirts',
  'mug': 'Custom Mugs',
  'cup': 'Custom Cups/Mugs',
  'cap': 'Caps/Hats',
  'hat': 'Caps/Hats',
  'hoodie': 'Hoodies',
  'bag': 'Bags',
  'tote': 'Tote Bags',
  'pen': 'Branded Pens',
  'sticker': 'Stickers',
  'banner': 'Banners',
  'poster': 'Posters',
  'card': 'Business Cards',
  'flyer': 'Flyers',
  'brochure': 'Brochures',
  'uniform': 'Uniforms',
  'jersey': 'Jerseys',
  'packaging': 'Custom Packaging',
  'box': 'Custom Boxes',
  'label': 'Labels',
  'print': 'Printing Services',
  'logo': 'Logo Design',
  'design': 'Design Services',
};

const INTENT_PATTERNS = [
  { pattern: /\b(price|pricing|cost|rate|quote|quotation|how much|charges?)\b/i, intent: 'pricing_inquiry' },
  { pattern: /\b(buy|purchase|order|place.?order|want to buy|need)\b/i, intent: 'purchase_request' },
  { pattern: /\b(help|issue|problem|broken|defect|wrong|complain|return|refund|exchange)\b/i, intent: 'support' },
  { pattern: /\b(follow.?up|update|status|where|when|tracking|shipped)\b/i, intent: 'follow_up' },
  { pattern: /\b(interested|looking for|enquiry|inquiry|information|details|tell me|share)\b/i, intent: 'product_inquiry' },
];

const URGENCY_PATTERNS = [
  { pattern: /\b(urgent|asap|immediately|rush|today|tomorrow|right away)\b/i, level: 'high', reason: 'Customer used urgent language' },
  { pattern: /\b(next week|this week|soon|quickly|fast)\b/i, level: 'high', reason: 'Short timeline indicated' },
  { pattern: /\b(next month|few weeks|couple of weeks)\b/i, level: 'medium', reason: 'Moderate timeline mentioned' },
  { pattern: /\b(whenever|no rush|no hurry|take your time|flexible)\b/i, level: 'low', reason: 'Customer indicated no urgency' },
];

function extractProducts(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const [keyword, product] of Object.entries(PRODUCT_KEYWORDS)) {
    if (lower.includes(keyword)) {
      found.add(product);
    }
  }
  return [...found];
}

function extractIntent(text) {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  // Very short messages with no clear intent
  if (text.trim().length < 15) return 'greeting';
  return 'general_inquiry';
}

function extractQuantity(text) {
  const match = text.match(/(\d[\d,]*)\s*(pcs|pieces|units|nos|numbers|items|sets?|dozen|hundred|thousand)?/i);
  if (match) return match[0].trim();

  const wordNumbers = { 'a few': '~5', 'some': '~10', 'many': '50+', 'bulk': '100+', 'hundred': '100', 'thousand': '1000' };
  const lower = text.toLowerCase();
  for (const [word, qty] of Object.entries(wordNumbers)) {
    if (lower.includes(word)) return qty;
  }
  return '';
}

function extractUrgency(text) {
  for (const { pattern, level, reason } of URGENCY_PATTERNS) {
    if (pattern.test(text)) return { level, reason };
  }
  // Check for date mentions
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
    return { level: 'medium', reason: 'Specific month/date mentioned' };
  }
  return { level: 'low', reason: 'No urgency indicators detected' };
}

function extractKeyRequirements(text) {
  const requirements = [];
  if (/\b(custom|personali[sz]ed|branded|logo)\b/i.test(text)) requirements.push('Custom branding/logo required');
  if (/\b(deliver|shipping|ship|dispatch)\b/i.test(text)) requirements.push('Delivery/shipping details needed');
  if (/\b(color|colour|size|dimension|material|fabric)\b/i.test(text)) requirements.push('Product specifications discussed');
  if (/\b(sample|demo|trial|prototype)\b/i.test(text)) requirements.push('Sample/prototype requested');
  if (/\b(bulk|wholesale|large.?order)\b/i.test(text)) requirements.push('Bulk/wholesale order');
  if (/\b(event|occasion|conference|wedding|party)\b/i.test(text)) requirements.push('Event-specific order');
  if (/\b(deadline|due date|by .*(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(text)) requirements.push('Specific deadline mentioned');
  if (requirements.length === 0 && text.trim().length > 20) requirements.push('General inquiry — needs clarification');
  return requirements;
}

function generateReply(analysis, customerName) {
  const name = customerName || 'there';

  if (analysis.intent === 'greeting') {
    return `Hi ${name}! 👋\n\nThank you for reaching out to us. How can we help you today? We offer a wide range of products and services — feel free to share what you're looking for and we'll be happy to assist!\n\nBest regards`;
  }

  if (analysis.intent === 'support') {
    return `Hi ${name},\n\nThank you for contacting us. I'm sorry to hear you're experiencing an issue. Could you please share more details about the problem so we can assist you promptly?\n\nWe'll do our best to resolve this as quickly as possible.\n\nBest regards`;
  }

  const productMention = analysis.products.length > 0
    ? `regarding ${analysis.products.join(' and ')}`
    : 'about our products';

  const quantityMention = analysis.quantity
    ? ` for ${analysis.quantity} units`
    : '';

  return `Hi ${name},\n\nThank you for your inquiry ${productMention}${quantityMention}. We'd be happy to help!\n\nTo provide you with an accurate quote, could you please share:\n${analysis.products.length === 0 ? '• Which specific product(s) you are interested in\n' : ''}• Any specific design or customization requirements\n• Your preferred delivery timeline and location\n${!analysis.quantity ? '• The quantity you need\n' : ''}\nWe'll get back to you with detailed pricing and options shortly.\n\nBest regards`;
}

function generateNextAction(analysis) {
  if (analysis.intent === 'greeting') {
    return 'Send a welcome message and ask the customer what they are looking for.';
  }
  if (analysis.intent === 'support') {
    return 'Acknowledge the issue and collect problem details. Escalate to support team if needed.';
  }
  if (analysis.intent === 'follow_up') {
    return 'Check the order/inquiry status and provide an update to the customer.';
  }

  const actions = [];
  if (analysis.products.length > 0 && analysis.quantity) {
    actions.push(`Prepare a pricing quote for ${analysis.quantity} ${analysis.products.join(' / ')}.`);
  } else if (analysis.products.length > 0) {
    actions.push(`Ask for quantity requirements and share pricing for ${analysis.products.join(' / ')}.`);
  } else {
    actions.push('Clarify which products/services the customer is interested in.');
  }

  if (analysis.urgency.level === 'high') {
    actions.push('Prioritize this lead — customer has an urgent timeline.');
  }

  return actions.join(' ');
}

/**
 * Analyze a customer message using keyword-based mock AI.
 */
function analyzeMessage(messageText) {
  const intent = extractIntent(messageText);
  const products = extractProducts(messageText);
  const quantity = extractQuantity(messageText);
  const urgency = extractUrgency(messageText);
  const keyRequirements = extractKeyRequirements(messageText);

  const analysis = {
    intent,
    products,
    quantity,
    urgency: urgency.level,
    urgencyReason: urgency.reason,
    keyRequirements,
    suggestedReply: '',
    nextAction: '',
    confidence: 'medium',
  };

  analysis.nextAction = generateNextAction({ ...analysis, urgency });
  analysis.suggestedReply = generateReply(analysis);

  // Confidence heuristic
  if (products.length > 0 && quantity && intent !== 'greeting') {
    analysis.confidence = 'high';
  } else if (intent === 'greeting' || (products.length === 0 && !quantity)) {
    analysis.confidence = 'low';
  }

  return analysis;
}

module.exports = { analyzeMessage, generateReply: (analysis, name) => generateReply(analysis, name) };
