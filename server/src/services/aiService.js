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
      description: 'Customer intent: product_inquiry, pricing_inquiry, purchase_request, support, follow_up, greeting, general_inquiry',
    },
    products: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of products or services the customer is interested in',
    },
    quantity: {
      type: 'string',
      description: 'Quantity mentioned by the customer, or empty string if not mentioned',
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

const SYSTEM_PROMPT = `You are an AI assistant for a CRM system that helps sales teams manage leads from WhatsApp and Instagram.

Your job is to analyze incoming customer messages and extract structured information to help salespersons work efficiently.

Guidelines:
- Be accurate: only extract information that is actually present in the message
- If information is missing (quantity, product, etc.), use empty strings or empty arrays — do NOT guess
- For greeting-only messages ("Hi", "Hello"), set intent to "greeting" and confidence to "low"
- If multiple products are mentioned, include all of them in the products array
- The suggested reply should be professional, concise, and ask for any missing information
- The next action should be specific and actionable, not generic advice
- Urgency should consider any deadlines, timeline mentions, or urgent language
- For the suggested reply, address the customer warmly and professionally
- Keep the reply concise but complete — under 150 words`;

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
