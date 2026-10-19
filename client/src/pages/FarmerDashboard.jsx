import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FieldWorkSummary from '../components/FieldWorkSummary';
import AlertActionCenter from '../components/AlertActionCenter';
import './Dashboard.css';

// Generic advice by severity, used only if an alert has no advice from the server
const ACTIONS = {
  High: ['Inspect your field today', 'Isolate or remove heavily affected plants', 'Contact your local agriculture officer'],
  Medium: ['Scout your field within 2 days', 'Apply the recommended treatment from the Pest Library', 'Report any new signs'],
  Low: ['Keep monitoring your crop', 'Check leaves weekly', 'Report anything unusual'],
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const timeAgo = (d) => {
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

const pestOf = (r) => r.pest?.pestName || r.aiPredictedPest || 'Pest not identified';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = (url) => api.get(url).then(({ data }) => data.data || []).catch(() => []);
    Promise.all([load('/farms/my'), load('/alerts/my'), load('/pest-reports/my')]).then(([f, a, r]) => {
      setFarms(f);
      setAlerts(a);
      setReports(r);
      setLoading(false);
    });
  }, []);

  const isUnread = (a) => !a.read;
  const markRead = async (id) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
    } catch {
      /* keep the alert as is if the request fails */
    }
  };

  const [editFarm, setEditFarm] = useState(null);
  const [farmMsg, setFarmMsg] = useState({ type: '', text: '' });
  const [farmSaving, setFarmSaving] = useState(false);
  const reloadFarms = () => api.get('/farms/my').then(({ data }) => setFarms(data.data || [])).catch(() => {});

  const saveFarm = async (e) => {
    e.preventDefault();
    if (!editFarm.farmName.trim()) return setFarmMsg({ type: 'error', text: 'Farm name is required' });
    setFarmSaving(true);
    try {
      await api.put(`/farms/${editFarm._id}`, { farmName: editFarm.farmName.trim(), cropType: editFarm.cropType });
      setEditFarm(null);
      setFarmMsg({ type: 'ok', text: 'Farm updated.' });
      await reloadFarms();
    } catch (err) {
      setFarmMsg({ type: 'error', text: err.response?.data?.message || 'Could not update the farm' });
    } finally {
      setFarmSaving(false);
    }
  };

  const deleteFarm = async (f) => {
    if (!window.confirm(`Delete "${f.farmName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/farms/${f._id}`);
      setFarmMsg({ type: 'ok', text: `${f.farmName} was deleted.` });
      await reloadFarms();
    } catch (err) {
      setFarmMsg({ type: 'error', text: err.response?.data?.message || 'Could not delete the farm' });
    }
  };

  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
  const pending = reports.filter((r) => r.status === 'Pending').length;
  const recent = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  return (
    <div className="db db-farmer">
      <header className="db-head">
        <div>
          <h1>{greeting()}, {user?.name}</h1>
          <p className="db-summary">
            {loading
              ? 'Loading your farm data…'
              : `${farms.length} ${farms.length === 1 ? 'farm' : 'farms'} · ${reports.length} reports (${pending} awaiting review) · ${activeAlerts.length} active ${activeAlerts.length === 1 ? 'alert' : 'alerts'}`}
          </p>
        </div>
 
      </header>

      <section className="db-section">
        <h2>Pest alerts near you</h2>
        {!loading && activeAlerts.length === 0 ? (
          <div className="db-empty db-ok">No active outbreaks near your farms. We will alert you here if that changes.</div>
        ) : (
          <div className="db-alerts">
            {activeAlerts.map((a) => (
              <article key={a._id} className={`db-alert sev-${a.severity}`}>
                <div className="db-alert-top">
                  <h3>{a.pestName} on {a.crop}</h3>
                  <span className="db-tag">{a.severity} risk</span>
                  {isUnread(a) && <span className="db-new">New</span>}
                </div>
                <p>{a.message}</p>
                <div className="db-todo">
                  <strong>What to do</strong>
                  <ul>
                    {(a.recommendedActions?.length ? a.recommendedActions : ACTIONS[a.severity] || ACTIONS.Medium).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
                <AlertActionCenter alert={a} onMarkRead={markRead} />
                <div className="db-alert-foot">
                  <span>Within {a.radiusKm} km · {timeAgo(a.createdAt)}</span>
                  {isUnread(a) && <button onClick={() => markRead(a._id)}>Mark as read</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <FieldWorkSummary />

      <div className="db-cols">
        <section className="db-section">
          <h2>My farms</h2>
          {farmMsg.text && <p className={farmMsg.type === 'ok' ? 'db-msg-ok' : 'db-msg-err'} role="status">{farmMsg.text}</p>}
          {farms.length === 0 ? (
            <div className="db-empty">No farms yet. <Link to="/create-farm">Add your first farm</Link> to start tracking your crop.</div>
          ) : (
            <div className="db-farms">
              {farms.map((f) => (
                <div key={f._id} className={`db-farm crop-${f.cropType}`}>
                  <Link to={`/crop-lifecycle/${f.cropType}`} className="db-farm-main">
                    <span className="db-farm-crop">{f.cropType}</span>
                    <span className="db-farm-name">{f.farmName}</span>
                    <span className="db-farm-link">View crop guide</span>
                  </Link>
                  <div className="db-farm-tools">
                    <button onClick={() => { setEditFarm({ _id: f._id, farmName: f.farmName, cropType: f.cropType }); setFarmMsg({ type: '', text: '' }); }}>Edit</button>
                    <button className="danger" onClick={() => deleteFarm(f)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="db-section">
          <h2>Recent reports</h2>
          {recent.length === 0 ? (
            <div className="db-empty">You have not reported anything yet. <Link to="/report-pest">Report a pest</Link></div>
          ) : (
            <ul className="db-reports">
              {recent.map((r) => (
                <li key={r._id}>
                  <div>
                    <strong>{pestOf(r)}</strong>
                    <span>{r.crop} · {timeAgo(r.createdAt)}</span>
                  </div>
                  <span className={`db-status st-${r.status}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          )}
          {reports.length > 0 && <Link to="/my-reports" className="db-more">See all reports</Link>}
        </section>
      </div>

      {editFarm && (
        <div className="db-overlay" onMouseDown={(e) => e.target === e.currentTarget && !farmSaving && setEditFarm(null)}>
          <form className="db-modal" onSubmit={saveFarm} role="dialog" aria-modal="true" aria-labelledby="db-farm-title">
            <h2 id="db-farm-title">Edit farm</h2>
            <label htmlFor="db-fname">Farm name</label>
            <input id="db-fname" value={editFarm.farmName} onChange={(e) => setEditFarm({ ...editFarm, farmName: e.target.value })} autoFocus />
            <label htmlFor="db-fcrop">Crop</label>
            <select id="db-fcrop" value={editFarm.cropType} onChange={(e) => setEditFarm({ ...editFarm, cropType: e.target.value })}>
              <option>Groundnut</option>
              <option>Potato</option>
              <option>Chilli</option>
            </select>
            <div className="db-modal-actions">
              <button type="button" onClick={() => setEditFarm(null)} disabled={farmSaving}>Cancel</button>
              <button type="submit" className="db-btn-primary" disabled={farmSaving}>{farmSaving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
