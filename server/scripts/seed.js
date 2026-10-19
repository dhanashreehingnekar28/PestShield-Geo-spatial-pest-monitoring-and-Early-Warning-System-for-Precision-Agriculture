const path = require('path');
const mongoose = require('mongoose');

// This seed script is ONLY for the demo database.
process.env.PESTSHIELD_MODE = 'demo';

require('dotenv').config({
  path: path.join(__dirname, '../.env.demo'),
  override: true
});

const connectDB = require('../config/db');
const Pest = require('../models/Pest');
const pests = require('../data/pests');

const run = async () => {
  try {
    await connectDB();

    // Additional protection against seeding the wrong database.
    if (mongoose.connection.name !== 'pestshield_demo') {
      throw new Error('Refusing to seed a non-demo database');
    }

    let inserted = 0;
    let existing = 0;

    for (const pest of pests) {
      const result = await Pest.updateOne(
        {
          crop: pest.crop,
          pestName: pest.pestName
        },
        {
          $setOnInsert: pest
        },
        {
          upsert: true
        }
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        existing++;
      }
    }

    console.log(`Seed completed successfully.`);
    console.log(`New pests inserted: ${inserted}`);
    console.log(`Existing pests preserved: ${existing}`);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
