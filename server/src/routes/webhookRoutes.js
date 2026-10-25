const express = require('express');
const router = express.Router();
const {
  verifyWebhookSecret,
  handleWhatsApp,
  handleInstagram,
  webhookHealth,
} = require('../controllers/webhookController');

// Apply secret verification to all webhook routes
router.use(verifyWebhookSecret);

// Health check — Make.com uses this to test the connection
router.get('/health', webhookHealth);

// WhatsApp webhook — Make.com sends messages here
router.post('/whatsapp', handleWhatsApp);

// Instagram webhook — Make.com sends DMs here
router.post('/instagram', handleInstagram);

module.exports = router;
