import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import BackButton from '../components/BackButton';
import ReportDetailModal from '../components/ReportDetailModal';
import './AdminPanel.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const TABS = ['Pending', 'Verified', 'Rejected', 'All'];
const label = (name) => (name || '').replace(/_/g, ' ');

const AdminPanel = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [detail, setDetail] = useState(null);

  const load = () =>
    api
      .get('/pest-reports')
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setMsg({ type: 'error', text: 'Could not load reports' }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const review = async (r, status) => {
    if (status === 'Rejected' && !window.confirm('Reject this report? The farmer will see it as rejected.')) return { cancelled: true };
    setBusyId(r._id);
    setMsg({ type: '', text: '' });
    try {
      await api.put(`/pest-reports/${r._id}/verify`, { status });
      setMsg({ type: 'ok', text: `Report ${status.toLowerCase()}.` });
      await load();
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update the report';
      setMsg({ type: 'error', text: message });
      return { ok: false, message };
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const pestName = (r) => (r.pest?.pestName ? label(r.pest.pestName) : r.aiPredictedPest ? label(r.aiPredictedPest) : 'Pest not identified');
  const shown = reports
    .filter((r) => tab === 'All' || r.status === tab)
    .filter((r) => !q || [pestName(r), r.crop, r.farmer?.name, r.farmer?.email].some((v) => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => (tab === 'Pending' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)));
  const count = (s) => (s === 'All' ? reports.length : reports.filter((r) => r.status === s).length);

  return (
    <div className="ar">
      <BackButton />
      <header className="ar-head">
        <div>
          <h1>All reports</h1>
          <p>Review farmer reports. Verified reports with a location feed outbreak alerts and the map.</p>
        </div>
        <Link to="/dashboard" className="ar-back">Back to dashboard</Link>
      </header>

      <div className="ar-bar">
        <div className="ar-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t} ({count(t)})</button>
          ))}
        </div>
        <input type="search" placeholder="Search pest, crop or farmer" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search reports" />
      </div>

      {msg.text && <p className={msg.type === 'ok' ? 'ar-ok' : 'ar-err'} role="status">{msg.text}</p>}

      {loading ? (
        <p className="ar-muted">Loading reports…</p>
      ) : shown.length === 0 ? (
        <div className="ar-empty">{reports.length === 0 ? 'No reports have been submitted yet.' : `No ${tab === 'All' ? '' : tab.toLowerCase() + ' '}reports match.`}</div>
      ) : (
        <div className="ar-grid">
          {shown.map((r) => (
            <article key={r._id} className="ar-card">
              <img src={`${API_ORIGIN}${r.image}`} alt={`${r.crop} report`} />
              <div className="ar-body">
                <div className="ar-top">
                  <strong>{pestName(r)}</strong>
                  <span className={`ar-status st-${r.status}`}>{r.status}</span>
                </div>
                <span className="ar-meta">{r.crop} · {r.severity} severity</span>
                <span className="ar-meta">By {r.farmer?.name || 'a deleted user'} on {new Date(r.createdAt).toLocaleDateString()}</span>
                <span className="ar-meta">
                  {r.detectionMethod === 'AI-Assisted'
                    ? `AI suggestion${r.aiConfidence ? `, ${Math.round(r.aiConfidence * 100)}% confident` : ''}`
                    : 'Picked manually'}
                </span>
                {r.latitude == null && <span className="ar-warn">No location, so it will not appear on the map</span>}
                {r.description && <p className="ar-desc">{r.description}</p>}
                
                <button className="rd-open" onClick={() => setDetail(r)}>View details</button>

                {r.status === 'Pending' && (
                  <div className="ar-actions">
                    <button className="ok" disabled={busyId === r._id} onClick={() => review(r, 'Verified')}>Verify</button>
                    <button className="no" disabled={busyId === r._id} onClick={() => review(r, 'Rejected')}>Reject</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {detail && <ReportDetailModal report={detail} onClose={() => setDetail(null)} onReview={review} />}
    </div>
  );
};

export default AdminPanel;