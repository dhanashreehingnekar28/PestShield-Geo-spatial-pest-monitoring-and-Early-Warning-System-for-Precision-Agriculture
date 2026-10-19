const PestReport = require('../models/PestReport');
const Farm = require('../models/Farm');
const Alert = require('../models/Alert');
const { haversineDistanceKm } = require('../utils/geo');
const { buildRecommendedActions } = require('../utils/recommendations');

const {
  getOutbreakThresholds
} = require('../config/outbreakThresholds');

// These are not confirmed pest outbreaks.
const EXCLUDED_CATEGORIES = new Set([
  'healthy',
  'yellowish'
]);

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}

function effectivePestName(report) {
  if (report.pest && report.pest.pestName) {
    return report.pest.pestName;
  }

  return report.aiPredictedPest || null;
}

function validCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function hasEligibleFarmLocation(report) {
  const source = report.locationSource || 'Unknown';

  return (
    source === 'FarmSelected' ||
    source === 'DeviceGPS'
  );
}

function countDistinctFarmReports(reports) {
  const latestByFarm = new Map();

  for (const report of reports) {
    const farmId = report.farm?._id || report.farm;

    if (!farmId) continue;

    const key = String(farmId);
    const previous = latestByFarm.get(key);

    if (
      !previous ||
      new Date(report.createdAt) >
        new Date(previous.createdAt)
    ) {
      latestByFarm.set(key, report);
    }
  }

  return [...latestByFarm.values()];
}

async function findNearbyFarmerIds(crop, centerLat, centerLon, radiusKm) {
  const farms = await Farm.find({ cropType: crop });
  const ids = new Set();

  for (const farm of farms) {
    if (
      farm.location?.source !== 'FarmSelected' &&
      farm.location?.source !== 'DeviceGPS'
    ) {
      continue;
    }

    const { latitude, longitude } = farm.location || {};

    if (!validCoordinates(latitude, longitude)) continue;

    const distance = haversineDistanceKm(
      centerLat,
      centerLon,
      latitude,
      longitude
    );

    if (distance <= radiusKm) {
      ids.add(String(farm.farmer));
    }
  }

  return [...ids];
}

async function evaluateOutbreak(reportId) {
  const report = await PestReport.findById(reportId)
    .populate('pest')
    .populate('farm');

  if (!report || report.status !== 'Verified') return null;

  const {
    radiusKm,
    minReports,
    highRiskReports,
    windowDays
  } = getOutbreakThresholds(report.crop);

  const pestName = effectivePestName(report);

  if (!pestName) return null;

  if (EXCLUDED_CATEGORIES.has(normalizeName(pestName))) {
    return null;
  }

  if (
    !validCoordinates(report.latitude, report.longitude) ||
    !hasEligibleFarmLocation(report)
  ) {
    return null;
  }

  const since = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000
  );

  const candidates = await PestReport.find({
    crop: report.crop,
    status: 'Verified',
    createdAt: { $gte: since }
  })
    .populate('pest')
    .populate('farm', 'location');

  const nearbyReports = candidates.filter((candidate) => {
    const candidatePestName = effectivePestName(candidate);

    if (normalizeName(candidatePestName) !== normalizeName(pestName)) {
      return false;
    }

    if (
      !validCoordinates(candidate.latitude, candidate.longitude) ||
      !hasEligibleFarmLocation(candidate)
    ) {
      return false;
    }

    const distance = haversineDistanceKm(
      report.latitude,
      report.longitude,
      candidate.latitude,
      candidate.longitude
    );

    return distance <= radiusKm;
  });

  const matching = countDistinctFarmReports(nearbyReports);

  if (matching.length < minReports) {
    return null;
  }

  const centerLat =
    matching.reduce((sum, item) => sum + item.latitude, 0) /
    matching.length;

  const centerLon =
    matching.reduce((sum, item) => sum + item.longitude, 0) /
    matching.length;

  const severity =
    matching.length >= highRiskReports ? 'High' : 'Medium';

  const reportIds = matching.map((item) => item._id);

  // Find only an alert in the same geographical area.
  const activeAlerts = await Alert.find({
    crop: report.crop,
    status: 'Active'
  });

  const existingAlert = activeAlerts.find((alert) => {
    if (normalizeName(alert.pestName) !== normalizeName(pestName)) {
      return false;
    }

    if (!validCoordinates(
      alert.centerLatitude,
      alert.centerLongitude
    )) {
      return false;
    }

    return haversineDistanceKm(
      centerLat,
      centerLon,
      alert.centerLatitude,
      alert.centerLongitude
    ) <= radiusKm;
  });

  const recommendedActions = await buildRecommendedActions(
    pestName,
    report.crop,
    severity
  );

  const message =
    `${pestName} outbreak detected in your area affecting ` +
    `${report.crop}. ${matching.length} distinct farms with verified reports ` +
    `in the last ${windowDays} days.`;

  const nearbyFarmerIds = await findNearbyFarmerIds(
    report.crop,
    centerLat,
    centerLon,
    radiusKm
  );

  if (existingAlert) {
    // Replace stale report IDs with the current cluster.
    existingAlert.triggeringReports = reportIds;
    existingAlert.severity = severity;
    existingAlert.centerLatitude = centerLat;
    existingAlert.centerLongitude = centerLon;
    existingAlert.radiusKm = radiusKm;
    existingAlert.message = message;
    existingAlert.recommendedActions = recommendedActions;

    // Preserve read status for farmers already notified.
    const existingNotifications = new Map(
      (existingAlert.notifiedFarmers || []).map((entry) => [
        String(entry.farmer),
        entry.read
      ])
    );

    existingAlert.notifiedFarmers = nearbyFarmerIds.map((farmer) => ({
      farmer,
      read: existingNotifications.get(String(farmer)) ?? false
    }));

    await existingAlert.save();
    return existingAlert;
  }

  return Alert.create({
    crop: report.crop,
    pestName,
    severity,
    centerLatitude: centerLat,
    centerLongitude: centerLon,
    radiusKm,
    triggeringReports: reportIds,
    message,
    recommendedActions,
    notifiedFarmers: nearbyFarmerIds.map((farmer) => ({
      farmer,
      read: false
    }))
  });
}

