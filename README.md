# LeadFlow CRM — AI-Powered WhatsApp/Instagram Lead Workflow

A production-quality CRM mini-feature that converts incoming WhatsApp and Instagram customer messages into structured leads with AI-powered analysis, intelligent lead scoring, next-action recommendations, and conversation history.

![Stack](https://img.shields.io/badge/React-19-blue) ![Stack](https://img.shields.io/badge/Express-4-green) ![Stack](https://img.shields.io/badge/MongoDB-8-darkgreen) ![Stack](https://img.shields.io/badge/AI-Gemini_2.0_Flash-purple)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [AI Implementation](#ai-implementation)
- [Lead Scoring Logic](#lead-scoring-logic)
- [API Documentation](#api-documentation)
- [Sample Data](#sample-data)
- [Edge Case Handling](#edge-case-handling)
- [Assumptions & Decisions](#assumptions--decisions)
- [Bonus Features](#bonus-features)
- [Project Structure](#project-structure)

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas connection string)

### Installation

```bash
# Clone and enter the project
cd CRM

# Install all dependencies (root + server + client)
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env if you want to add a Gemini API key (optional)

# Seed the database with sample data
npm run seed

# Start both server and client
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

### With Gemini AI (Optional)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add it to `server/.env`: `GEMINI_API_KEY=your_key_here`
3. Restart the server

Without a key, the app uses a **mock AI service** that provides deterministic analysis via keyword matching.

---


### Tech Stack Rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **Vite + React 19** | Fast HMR, modern tooling, as per assignment stack |
| Styling | **Vanilla CSS** (custom properties) | Full design control, no dependency overhead, premium dark theme |
| Backend | **Express 4** | Thin controller/service pattern, clean separation of concerns |
| Database | **MongoDB + Mongoose 8** | Flexible schema for varied lead data, embedded documents for activities |
| AI | **Google Gemini 2.0 Flash** | Native structured JSON output, free tier, fast inference |

---

## AI Implementation

### Why Gemini 2.0 Flash

- **Structured JSON output** via `responseMimeType: "application/json"` with `responseSchema` — guaranteed valid JSON without fragile regex parsing
- **Free tier** generous enough for development and demo
- **Fast inference** (~1-2 seconds) suitable for real-time CRM workflows
- **Low temperature** (0.3) for consistent, factual extraction

### Prompt Strategy

The AI receives a **system prompt** that establishes it as a "CRM sales assistant" with specific guidelines:

```
- Extract only information actually present in the message
- For missing data, use empty strings/arrays (don't guess)
- Greeting-only messages get intent="greeting", confidence="low"
- Multiple products are returned as an array
- Suggested replies are professional, concise (<150 words)
```

The **user prompt** sends only:
- Message text
- Channel (whatsapp/instagram)
- Customer name (for personalized replies)

**No PII (phone, email, address) is sent to the AI** — only the message content and name.

### AI Output Schema

```json
{
  "intent": "pricing_inquiry",
  "products": ["Custom T-Shirts"],
  "quantity": "500",
  "urgency": "medium",
  "urgencyReason": "Event mentioned next month",
  "keyRequirements": ["Custom branding", "Delivery timeline needed"],
  "nextAction": "Send pricing and ask for T-shirt sizes and delivery location.",
  "suggestedReply": "Hi Rahul, Thank you for your inquiry...",
  "confidence": "high"
}
```

### Fallback Strategy

When `GEMINI_API_KEY` is not set or the API fails:

1. **Mock AI Service** activates automatically
2. Uses keyword matching for intent detection, product extraction, urgency signals
3. Returns the **exact same schema** as Gemini for seamless integration
4. Confidence is set to `"medium"` for mock analysis
5. The AI provider is tracked in activity history (`provider: "mock"` vs `"gemini"`)

---

## Lead Scoring Logic

### Score Calculation (0–100)

Each factor contributes a weighted amount to the total score:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| **Product Mentioned** | 20 | Customer referenced a specific product/service |
| **Quantity Specified** | 15 | A quantity or volume was mentioned |
| **Timeline/Urgency** | 15 | High urgency = full points, medium = 60% |
| **Purchase Intent** | 20 | Purchase request = 100%, pricing = 85%, inquiry = 60%, greeting = 0% |
| **Contact Info** | 10 | Phone or email was provided |
| **Message Detail** | 10 | Based on word count (≥30 words = full, ≥15 = 60%) |
| **Channel Quality** | 10 | WhatsApp = 100%, Instagram = 70% |

### Score → Priority Mapping

| Score Range | Priority |
|------------|----------|
| 0–30 | Low |
| 31–60 | Medium |
| 61–100 | High |

### Score → CRM Stage Mapping

| Condition | Stage |
|-----------|-------|
| Greeting / unknown intent | **New** — not enough to act on |
| Support intent | **New** — tracked but not a sales lead |
| Score < 25 | **New** |
| Score 25–49 | **Contacted** — need more info |
| Score ≥ 50 | **Qualified** — sales-ready |
| Purchase intent + score ≥ 50 | **Proposal** — ready to quote |

**Why this logic**: A salesperson's time is most valuable when focused on qualified leads. The scoring system ensures:
- Greetings don't clutter the pipeline
- Support requests are tracked but not mixed with sales
- Leads with product + quantity + urgency are fast-tracked to "Qualified"
- Explicit purchase intent skips directly to "Proposal"

---

## API Documentation

### Lead Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/leads` | Create lead from incoming message (triggers AI analysis) |
| `GET` | `/api/leads` | List leads (query: `stage`, `priority`, `channel`, `search`, `sortBy`, `order`) |
| `GET` | `/api/leads/:id` | Get lead with full activity history |
| `PATCH` | `/api/leads/:id` | Update lead (stage, priority, AI field overrides) |
| `POST` | `/api/leads/:id/messages` | Add follow-up message (re-triggers AI analysis) |
| `POST` | `/api/leads/:id/reply` | Save sent reply to activity log |
| `GET` | `/api/leads/check-duplicate` | Check for duplicate (query: `customerContact`, `customerName`, `channel`) |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/summary` | Aggregated stats: by stage, priority, channel, avg score |

### Example Request

```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Rahul Sharma",
    "customerContact": "+91-9876543210",
    "channel": "whatsapp",
    "messageText": "Hi, I need 500 custom T-shirts for my company event next month."
  }'
```

---

## Sample Data

The seed script (`npm run seed`) creates 7 sample leads covering different scenarios:

| Customer | Scenario | Expected Behavior |
|----------|----------|-------------------|
| Rahul Sharma | Ideal lead — product + qty + timeline + pricing intent | High score, Qualified/Proposal stage |
| Priya Patel | "Hi" — no useful info | Low score, New stage, confidence: low |
| Amit Kumar | Multi-product (hoodies + caps + packaging) with urgency | High score, all products extracted |
| Sneha Reddy | Support request — printing defects + order issue | Intent: support, New stage, not a sales lead |
| Vikram Singh | Follow-up — referencing previous conversation | Intent: follow_up, moderate score |
| Ananya Desai | Casual inquiry — no quantity, no contact info | Medium score, Contacted stage |
| Rajesh Verma | URGENT multi-product rush order | Highest score, Proposal stage, urgency: high |

---

## Edge Case Handling

| Edge Case | How It's Handled |
|-----------|-----------------|
| **"Hi" with no info** | Intent = greeting, confidence = low, stage = New, score ≈ 7. Next action: "Send a welcome message and ask what they need." |
| **Multiple products** | Products extracted as array. All displayed in AI insights. |
| **No quantity/date** | Fields left empty (not guessed). Next action asks for the missing info. |
| **Support request** | Intent = support, stage = New. Clearly different from sales leads. |
| **AI returns invalid data** | Caught by try/catch. Falls back to mock AI. Error logged in activity history. |
| **Repeat customer** | Duplicate detection by contact info. Message appended to existing lead instead of creating new one. |
| **Salesperson edits AI fields** | Changes tracked in activity log. `isAiOverridden` flag set. "Edited" badge shown. |
| **Very long message** | Message text limited to 5000 chars via validation. Higher message richness score. |
| **No API key** | Mock AI used automatically. Works fully offline. |

---

## Assumptions & Decisions

1. **No authentication** — The CRM is single-team for this mini-feature. Auth would be a separate module in the full product.

2. **No real message delivery** — "Sending" a reply logs it in activity history but doesn't integrate with WhatsApp/Instagram APIs. This would require Meta Business API integration.

3. **AI as assistant, not authority** — All AI-generated fields are editable by the salesperson. AI confidence is displayed transparently. The salesperson has final authority.

4. **Configurable scoring** — The scoring weights are documented constants in `leadScoringService.js`. A business owner can adjust them to match their specific sales process.

5. **Conversation continuity** — When a known customer (matched by contact info) sends another message, it appends to the existing lead rather than creating a duplicate.

6. **Non-linear stage progression** — Stages can be set manually in any order. A lead can jump from "New" to "Proposal" if the message warrants it. This reflects real sales: customers sometimes arrive ready to buy.

7. **Channel quality scoring** — WhatsApp scores slightly higher than Instagram (10 vs 7 points). Reasoning: WhatsApp messages tend to indicate more direct purchase intent, while Instagram inquiries are often more exploratory.

8. **Auto-stage advancement** — When a salesperson sends a reply, a "New" lead auto-advances to "Contacted". All other stage transitions are manual or AI-suggested.

---

## Bonus Features

- ✅ **Lead scoring** with transparent 7-factor breakdown (0–100)
- ✅ **Duplicate lead detection** — exact contact match + fuzzy name match
- ✅ **Human override** of all AI-extracted fields with edit tracking
- ✅ **Conversation memory** — follow-up messages append to existing leads with re-analysis
- ✅ **Basic analytics** — leads by stage, priority, channel with bar charts
- ✅ **Responsive UI** — glassmorphism dark theme with micro-animations
- ✅ **Backend tests** — Jest tests for lead scoring service

---

## Project Structure

```
CRM/
├── package.json              # Root: concurrently runs server + client
├── README.md
├── server/
│   ├── .env.example          # Environment template
│   ├── package.json
│   └── src/
│       ├── index.js           # Express entry point
│       ├── config/
│       │   └── db.js          # MongoDB connection
│       ├── models/
│       │   └── Lead.js        # Mongoose Lead schema
│       ├── controllers/
│       │   ├── leadController.js
│       │   └── analyticsController.js
│       ├── routes/
│       │   ├── leadRoutes.js
│       │   └── analyticsRoutes.js
│       ├── services/
│       │   ├── aiService.js           # Gemini AI + fallback
│       │   ├── mockAiService.js       # Keyword-based mock AI
│       │   ├── leadScoringService.js  # Transparent scoring logic
│       │   └── duplicateDetectionService.js
│       ├── middleware/
│       │   ├── errorHandler.js
│       │   └── validate.js
│       ├── seed/
│       │   ├── sampleMessages.js      # 7 sample customer messages
│       │   └── seed.js
│       └── __tests__/
│           └── leadScoring.test.js
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css                  # Complete design system
        ├── services/
        │   └── api.js                 # Centralized API client
        ├── utils/
        │   └── helpers.js             # Formatting & constants
        ├── components/
        │   ├── layout/
        │   │   └── Layout.jsx
        │   ├── ui/
        │   │   └── ToastContainer.jsx
        │   └── leads/
        │       ├── NewMessageModal.jsx
        │       ├── AIInsightsCard.jsx
        │       ├── LeadScoreCard.jsx
        │       ├── StageSelector.jsx
        │       ├── NextActionCard.jsx
        │       ├── SuggestedReplyCard.jsx
        │       ├── ActivityTimeline.jsx
        │       └── AddMessageForm.jsx
        └── pages/
            ├── LeadInbox.jsx
            ├── LeadDetail.jsx
            └── Analytics.jsx
```

---

## Running Tests

```bash
# Backend tests (lead scoring logic)
npm test
```

---

## What I Would Add with More Time

1. **WebSocket real-time updates** — when a new message arrives, the inbox updates live
2. **Lead notes** — salesperson can add internal notes to a lead
3. **Bulk actions** — select multiple leads and change stage/priority in batch
4. **Export** — CSV export of leads for reporting
5. **User authentication** — role-based access (sales rep vs manager)
6. **Meta Business API integration** — actual WhatsApp/Instagram message sending
7. **Email notifications** — alert salespeople when a high-priority lead arrives
8. **Lead assignment** — assign leads to specific team members
