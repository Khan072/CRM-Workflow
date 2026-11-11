/**
 * Mock AI Service — Keyword-based lead analysis.
 *
 * Tuned for Worth Prime Global:
 * A B2B business consulting & company formation firm serving
 * entrepreneurs, startups, and enterprises looking to establish or
 * expand operations in the UAE (Dubai) and Saudi Arabia (Riyadh).
 *
 * Services offered:
 *   - Company Formation & Business Setup (Mainland / Freezone / Offshore)
 *   - Corporate Banking assistance
 *   - Business Licensing (Commercial, Professional, Industrial)
 *   - Visa & Immigration (Investor, Employment, Family visas)
 *   - PRO Services (Government documents, clearances)
 *   - Virtual & Physical Office Solutions
 *   - Accounting, Bookkeeping & VAT Compliance
 *   - Strategic Business Consulting & Market Entry Advisory
 *   - Partner / Referral Program
 */

// ── Service keyword → display name ───────────────────────────────────────────
const SERVICE_KEYWORDS = {
  // Company formation
  'company formation':      'Company Formation',
  'business setup':         'Business Setup',
  'company setup':          'Company Setup',
  'incorporate':            'Company Incorporation',
  'incorporation':          'Company Incorporation',
  'register company':       'Company Registration',
  'company registration':   'Company Registration',
  'start a business':       'Business Setup',
  'open a company':         'Company Formation',
  'set up business':        'Business Setup',
  'mainland':               'Mainland Company Setup',
  'freezone':               'Freezone Company Setup',
  'free zone':              'Freezone Company Setup',
  'offshore':               'Offshore Company Setup',

  // Banking
  'bank account':           'Corporate Banking',
  'corporate account':      'Corporate Banking',
  'business account':       'Corporate Banking',
  'banking':                'Corporate Banking',

  // Licensing
  'trade license':          'Trade License',
  'commercial license':     'Commercial License',
  'professional license':   'Professional License',
  'license':                'Business Licensing',
  'licence':                'Business Licensing',

  // Visa & Immigration
  'visa':                   'Visa Services',
  'investor visa':          'Investor Visa',
  'employment visa':        'Employment Visa',
  'residence visa':         'Residence Visa',
  'work permit':            'Work Permit',
  'immigration':            'Immigration Services',

  // PRO services
  'pro service':            'PRO Services',
  'government document':    'PRO Services',
  'attestation':            'Document Attestation',
  'notary':                 'Notary Services',
  'emirates id':            'Emirates ID',
  'moc':                    'Ministry of Commerce',

  // Office
  'office':                 'Office Solutions',
  'virtual office':         'Virtual Office',
  'physical office':        'Physical Office Space',
  'coworking':              'Co-working Space',
  'registered address':     'Registered Address',

  // Accounting & compliance
  'accounting':             'Accounting & Bookkeeping',
  'bookkeeping':            'Accounting & Bookkeeping',
  'vat':                    'VAT Registration & Filing',
  'audit':                  'Audit Services',
  'financial statement':    'Financial Reporting',
  'payroll':                'Payroll Services',

  // Consulting
  'consulting':             'Business Consulting',
  'consultancy':            'Business Consulting',
  'market entry':           'Market Entry Advisory',
  'business plan':          'Business Plan',
  'feasibility':            'Feasibility Study',
  'expansion':              'Business Expansion',

  // Partnership
  'partner':                'Partner Program',
  'referral':               'Referral Program',
  'affiliate':              'Partner Program',
  'collaborate':            'Partnership',
  'joint venture':          'Joint Venture',

  // Locations
  'dubai':                  'Dubai Setup',
  'uae':                    'UAE Setup',
  'abu dhabi':              'Abu Dhabi Setup',
  'sharjah':                'Sharjah Setup',
  'saudi':                  'Saudi Arabia Setup',
  'riyadh':                 'Saudi Arabia Setup',
  'ksa':                    'Saudi Arabia Setup',
  'gcc':                    'GCC Expansion',
};

// ── Intent patterns ───────────────────────────────────────────────────────────
const INTENT_PATTERNS = [
  { pattern: /\b(schedule|book|call|meeting|consultation|consult|talk to|speak with|appointment)\b/i,  intent: 'consultation_request' },
  { pattern: /\b(partner|referral|affiliate|collaborate|joint venture|revenue share)\b/i,              intent: 'partnership_inquiry' },
  { pattern: /\b(price|pricing|cost|fee|charges?|how much|quote|quotation|proposal|package)\b/i,       intent: 'pricing_inquiry' },
  { pattern: /\b(start|set up|open|register|incorporate|form|establish|launch)\b/i,                   intent: 'purchase_request' },
  { pattern: /\b(help|issue|problem|stuck|status|update|follow.?up|waiting|renewal)\b/i,               intent: 'follow_up' },
  { pattern: /\b(interested|looking for|enquiry|inquiry|information|details|tell me|want to know)\b/i, intent: 'product_inquiry' },
];

