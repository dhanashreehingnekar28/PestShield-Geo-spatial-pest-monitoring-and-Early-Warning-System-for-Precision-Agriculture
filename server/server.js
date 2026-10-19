const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const path = require('path');

const mode = process.env.PESTSHIELD_MODE || 'demo';
process.env.PESTSHIELD_MODE = mode;

if (!['demo', 'real'].includes(mode)) {
  console.error(
    'Set PESTSHIELD_MODE to demo or real before starting.'
  );
  process.exit(1);
}

require('dotenv').config({
  path: path.join(__dirname, `.env.${mode}`),
  override: true
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const {
  expireOutdatedOutbreaks
} = require('./services/outbreakService');
const bootstrapAdmin = require('./scripts/bootstrapAdmin');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const pestRoutes = require('./routes/pestRoutes');
const pestReportRoutes = require('./routes/pestReportRoutes');
const pestDetectionRoutes = require('./routes/pestDetectionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const mapRoutes = require('./routes/mapRoutes');
const activityRoutes = require('./routes/activityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

// Login tokens cannot be signed without a secret, so refuse to start without one
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to server/.env and restart.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  console.warn('CLIENT_URL is not set, so the API accepts requests from any website. Set it in production.');
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/pests', pestRoutes);
app.use('/api/pest-reports', pestReportRoutes);
app.use('/api/pest-detection', pestDetectionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api', notFound);
app.use(errorHandler);

const OUTBREAK_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

let outbreakCleanupRunning = false;

const runOutbreakCleanup = async () => {
  if (outbreakCleanupRunning) return;

  outbreakCleanupRunning = true;

  try {
    const result = await expireOutdatedOutbreaks();

    console.log(
      `[Outbreak Cleanup] Checked ${result.checked} alerts, ` +
      `resolved ${result.resolved}.`
    );
  } catch (error) {
    console.error(
      '[Outbreak Cleanup] Failed:',
      error
    );
  } finally {
    outbreakCleanupRunning = false;
  }
};

const initializeDatabase = async () => {
  await connectDB();
  await bootstrapAdmin();
};


initializeDatabase()
  .then(() => {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `PestShield API running on port ${PORT} in [${mode}] mode`
      );

      // Check existing outbreaks when the server starts.
      void runOutbreakCleanup();

      // Recheck periodically without overlapping runs.
      setInterval(
        () => {
          void runOutbreakCleanup();
        },
        OUTBREAK_CLEANUP_INTERVAL_MS
      );
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
