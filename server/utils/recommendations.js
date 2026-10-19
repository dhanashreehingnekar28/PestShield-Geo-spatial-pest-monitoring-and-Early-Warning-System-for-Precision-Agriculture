const Pest = require('../models/Pest');

const URGENCY = {
  High: 'Inspect your field today and act quickly',
  Medium: 'Scout your field within 2 days',
  Low: 'Keep monitoring your crop weekly',
};

// Turns the Pest Library "treatment" text (or list) into a short action list for an alert.
// Falls back to general advice when the pest has no treatment text yet.
const buildRecommendedActions = async (pestName, crop, severity) => {
  const actions = [URGENCY[severity] || URGENCY.Medium];
  try {
    const pest = await Pest.findOne({ pestName, crop }).lean();
    const raw = pest && pest.treatment;
    const lines = Array.isArray(raw)
      ? raw
      : String(raw || '')
          .replace(/\be\.g\./gi, 'e§g§')
          .replace(/\bi\.e\./gi, 'i§e§')
          .split(/\r?\n|(?<=\.)\s+/)
          .map((l) => l.replace(/§/g, '.').replace(/^[-*•\d.)\s]+/, '').trim());
    lines.filter((l) => l.length > 3).slice(0, 4).forEach((l) => actions.push(l));
  } catch (err) {
    /* use the fallback below */
  }
  if (actions.length === 1) {
    actions.push('Check the Pest Library for treatment steps', 'Report any new signs through the app');
  }
  return actions;
};

module.exports = { buildRecommendedActions };