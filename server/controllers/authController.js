const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

const clean = (v) => String(v || '').trim();

// Public registration always creates a farmer. Admins are created by the first-admin
// setup (.env) or by an existing admin from the Users page.
const register = asyncHandler(async (req, res) => {
  const name = clean(req.body.name);
  const email = clean(req.body.email).toLowerCase();
  const { password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Try logging in instead.' });
  }
  // role is set here and never read from req.body
  await User.create({ name, email, password, role: 'farmer' });
  res.status(201).json({
    success: true,
    message: 'Registered successfully. Please login.',
    data: { name, email, role: 'farmer' },
  });
});

// loginAs is optional ("farmer" or "admin"). It only helps the user pick the right door:
// the role that counts is always the one stored on the account.
const login = asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const { password, loginAs } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (user.isActive === false) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact an administrator.' });
  }
  if (loginAs && loginAs !== user.role) {
    const message = user.role === 'admin'
      ? 'This is an administrator account. Please use Admin login.'
      : 'This is a farmer account. Please use Farmer login.';
    return res.status(403).json({ success: false, message });
  }
  res.json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) },
  });
});

const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };