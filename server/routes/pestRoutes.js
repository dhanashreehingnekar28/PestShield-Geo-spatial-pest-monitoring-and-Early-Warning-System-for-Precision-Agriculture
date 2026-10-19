const validate = require('../middleware/validate');
const { pestCreateRules, pestUpdateRules, idParam } = require('../validators');
const express = require('express');
const router = express.Router();
const { getPests, getLifecycle, createPest, updatePest, deletePest } = require('../controllers/pestController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getPests);
router.get('/lifecycle/:crop', getLifecycle);
router.post('/', protect, adminOnly, pestCreateRules, validate, createPest);
router.put('/:id', protect, adminOnly, pestUpdateRules, validate, updatePest);
router.delete('/:id', protect, adminOnly, idParam(), validate, deletePest);

module.exports = router;