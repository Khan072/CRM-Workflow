const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check for validation errors and return 400 if found.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      messages: errors.array().map((e) => e.msg),
    });
  }
  next();
}

// Validation rules for creating a lead from an incoming message
const validateCreateLead = [
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ max: 200 })
    .withMessage('Customer name must be under 200 characters'),
  body('channel')
    .trim()
    .notEmpty()
    .withMessage('Channel is required')
    .isIn(['whatsapp', 'instagram'])
    .withMessage('Channel must be whatsapp or instagram'),
  body('messageText')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 5000 })
    .withMessage('Message text must be under 5000 characters'),
  body('customerContact')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Customer contact must be under 200 characters'),
  handleValidationErrors,
];

// Validation for updating a lead
const validateUpdateLead = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('stage')
    .optional()
    .isIn(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])
    .withMessage('Invalid stage value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority value'),
  handleValidationErrors,
];

// Validation for adding a follow-up message
const validateAddMessage = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('messageText')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 5000 })
    .withMessage('Message text must be under 5000 characters'),
  body('sender')
    .optional()
    .isIn(['customer', 'salesperson'])
    .withMessage('Sender must be customer or salesperson'),
  handleValidationErrors,
];

const validateLeadId = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  handleValidationErrors,
];

module.exports = {
  validateCreateLead,
  validateUpdateLead,
  validateAddMessage,
  validateLeadId,
};
