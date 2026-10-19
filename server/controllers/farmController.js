const Farm = require('../models/Farm');
const { asyncHandler } = require('../middleware/errorHandler');
const { cleanupFarmData } = require('../utils/cascade');
const { generateFarmPlan } = require('../services/activityPlanner');

const DAY = 24 * 60 * 60 * 1000;
const SOWING_MSG = 'Sowing date must be a valid date within the last 2 years or the next year';

const validateCoordinatePair = (latitude, longitude) => {
  const hasLatitude = latitude !== undefined && latitude !== null && latitude !== '';
  const hasLongitude = longitude !== undefined && longitude !== null && longitude !== '';

  if (!hasLatitude && !hasLongitude) {
    return { valid: true, present: false };
  }

  if (!hasLatitude || !hasLongitude) {
    return { valid: false, present: false };
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return { valid: false, present: false };
  }

  return {
    valid: true,
    present: true,
    latitude: lat,
    longitude: lon
  };
};

// undefined = not sent, null = invalid, Date = ok. A date-only value is read as local noon
// so it never slips to the neighbouring day.
const parseSowingDate = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(`${v}T12:00:00`) : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const now = Date.now();
  return d.getTime() < now - 730 * DAY || d.getTime() > now + 365 * DAY ? null : d;
};

// Builds (or rebuilds) the recommended activity schedule. A failure here must not fail the farm request.
const syncSchedule = async (farm, reset) => {
  try { await generateFarmPlan(farm, { reset }); } catch (e) { console.error('Could not build activity schedule:', e.message); }
};

const createFarm = asyncHandler(async (req, res) => {
  const {
    farmName,
    cropType,
    latitude,
    longitude,
    state,
    stateCode,
    district,
    districtCode,
    locationSource
  } = req.body;
  
  const coordinates = validateCoordinatePair(latitude, longitude);

  if (!coordinates.valid || !coordinates.present) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid farm location.'
    });
  }

  if (!district || typeof district !== 'string' || !district.trim()) {
    return res.status(400).json({
      success: false,
      message: 'District is required and must be a valid text string.'
    });
  }

  const allowedSources = [
    'FarmSelected',
    'DeviceGPS',
    'DistrictApproximate'
  ];
  const source = allowedSources.includes(locationSource) ? locationSource : 'Unknown';

  const sowingDate = parseSowingDate(req.body.sowingDate);
  if (sowingDate === null) return res.status(400).json({ success: false, message: SOWING_MSG });

  const farm = await Farm.create({
    farmer: req.user._id,
    farmName,
    cropType,
    location: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      state: typeof state === 'string' ? state.trim() : '',
      stateCode: typeof stateCode === 'string' ? stateCode.trim() : '',
      district: district.trim(),
      districtCode: typeof districtCode === 'string'
        ? districtCode.trim()
        : '',
      source
    },
    ...(sowingDate && { sowingDate }),
  });
  await syncSchedule(farm, false);
  res.status(201).json({ success: true, data: farm });
});

const getMyFarms = asyncHandler(async (req, res) => {
  const farms = await Farm.find({ farmer: req.user._id });
  res.json({ success: true, data: farms });
});

// Admin-only: return limited farm details for map display.
const getFarmsForMap = asyncHandler(async (req, res) => {
  const farms = await Farm.find({
    'location.latitude': { $gte: -90,$lte: 90 },
    'location.longitude': { $gte: -180,$lte: 180 }
  })
    .select('farmName cropType location')
    .lean();

  const mapFarms = farms
    .filter((farm) => {
      const lat = farm.location?.latitude;
      const lng = farm.location?.longitude;

      return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      );
    })
    .map((farm) => ({
      id: farm._id,
      farmName: farm.farmName,
      cropType: farm.cropType,
      latitude: farm.location.latitude,
      longitude: farm.location.longitude,
      state: farm.location.state || '',
      stateCode: farm.location.stateCode || '',
      district: farm.location.district,
      districtCode: farm.location.districtCode || '',
      locationSource: farm.location.source || 'Unknown'
    }));

  res.json({
    success: true,
    data: mapFarms
  });
});

const getFarmById = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  if (String(farm.farmer) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this farm' });
  }
  res.json({ success: true, data: farm });
});

const updateFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  if (String(farm.farmer) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this farm' });
  }
  const {
    farmName,
    cropType,
    latitude,
    longitude,
    state,
    stateCode,
    district,
    districtCode,
    locationSource
  } = req.body;
  const sowingDate = parseSowingDate(req.body.sowingDate);
  if (sowingDate === null) return res.status(400).json({ success: false, message: SOWING_MSG });

  let planChanged = false;
  if (farmName !== undefined) farm.farmName = farmName;
  if (cropType !== undefined) {
    if (cropType !== farm.cropType) planChanged = true;
    farm.cropType = cropType;
  }
  if (sowingDate && (!farm.sowingDate || sowingDate.getTime() !== new Date(farm.sowingDate).getTime())) {
    farm.sowingDate = sowingDate;
    planChanged = true;
  }
  
  if (!farm.location) farm.location = {};

  const changingCoordinates =
    latitude !== undefined || longitude !== undefined;

  if (changingCoordinates) {
    const nextLatitude =
      latitude !== undefined
        ? latitude
        : farm.location.latitude;

    const nextLongitude =
      longitude !== undefined
        ? longitude
        : farm.location.longitude;

    const coordinates = validateCoordinatePair(
      nextLatitude,
      nextLongitude
    );

    if (!coordinates.valid || !coordinates.present) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid farm coordinates.'
      });
    }

    const allowedSources = [
      'FarmSelected',
      'DeviceGPS',
      'DistrictApproximate'
    ];

    if (!allowedSources.includes(locationSource)) {
      return res.status(400).json({
        success: false,
        message:
          'Please specify how the updated farm location was selected.'
      });
    }

    farm.location.latitude = coordinates.latitude;
    farm.location.longitude = coordinates.longitude;
    farm.location.source = locationSource;
  }

  if (district !== undefined) {
    if (
      typeof district !== 'string' ||
      !district.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'District is required.'
      });
    }

    farm.location.district = district.trim();
  }

  if (state !== undefined) {
    farm.location.state = String(state).trim();
  }

  if (stateCode !== undefined) {
    farm.location.stateCode = String(stateCode).trim();
  }

  if (districtCode !== undefined) {
    farm.location.districtCode = String(districtCode).trim();
  }

  await farm.save();
  // A new crop or sowing date changes the schedule: rebuild the tasks that are still pending
  if (planChanged) await syncSchedule(farm, true);
  res.json({ success: true, data: farm });
});

// Deleting a farm also removes its activity log and its pending/rejected reports.
// Verified reports stay, since outbreak alerts and the map depend on them.
const deleteFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  if (String(farm.farmer) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this farm' });
  }
  await cleanupFarmData(farm._id);
  await farm.deleteOne();
  res.json({ success: true, message: 'Farm deleted' });
});

module.exports = {
  createFarm,
  getMyFarms,
  getFarmsForMap,
  getFarmById,
  updateFarm,
  deleteFarm
};