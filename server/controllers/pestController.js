const Pest = require('../models/Pest');
const cropLifecycle = require('../data/cropLifecycle');

const getPests = async (req, res) => {
  try {
    const filter = req.query.crop ? { crop: req.query.crop } : {};
    const pests = await Pest.find(filter);
    res.json({ success: true, data: pests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch pests' });
  }
};

const getLifecycle = (req, res) => {
  const crop = req.params.crop;
  const stages = cropLifecycle[crop];
  if (!stages) return res.status(404).json({ success: false, message: 'Unknown crop' });
  res.json({ success: true, data: stages });
};

const createPest = async (req, res) => {
  try {
    const {
      pestName, crop, description, symptoms, treatment,
      causalAgent, spread, earlySigns, advancedSigns, identification,
      immediateSteps, treatmentOptions, prevention, precautions,
    } = req.body;
    if (!pestName || !crop) {
      return res.status(400).json({ success: false, message: 'pestName and crop are required' });
    }
    const pest = await Pest.create({
      pestName, crop, description, symptoms, treatment,
      causalAgent, spread, earlySigns, advancedSigns, identification,
      immediateSteps, treatmentOptions, prevention, precautions,
    });
    res.status(201).json({ success: true, data: pest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updatePest = async (req, res) => {
  try {
    const pest = await Pest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pest) return res.status(404).json({ success: false, message: 'Pest not found' });
    res.json({ success: true, data: pest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deletePest = async (req, res) => {
  try {
    const pest = await Pest.findByIdAndDelete(req.params.id);
    if (!pest) return res.status(404).json({ success: false, message: 'Pest not found' });
    res.json({ success: true, message: 'Pest deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete pest' });
  }
};

module.exports = { getPests, getLifecycle, createPest, updatePest, deletePest };