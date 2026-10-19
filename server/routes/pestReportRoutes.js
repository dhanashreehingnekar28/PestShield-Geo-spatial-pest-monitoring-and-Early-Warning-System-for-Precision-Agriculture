const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, authorize, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, reportCreateRules, reportUpdateRules, reportVerifyRules } = require('../validators');
const { createReport, getMyReports, getAllReports, verifyReport } = require('../controllers/pestReportController');
const { updateReport, deleteReport } = require('../controllers/reportManageController');

// authorize runs before upload.single so a rejected admin request never writes a file to disk
router.post('/', protect, authorize('farmer'), upload.single('image'), reportCreateRules, validate, createReport);
router.get('/my', protect, getMyReports);
router.get('/', protect, adminOnly, getAllReports);
router.put('/:id/verify', protect, adminOnly, reportVerifyRules, validate, verifyReport);
router.put('/:id', protect, reportUpdateRules, validate, updateReport);
router.delete('/:id', protect, idParam(), validate, deleteReport);

module.exports = router;