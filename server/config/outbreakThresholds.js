
const CROP_THRESHOLDS = {
  Groundnut: {
    radiusKm: 5,
    minReports: 3,
    highRiskReports: 5,
    windowDays: 7
  },
  Potato: {
    radiusKm: 3,
    minReports: 2,
    highRiskReports: 4,
    windowDays: 5
  },
  Chilli: {
    radiusKm: 4,
    minReports: 3,
    highRiskReports: 5,
    windowDays: 7
  }
};

function getOutbreakThresholds(crop) {
  const cropName = String(crop || '')
    .trim()
    .toLowerCase();

  const key = Object.keys(CROP_THRESHOLDS).find(
    (name) => name.toLowerCase() === cropName
  );

  // Preserve the original rule for unknown crop types.
  return key
    ? CROP_THRESHOLDS[key]
    : CROP_THRESHOLDS.Groundnut;
}

module.exports = {
  CROP_THRESHOLDS,
  getOutbreakThresholds
};
