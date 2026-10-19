import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import BackButton from '../components/BackButton';
import './MyReports.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const FILTERS = ['All', 'Pending', 'Verified', 'Rejected'];
const label = (name) => (name || '').replace(/_/g, ' ');

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [edit, setEdit] = useState(null); // report being edited
  const [pests, setPests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () =>
    api
      .get('/pest-reports/my')
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setMsg({ type: 'error', text: 'Could not load your reports' }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openEdit = (r) => {
    setEdit({ _id: r._id, crop: r.crop, severity: r.severity, description: r.description || '', pest: r.pest?._id || '' });
    setFormError('');
    api.get('/pests', { params: { crop: r.crop } }).then(({ data }) => setPests(data.data || [])).catch(() => setPests([]));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = { severity: edit.severity, description: edit.description };
      if (edit.pest) body.pest = edit.pest;
      await api.put(`/pest-reports/${edit._id}`, body);
      setMsg({ type: 'ok', text: 'Report updated.' });
      setEdit(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/pest-reports/${r._id}`);
      setMsg({ type: 'ok', text: 'Report deleted.' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not delete the report' });
    }
  };

  const shown = reports.filter((r) => filter === 'All' || r.status === filter);
  const count = (s) => (s === 'All' ? reports.length : reports.filter((r) => r.status === s).length);

  return (
    <div className="mr">
      <BackButton />
      <header className="mr-head">
        <div>
          <h1>My reports</h1>
          <p>Pending reports can be edited or deleted. Verified reports are locked because they feed outbreak alerts.</p>
        </div>
        <Link to="/report-pest" className="mr-primary">Report a pest</Link>
      </header>

      <div className="mr-tabs" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f} ({count(f)})</button>
        ))}
      </div>

      {msg.text && <p className={msg.type === 'ok' ? 'mr-ok' : 'mr-err'} role="status">{msg.text}</p>}

      {loading ? (
        <p className="mr-muted">Loading your reports…</p>
      ) : shown.length === 0 ? (
        <div className="mr-empty">
          {reports.length === 0 ? <>No reports yet. <Link to="/report-pest">Report your first pest</Link>.</> : `No ${filter.toLowerCase()} reports.`}
        </div>
      ) : (
        <div className="mr-grid">
          {shown.map((r) => (
            <article key={r._id} className="mr-card">
              <img src={`${API_ORIGIN}${r.image}`} alt={`${r.crop} report`} />
              <div className="mr-body">
                <div className="mr-top">
                  <strong>{r.pest?.pestName ? label(r.pest.pestName) : r.aiPredictedPest ? label(r.aiPredictedPest) : 'Pest not identified'}</strong>
                  <span className={`mr-status st-${r.status}`}>{r.status}</span>
                </div>
                <span className="mr-meta">{r.crop} · {r.severity} severity · {new Date(r.createdAt).toLocaleDateString()}</span>
                <span className="mr-meta">
                  {r.detectionMethod === 'AI-Assisted'
                    ? `AI-assisted${r.aiConfidence ? `, ${Math.round(r.aiConfidence * 100)}% confident` : ''}`
                    : 'Picked manually'}
                </span>
                {r.description && <p className="mr-desc">{r.description}</p>}

                {r.status === 'Pending' && (
                  <div className="mr-actions">
                    <button onClick={() => openEdit(r)}>Edit</button>
                    <button className="danger" onClick={() => remove(r)}>Delete</button>
                  </div>
                )}
                {r.status === 'Rejected' && (
                  <div className="mr-actions">
                    <button className="danger" onClick={() => remove(r)}>Delete</button>
                  </div>
                )}
                {r.status === 'Verified' && <span className="mr-lock">Verified by an admin and locked</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {edit && (
        <div className="mr-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && setEdit(null)}>
          <form className="mr-modal" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="mr-title">
            <h2 id="mr-title">Edit report</h2>

            <label htmlFor="mr-pest">Pest</label>
            <select id="mr-pest" value={edit.pest} onChange={(e) => setEdit({ ...edit, pest: e.target.value })}>
              <option value="">Keep as it is</option>
              {pests.map((p) => <option key={p._id} value={p._id}>{label(p.pestName)}</option>)}
            </select>

            <label htmlFor="mr-sev">Severity</label>
            <select id="mr-sev" value={edit.severity} onChange={(e) => setEdit({ ...edit, severity: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <label htmlFor="mr-desc">Description</label>
            <textarea id="mr-desc" rows="4" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />

            {formError && <p className="mr-err">{formError}</p>}

            <div className="mr-modal-actions">
              <button type="button" onClick={() => setEdit(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="mr-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyReports;