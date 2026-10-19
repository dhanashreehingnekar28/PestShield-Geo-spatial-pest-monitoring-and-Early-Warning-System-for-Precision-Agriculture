const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMapData } = require('../controllers/mapController');

router.get('/data', protect, getMapData);

module.exports = router;