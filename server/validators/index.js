const { body, param, query } = require('express-validator');

const CROPS = ['Groundnut', 'Potato', 'Chilli'];
const SEVERITIES = ['Low', 'Medium', 'High'];
const OPT = { nullable: true, checkFalsy: true }; // treat '' and null as "not sent"

const idParam = (name = 'id') => param(name).isMongoId().withMessage('Invalid ID');
const lat = body('latitude').optional(OPT).isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90');
const lng = body('longitude').optional(OPT).isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180');
const coordinatePair = body().custom((value) => {
  const hasLat = value.latitude !== undefined &&
    value.latitude !== null && value.latitude !== '';

  const hasLng = value.longitude !== undefined &&
    value.longitude !== null && value.longitude !== '';

  if (hasLat !== hasLng) {
    throw new Error('Latitude and longitude must be provided together');
  }

  return true;
});

const text = (field, max) =>
  body(field).optional(OPT).isString().withMessage(`${field} must be text`).bail().trim()
    .isLength({ max }).withMessage(`${field} must be at most ${max} characters`);
const longText = (field, max = 3000) =>
  body(field).optional(OPT).custom((v) => {
    const s = Array.isArray(v) ? v.join(' ') : v;
    if (typeof s !== 'string') throw new Error(`${field} must be text`);
    if (s.length > max) throw new Error(`${field} must be at most ${max} characters`);
    return true;
  });

// ---------- Auth ----------
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name must be at most 60 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
];
const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ---------- Farms ----------
const farmCreateRules = [
  body('farmName').trim().notEmpty().withMessage('Farm name is required').isLength({ max: 80 }).withMessage('Farm name must be at most 80 characters'),
  body('cropType').isIn(CROPS).withMessage(`cropType must be one of: ${CROPS.join(', ')}`),
  lat, lng, coordinatePair, text('district', 80),
];
const farmUpdateRules = [
  idParam(),
  body('farmName').optional().trim().notEmpty().withMessage('Farm name cannot be empty').isLength({ max: 80 }).withMessage('Farm name must be at most 80 characters'),
  body('cropType').optional().isIn(CROPS).withMessage(`cropType must be one of: ${CROPS.join(', ')}`),
  lat, lng, text('district', 80),
];

// ---------- Pest library ----------
const pestCreateRules = [
  body('pestName').trim().notEmpty().withMessage('Pest name is required').isLength({ max: 100 }).withMessage('Pest name must be at most 100 characters'),
  body('crop').isIn(CROPS).withMessage(`crop must be one of: ${CROPS.join(', ')}`),
  longText('description'), longText('symptoms'), longText('treatment'),
];
const pestUpdateRules = [
  idParam(),
  body('pestName').optional().trim().notEmpty().withMessage('Pest name cannot be empty').isLength({ max: 100 }).withMessage('Pest name must be at most 100 characters'),
  body('crop').optional().isIn(CROPS).withMessage(`crop must be one of: ${CROPS.join(', ')}`),
  longText('description'), longText('symptoms'), longText('treatment'),
];

// ---------- Pest reports ----------
const reportCreateRules = [
  body('crop').isIn(CROPS).withMessage(`crop must be one of: ${CROPS.join(', ')}`),
  body('farm').optional(OPT).isMongoId().withMessage('Invalid farm'),
  body('pest').optional(OPT).isMongoId().withMessage('Invalid pest'),
  body('severity').optional(OPT).isIn(SEVERITIES).withMessage(`severity must be one of: ${SEVERITIES.join(', ')}`),
  body('detectionMethod').optional(OPT).isIn(['Manual', 'AI-Assisted']).withMessage('Invalid detection method'),
  text('description', 1000), lat, lng, coordinatePair,
];
const reportUpdateRules = [
  idParam(),
  body('crop').optional().isIn(CROPS).withMessage(`crop must be one of: ${CROPS.join(', ')}`),
  body('severity').optional().isIn(SEVERITIES).withMessage(`severity must be one of: ${SEVERITIES.join(', ')}`),
  body('pest').optional(OPT).isMongoId().withMessage('Invalid pest'),
  text('description', 1000), lat, lng,
];
const reportVerifyRules = [
  idParam(),
  body('status').isIn(['Verified', 'Rejected', 'Pending']).withMessage('status must be Verified, Rejected or Pending'),
];

// ---------- Admin: users ----------
const adminListRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be 1 or more'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('role').optional().isIn(['farmer', 'admin']).withMessage("role must be 'farmer' or 'admin'"),
  query('search').optional().isLength({ max: 100 }).withMessage('search is too long'),
];
const adminRoleRules = [idParam(), body('role').isIn(['farmer', 'admin']).withMessage("Role must be 'farmer' or 'admin'")];
const adminStatusRules = [idParam(), body('isActive').isBoolean().withMessage('isActive must be true or false')];

module.exports = {
  idParam,
  registerRules, loginRules,
  farmCreateRules, farmUpdateRules,
  pestCreateRules, pestUpdateRules,
  reportCreateRules, reportUpdateRules, reportVerifyRules,
  adminListRules, adminRoleRules, adminStatusRules,
};