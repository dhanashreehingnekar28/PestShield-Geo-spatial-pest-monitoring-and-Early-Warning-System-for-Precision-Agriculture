const FieldActivity = require('../models/FieldActivity');
const { buildRecommendedActions } = require('../utils/recommendations');

// Rule-based recommendations. They come from each crop's calendar (the same stage
// timings as data/cropLifecycle.js) and from the Pest Library. No external AI model is called.
// Row: [startDay, endDay, type, task, stage, instructions]. Days count from the sowing date.
const PREP = [-14, -7, 'Ploughing', 'Plough and level the field', 'Land preparation',
  'Plough 2-3 times, remove weeds and old crop residue, and level the field so water does not stand.'];
const sprayIf = (start, end, problem) => [start, end, 'Spraying', `Spray only if ${problem} is found`, 'Crop protection',
  'Spray only if scouting finds the problem. Use the treatment listed in the Pest Library for the pest you find, and follow the product label.'];

const PLAN = {
  Groundnut: [
    PREP,
    [0, 2, 'Sowing', 'Sow groundnut seeds', 'Sowing', 'Sow seeds 3-5 cm deep with 15-20 cm spacing.'],
    [12, 15, 'Irrigation', 'Irrigate for germination', 'Germination', 'Keep the soil moist so seeds germinate evenly.'],
    [12, 15, 'Inspection', 'Check germination and fill gaps', 'Germination', 'Walk the rows, look for gaps where seeds did not come up, and re-sow them.'],
    [28, 32, 'Fertilizer', 'Apply first fertilizer dose', 'Vegetative Growth', 'Apply the first dose of fertilizer as advised for your soil.'],
    [28, 35, 'Weeding', 'First weeding', 'Vegetative Growth', 'Remove weeds so they do not compete with young plants.'],
    [42, 48, 'Inspection', 'Scout for leaf spot and rust', 'Flowering', 'Check leaves for brown spots and orange-brown pustules and note which parts of the field are affected.'],
    [42, 50, 'Irrigation', 'Light irrigation at flowering', 'Flowering', 'Give light irrigation and avoid water-logging.'],
    sprayIf(45, 55, 'leaf spot or rust'),
    [68, 72, 'Other', 'Earth up around the plant base', 'Pegging', 'Earth up soil around the base of the plants so the pegs can enter the soil.'],
    [95, 105, 'Irrigation', 'Maintain soil moisture', 'Pod Development', 'Keep moisture steady while the pods fill.'],
    [95, 105, 'Inspection', 'Watch for rosette disease', 'Pod Development', 'Look for stunted plants with small, curled leaves and report them in the app.'],
    [128, 135, 'Harvesting', 'Check pod maturity and harvest', 'Maturity & Harvest', 'Check that the pods are mature, then harvest and dry them.'],
  ],
  Potato: [
    PREP,
    [0, 2, 'Sowing', 'Plant seed tubers', 'Planting', 'Plant seed tubers 10-15 cm deep with 20-25 cm spacing.'],
    [13, 17, 'Irrigation', 'Irrigate for sprouting', 'Sprouting', 'Keep the soil moist but avoid water-logging.'],
    [28, 32, 'Fertilizer', 'Apply nitrogen fertilizer', 'Vegetative Growth', 'Apply nitrogen fertilizer as advised for your soil.'],
    [28, 32, 'Other', 'First earthing up', 'Vegetative Growth', 'Pull soil up around the base of the plants.'],
    [43, 48, 'Other', 'Second earthing up', 'Tuber Initiation', 'Earth up again so developing tubers stay covered.'],
    [43, 48, 'Inspection', 'Scout for early blight', 'Tuber Initiation', 'Look for dark spots with rings on the lower leaves.'],
    sprayIf(45, 50, 'early blight'),
    [63, 68, 'Irrigation', 'Regular irrigation', 'Tuber Bulking', 'Irrigate regularly while the tubers bulk up.'],
    [63, 68, 'Inspection', 'Scout for late blight', 'Tuber Bulking', 'Look for water-soaked patches that turn brown on leaves and stems, especially after wet weather.'],
    sprayIf(65, 70, 'late blight'),
    [74, 78, 'Irrigation', 'Stop irrigation before harvest', 'Maturity', 'Stop irrigating about 2 weeks before harvest.'],
    [88, 95, 'Harvesting', 'Harvest potatoes', 'Maturity & Harvest', 'Harvest once the plants have matured.'],
  ],
  Chilli: [
    PREP,
    [0, 2, 'Sowing', 'Sow the nursery bed', 'Nursery/Sowing', 'Raise seedlings in a nursery bed, or sow directly.'],
    [23, 27, 'Sowing', 'Transplant seedlings', 'Transplanting', 'Transplant seedlings at 45-60 cm spacing.'],
    [38, 42, 'Fertilizer', 'Apply first fertilizer dose', 'Vegetative Growth', 'Apply the first dose of fertilizer as advised for your soil.'],
    [38, 42, 'Weeding', 'Weed the field', 'Vegetative Growth', 'Remove weeds so they do not compete with the plants.'],
    [58, 62, 'Inspection', 'Scout for leaf curl and leaf spot', 'Flowering', 'Look for curled, thickened leaves and spots on the leaves.'],
    [58, 62, 'Irrigation', 'Light irrigation at flowering', 'Flowering', 'Give light irrigation and avoid water-logging.'],
    sprayIf(60, 66, 'leaf curl or leaf spot'),
    [78, 82, 'Irrigation', 'Regular irrigation', 'Fruiting', 'Irrigate regularly while the fruits develop.'],
    [78, 82, 'Inspection', 'Monitor pests closely', 'Fruiting', 'Check flowers, fruits and the underside of leaves. Pest pressure rises at this stage.'],
    [118, 125, 'Harvesting', 'Start harvesting mature pods', 'Harvest', 'Pick mature pods and repeat the harvest periodically.'],
  ],
};

