const Alert = require('../models/Alert');
const fs = require('fs');
const PestReport = require('../models/PestReport');
const Farm = require('../models/Farm');
const Pest = require('../models/Pest');
const FieldActivity = require('../models/FieldActivity');
const { createPestTasks } = require('../services/activityPlanner');
const {
  evaluateOutbreak,
  RADIUS_KM,
  MIN_REPORTS,
  HIGH_RISK_REPORTS,
  WINDOW_DAYS
} = require('../services/outbreakService');
const { haversineDistanceKm } = require('../utils/geo');
const { buildRecommendedActions } = require('../utils/recommendations');

const discardUpload = (file) => { if (file) fs.unlink(file.path, () => {}); };

const createReport = async (req, res) => {
  try {
    const {
      farm, crop, pest, severity, description,
      aiPredictedPest, aiConfidence, detectionMethod,
    } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'Image is required' });

    // The farm must exist and belong to the person reporting
    if (!farm) { discardUpload(req.file); return res.status(400).json({ success: false, message: 'Farm is required' }); }
    const farmDoc = await Farm.findById(farm);
    if (!farmDoc) { discardUpload(req.file); return res.status(404).json({ success: false, message: 'Farm not found' }); }
    if (String(farmDoc.farmer) !== String(req.user._id)) {
      discardUpload(req.file);
      return res.status(403).json({ success: false, message: 'You can only report pests on your own farms' });
    }

    if (farmDoc.cropType !== crop) {
      discardUpload(req.file);
      return res.status(400).json({
        success: false,
        message: 'Report crop must match the selected farm crop'
      });
    }

    const farmLatitude = farmDoc.location?.latitude;
    const farmLongitude = farmDoc.location?.longitude;

    const hasValidFarmLocation =
      typeof farmLatitude === 'number' &&
      Number.isFinite(farmLatitude) &&
      farmLatitude >= -90 &&
      farmLatitude <= 90 &&
      typeof farmLongitude === 'number' &&
      Number.isFinite(farmLongitude) &&
      farmLongitude >= -180 &&
      farmLongitude <= 180;

    if (!hasValidFarmLocation) {
      discardUpload(req.file);

      return res.status(400).json({
        success: false,
        message: 'This farm does not have valid location coordinates. Please update the farm location before submitting a pest report.'
      });
    }

    if (pest) {
      const selectedPest = await Pest.findById(pest);

      if (!selectedPest) {
        discardUpload(req.file);
        return res.status(400).json({
          success: false,
          message: 'Selected pest or disease was not found.'
        });
      }

      if (selectedPest.crop !== crop) {
        discardUpload(req.file);
        return res.status(400).json({
          success: false,
          message: 'Selected pest or disease does not belong to this crop.'
        });
      }
    }

    const report = await PestReport.create({
      farmer: req.user._id,
      farm,
      crop,
      pest: pest || undefined,
      severity,
      description,
      image: `/uploads/${req.file.filename}`,
      latitude: farmDoc.location.latitude,
      longitude: farmDoc.location.longitude,
      locationSource: farmDoc.location.source || 'Unknown',
      aiPredictedPest: aiPredictedPest || undefined,
      aiConfidence: aiConfidence !== undefined && aiConfidence !== '' ? Number(aiConfidence) : undefined,
      detectionMethod: detectionMethod === 'AI-Assisted' ? 'AI-Assisted' : 'Manual',
    });

    // Add inspection / treatment tasks for the farmer. A problem here must not fail the report.
    let tasksCreated = 0;
    try {
      const pestDoc = report.pest ? await Pest.findById(report.pest).lean() : null;
      if (pestDoc) {
        const tasks = await createPestTasks({ farm: farmDoc, pestName: pestDoc.pestName, severity: report.severity, reportId: report._id });
        tasksCreated = tasks.length;
      }
    } catch (e) {
      console.error('Could not create pest tasks:', e.message);
    }

    res.status(201).json({ success: true, data: report, tasksCreated });
  } catch (err) {
    discardUpload(req.file);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyReports = async (req, res) => {
  const reports = await PestReport.find({ farmer: req.user._id }).populate('pest').sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
};

const getAllReports = async (req, res) => {
  const reports = await PestReport.find()
    .populate('farmer', 'name email')
    .populate('farm', 'farmName cropType location')
    .populate('pest')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
};

async function refreshAffectedAlerts(reportId) {
  const alerts = await Alert.find({
    status: 'Active',
    triggeringReports: reportId
  });

  const since = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  for (const alert of alerts) {
    const reports = await PestReport.find({
      _id: { $in: alert.triggeringReports },
      crop: alert.crop,
      status: 'Verified',
      createdAt: { $gte: since }
    })
      .populate('pest')
      .populate('farm', 'location');

    const matching = reports.filter((report) => {
      const source = report.locationSource || 'Unknown';

      if (
        source !== 'FarmSelected' &&
        source !== 'DeviceGPS'
      ) {
        return false;
      }

      const name = report.pest?.pestName || report.aiPredictedPest;

      if (!name) return false;

      const normalize = (value) =>
        String(value || '')
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, ' ');

      if (normalize(name) !== normalize(alert.pestName)) {
        return false;
      }

      if (
        !Number.isFinite(report.latitude) ||
        !Number.isFinite(report.longitude)
      ) {
        return false;
      }

      return haversineDistanceKm(
        alert.centerLatitude,
        alert.centerLongitude,
        report.latitude,
        report.longitude
      ) <= RADIUS_KM;
    });

    if (matching.length < MIN_REPORTS) {
      alert.status = 'Resolved';
      alert.triggeringReports = matching.map((report) => report._id);
      await alert.save();
      continue;
    }

    const severity =
      matching.length >= HIGH_RISK_REPORTS ? 'High' : 'Medium';

    alert.triggeringReports = matching.map((report) => report._id);
    alert.severity = severity;

    alert.centerLatitude =
      matching.reduce((sum, report) => sum + report.latitude, 0) /
      matching.length;

    alert.centerLongitude =
      matching.reduce((sum, report) => sum + report.longitude, 0) /
      matching.length;

    alert.message =
      `${alert.pestName} outbreak detected in your area affecting ` +
      `${alert.crop}. ${matching.length} verified reports ` +
      `in the last ${WINDOW_DAYS} days.`;

    alert.recommendedActions = await buildRecommendedActions(
      alert.pestName,
      alert.crop,
      severity
    );

    await alert.save();
  }
}

const verifyReport = async (req, res) => {
  try {
    const { status, pest } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Verified or Rejected'
      });
    }

    const previousReport = await PestReport.findById(req.params.id);

    if (!previousReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const update = { status };
    if (pest) {
      const pestDoc = await Pest.findById(pest);

      if (!pestDoc || pestDoc.crop !== previousReport.crop) {
        return res.status(400).json({
          success: false,
          message: 'Selected pest must belong to the report crop'
        });
      }

      update.pest = pest;
    }

    const report = await PestReport.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    try {
      // Remove outdated membership from existing outbreaks,
      // including when the administrator changes the pest.
      await refreshAffectedAlerts(report._id);

      if (status === 'Verified') {
        await evaluateOutbreak(report._id);
      }
    } catch (error) {
      console.error(
        'Outbreak recalculation failed:',
        error.message
      );
    }

    if (status === 'Rejected') {
      try {
        await FieldActivity.deleteMany({
          report: report._id,
          source: 'pest',
          status: 'Pending'
        });
      } catch (error) {
        console.error(
          'Could not remove tasks for rejected report:',
          error.message
        );
      }
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Report verification failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not verify report'
    });
  }
};

module.exports = { createReport, getMyReports, getAllReports, verifyReport };