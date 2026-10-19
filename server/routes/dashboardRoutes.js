const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getFarmerSummary, getAdminAnalytics } = require('../controllers/dashboardController');

router.get('/farmer', protect, authorize('farmer'), getFarmerSummary);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);

module.exports = router;