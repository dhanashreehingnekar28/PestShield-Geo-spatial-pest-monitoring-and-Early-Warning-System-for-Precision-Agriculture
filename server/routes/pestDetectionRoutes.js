const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { predict } = require('../controllers/pestDetectionController');

router.post('/predict', protect, upload.single('image'), predict);

module.exports = router;
