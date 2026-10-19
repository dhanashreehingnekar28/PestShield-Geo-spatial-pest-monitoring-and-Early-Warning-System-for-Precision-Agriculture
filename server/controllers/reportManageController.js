const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const PestReport = require('../models/PestReport');
const Pest = require('../models/Pest');

const CROPS = ['Groundnut', 'Potato', 'Chilli'];
const SEVERITIES = ['Low', 'Medium', 'High'];
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Loads the report and checks the caller owns it. Returns null after sending an error response.
const getOwnedReport = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ success: false, message: 'Invalid report ID' });
    return null;
  }
  const report = await PestReport.findById(req.params.id);
  if (!report) {
    res.status(404).json({ success: false, message: 'Report not found' });
    return null;
  }
  if (report.farmer.toString() !== req.user._id.toString()) {
    res.status(403).json({ success: false, message: 'You can only change your own reports' });
    return null;
  }
  return report;
};

// @route PUT /api/pest-reports/:id   (farmer, own report, Pending only)
// Verified reports feed outbreak detection, so they are locked once reviewed.
const updateReport = async (req, res) => {
  try {
    const report = await getOwnedReport(req, res);
    if (!report) return;

    if (report.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `A ${report.status.toLowerCase()} report can no longer be edited` });
    }

    const { crop, severity, description, pest, latitude, longitude } = req.body;

    if (crop !== undefined) {
      if (!CROPS.includes(crop)) return res.status(400).json({ success: false, message: `crop must be one of: ${CROPS.join(', ')}` });
      report.crop = crop;
    }
    if (severity !== undefined) {
      if (!SEVERITIES.includes(severity)) return res.status(400).json({ success: false, message: `severity must be one of: ${SEVERITIES.join(', ')}` });
      report.severity = severity;
    }
    if (description !== undefined) report.description = String(description).trim();

    if (pest !== undefined && pest !== '') {
      if (!mongoose.Types.ObjectId.isValid(pest) || !(await Pest.exists({ _id: pest }))) {
        return res.status(400).json({ success: false, message: 'Selected pest does not exist' });
      }
      report.pest = pest;
    }

    if (latitude !== undefined && latitude !== '' && latitude !== null) {
      const lat = Number(latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90' });
      report.latitude = lat;
    }
    if (longitude !== undefined && longitude !== '' && longitude !== null) {
      const lng = Number(longitude);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180' });
      report.longitude = lng;
    }

    await report.save();
    const populated = await report.populate('pest', 'pestName');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/pest-reports/:id   (farmer, own report, Pending or Rejected only)
const deleteReport = async (req, res) => {
  try {
    const report = await getOwnedReport(req, res);
    if (!report) return;

    if (report.status === 'Verified') {
      return res.status(400).json({ success: false, message: 'Verified reports are part of outbreak data and cannot be deleted' });
    }

    // Remove the uploaded photo too (only if it really lives inside the uploads folder)
    if (report.image) {
      const filePath = path.join(__dirname, '..', report.image);
      if (filePath.startsWith(UPLOADS_DIR)) fs.unlink(filePath, () => {});
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updateReport, deleteReport };
