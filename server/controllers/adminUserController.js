const mongoose = require('mongoose');
const User = require('../models/User');
const Farm = require('../models/Farm');
const PestReport = require('../models/PestReport');
const { asyncHandler } = require('../middleware/errorHandler');
const { cleanupUserData } = require('../utils/cascade');

const isSelf = (req) => req.params.id === req.user._id.toString();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/users?role=farmer&search=john&page=1&limit=10
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i'); // escaped, so users cannot inject patterns
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/admin/users/:id
// Same response as before ({ data: user }) plus a "stats" block counted from existing data.
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const [farms, byStatus, lastReport] = await Promise.all([
    Farm.countDocuments({ farmer: user._id }),
    PestReport.aggregate([
      { $match: { farmer: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    PestReport.findOne({ farmer: user._id }).sort({ createdAt: -1 }).select('createdAt'),
  ]);

  const counts = { Pending: 0, Verified: 0, Rejected: 0 };
  byStatus.forEach((s) => { if (s._id in counts) counts[s._id] = s.count; });

  res.json({
    success: true,
    data: user,
    stats: {
      farms,
      reports: counts.Pending + counts.Verified + counts.Rejected,
      pending: counts.Pending,
      verified: counts.Verified,
      rejected: counts.Rejected,
      lastReportAt: lastReport ? lastReport.createdAt : null,
    },
  });
});

// PUT /api/admin/users/:id/role   { "role": "admin" }
exports.updateUserRole = asyncHandler(async (req, res) => {
  if (isSelf(req)) return res.status(400).json({ success: false, message: 'You cannot change your own role' });

  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'Role updated', user });
});

// PUT /api/admin/users/:id/status   { "isActive": false }
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, message: 'isActive must be true or false' });
  if (isSelf(req)) return res.status(400).json({ success: false, message: 'You cannot deactivate yourself' });

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}`, user });
});

// DELETE /api/admin/users/:id
// Removes the user, their farms, activities and unverified reports.
// Verified reports are kept because alerts and the outbreak map rely on them.
exports.deleteUser = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
  if (isSelf(req)) return res.status(400).json({ success: false, message: 'You cannot delete yourself' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await cleanupUserData(user._id);
  await user.deleteOne();
  res.json({ success: true, message: 'User and related data deleted' });
});