async function expireOutdatedOutbreaks() {
  const activeAlerts = await Alert.find({
    status: 'Active'
  });

  let resolvedCount = 0;

  for (const alert of activeAlerts) {
    const {
      radiusKm,
      minReports,
      highRiskReports,
      windowDays
    } = getOutbreakThresholds(alert.crop);

    const since = new Date(
      Date.now() - windowDays * 24 * 60 * 60 * 1000
    );

    const reports = await PestReport.find({
      status: 'Verified',
      createdAt: { $gte: since },
      crop: alert.crop,
      locationSource: {
        $in: ['FarmSelected', 'DeviceGPS']
      }
    }).populate('pest', 'pestName');

    const nearbyReports = reports.filter((report) => {
      const pestName = effectivePestName(report);

      if (
        normalizeName(pestName) !==
        normalizeName(alert.pestName)
      ) {
        return false;
      }

      if (
        !validCoordinates(
          report.latitude,
          report.longitude
        ) ||
        !validCoordinates(
          alert.centerLatitude,
          alert.centerLongitude
        )
      ) {
        return false;
      }

      return haversineDistanceKm(
        alert.centerLatitude,
        alert.centerLongitude,
        report.latitude,
        report.longitude
      ) <= radiusKm;
    });

    const matching = countDistinctFarmReports(nearbyReports);

    if (matching.length < minReports) {
      alert.status = 'Resolved';
      await alert.save();
      resolvedCount += 1;
      continue;
    }

    const severity =
      matching.length >= highRiskReports
        ? 'High'
        : 'Medium';

    const centerLatitude =
      matching.reduce(
        (sum, report) => sum + report.latitude,
        0
      ) / matching.length;

    const centerLongitude =
      matching.reduce(
        (sum, report) => sum + report.longitude,
        0
      ) / matching.length;

    alert.triggeringReports = matching.map(
      (report) => report._id
    );

    alert.severity = severity;
    alert.centerLatitude = centerLatitude;
    alert.centerLongitude = centerLongitude;
    alert.radiusKm = radiusKm;

    alert.message =
      `${alert.pestName} outbreak detected in your area affecting ` +
      `${alert.crop}. ${matching.length} distinct farms with verified reports ` +
      `in the last ${windowDays} days.`;

    if (alert.isModified('severity')) {
      alert.recommendedActions =
        await buildRecommendedActions(
          alert.pestName,
          alert.crop,
          severity
        );
    }

    await alert.save();
  }

  return {
    checked: activeAlerts.length,
    resolved: resolvedCount
  };
}

module.exports = {
  evaluateOutbreak,
  expireOutdatedOutbreaks,
  getOutbreakThresholds
};