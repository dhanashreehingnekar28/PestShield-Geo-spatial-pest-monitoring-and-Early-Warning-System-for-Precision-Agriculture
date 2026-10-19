const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators');
const {
  createActivity, generateForFarm, createFromPest, getMyActivities, updateActivity, setStatus, deleteActivity,
} = require('../controllers/activityController');

// Field activities belong to farmers. Admins do not use these routes.
router.use(protect, authorize('farmer'));

router.post('/generate', generateForFarm);
router.post('/from-pest', createFromPest);
router.post('/', createActivity);
router.get('/', getMyActivities);
router.patch('/:id/status', idParam(), validate, setStatus);
router.put('/:id', idParam(), validate, updateActivity);
router.delete('/:id', idParam(), validate, deleteActivity);

module.exports = router;