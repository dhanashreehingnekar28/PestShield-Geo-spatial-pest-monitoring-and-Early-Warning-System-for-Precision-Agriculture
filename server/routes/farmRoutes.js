
const express = require('express');
const router = express.Router();

const {
  createFarm,
  getMyFarms,
  getFarmsForMap,
  getFarmById,
  updateFarm,
  deleteFarm
} = require('../controllers/farmController');

const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const {
  idParam,
  farmCreateRules,
  farmUpdateRules
} = require('../validators');

// Existing farm creation
router.post(
  '/',
  protect,
  authorize('farmer'),
  farmCreateRules,
  validate,
  createFarm
);

// Existing farmer-specific farm list
router.get('/my', protect, getMyFarms);

// NEW: Admin-only farm map endpoint
router.get(
  '/map',
  protect,
  authorize('admin'),
  getFarmsForMap
);

// Existing farm details
router.get('/:id', protect, idParam(), validate, getFarmById);

// Existing farm update
router.put('/:id', protect, farmUpdateRules, validate, updateFarm);

// Existing farm deletion
router.delete('/:id', protect, idParam(), validate, deleteFarm);

module.exports = router;
