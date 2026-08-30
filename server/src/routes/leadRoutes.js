const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { validateCreateLead, validateUpdateLead, validateAddMessage, validateLeadId } = require('../middleware/validate');

// Check duplicate (must be before /:id routes)
router.get('/check-duplicate', leadController.checkDuplicate);

// CRUD
router.post('/', validateCreateLead, leadController.createLead);
router.get('/', leadController.getLeads);
router.get('/:id', validateLeadId, leadController.getLeadById);
router.patch('/:id', validateUpdateLead, leadController.updateLead);

// Messages & replies
router.post('/:id/messages', validateAddMessage, leadController.addMessage);
router.post('/:id/reply', validateLeadId, leadController.sendReply);

module.exports = router;
