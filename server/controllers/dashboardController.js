const User = require('../models/User');
const Farm = require('../models/Farm');
const PestReport = require('../models/PestReport');
const Alert = require('../models/Alert');
const FieldActivity = require('../models/FieldActivity');
const { asyncHandler } = require('../middleware/errorHandler');

const DAY = 24 * 60 * 60 * 1000;
const CROPS = ['Groundnut', 'Potato', 'Chilli'];
const TREND_DAYS = 14;
const TZ = 'Asia/Kolkata'; // decides which calendar day a report belongs to
const SEVERITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'Verified', 'Rejected'];
const TOP_PESTS = 5;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// [{ _id: 'Potato', count: 3 }] -> one row per crop, missing crops get 0
const perCrop = (rows) => CROPS.map((crop) => ({ crop, count: rows.find((r) => r._id === crop)?.count || 0 }));

// [{ _id: 'High', count: 2 }] -> one row per severity, missing ones get 0
const perSeverity = (rows) => SEVERITIES.map((severity) => ({ severity, count: rows.find((r) => r._id === severity)?.count || 0 }));

// [{ _id: { crop, status }, count }] -> one row per crop with a count for each status
const perCropStatus = (rows) =>
  CROPS.map((crop) => {
    const row = { crop };
    STATUSES.forEach((s) => { row[s] = rows.find((r) => r._id.crop === crop && r._id.status === s)?.count || 0; });
    row.total = STATUSES.reduce((sum, s) => sum + row[s], 0);
    return row;
  });

// The AI names its classes with the crop in front (GROUNDNUT_RUST); the pest library does not (Rust)
const cleanPestName = (name) => {
  const clean = String(name).replace(/_/g, ' ').trim().replace(/^(groundnut|potato|chilli|chili)\s+/i, '');
  // AI labels are all capitals (LEAF CURL), so show them like the library does (Leaf Curl)
  return clean === clean.toUpperCase() ? clean.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : clean;
};

// Merge spellings of the same pest, drop "Healthy" (not a pest) and keep the top few
const rankPests = (rows) => {
  const merged = new Map();
  rows.forEach((r) => {
    const pest = cleanPestName(r._id.pest);
    if (!pest || pest.toLowerCase() === 'healthy') return;
    const key = `${r._id.crop}|${pest.toLowerCase()}`;
    const prev = merged.get(key);
    if (prev) prev.count += r.count;
    else merged.set(key, { pest, crop: r._id.crop, count: r.count });
  });
  return [...merged.values()].sort((a, b) => b.count - a.count || a.pest.localeCompare(b.pest)).slice(0, TOP_PESTS);
};

