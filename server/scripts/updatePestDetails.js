// Adds the detailed Pest Library content (symptoms stages, identification,
// treatment options, prevention, precautions...) to pests that already exist.
//
// Safe to run more than once, and safe on a live database:
//   - it never deletes or re-creates pests, so report references keep working
//   - it never touches pestName, crop, description, symptoms or treatment
//   - it only fills a detail field when that field is empty, so anything an
//     admin has written is kept
//   - pests missing from the database are reported, not created
//
// Usage (from the server folder):
//   npm run seed:details              apply the changes
//   npm run seed:details -- --dry-run show what would change, write nothing

const DETAIL_FIELDS = [
  'causalAgent', 'spread', 'earlySigns', 'advancedSigns', 'identification',
  'immediateSteps', 'treatmentOptions', 'prevention', 'precautions',
];

const isEmpty = (v) =>
  v == null ||
  (typeof v === 'string' && !v.trim()) ||
  (Array.isArray(v) && v.every((x) => !String(x || '').trim()));

// Returns the fields to $set on `existing` (an empty object means "nothing to do").
const buildDetailUpdate = (existing, entry) => {
  const update = {};
  DETAIL_FIELDS.forEach((field) => {
    if (!isEmpty(entry[field]) && isEmpty(existing[field])) update[field] = entry[field];
  });
  return update;
};

const run = async () => {
  require('dotenv').config();
  const connectDB = require('../config/db');
  const Pest = require('../models/Pest');
  const entries = require('../data/pests');
  const dryRun = process.argv.includes('--dry-run');

  await connectDB();

  let updated = 0, unchanged = 0, missing = 0;
  for (const entry of entries) {
    const tag = `${entry.crop} / ${entry.pestName}`;
    const existing = await Pest.findOne({ pestName: entry.pestName, crop: entry.crop }).lean();
    if (!existing) {
      missing += 1;
      console.log(`  not in database, skipped: ${tag}`);
      continue;
    }
    const update = buildDetailUpdate(existing, entry);
    const fields = Object.keys(update);
    if (!fields.length) {
      unchanged += 1;
      console.log(`  already complete:         ${tag}`);
      continue;
    }
    if (!dryRun) await Pest.updateOne({ _id: existing._id }, { $set: update });
    updated += 1;
    console.log(`  ${dryRun ? 'would update' : 'updated'}:             ${tag} (${fields.length} fields)`);
  }

  console.log(`\n${dryRun ? 'Dry run - nothing was written. ' : ''}${updated} updated, ${unchanged} already complete, ${missing} not found.`);
  process.exit(0);
};

if (require.main === module) {
  run().catch((err) => {
    console.error('Update failed:', err.message);
    process.exit(1);
  });
}

module.exports = { buildDetailUpdate, DETAIL_FIELDS };