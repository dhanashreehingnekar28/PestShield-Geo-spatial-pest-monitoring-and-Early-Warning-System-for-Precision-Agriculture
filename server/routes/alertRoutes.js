const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators');
const { getMyAlerts, markAlertRead, getAllAlerts, resolveAlert, getAlertWeather } = require('../controllers/alertController');

router.get('/my', protect, getMyAlerts);
router.put('/:id/read', protect, idParam(), validate, markAlertRead);
router.get('/:id/weather', protect, idParam(), validate, getAlertWeather);
router.get('/', protect, adminOnly, getAllAlerts);
router.put('/:id/resolve', protect, adminOnly, idParam(), validate, resolveAlert);

module.exports = router;