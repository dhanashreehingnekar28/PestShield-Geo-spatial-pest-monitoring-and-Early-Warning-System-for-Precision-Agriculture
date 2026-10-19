
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mode = process.env.PESTSHIELD_MODE;
    const uri = process.env.MONGO_URI;

    if (!['demo', 'real'].includes(mode)) {
      throw new Error('PESTSHIELD_MODE must be demo or real');
    }

    if (!uri) {
      throw new Error('MONGO_URI is missing');
    }

    const parsed = new URL(uri);
    const database = decodeURIComponent(
      parsed.pathname.replace(/^\//, '')
    );

    const expected = `pestshield_${mode}`;

    if (database !== expected) {
      throw new Error(
        `Database mismatch: ${mode} mode requires ${expected}`
      );
    }

    await mongoose.connect(uri, {
      dbName: expected
    });

    console.log(`MongoDB connected: ${expected} (${mode} mode)`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
