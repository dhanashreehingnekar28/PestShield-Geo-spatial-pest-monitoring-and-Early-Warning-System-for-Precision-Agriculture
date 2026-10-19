const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    crop: { type: String, enum: ['Groundnut', 'Potato', 'Chilli'], required: true },
    pestName: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    centerLatitude: { type: Number, required: true },
    centerLongitude: { type: Number, required: true },
    radiusKm: { type: Number, default: 5 },
    triggeringReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PestReport' }],
    message: { type: String, required: true },
    recommendedActions: [{ type: String }], // NEW: pest-specific advice shown to farmers
    status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
    notifiedFarmers: [
      {
        farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        read: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
