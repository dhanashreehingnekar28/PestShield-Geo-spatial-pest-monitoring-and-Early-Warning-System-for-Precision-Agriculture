
const PestReport = require('../models/PestReport');
const Alert = require('../models/Alert');

const CROPS = ['Groundnut', 'Potato', 'Chilli'];
const SEVERITIES = ['Low', 'Medium', 'High'];

const isValidCoordinates = (latitude, longitude) =>
  typeof latitude === 'number' &&
  Number.isFinite(latitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  typeof longitude === 'number' &&
  Number.isFinite(longitude) &&
  longitude >= -180 &&
  longitude <= 180;

const normalize = (value) =>
  String(value || '').trim().toLowerCase();

const riskFromAlert = (alert) => {
  const count = alert.triggeringReports?.length || 0;

  if (alert.severity === 'High' || count >= 6) {
    return 'High';
  }

  if (alert.severity === 'Medium' || count >= 4) {
    return 'Medium';
  }

  return 'Low';
};

const reportPestName = (report) =>
  report.pest?.pestName ||
  report.aiPredictedPest ||
  'Unknown';

// GET /api/map/data
// GeoJSON coordinates use [longitude, latitude].
const getMapData = async (req, res) => {
  try {
    const {
      crop,
      pest,
      severity,
      days,
      includeResolved
    } = req.query;

    const isAdmin = req.user?.role === 'admin';

    // Validate crop filter
    if (crop && !CROPS.includes(crop)) {
      return res.status(400).json({
        success: false,
        message: `crop must be one of: ${CROPS.join(', ')}`
      });
    }

    // Validate severity filter
    if (severity && !SEVERITIES.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: `severity must be one of: ${SEVERITIES.join(', ')}`
      });
    }

    // Validate date range
    let since = null;

    if (days !== undefined && days !== '') {
      const numberOfDays = Number(days);

      if (
        !Number.isFinite(numberOfDays) ||
        numberOfDays <= 0 ||
        numberOfDays > 365
      ) {
        return res.status(400).json({
          success: false,
          message: 'days must be between 1 and 365'
        });
      }

      since = new Date(
        Date.now() - numberOfDays * 24 * 60 * 60 * 1000
      );
    }

    // Only verified reports with eligible location sources
    const reportFilter = {
      status: 'Verified',
      latitude: { $ne: null },
      longitude: { $ne: null },
      locationSource: {
        $in: ['FarmSelected', 'DeviceGPS']
      }
    };

    const alertFilter = {};

    // Show active outbreaks by default
    if (includeResolved !== 'true') {
      alertFilter.status = 'Active';
    }

    if (crop) {
      reportFilter.crop = crop;
      alertFilter.crop = crop;
    }

    if (severity) {
      reportFilter.severity = severity;
      alertFilter.severity = severity;
    }

    if (since) {
      reportFilter.createdAt = { $gte: since };
      alertFilter.createdAt = { $gte: since };
    }

    // Fetch reports and outbreaks from MongoDB
    const [reports, alerts] = await Promise.all([
      PestReport.find(reportFilter)
        .populate('pest', 'pestName')
        .sort({ createdAt: -1 })
        .limit(2000)
        .lean(),

      Alert.find(alertFilter)
        .sort({ createdAt: -1 })
        .limit(500)
        .lean()
    ]);

    const pestQuery = normalize(pest);

    const matchesPest = (name) =>
      !pestQuery || normalize(name).includes(pestQuery);

    // Convert verified reports to GeoJSON features
    const reportFeatures = reports
      .filter((report) => {
        if (!matchesPest(reportPestName(report))) {
          return false;
        }

        if (!isValidCoordinates(
          report.latitude,
          report.longitude
        )) {
          return false;
        }

        // Extra protection against approximate locations
        const source = report.locationSource || 'Unknown';

        if (
          source !== 'FarmSelected' &&
          source !== 'DeviceGPS'
        ) {
          return false;
        }

        return true;
      })
      .map((report) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            report.longitude,
            report.latitude
          ]
        },
        properties: {
          id: report._id,
          crop: report.crop,
          pestName: reportPestName(report),
          severity: report.severity,
          detectionMethod: report.detectionMethod,
          reportedAt: report.createdAt,

          // Additional information only for admins
          ...(isAdmin && {
            image: report.image,
            description: report.description || '',
            aiPredictedPest:
              report.aiPredictedPest || null,
            aiConfidence:
              Number.isFinite(report.aiConfidence)
                ? report.aiConfidence
                : null
          })
        }
      }));

    // Convert outbreak alerts to GeoJSON features
    const outbreakFeatures = alerts
      .filter((alert) => {
        return (
          matchesPest(alert.pestName) &&
          isValidCoordinates(
            alert.centerLatitude,
            alert.centerLongitude
          )
        );
      })
      .map((alert) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            alert.centerLongitude,
            alert.centerLatitude
          ]
        },
        properties: {
          id: alert._id,
          crop: alert.crop,
          pestName: alert.pestName,
          severity: alert.severity,
          riskLevel: riskFromAlert(alert),
          radiusKm: alert.radiusKm,
          reportCount:
            alert.triggeringReports?.length || 0,
          status: alert.status,
          message: alert.message,
          detectedAt: alert.createdAt,
          updatedAt: alert.updatedAt,
          recommendedActions:
            alert.recommendedActions || [],
          reportIds:
            (alert.triggeringReports || []).map(String)
        }
      }));

    // Crop-wise summary
    const byCrop = {
      Groundnut: 0,
      Potato: 0,
      Chilli: 0
    };

    reportFeatures.forEach((feature) => {
      byCrop[feature.properties.crop] += 1;
    });

    return res.json({
      success: true,
      data: {
        reports: {
          type: 'FeatureCollection',
          features: reportFeatures
        },
        outbreaks: {
          type: 'FeatureCollection',
          features: outbreakFeatures
        },
        summary: {
          totalReports: reportFeatures.length,
          totalOutbreakZones:
            outbreakFeatures.length,
          highRiskZones:
            outbreakFeatures.filter(
              (feature) =>
                feature.properties.riskLevel === 'High'
            ).length,
          byCrop
        }
      }
    });
  } catch (error) {
    console.error('Map data error:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not load map data'
    });
  }
};

module.exports = { getMapData };
