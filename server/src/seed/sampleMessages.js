/**
 * Sample customer messages for demonstrating the CRM workflow.
 * Each covers a different edge case or scenario.
 */

const sampleMessages = [
  {
    customerName: 'Rahul Sharma',
    customerContact: '+91-9876543210',
    channel: 'whatsapp',
    messageText: 'Hi, I need around 500 custom T-shirts for my company event next month. Please share the price and delivery time.',
    description: 'Ideal lead — specific product, quantity, timeline, pricing intent',
  },
  {
    customerName: 'Priya Patel',
    customerContact: 'priya.patel@email.com',
    channel: 'instagram',
    messageText: 'Hi',
    description: 'Edge case — vague greeting with no useful information',
  },
  {
    customerName: 'Amit Kumar',
    customerContact: '+91-9988776655',
    channel: 'whatsapp',
    messageText: 'Hello! I am looking for custom hoodies and caps for my startup team. We need about 50 hoodies in dark blue and 50 caps with our logo. Can you also do custom packaging for these? We need everything delivered by next week.',
    description: 'Multi-product inquiry with urgency and customization details',
  },
  {
    customerName: 'Sneha Reddy',
    customerContact: 'sneha.r@company.co',
    channel: 'instagram',
    messageText: 'I placed an order for 200 mugs last week (Order #MUG-2024-089) but received only 180. Some of them also have printing defects. Please help resolve this issue urgently.',
    description: 'Support request — not a purchase inquiry, tests intent classification',
  },
  {
    customerName: 'Vikram Singh',
    customerContact: '+91-7766554433',
    channel: 'whatsapp',
    messageText: 'We spoke last Tuesday about the corporate jersey order for our cricket team. Just following up — have you prepared the quote yet? We need to finalize by this Friday.',
    description: 'Follow-up message with deadline pressure',
  },
  {
    customerName: 'Ananya Desai',
    customerContact: '',
    channel: 'instagram',
    messageText: 'Your designs look amazing! Can you tell me more about your custom tote bags? I might be interested in ordering some for my boutique.',
    description: 'Casual product inquiry — no quantity, no urgency, no contact info',
  },
  {
    customerName: 'Rajesh Verma',
    customerContact: '+91-8899001122',
    channel: 'whatsapp',
    messageText: 'URGENT: Need 1000 branded pens and 500 flyers for a trade show happening day after tomorrow. Can you handle rush orders? Budget is not an issue but quality must be premium. Also need a banner 10ft x 4ft. Please confirm ASAP.',
    description: 'High-urgency multi-product order with budget signal and tight deadline',
  },
];

module.exports = sampleMessages;
