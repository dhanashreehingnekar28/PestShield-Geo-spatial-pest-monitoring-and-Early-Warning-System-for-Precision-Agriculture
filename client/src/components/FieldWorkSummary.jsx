import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../pages/Dashboard.css';

const FieldWorkSummary = () => {
  const [summary, setSummary] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    api.get('/dashboard/farmer')
      .then(({ data }) => { setSummary(data.data); setState('ready'); })
      .catch(() => setState('error'));
  }, []);

  if (state !== 'ready') {
    return (
      <section className="db-section">
        <h2>My field work</h2>
        <div className="db-empty">{state === 'loading' ? 'Loading…' : 'Field work summary is unavailable right now.'}</div>
      </section>
    );
  }

  const { activities, reports } = summary;

  return (
    <section className="db-section">
      <h2>My field work</h2>
      <div className="db-stats">
        <div className={`db-stat ${activities.overdue ? 'warn' : ''}`}><b>{activities.overdue}</b><span>Overdue tasks</span></div>
        <div className="db-stat"><b>{activities.dueThisWeek}</b><span>Due in the next 7 days</span></div>
        <div className="db-stat"><b>{activities.pending}</b><span>Pending tasks</span></div>
        <div className="db-stat"><b>{reports.Verified}</b><span>Verified reports</span></div>
      </div>

      {activities.upcoming.length === 0 ? (
        <div className="db-empty">No pending tasks. <Link to="/activities">Open field activities</Link></div>
      ) : (
        <ul className="db-reports">
          {activities.upcoming.map((t) => (
            <li key={t._id}>
              <div>
                <strong>{t.title || t.type}</strong>
                <span>{t.farm?.farmName} · due {new Date(t.dueDate).toLocaleDateString()}</span>
              </div>
              <span className={`db-status ${t.isOverdue ? 'st-Rejected' : 'st-Pending'}`}>{t.isOverdue ? 'Overdue' : 'Pending'}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/activities" className="db-more">See all activities</Link>
    </section>
  );
};

export default FieldWorkSummary;