// GET /api/dashboard/farmer: only the logged-in farmer's own data
const getFarmerSummary = asyncHandler(async (req, res) => {
  const farmer = req.user._id;
  const today = startOfToday();
  const nextWeek = new Date(today.getTime() + 7 * DAY);
  const pending = { farmer, status: 'Pending' };
  const dueBefore = (d) => ({ $or: [{ dueDate: { $lt: d } }, { dueDate: { $exists: false }, date: { $lt: d } }] });

  const [farms, reportRows, pendingCount, overdueCount, dueThisWeek, upcoming] = await Promise.all([
    Farm.countDocuments({ farmer }),
    PestReport.aggregate([{ $match: { farmer } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    FieldActivity.countDocuments(pending),
    FieldActivity.countDocuments({ ...pending, ...dueBefore(today) }),
    FieldActivity.countDocuments({ ...pending, dueDate: { $gte: today, $lt: nextWeek } }),
    FieldActivity.find(pending).sort({ dueDate: 1, date: 1 }).limit(5).populate('farm', 'farmName cropType').lean(),
  ]);

  const count = (s) => reportRows.find((r) => r._id === s)?.count || 0;
  const reports = { Pending: count('Pending'), Verified: count('Verified'), Rejected: count('Rejected') };
  reports.total = reports.Pending + reports.Verified + reports.Rejected;

  const tasks = upcoming.map((t) => {
    const due = t.dueDate || t.date;
    return { _id: t._id, title: t.title, type: t.type, farm: t.farm, dueDate: due, isOverdue: !!due && due < today };
  });

  res.json({
    success: true,
    data: { farms, reports, activities: { pending: pendingCount, overdue: overdueCount, dueThisWeek, upcoming: tasks } },
  });
});

// GET /api/dashboard/admin: system-wide analytics
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - (TREND_DAYS + 1) * DAY);
  const notRejected = { status: { $ne: 'Rejected' } };

  const [
    farmers, activeFarmers, farms, farmsByCrop, reportsByCropStatus, reportsBySeverity,
    pestRows, trendRows, oldestPending, activeAlerts, highRisk, resolvedAlerts,
  ] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'farmer', isActive: { $ne: false } }),
    Farm.countDocuments(),
    Farm.aggregate([{ $group: { _id: '$cropType', count: { $sum: 1 } } }]),
    PestReport.aggregate([{ $group: { _id: { crop: '$crop', status: '$status' }, count: { $sum: 1 } } }]),
    // Rejected reports were wrong, so they are left out of the severity picture
    PestReport.aggregate([{ $match: notRejected }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    // Pest name = the library pest if chosen, otherwise the AI prediction. Rejected reports are ignored.
    PestReport.aggregate([
      { $match: notRejected },
      { $lookup: { from: 'pests', localField: 'pest', foreignField: '_id', as: 'pestDoc' } },
      { $addFields: { pestLabel: { $ifNull: [{ $arrayElemAt: ['$pestDoc.pestName', 0] }, '$aiPredictedPest'] } } },
      { $match: { pestLabel: { $ne: null } } },
      { $group: { _id: { pest: '$pestLabel', crop: '$crop' }, count: { $sum: 1 } } },
    ]),
    PestReport.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } },
    ]),
    PestReport.findOne({ status: 'Pending' }).sort({ createdAt: 1 }).select('createdAt').lean(),
    Alert.countDocuments({ status: 'Active' }),
    Alert.countDocuments({ status: 'Active', severity: 'High' }),
    Alert.countDocuments({ status: 'Resolved' }),
  ]);

  const byCropStatus = perCropStatus(reportsByCropStatus);
  const sumStatus = (s) => byCropStatus.reduce((sum, c) => sum + c[s], 0);
  const pendingReports = sumStatus('Pending');
  const verifiedReports = sumStatus('Verified');
  const rejectedReports = sumStatus('Rejected');
  const reviewed = verifiedReports + rejectedReports;

  // One entry per day for the last TREND_DAYS days, including days with no reports
  const trend = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * DAY).toLocaleDateString('en-CA', { timeZone: TZ });
    trend.push({ date, count: trendRows.find((r) => r._id === date)?.count || 0 });
  }

  res.json({
    success: true,
    data: {
      totals: {
        farmers, activeFarmers, farms,
        reports: pendingReports + verifiedReports + rejectedReports,
        pendingReports, verifiedReports, rejectedReports,
        // Share of reviewed reports that were verified. null until something has been reviewed.
        verificationRate: reviewed ? Math.round((verifiedReports / reviewed) * 100) : null,
        oldestPendingAt: oldestPending ? oldestPending.createdAt : null,
      },
      alerts: { active: activeAlerts, highRisk, resolved: resolvedAlerts },
      reportsByCrop: byCropStatus.map((c) => ({ crop: c.crop, count: c.total })),
      reportsByCropStatus: byCropStatus,
      reportsBySeverity: perSeverity(reportsBySeverity),
      farmsByCrop: perCrop(farmsByCrop),
      topPests: rankPests(pestRows),
      trend,
    },
  });
});

module.exports = { getFarmerSummary, getAdminAnalytics };