import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AdminAnalytics from '../components/AdminAnalytics';
import ReportDetailModal from '../components/ReportDetailModal';
import './Dashboard.css';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

const pestOf = (r) => (r.pest?.pestName ? r.pest.pestName.replace(/_/g, ' ') : r.aiPredictedPest || 'Pest not identified');

const AdminDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [farmerCount, setFarmerCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const loadReports = () => api.get('/pest-reports').then(({ data }) => setReports(data.data || [])).catch(() => setError('Could not load reports'));
  const loadAlerts = () => api.get('/alerts').then(({ data }) => setAlerts(data.data || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      loadReports(),
      loadAlerts(),
      api.get('/admin/users', { params: { role: 'farmer', limit: 1 } }).then(({ data }) => setFarmerCount(data.total)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const review = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.put(`/pest-reports/${id}/verify`, { status });
      await Promise.all([loadReports(), loadAlerts()]); // verifying can create an outbreak alert
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update the report';
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async (id) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      loadAlerts();
    } catch {
      setError('Could not resolve the alert');
    }
  };

  const pending = reports
    .filter((r) => r.status === 'Pending')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // oldest first
  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const highRisk = activeAlerts.filter((a) => a.severity === 'High').length;

  return (
    <div className="db db-admin">
      <header className="db-head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="db-summary">Signed in as {user?.name}. Review new reports and keep an eye on active outbreaks.</p>
        </div>
 
      </header>

      {error && <p className="error">{error}</p>}

      <div className="db-stats">
        <div className={`db-stat ${pending.length ? 'warn' : ''}`}><b>{loading ? '–' : pending.length}</b><span>Reports to review</span></div>
        <div className="db-stat"><b>{loading ? '–' : activeAlerts.length}</b><span>Active outbreaks</span></div>
        <div className={`db-stat ${highRisk ? 'hot' : ''}`}><b>{loading ? '–' : highRisk}</b><span>High-risk zones</span></div>
        <div className="db-stat"><b>{farmerCount ?? '–'}</b><span>Registered farmers</span></div>
      </div>

      <AdminAnalytics refreshKey={`${pending.length}-${activeAlerts.length}-${reports.length}`} />
      <div className="db-admin-cols">
        <section className="db-section">
          <h2>Reports waiting for review</h2>
          {!loading && pending.length === 0 ? (
            <div className="db-empty db-ok">All caught up. New farmer reports will appear here.</div>
          ) : (
            <div className="db-review">
              {pending.map((r) => (
                <article key={r._id} className="db-review-card">
                  <img src={`${API_ORIGIN}${r.image}`} alt={`${r.crop} report`} />
                  <div className="db-review-body">
                    <strong>{pestOf(r)}</strong>
                    <span>{r.crop} · {r.severity} severity</span>
                    <span>Reported by {r.farmer?.name || 'unknown'} {timeAgo(r.createdAt)}</span>
                    <span className={`db-ai ${r.aiConfidence && r.aiConfidence < 0.6 ? 'low' : ''}`}>
                      {r.detectionMethod === 'AI-Assisted'
                        ? `AI suggestion${r.aiConfidence ? `, ${Math.round(r.aiConfidence * 100)}% confident` : ''}`
                        : 'Picked manually by the farmer'}
                    </span>
                    {r.latitude == null && <span>No location attached, so it will not appear on the map.</span>}
                    
                    <button className="rd-open" onClick={() => setDetail(r)}>View details</button>

                    <div className="db-review-actions">
                      <button className="ok" disabled={busyId === r._id} onClick={() => review(r._id, 'Verified')}>Verify</button>
                      <button className="no" disabled={busyId === r._id} onClick={() => review(r._id, 'Rejected')}>Reject</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="db-section">
          <h2>Active outbreaks</h2>
          {!loading && activeAlerts.length === 0 ? (
            <div className="db-empty">No active outbreaks. Alerts are created when verified pest reports meet the crop-specific outbreak thresholds.</div>
          ) : (
            activeAlerts.map((a) => (
              <div key={a._id} className={`db-zone sev-${a.severity}`}>
                <div>
                  <strong>{a.pestName} on {a.crop}</strong>
                  <span>{a.severity}</span>
                </div>
                <span>{a.triggeringReports?.length || 0} reports within {a.radiusKm} km · {timeAgo(a.createdAt)}</span>
                <br />
                <button onClick={() => resolve(a._id)}>Mark as resolved</button>
              </div>
            ))
          )}
        </section>
      </div>

      {detail && (
        <ReportDetailModal
          report={detail}
          reports={reports}
          onClose={() => setDetail(null)}
          onReview={(rep, s) =>
            s === 'Rejected' && !window.confirm('Reject this report? The farmer will see it as rejected.')
              ? { cancelled: true }
              : review(rep._id, s)
          }
        />
      )}
    </div>
  );
};

export default AdminDashboard;
