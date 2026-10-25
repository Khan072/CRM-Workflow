require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const leadRoutes = require('./routes/leadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhook', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CRM Server running on http://localhost:${PORT}`);
    console.log(`AI Provider: ${process.env.GEMINI_API_KEY ? 'Google Gemini' : 'Mock AI (set GEMINI_API_KEY for real AI)'}`);
  });
}

start();

module.exports = app; // For testing
