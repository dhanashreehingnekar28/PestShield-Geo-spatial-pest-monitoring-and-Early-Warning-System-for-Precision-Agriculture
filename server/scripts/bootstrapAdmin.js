const mongoose = require('mongoose');
const User = require('../models/User');

// Creates the very first admin from .env, only when no admin exists yet.
// Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and start the server once.
const run = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  try {
    if (await User.exists({ role: 'admin' })) {
      console.log('Admin account already exists. First-admin setup skipped.');
      return;
    }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log('No admin account exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env and restart to create the first admin.');
      return;
    }
    if (ADMIN_PASSWORD.length < 8) {
      console.log('ADMIN_PASSWORD must be at least 8 characters. First admin was not created.');
      return;
    }
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      // Promote an existing account only if ADMIN_PASSWORD is that account's password.
      // Otherwise anyone who registered this email as a farmer before the first admin
      // was set up would become admin on the next restart.
      if (!(await existing.matchPassword(ADMIN_PASSWORD))) {
        console.log(`An account for ${email} already exists with a different password, so it was NOT promoted. Use a different ADMIN_EMAIL, or set ADMIN_PASSWORD to that account's password.`);
        return;
      }
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save();
      console.log(`Existing account ${email} was promoted to admin.`);
      return;
    }
    await User.create({ name: ADMIN_NAME || 'Administrator', email, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`First admin account created: ${email}`);
  } catch (err) {
    console.error('Admin bootstrap failed:', err.message);
  }
};

module.exports = () => {
  if (mongoose.connection.readyState === 1) run();
  else mongoose.connection.once('open', run);
};