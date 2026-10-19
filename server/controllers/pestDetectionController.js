const fs = require('fs');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// @route POST /api/pest-detection/predict
// Forwards the uploaded image to the Python AI microservice and relays its
// prediction back to the frontend. This is a "preview" call made before the
// farmer submits the final report — it does NOT save anything to the DB.
const predict = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'image is required' });
  }
  const { crop } = req.body;
  if (!crop) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ success: false, message: 'crop is required' });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer]);

    const form = new FormData();
    form.append('crop', crop);
    form.append('image', blob, req.file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ success: false, message: `AI service error: ${errText}` });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    // AI service down/unreachable — fail gracefully, frontend falls back to manual selection
    res.status(503).json({ success: false, message: `AI service unavailable: ${err.message}` });
  } finally {
    fs.unlink(req.file.path, () => {}); // this was only a preview call, don't keep the temp file
  }
};

module.exports = { predict };
