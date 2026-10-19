
const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  farmName: { type: String, required: true },

  cropType: {
    type: String,
    enum: ['Groundnut', 'Potato', 'Chilli'],
    required: true
  },

  location: {
    latitude: { type: Number },
    longitude: { type: Number },

    state: { type: String, trim: true },
    stateCode: { type: String, trim: true },

    district: { type: String, trim: true },
    districtCode: { type: String, trim: true },

    source: {
      type: String,
      enum: [
        'DeviceGPS',
        'FarmSelected',
        'Demo',
        'DistrictApproximate',
        'Unknown'
      ],
      default: 'Unknown'
    }
  },

  sowingDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Farm', farmSchema);
