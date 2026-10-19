import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import BackButton from '../components/BackButton';

const CONFIDENCE_THRESHOLD = 0.6;
const REDIRECT_MS = 2500;

// AI labels look like "GROUNDNUT_ROSETTE"; library names look like "Rosette"
const matchesAi = (pestName, aiLabel, crop) => {
  const normalize = (value) =>
    String(value || '')
      .replace(/_/g, ' ')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const cropName = normalize(crop);
  const dbName = normalize(pestName);

  let predictedName = normalize(aiLabel);

  if (cropName && predictedName.startsWith(`${cropName} `)) {
    predictedName = predictedName.slice(cropName.length + 1);
  }

  const aliases = {
    chilli: {
      'leaf curl virus': 'leaf curl'
    }
  };

  predictedName = aliases[cropName]?.[predictedName] || predictedName;

  return dbName === predictedName;
};

// Resolves with coordinates from the selected farm record
const getFarmCoords = (farm) => {
  const latitude = farm?.location?.latitude;
  const longitude = farm?.location?.longitude;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
};

const ReportPest = () => {
  const [farms, setFarms] = useState([]);
  const [pests, setPests] = useState([]);
  const [form, setForm] = useState({ farm: '', crop: '', pest: '', severity: 'Medium', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [aiState, setAiState] = useState('idle'); // idle | loading | done | error
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // { n, to, state } once the report is saved
  const navigate = useNavigate();
  const prefill = useLocation().state;
  const prefilledPest = useRef(false);
  const [prefillNote, setPrefillNote] = useState(false);

  useEffect(() => {
    api.get('/farms/my').then(({ data }) => {
      setFarms(data.data);
      if (data.data.length > 0) {
        const wanted = data.data.find((f) => f._id === prefill?.farmId) || data.data[0];
        setForm((f) => ({ ...f, farm: wanted._id, crop: wanted.cropType }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.crop) return;
    api.get(`/pests?crop=${form.crop}`).then(({ data }) => {
      setPests(data.data);
      if (prefill?.pestName && !prefilledPest.current) {
        prefilledPest.current = true;
        const m = data.data.find((p) => p.pestName.toLowerCase() === prefill.pestName.toLowerCase());
        if (m) { setForm((f) => ({ ...f, pest: m._id })); setPrefillNote(true); }
      }
    }).catch(() => {});
  }, [form.crop]);

  // After a successful submit, show the popup, then move on automatically
  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => navigate(success.to, { state: success.state }), REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  // Ensures automatic selection happens once both the AI prediction and the crop-specific pest list are available
  useEffect(() => {
    if (
      aiState !== 'done' ||
      !aiResult ||
      aiResult.confidence < CONFIDENCE_THRESHOLD ||
      !form.crop ||
      pests.length === 0
    ) return;

    const match = pests.find((p) =>
      matchesAi(p.pestName, aiResult.predicted_class, form.crop)
    );

    if (match) {
      setForm((prev) =>
        prev.pest === match._id
          ? prev
          : { ...prev, pest: match._id }
      );
    }
  }, [aiState, aiResult, form.crop, pests]);

  const handleFarmChange = (farmId) => {
    const selected = farms.find((f) => f._id === farmId);
    setForm({ ...form, farm: farmId, crop: selected?.cropType || '', pest: '' });
    setAiState('idle');
    setAiResult(null);
  };

  const runPrediction = async (file, crop) => {
    setAiState('loading');
    setAiResult(null);
    try {
      const fd = new FormData();
      fd.append('crop', crop.toLowerCase());
      fd.append('image', file);
      const { data } = await api.post('/pest-detection/predict', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = data.data;
      setAiResult(result);
      setAiState('done');
    } catch (err) {
      setAiState('error');
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file && form.crop) runPrediction(file, form.crop);
  };

  const submitReport = async (coords) => {
    const selectedPest = pests.find((p) => p._id === form.pest);
    const aiConfirmed = aiResult && selectedPest &&
      matchesAi(selectedPest.pestName, aiResult.predicted_class, form.crop);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    Object.entries(coords).forEach(([k, v]) => fd.append(k, v));
    fd.append('image', imageFile);
    if (aiResult) {
      fd.append('aiPredictedPest', aiResult.predicted_class);
      fd.append('aiConfidence', aiResult.confidence);
    }
    fd.append('detectionMethod', aiConfirmed ? 'AI-Assisted' : 'Manual');
    return api.post('/pest-reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!imageFile) return setError('Please attach a photo of the affected leaf.');
    if (!form.pest) return setError('Please select the pest/disease (or wait for the AI suggestion above).');

    const selectedFarm = farms.find((farm) => farm._id === form.farm);

    if (!selectedFarm) {
      return setError('Please select a valid farm.');
    }

    const coords = getFarmCoords(selectedFarm);

    if (!coords) {
      return setError('The selected farm does not have valid location coordinates.');
    }

    setSubmitting(true);
    try {
      const { data } = await submitReport(coords);
      const n = data.tasksCreated || 0;
      setSuccess(n > 0
        ? { n, to: '/activities', state: { notice: `Report submitted. ${n} ${n === 1 ? 'task was' : 'tasks were'} added to your activities.` } }
        : { n, to: '/my-reports' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const pct = aiResult ? Math.round(aiResult.confidence * 100) : 0;

  return (
    <div className="form-page report-pest-page">
      <BackButton />
      <h2 className="rp-title">Report a Pest</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="rp-form" onSubmit={handleSubmit}>
        <div className="rp-field">
        <label htmlFor="rp-farm">Farm</label>
        <select id="rp-farm" value={form.farm} onChange={(e) => handleFarmChange(e.target.value)} required>
          <option value="">Select a farm</option>
          {farms.map((f) => <option key={f._id} value={f._id}>{f.farmName} ({f.cropType})</option>)}
        </select>
        </div>

        <div className="rp-field">
        <label htmlFor="rp-photo">Photo Upload</label>
        <input id="rp-photo" type="file" accept="image/*" onChange={handleImage} required />
        {preview && <img src={preview} alt="preview" className="preview" />}
        </div>

        {aiState === 'loading' && <div className="ai-box ai-loading">Analyzing photo...</div>}
        {aiState === 'done' && aiResult && aiResult.confidence >= CONFIDENCE_THRESHOLD && (
          <div className="ai-box ai-confident">
            <strong>AI Suggestion:</strong> {aiResult.predicted_class} — {pct}% confidence
            <div className="ai-note">Auto-selected below — change it if this looks wrong.</div>
          </div>
        )}
        {aiState === 'done' && aiResult && aiResult.confidence < CONFIDENCE_THRESHOLD && (
          <div className="ai-box ai-unsure">AI isn't confident about this one ({pct}%). Please select the pest manually below.</div>
        )}
        {aiState === 'error' && <div className="ai-box ai-unavailable">AI check unavailable right now — select the pest manually below.</div>}

        <div className="rp-field">
        <label htmlFor="rp-pest">Pest / Disease</label>
        <select id="rp-pest" value={form.pest} onChange={(e) => setForm({ ...form, pest: e.target.value })} required>
          <option value="">Select pest/disease</option>
          {pests.map((p) => <option key={p._id} value={p._id}>{p.pestName.replace(/_/g, ' ')}</option>)}
        </select>
        {prefillNote && form.pest && <small>Pre-selected from the alert. Change it if what you see on your plants is different.</small>}
        </div>

        <div className="rp-field">
        <label htmlFor="rp-severity">Severity</label>
        <select id="rp-severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        </div>

        <div className="rp-field">
        <label htmlFor="rp-description">Description</label>
        <textarea id="rp-description" placeholder="What do you notice on the leaves?"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <button className="rp-submit" type="submit" disabled={submitting || !!success}>{submitting ? 'Submitting...' : 'Submit Report'}</button>
      </form>

      {success && (
        <div className="ui-overlay">
          <div className="ui-popup" role="alertdialog" aria-modal="true" aria-labelledby="rs-title" aria-describedby="rs-desc">
            <div className="ui-popup-icon" aria-hidden="true">✓</div>
            <h2 id="rs-title">Report submitted successfully!</h2>
            <p id="rs-desc">
              {success.n > 0 && `${success.n} ${success.n === 1 ? 'task was' : 'tasks were'} added to your activities. `}Taking you back…
            </p>
            <button type="button" className="ui-popup-btn" autoFocus
              onClick={() => navigate(success.to, { state: success.state })}>
              Continue now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPest;