const mongoose = require('mongoose');
const FieldActivity = require('../models/FieldActivity');
const Farm = require('../models/Farm');
const { generateFarmPlan, createPestTasks } = require('../services/activityPlanner');
const { ACTIVITY_TYPES, STATUSES } = FieldActivity;

const isId = (id) => mongoose.Types.ObjectId.isValid(id);
const parseDate = (value) => {
  if (value === undefined || value === '' || value === null) return undefined;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};
const populate = (a) => a.populate('farm', 'farmName cropType');

// Loads a farm and checks that it belongs to the logged-in farmer.
const getOwnedFarm = async (req, res, farmId) => {
  if (!farmId || !isId(farmId)) { res.status(400).json({ success: false, message: 'A valid farm is required' }); return null; }
  const farm = await Farm.findById(farmId);
  if (!farm) { res.status(404).json({ success: false, message: 'Farm not found' }); return null; }
  if (String(farm.farmer) !== String(req.user._id)) {
    res.status(403).json({ success: false, message: 'You can only use your own farms' });
    return null;
  }
  return farm;
};

// @route POST /api/activities { farm, type, title?, dueDate? (or date), status?, product?, notes?, instructions? }
// Custom activity: a task to do (Pending) or something already done (Completed, the default).
const createActivity = async (req, res) => {
  try {
    const { farm, type, title, dueDate, date, status, product, notes, instructions } = req.body;
    if (!ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${ACTIVITY_TYPES.join(', ')}` });
    }
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STATUSES.join(', ')}` });
    }
    const when = parseDate(dueDate !== undefined ? dueDate : date);
    if (when === null) return res.status(400).json({ success: false, message: 'date is not valid' });
    const farmDoc = await getOwnedFarm(req, res, farm);
    if (!farmDoc) return;
    const finalStatus = status || 'Completed';
    const day = when || new Date();
    const activity = await FieldActivity.create({
      farmer: req.user._id, farm, type,
      title: title || type,
      date: day, dueDate: day,
      status: finalStatus,
      ...(finalStatus === 'Completed' && { completedAt: new Date() }),
      source: 'manual', product, notes, instructions,
    });
    res.status(201).json({ success: true, data: await populate(activity) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route POST /api/activities/generate { farm, reset? }
// Creates the recommended schedule for one of the farmer's farms (safe to call repeatedly).
const generateForFarm = async (req, res) => {
  try {
    const farm = await getOwnedFarm(req, res, req.body.farm);
    if (!farm) return;
    const created = await generateFarmPlan(farm, { reset: req.body.reset === true });
    res.json({ success: true, data: { created } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not generate the schedule' });
  }
};

// @route POST /api/activities/from-pest { farm, pestName, severity?, report? }
// Adds inspection / treatment tasks after a pest is found on a farm.
const createFromPest = async (req, res) => {
  try {
    const { farm, pestName, severity, report } = req.body;
    const farmDoc = await getOwnedFarm(req, res, farm);
    if (!farmDoc) return;
    if (!pestName || !String(pestName).trim()) return res.status(400).json({ success: false, message: 'pestName is required' });
    const created = await createPestTasks({
      farm: farmDoc, pestName, severity,
      reportId: report && isId(report) ? report : undefined,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create pest tasks' });
  }
};

// @route GET /api/activities?farm=<id>&type=Spraying&status=Pending
const getMyActivities = async (req, res) => {
  try {
    const { farm, type, status } = req.query;
    const filter = { farmer: req.user._id };
    if (farm) {
      if (!isId(farm)) return res.status(400).json({ success: false, message: 'Invalid farm ID' });
      filter.farm = farm;
    }
    if (type) {
      if (!ACTIVITY_TYPES.includes(type)) return res.status(400).json({ success: false, message: 'Invalid activity type' });
      filter.type = type;
    }
    if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
      // Older diary entries have no stored status and count as Completed
      filter.status = status === 'Completed' ? { $ne: 'Pending' } : 'Pending';
    }
    const activities = await FieldActivity.find(filter)
      .populate('farm', 'farmName cropType')
      .sort({ date: -1 })
      .limit(500);
    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch activities' });
  }
};

const getOwned = async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ success: false, message: 'Invalid activity ID' }); return null; }
  const activity = await FieldActivity.findById(req.params.id);
  if (!activity) { res.status(404).json({ success: false, message: 'Activity not found' }); return null; }
  if (String(activity.farmer) !== String(req.user._id)) {
    res.status(403).json({ success: false, message: 'Not authorized for this activity' });
    return null;
  }
  return activity;
};

// @route PUT /api/activities/:id { type?, title?, dueDate? (or date), product?, notes?, instructions? }
const updateActivity = async (req, res) => {
  try {
    const activity = await getOwned(req, res);
    if (!activity) return;
    const { type, title, dueDate, date, product, notes, instructions } = req.body;
    if (type !== undefined) {
      if (!ACTIVITY_TYPES.includes(type)) return res.status(400).json({ success: false, message: 'Invalid activity type' });
      activity.type = type;
    }
    const when = parseDate(dueDate !== undefined ? dueDate : date);
    if (when === null) return res.status(400).json({ success: false, message: 'date is not valid' });
    if (when) { activity.dueDate = when; activity.date = when; }
    if (title !== undefined) activity.title = title;
    if (product !== undefined) activity.product = product;
    if (notes !== undefined) activity.notes = notes;
    if (instructions !== undefined) activity.instructions = instructions;
    await activity.save();
    res.json({ success: true, data: await populate(activity) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/activities/:id/status { status: 'Completed' | 'Pending' }
const setStatus = async (req, res) => {
  try {
    const activity = await getOwned(req, res);
    if (!activity) return;
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STATUSES.join(', ')}` });
    }
    activity.status = status;
    activity.completedAt = status === 'Completed' ? new Date() : undefined;
    await activity.save();
    res.json({ success: true, data: await populate(activity) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/activities/:id
const deleteActivity = async (req, res) => {
  try {
    const activity = await getOwned(req, res);
    if (!activity) return;
    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete activity' });
  }
};

module.exports = { createActivity, generateForFarm, createFromPest, getMyActivities, updateActivity, setStatus, deleteActivity };