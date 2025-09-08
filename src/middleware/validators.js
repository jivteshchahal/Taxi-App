const { body } = require('express-validator');

const bookingValidators = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full Name must be 2-100 characters'),

  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .isLength({ min: 7, max: 20 }).withMessage('Phone must be 7-20 characters'),

  body('pickupAddress')
    .trim()
    .notEmpty().withMessage('Pickup Address is required')
    .isLength({ min: 5, max: 200 }).withMessage('Pickup Address must be 5-200 characters'),

  body('dropoffAddress')
    .trim()
    .notEmpty().withMessage('Dropoff Address is required')
    .isLength({ min: 5, max: 200 }).withMessage('Dropoff Address must be 5-200 characters'),

  body('pickupDate')
    .trim()
    .notEmpty().withMessage('Pickup Date is required')
    .isISO8601().withMessage('Pickup Date must be a valid date'),

  body('pickupTime')
    .trim()
    .notEmpty().withMessage('Pickup Time is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('Pickup Time must be in HH:MM format'),

  body('passengers')
    .toInt()
    .isInt({ min: 1, max: 6 }).withMessage('Passengers must be between 1 and 6'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must be 500 characters or less'),

  // Honeypot field allowed empty; any value will be handled in route
  body('website').optional().trim(),
];

module.exports = { bookingValidators };

