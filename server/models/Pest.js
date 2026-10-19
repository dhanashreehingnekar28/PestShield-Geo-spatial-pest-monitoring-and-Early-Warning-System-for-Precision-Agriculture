const mongoose = require('mongoose');

// Optional list of short text items. `default: undefined` keeps older Pest
// documents untouched (Mongoose would otherwise add an empty array).
const list = { type: [String], default: undefined };

const pestSchema = new mongoose.Schema({
  pestName: { type: String, required: true },
  crop: { type: String, enum: ['Groundnut', 'Potato', 'Chilli'], required: true },
  description: { type: String },
  symptoms: { type: String },
  treatment: { type: String },

  // Detailed library content shown in the admin "Symptoms and treatment" popup.
  // All optional; the popup hides any section that has no data.
  causalAgent: { type: String },
  spread: { type: String },
  earlySigns: list,
  advancedSigns: list,
  identification: list,
  immediateSteps: list,
  treatmentOptions: list,
  prevention: list,
  precautions: list,
}, { timestamps: true });

module.exports = mongoose.model('Pest', pestSchema);