/**
 * Sample customer messages for Worth Prime Global CRM demo.
 *
 * Worth Prime Global: B2B business consulting & company formation firm
 * specializing in UAE (Dubai/Abu Dhabi) and Saudi Arabia (Riyadh/Jeddah) setups.
 *
 * Each message covers a different service, intent type, and lead quality scenario.
 */

const sampleMessages = [
  {
    customerName: 'Arjun Mehta',
    customerContact: '+91-9876543210',
    channel: 'whatsapp',
    messageText: 'Hi, I want to set up a mainland company in Dubai for my IT consulting business. I need 2 investor visas and a corporate bank account as well. What is the total cost and how long does the process take?',
    description: 'High-quality lead — specific service (mainland setup + visas + banking), jurisdiction, activity, and pricing intent',
  },
  {
    customerName: 'Sarah Al-Rashidi',
    customerContact: 'sarah@techventures.ae',
    channel: 'website',
    messageText: 'We are a UK-based SaaS company looking to expand into the GCC market. We are interested in setting up a free zone entity in Dubai that allows 100% foreign ownership. We also need help with VAT registration and accounting. Can we schedule a consultation call this week?',
    description: 'Ideal B2B lead — multiple services, jurisdiction preference, timeline, consultation request, business email',
  },
  {
    customerName: 'Faisal Al-Amer',
    customerContact: '+966-501234567',
    channel: 'whatsapp',
    messageText: 'Hi',
    description: 'Edge case — vague greeting with no useful information',
  },
  {
    customerName: 'Priya Kapoor',
    customerContact: '+91-9988776655',
    channel: 'instagram',
    messageText: 'I am an Indian entrepreneur planning to move to Dubai and start a trading company. I need an investor visa for myself, one for my business partner, and a trade license. What packages do you offer and what is the timeline?',
    description: 'Multi-service inquiry — company setup + 2 visas + license, timeline asked, good detail level',
  },
  {
    customerName: 'James Okafor',
    customerContact: 'james.okafor@globalpartners.co',
    channel: 'website',
    messageText: 'I represent a UK law firm specialising in cross-border transactions. We regularly have clients asking about UAE and Saudi business setup. I am interested in learning more about your partner referral program and how we can collaborate on a revenue-share basis.',
    description: 'Partnership inquiry — referral program, B2B law firm, high-value potential partner',
  },
  {
    customerName: 'Mohammed Al-Zahrani',
    customerContact: '+966-559876543',
    channel: 'facebook',
    messageText: 'I already submitted my documents for the company registration in Riyadh 3 weeks ago. I haven\'t received any update. Can someone check the status of my application? This is urgent as my investor visa depends on it.',
    description: 'Follow-up / support case — existing client needing status update, high urgency',
  },
  {
    customerName: 'Ravi Shankar',
    customerContact: '+91-8899001122',
    channel: 'whatsapp',
    messageText: 'URGENT: I need to set up an offshore company in UAE by end of this month for a contract I am signing. The client requires a UAE registered entity. What is the fastest option available? Budget is flexible but need it done in 2 weeks.',
    description: 'High-urgency offshore setup, deadline pressure, budget flexibility, fast-track required',
  },
  {
    customerName: 'Chen Wei',
    customerContact: 'chen.wei@horizoncapital.hk',
    channel: 'website',
    messageText: 'We are a Hong Kong-based investment fund exploring setting up a holding company in the DIFC or ADGM to manage our Middle East investments. We need guidance on the regulatory framework, annual costs, and whether a family office structure would be appropriate for our requirements. Can you send a detailed proposal?',
    description: 'High-value enterprise inquiry — DIFC/ADGM holding company, family office, formal proposal requested',
  },
];

module.exports = sampleMessages;
