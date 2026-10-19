const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['Ploughing', 'Sowing', 'Irrigation', 'Fertilizer', 'Spraying', 'Weeding', 'Harvesting', 'Inspection', 'Other'];
const STATUSES = ['Pending', 'Completed'];
const SOURCES = ['manual', 'plan', 'pest'];

const fieldActivitySchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    title: { type: String, trim: true, maxlength: 120 },          // the task, e.g. "First weeding"
    date: { type: Date, default: Date.now },                        // kept for older entries
    windowStart: { type: Date },                                    // start of the recommended period
    dueDate: { type: Date },                                        // deadline (end of the period)
    // Older diary entries have no status, so they read as Completed.
    status: { type: String, enum: STATUSES, default: 'Completed' },
    completedAt: { type: Date },
    source: { type: String, enum: SOURCES, default: 'manual' },     // manual | plan (crop schedule) | pest (pest report)
    stage: { type: String, trim: true, maxlength: 60 },
    instructions: { type: String, trim: true, maxlength: 1000 },    // reason / how to do it
    product: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 500 },
    dedupeKey: { type: String },                                    // stops the same recommendation being created twice
    report: { type: mongoose.Schema.Types.ObjectId, ref: 'PestReport' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// A pending task is overdue once its deadline day has passed.
fieldActivitySchema.virtual('isOverdue').get(function () {
  const due = this.dueDate || this.date;
  if (this.status !== 'Pending' || !due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
});

fieldActivitySchema.index({ farmer: 1, date: -1 });
fieldActivitySchema.index(
  { farm: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } }
);

module.exports = mongoose.model('FieldActivity', fieldActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.STATUSES = STATUSES;