const fs = require('fs');
const path = require('path');
const Farm = require('../models/Farm');
const PestReport = require('../models/PestReport');
const FieldActivity = require('../models/FieldActivity');
const Alert = require('../models/Alert');

const BASE = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(BASE, 'uploads');

const removeFile = (rel) => {
  if (!rel) return;
  const p = path.join(BASE, rel);
  if (p.startsWith(UPLOADS_DIR)) fs.unlink(p, () => {});
};

// Pending and rejected reports (and their photos) are removed.
// Verified reports stay, because they are part of outbreak history and alerts.
const deleteUnverifiedReports = async (filter) => {
  const reports = await PestReport.find({ ...filter, status: { $ne: 'Verified' } }).select('image');
  reports.forEach((r) => removeFile(r.image));
  if (reports.length) await PestReport.deleteMany({ _id: { $in: reports.map((r) => r._id) } });
};

const cleanupFarmData = async (farmId) => {
  await FieldActivity.deleteMany({ farm: farmId });
  await deleteUnverifiedReports({ farm: farmId });
};

const cleanupUserData = async (userId) => {
  const farms = await Farm.find({ farmer: userId }).select('_id');
  for (const f of farms) await cleanupFarmData(f._id);
  await Farm.deleteMany({ farmer: userId });
  await FieldActivity.deleteMany({ farmer: userId });
  await deleteUnverifiedReports({ farmer: userId });
  await Alert.updateMany({}, { $pull: { notifiedFarmers: { farmer: userId } } });
};

module.exports = { cleanupFarmData, cleanupUserData };