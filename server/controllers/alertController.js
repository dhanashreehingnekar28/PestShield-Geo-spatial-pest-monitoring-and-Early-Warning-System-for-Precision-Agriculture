const Alert = require('../models/Alert');
const Farm = require('../models/Farm');
const PestReport = require('../models/PestReport');
const Pest = require('../models/Pest');
const { haversineDistanceKm } = require('../utils/geo');
const { WINDOW_DAYS } = require('../services/outbreakService');
const { buildAdvisory } = require('../utils/advisory');
const { getWeather } = require('../services/weatherService');

const round2 = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);

// Farmer-safe view of an alert: removes the list of other recipients
// and adds only this farmer's own read flag.
const toFarmerView = (alert, userId) => {
  const obj = alert.toObject();
  const mine = (obj.notifiedFarmers || []).find((n) => String(n.farmer) === String(userId));
  const verifiedReportCount = (obj.triggeringReports || []).length;
  delete obj.notifiedFarmers;
  delete obj.triggeringReports;
  return { 
    ...obj, 
    centerLatitude: round2(obj.centerLatitude), 
    centerLongitude: round2(obj.centerLongitude),
    read: mine ? mine.read : false, 
    verifiedReportCount, 
    windowDays: WINDOW_DAYS 
  };
};

// Farms of this farmer that grow the alert's crop and lie inside its radius
const farmsNear = (alert, farms) =>
  farms.filter((f) => {
    if (f.cropType !== alert.crop) return false;
    const { latitude, longitude } = f.location || {};
    return haversineDistanceKm(alert.centerLatitude, alert.centerLongitude, latitude, longitude) <= (alert.radiusKm || 5);
  });

const isNearAlert = (alert, farms) => farmsNear(alert, farms).length > 0;

const addAdvisory = async (alerts, farms, userId) => {
  const ids = alerts.flatMap((a) => [...(a.triggeringReports || [])]);
  const [reports, pests] = await Promise.all([
    PestReport.find({ _id: { $in: ids } }).select('aiPredictedPest aiConfidence').lean(),
    Pest.find({ pestName: { $in: alerts.map((a) => a.pestName) } }).select('pestName crop symptoms treatment').lean(),
  ]);
  const byId = new Map(reports.map((r) => [String(r._id), r]));
  return alerts.map((a) => {
    const own = [...(a.triggeringReports || [])].map((id) => byId.get(String(id))).filter(Boolean);
    const pest = pests.find((p) => p.pestName === a.pestName && p.crop === a.crop);
    return {
      ...toFarmerView(a, userId),
      affectedFarms: farmsNear(a, farms).map((f) => ({
      _id: f._id,
      farmName: f.farmName,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
    })),
      advisory: buildAdvisory(a, pest, own),
    };
  });
};

const getMyAlerts = async (req, res) => {
  try {
    const farms = await Farm.find({ farmer: req.user._id }).select('farmName cropType location');

    const [notified, active] = await Promise.all([
      Alert.find({ 'notifiedFarmers.farmer': req.user._id }),
      Alert.find({ status: 'Active', crop: { $in: farms.map((f) => f.cropType) } }),
    ]);

    // Alerts the farmer was notified about, plus active alerts near any of their farms
    const byId = new Map();
    notified.forEach((a) => byId.set(String(a._id), a));
    active.forEach((a) => {
      if (!byId.has(String(a._id)) && isNearAlert(a, farms)) byId.set(String(a._id), a);
    });

    const sorted = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
    const data = await addAdvisory(sorted, farms, req.user._id);
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch alerts' });
  }
};

const markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    const entry = alert.notifiedFarmers.find((n) => String(n.farmer) === String(req.user._id));
    if (entry) {
      entry.read = true;
    } else {
      // Not on the original recipient list: allowed only if an active alert is near their farm
      const farms = await Farm.find({ farmer: req.user._id }).select('farmName cropType location');
      if (alert.status !== 'Active' || !isNearAlert(alert, farms)) {
        return res.status(403).json({ success: false, message: 'Not your alert' });
      }
      alert.notifiedFarmers.push({ farmer: req.user._id, read: true });
    }

    await alert.save();
    res.json({ success: true, data: toFarmerView(alert, req.user._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update alert' });
  }
};

const getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch alerts' });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not resolve alert' });
  }
};

const getAlertWeather = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    const mine = alert.notifiedFarmers.some((n) => String(n.farmer) === String(req.user._id));
    if (!mine) {
      const farms = await Farm.find({ farmer: req.user._id }).select('farmName cropType location');
      if (alert.status !== 'Active' || !isNearAlert(alert, farms)) {
        return res.status(403).json({ success: false, message: 'Not your alert' });
      }
    }
    
    let data = null;
    try { 
      data = await getWeather(alert.centerLatitude, alert.centerLongitude); 
    } catch { 
      /* weather unavailable */ 
    }
    
    res.json({ success: true, data }); // data:null means "unavailable", never fake values
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch weather' });
  }
};

module.exports = { getMyAlerts, markAlertRead, getAllAlerts, resolveAlert, getAlertWeather };