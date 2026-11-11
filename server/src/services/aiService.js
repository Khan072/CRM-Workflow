/**
 * AI Service — Uses Google Gemini 2.0 Flash for structured lead analysis.
 *
 * Why Gemini 2.0 Flash:
 * - Native structured JSON output via responseSchema (no fragile parsing)
 * - Free tier generous enough for development/demo
 * - Fast inference (~1-2s) suitable for real-time CRM workflows
 * - Excellent at extraction/classification tasks
 *
 * Falls back to mock AI service when:
 * - GEMINI_API_KEY is not set
 * - API call fails (network error, rate limit, etc.)
 * - Response is malformed
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mockAiService = require('./mockAiService');

let genAI = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Schema for structured AI output — enforces valid JSON matching our data model
const analysisSchema = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      description: 'Customer intent: product_inquiry, pricing_inquiry, purchase_request, consultation_request, partnership_inquiry, support, follow_up, greeting, general_inquiry',
    },
    products: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of Worth Prime Global services the customer is interested in (e.g. Company Formation, Investor Visa, Corporate Banking, VAT Registration, PRO Services, Virtual Office)',
    },
    quantity: {
      type: 'string',
      description: 'Project scope / scale signal: number of visas, number of entities, company size, budget range (e.g. "3 investor visas", "startup", "Budget AED 30,000"). Empty string if not mentioned.',
    },
    urgency: {
      type: 'string',
      description: 'Urgency level: low, medium, or high',
      enum: ['low', 'medium', 'high'],
    },
    urgencyReason: {
      type: 'string',
      description: 'Brief explanation of why this urgency level was assigned',
    },
    keyRequirements: {
      type: 'array',
      items: { type: 'string' },
      description: 'Key requirements or details extracted from the message',
    },
    nextAction: {
      type: 'string',
      description: 'Specific, actionable recommendation for the salesperson',
    },
    suggestedReply: {
      type: 'string',
      description: 'Professional, concise reply draft for the customer',
    },
    confidence: {
      type: 'string',
      description: 'Confidence in the analysis: high, medium, or low',
      enum: ['high', 'medium', 'low'],
    },
  },
  required: ['intent', 'products', 'quantity', 'urgency', 'urgencyReason', 'keyRequirements', 'nextAction', 'suggestedReply', 'confidence'],
};

const SYSTEM_PROMPT = `You are an AI assistant for Worth Prime Global's CRM system — a B2B business consulting and company formation firm helping entrepreneurs, startups, and enterprises set up and expand their business operations in the UAE (Dubai, Abu Dhabi, Sharjah) and Saudi Arabia (Riyadh, Jeddah).

Worth Prime Global's core services:
- Company Formation & Business Setup (Mainland, Freezone, Offshore)
- Corporate Banking assistance
- Business Licensing (Commercial, Professional, Industrial)
- Visa & Immigration (Investor, Employment, Residence, Family visas)
- PRO Services (government documents, clearances, attestation)
- Virtual & Physical Office Solutions
- Accounting, Bookkeeping & VAT Compliance
- Strategic Business Consulting & Market Entry Advisory
- Partner / Referral Program

Your job is to analyze incoming customer messages and extract structured information to help the sales team qualify leads efficiently.

Guidelines:
- Be accurate: only extract information that is actually present in the message
- For "products", extract the specific SERVICES the prospect is interested in (e.g. "Company Formation", "Investor Visa", "Corporate Banking", "VAT Registration")
- For "quantity", capture business scope signals: number of visas needed, number of entities, budget range, company size (e.g. "5 visas", "startup", "enterprise", "Budget AED 50,000")
- Intent options: product_inquiry, pricing_inquiry, purchase_request, consultation_request, partnership_inquiry, follow_up, support, greeting, general_inquiry
- Use "consultation_request" when prospect wants to book a call or meeting
- Use "partnership_inquiry" when contact is a referring consultant, law firm, or business partner
- If information is missing, use empty strings or empty arrays — do NOT guess
- The suggested reply should be professional, warm, and represent Worth Prime Global's brand
- The next action should be specific: schedule a call, send a proposal, assign to a visa specialist, etc.
- Urgency should consider business setup timelines, visa deadlines, or launch target dates
- Keep the reply under 150 words`;

/**
 * Analyze a customer message using Gemini AI with structured output.
 * Falls back to mock analysis if Gemini is unavailable.
 */
async function analyzeMessage(messageText, channel = 'whatsapp', customerName = '') {
  const client = getClient();

  if (!client) {
    console.log('Gemini API key not configured — using mock AI service');
    const result = mockAiService.analyzeMessage(messageText);
    // Re-generate reply with customer name
    result.suggestedReply = mockAiService.generateReply(result, customerName);
    return { ...result, _aiProvider: 'mock' };
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.3, // Low temperature for consistent, factual extraction
      },
      systemInstruction: SYSTEM_PROMPT,
    });

    const userPrompt = `Analyze this incoming ${channel} customer message and extract structured lead information.
${customerName ? `Customer name: ${customerName}` : 'Customer name is unknown.'}

Customer message:
"${messageText}"

Provide your analysis as structured JSON.`;

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();
    const analysis = JSON.parse(responseText);

    // Validate required fields exist
    if (!analysis.intent || !analysis.urgency) {
      throw new Error('AI response missing required fields');
    }

    // Normalize fields
    analysis.products = analysis.products || [];
    analysis.quantity = analysis.quantity || '';
    analysis.keyRequirements = analysis.keyRequirements || [];
    analysis.confidence = analysis.confidence || 'medium';
    analysis._aiProvider = 'gemini';

    return analysis;
  } catch (error) {
    console.error('Gemini AI analysis failed, falling back to mock:', error.message);
    const result = mockAiService.analyzeMessage(messageText);
    result.suggestedReply = mockAiService.generateReply(result, customerName);
    return { ...result, _aiProvider: 'mock', _aiError: error.message };
  }
}

module.exports = { analyzeMessage };