// ── Urgency patterns ──────────────────────────────────────────────────────────
const URGENCY_PATTERNS = [
  { pattern: /\b(urgent|asap|immediately|right away|today|by tomorrow|deadline)\b/i,   level: 'high',   reason: 'Customer used urgent language or mentioned an imminent deadline' },
  { pattern: /\b(this week|next week|within days|few days|quickly|soon|fast)\b/i,      level: 'high',   reason: 'Short timeline indicated' },
  { pattern: /\b(this month|next month|few weeks|couple of weeks|planning)\b/i,        level: 'medium', reason: 'Moderate timeline mentioned' },
  { pattern: /\b(whenever|no rush|flexible|at some point|just exploring)\b/i,          level: 'low',    reason: 'Customer indicated no urgency' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractServices(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const [keyword, service] of Object.entries(SERVICE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      found.add(service);
    }
  }
  return [...found];
}

function extractIntent(text) {
  for (const { pattern, intent } of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  if (text.trim().length < 15) return 'greeting';
  return 'general_inquiry';
}

/**
 * For B2B consulting, "quantity" maps to project scope signals:
 * number of employees, visas needed, entities to form, budget range, etc.
 */
function extractScope(text) {
  // Number of visas / employees
  const visaMatch = text.match(/(\d[\d,]*)\s*(visa|employee|staff|people|person|shareholder|director|partner)/i);
  if (visaMatch) return `${visaMatch[1]} ${visaMatch[2]}(s)`;

  // Budget mention
  const budgetMatch = text.match(/budget\s*(is|of|around|about)?\s*(AED|USD|INR|SAR)?\s*([\d,]+)/i);
  if (budgetMatch) return `Budget ~${budgetMatch[2] || ''}${budgetMatch[3]}`;

  // Generic number of entities
  const numMatch = text.match(/(\d[\d,]*)\s*(compan|entit|branch|office)/i);
  if (numMatch) return `${numMatch[1]} ${numMatch[2]}(ies)`;

  // Word-based scale hints
  const lower = text.toLowerCase();
  const scaleHints = {
    'small business': 'Small business',
    'startup': 'Startup',
    'sme': 'SME',
    'enterprise': 'Enterprise',
    'large company': 'Large enterprise',
    'multinational': 'Multinational',
    'group of companies': 'Group of companies',
    'holding company': 'Holding company',
  };
  for (const [hint, label] of Object.entries(scaleHints)) {
    if (lower.includes(hint)) return label;
  }
  return '';
}

function extractUrgency(text) {
  for (const { pattern, level, reason } of URGENCY_PATTERNS) {
    if (pattern.test(text)) return { level, reason };
  }
  if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
    return { level: 'medium', reason: 'Specific month/deadline mentioned' };
  }
  return { level: 'low', reason: 'No urgency indicators detected' };
}

function extractKeyRequirements(text) {
  const requirements = [];

  if (/\b(uae|dubai|abu dhabi|sharjah|ajman|fujairah)\b/i.test(text))   requirements.push('UAE jurisdiction interest');
  if (/\b(saudi|riyadh|jeddah|ksa)\b/i.test(text))                       requirements.push('Saudi Arabia jurisdiction interest');
  if (/\b(freezone|free zone)\b/i.test(text))                             requirements.push('Freezone setup preference');
  if (/\b(mainland)\b/i.test(text))                                       requirements.push('Mainland setup preference');
  if (/\b(offshore)\b/i.test(text))                                       requirements.push('Offshore structure interest');
  if (/\b(visa|residence|immigration)\b/i.test(text))                     requirements.push('Visa/immigration requirement');
  if (/\b(bank account|banking|corporate account)\b/i.test(text))         requirements.push('Corporate banking assistance needed');
  if (/\b(accounting|vat|bookkeeping|audit|financial)\b/i.test(text))     requirements.push('Accounting/compliance services needed');
  if (/\b(virtual office|registered address)\b/i.test(text))              requirements.push('Virtual office / registered address needed');
  if (/\b(partner|referral|affiliate|revenue share)\b/i.test(text))       requirements.push('Partner/referral program interest');
  if (/\b(timeline|deadline|by |before )\b/i.test(text))                  requirements.push('Timeline/deadline specified');
  if (/\b(budget|cost|fee|price|quote)\b/i.test(text))                    requirements.push('Pricing / cost information requested');
  if (/\b(call|meeting|consultation|schedule|appointment)\b/i.test(text)) requirements.push('Consultation call/meeting requested');

  if (requirements.length === 0 && text.trim().length > 20) {
    requirements.push('General inquiry — needs qualification call');
  }
  return requirements;
}

// ── Reply & next-action generators ───────────────────────────────────────────
function generateReply(analysis, customerName) {
  const name = customerName || 'there';

  if (analysis.intent === 'greeting') {
    return `Hi ${name}! 👋\n\nThank you for reaching out to Worth Prime Global. We specialize in company formation, business licensing, visa services, corporate banking, and accounting support across the UAE and Saudi Arabia.\n\nHow can we help you today? Please feel free to share your requirements and we'll guide you through the best solution for your business.`;
  }

  if (analysis.intent === 'support' || analysis.intent === 'follow_up') {
    return `Hi ${name},\n\nThank you for contacting us. We'd like to help resolve this as quickly as possible — could you please share more details about your request or the reference number for your case? Our team will follow up with you shortly.\n\nBest regards,\nWorth Prime Global`;
  }

  if (analysis.intent === 'consultation_request') {
    return `Hi ${name},\n\nThank you for your interest in Worth Prime Global! We'd be happy to schedule a consultation at your convenience.\n\nCould you please share:\n• Your preferred date and time for the call\n• The specific service you'd like to discuss\n• Your location / nationality (for visa/setup eligibility)\n\nOne of our business setup advisors will confirm the appointment and prepare for your call.\n\nBest regards,\nWorth Prime Global`;
  }

  if (analysis.intent === 'partnership_inquiry') {
    return `Hi ${name},\n\nThank you for your interest in partnering with Worth Prime Global! Our Partner Program offers excellent revenue-sharing opportunities for consultants, law firms, and advisors who refer clients seeking business setup in the UAE and Saudi Arabia.\n\nI'd love to tell you more. Could you share a bit about your business and the type of clients you typically work with? We'll follow up with our full partnership details.\n\nBest regards,\nWorth Prime Global`;
  }

  const serviceMention = analysis.products.length > 0
    ? `regarding ${analysis.products.slice(0, 2).join(' and ')}`
    : 'about our services';

  return `Hi ${name},\n\nThank you for your inquiry ${serviceMention}. We're glad you reached out!\n\nTo help you better, could you please share:\n${analysis.products.length === 0 ? '• Which specific service(s) you are looking for\n' : ''}• Your target jurisdiction (UAE — Mainland/Freezone, or Saudi Arabia)\n• Your business activity / industry\n${!analysis.quantity ? '• Number of shareholders/partners and employees (if applicable)\n' : ''}\nOne of our advisors will reach out with a tailored plan and transparent pricing.\n\nBest regards,\nWorth Prime Global`;
}

function generateNextAction(analysis) {
  if (analysis.intent === 'greeting') {
    return 'Send a welcome message and ask which service the prospect is looking for.';
  }
  if (analysis.intent === 'support' || analysis.intent === 'follow_up') {
    return 'Check the client\'s case file and provide a status update. Escalate to the relevant team if unresolved.';
  }
  if (analysis.intent === 'consultation_request') {
    return 'Schedule a discovery call within 24 hours. Assign to a senior business setup advisor.';
  }
  if (analysis.intent === 'partnership_inquiry') {
    return 'Send the Partner Program brochure. Schedule an introductory call with the partnerships team.';
  }
  if (analysis.intent === 'pricing_inquiry') {
    return `Prepare a customized pricing proposal for ${analysis.products.length > 0 ? analysis.products.join(' / ') : 'the requested services'}. Send within 24 hours.`;
  }

  const actions = [];
  if (analysis.products.length > 0) {
    actions.push(`Send detailed information about ${analysis.products.slice(0, 2).join(' and ')}.`);
  } else {
    actions.push('Clarify which service(s) the prospect needs — send a service overview brochure.');
  }
  if (analysis.urgency && analysis.urgency.level === 'high') {
    actions.push('Mark as high priority — prospect has an urgent requirement.');
  }
  actions.push('Follow up with a qualification call to understand business activity and jurisdiction.');
  return actions.join(' ');
}

// ── Main export ───────────────────────────────────────────────────────────────
function analyzeMessage(messageText) {
  const intent    = extractIntent(messageText);
  const products  = extractServices(messageText);   // "products" field reused for services
  const quantity  = extractScope(messageText);       // "quantity" field reused for project scope
  const urgency   = extractUrgency(messageText);
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

  analysis.nextAction    = generateNextAction({ ...analysis, urgency });
  analysis.suggestedReply = generateReply(analysis);

  // Confidence heuristic
  if (products.length > 0 && intent !== 'greeting' && intent !== 'general_inquiry') {
    analysis.confidence = 'high';
  } else if (intent === 'greeting' || (products.length === 0 && !quantity)) {
    analysis.confidence = 'low';
  }

  return analysis;
}

module.exports = { analyzeMessage, generateReply: (analysis, name) => generateReply(analysis, name) };
