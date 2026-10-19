const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam, adminListRules, adminRoleRules, adminStatusRules } = require('../validators');
const { getUsers, getUserById, updateUserRole, updateUserStatus, deleteUser } = require('../controllers/adminUserController');

router.use(protect, adminOnly);

router.get('/', adminListRules, validate, getUsers);
router.get('/:id', idParam(), validate, getUserById);
router.put('/:id/role', adminRoleRules, validate, updateUserRole);
router.put('/:id/status', adminStatusRules, validate, updateUserStatus);
router.delete('/:id', idParam(), validate, deleteUser);

module.exports = router;