// A task whose deadline passed more than this many days ago is skipped (the farmer
// has probably done it already). Anything more recent is created and shows as overdue.
const GRACE_DAYS = 7;

const midnight = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Pure function: which schedule items apply to this farm today.
const buildPlanItems = (farm, now = new Date()) => {
  const rows = PLAN[farm.cropType] || [];
  const sowing = midnight(farm.sowingDate || farm.createdAt || now);
  const cutoff = addDays(midnight(now), -GRACE_DAYS);
  const items = [];
  rows.forEach(([start, end, type, title, stage, instructions], i) => {
    const dueDate = addDays(sowing, end);
    // Land preparation only applies while sowing is still ahead; otherwise it is already done.
    if (end < 0 && sowing <= midnight(now)) return;
    if (dueDate < cutoff) return;
    items.push({
      type, title, stage, instructions,
      windowStart: addDays(sowing, start), dueDate, date: dueDate,
      dedupeKey: `plan:${farm.cropType}:${i}`,
    });
  });
  return items;
};

// Creates the schedule for a farm. Safe to call repeatedly: existing tasks are kept.
// reset = true first removes tasks that are still pending (use after changing the sowing date).
const generateFarmPlan = async (farm, { reset = false } = {}) => {
  if (reset) await FieldActivity.deleteMany({ farm: farm._id, source: 'plan', status: 'Pending' });
  const items = buildPlanItems(farm);
  const existing = await FieldActivity.find({ farm: farm._id, dedupeKey: { $in: items.map((i) => i.dedupeKey) } })
    .select('dedupeKey').lean();
  const have = new Set(existing.map((e) => e.dedupeKey));
  const fresh = items
    .filter((i) => !have.has(i.dedupeKey))
    .map((i) => ({ ...i, farmer: farm.farmer, farm: farm._id, status: 'Pending', source: 'plan' }));
  if (fresh.length) {
    try {
      await FieldActivity.insertMany(fresh, { ordered: false });
    } catch (err) {
      if (err.code !== 11000 && !err.writeErrors) throw err; // duplicate from a parallel call: ignore
    }
  }
  return fresh.length;
};

// Pest-based tasks, created when a pest is found on a farm.
const PEST_TIMING = { High: { inspect: 0, treat: 1 }, Medium: { inspect: 2, treat: 3 }, Low: { inspect: 7, treat: null } };
const HEALTHY = /healthy|no pest|no disease/i;

const createPestTasks = async ({ farm, pestName, severity, reportId }) => {
  const name = String(pestName || '').trim();
  if (!name || HEALTHY.test(name)) return [];
  const label = name.replace(/_/g, ' ');
  const sev = PEST_TIMING[severity] ? severity : 'Medium';
  const timing = PEST_TIMING[sev];
  const [urgency, ...treatment] = await buildRecommendedActions(name, farm.cropType, sev);
  const base = `pest:${reportId || name.toLowerCase()}`;
  const today = midnight(new Date());
  const common = { farmer: farm.farmer, farm: farm._id, status: 'Pending', source: 'pest', stage: 'Pest found', report: reportId || undefined };

  const drafts = [{
    ...common, type: 'Inspection', title: `Inspect the field for ${label}`,
    instructions: `${urgency}. Check several spots across the field, not only where it was first seen.`,
    dueDate: addDays(today, timing.inspect), dedupeKey: `${base}:inspect`,
  }];
  if (timing.treat !== null) {
    drafts.push({
      ...common, type: 'Spraying', title: `Treat ${label}`,
      instructions: `${treatment.join(' ')} Follow the product label and wear protective gear.`.trim(),
      dueDate: addDays(today, timing.treat), dedupeKey: `${base}:treat`,
    });
  }
  const created = [];
  for (const d of drafts) {
    try {
      created.push(await FieldActivity.create({ ...d, windowStart: today, date: d.dueDate }));
    } catch (err) {
      if (err.code !== 11000) throw err; // already created for this report
    }
  }
  return created;
};

module.exports = { buildPlanItems, generateFarmPlan, createPestTasks, PLAN };