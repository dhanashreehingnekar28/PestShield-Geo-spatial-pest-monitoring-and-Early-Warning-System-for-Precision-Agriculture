const mongoose = require('mongoose');

const pestReportSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  crop: { type: String, enum: ['Groundnut', 'Potato', 'Chilli'], required: true },
  pest: { type: mongoose.Schema.Types.ObjectId, ref: 'Pest' },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  description: { type: String },
  image: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },

  locationSource: {
    type: String,
    enum: [
      'DeviceGPS',
      'FarmSelected',
      'DistrictApproximate',
      'Demo',
      'Unknown'
    ],
    default: 'Unknown'
  },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },

  aiPredictedPest: { type: String },
  aiConfidence: { type: Number },
  detectionMethod: { type: String, enum: ['Manual', 'AI-Assisted'], default: 'Manual' },
}, { timestamps: true });

module.exports = mongoose.model('PestReport', pestReportSchema);
