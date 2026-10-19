const { MIN_REPORTS, HIGH_RISK_REPORTS, WINDOW_DAYS } = require('../services/outbreakService');

const norm = (s) => String(s || '').replace(/_/g, ' ').trim().toLowerCase();

// AI labels look like "GROUNDNUT_RUST"; library names look like "Rust".
// Drop a leading crop name from the AI label before comparing.
const sameAsPest = (aiLabel, pestName, crop) => {
  const c = norm(crop);
  let a = norm(aiLabel);
  if (c && a.startsWith(`${c} `)) a = a.slice(c.length + 1);
  return a === norm(pestName);
};

const NEXT_2_DAYS = [
  'Walk the field again and compare with your first notes',
  'Check field edges and shaded or low-lying spots as well as the centre',
  'If symptoms are spreading, contact your local agriculture officer or Krishi Vigyan Kendra',
];
const PREVENTION = [
  'Remove heavily affected plant parts and keep them away from healthy plants',
  'Clean tools after working in affected areas',
  'Avoid moving between affected and healthy plots without cleaning tools and footwear',
];
const MONITORING = [
  'Recheck the same spots every 2 to 3 days for the next 1 to 2 weeks',
  'Photograph and report any new signs through the app',
];
const CHECKLIST = [
  'Inspect the affected plants',
  'Check several areas of the field, not one spot',
  'Check whether the problem is spreading',
  'Record the symptoms you see (leaf, stem, pods or tubers)',
  'Follow verified guidance (Pest Library or your agriculture officer)',
  'Recheck the field in 2 days',
];

const buildAdvisory = (alert, pest, reports) => {
  const count = (alert.triggeringReports || []).length;
  const radius = alert.radiusKm || 5;
  const rawTreatment = pest && pest.treatment;
  const hasLibraryTreatment = !!String(Array.isArray(rawTreatment) ? rawTreatment.join('') : rawTreatment || '').trim();

  const withAi = reports.filter((r) => r.aiPredictedPest);
  const agreeing = withAi.filter((r) => sameAsPest(r.aiPredictedPest, alert.pestName, alert.crop));
  const conf = agreeing.map((r) => r.aiConfidence).filter((c) => Number.isFinite(c));
  const tally = new Map();
withAi.forEach((r) => {
  const t = tally.get(r.aiPredictedPest) || { label: r.aiPredictedPest, count: 0, sum: 0, n: 0 };
  t.count += 1;
  if (Number.isFinite(r.aiConfidence)) { t.sum += r.aiConfidence; t.n += 1; }
  tally.set(r.aiPredictedPest, t);
});
  const ai = withAi.length
    ? {
      reportsWithAi: withAi.length,
      agreeing: agreeing.length,
      averageConfidence: conf.length ? conf.reduce((s, c) => s + c, 0) / conf.length : null,
      predictions: [...tally.values()]
        .map((t) => ({ label: String(t.label).replace(/_/g, ' '), count: t.count, averageConfidence: t.n ? t.sum / t.n : null }))
        .sort((a, b) => b.count - a.count),
    }
  : null;

  const bands = `This system treats ${MIN_REPORTS} to ${HIGH_RISK_REPORTS - 1} such reports as Medium risk and ${HIGH_RISK_REPORTS} or more as High risk.`;
  return {
    why: { verifiedReports: count, radiusKm: radius, windowDays: WINDOW_DAYS, crop: alert.crop, pest: alert.pestName, minReports: MIN_REPORTS, highReports: HIGH_RISK_REPORTS },
    riskReason: `${count} verified report${count === 1 ? '' : 's'} of ${alert.pestName} on ${alert.crop} were found within ${radius} km in the last ${WINDOW_DAYS} days. ${bands} This is an estimate from reported cases, not a confirmed diagnosis for your field.`,
    immediate: alert.recommendedActions || [],
    next2Days: NEXT_2_DAYS,
    prevention: PREVENTION,
    monitoring: MONITORING,
    checklist: CHECKLIST,
    symptoms: (pest && pest.symptoms) || null,
    treatmentSource: hasLibraryTreatment ? 'Pest Library' : 'general guidance',
    ai,
  };
};

module.exports = { buildAdvisory };