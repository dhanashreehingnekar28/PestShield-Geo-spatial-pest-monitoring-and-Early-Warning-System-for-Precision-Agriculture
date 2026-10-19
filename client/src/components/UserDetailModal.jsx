import { useEffect, useState } from 'react';
import api from '../api/axios';
import './UserDetailModal.css';

const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

const UserDetailModal = ({ userId, isMe, onClose }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .get(`/admin/users/${userId}`)
      .then(({ data }) => { if (alive) { setUser(data.data); setStats(data.stats || null); } })
      .catch((err) => { if (alive) setError(err.response?.data?.message || 'Could not load user details'); });
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const inactive = user?.isActive === false;

  return (
    <div className="ud-overlay" onClick={onClose}>
      <div className="ud-modal" role="dialog" aria-modal="true" aria-label="User details" onClick={(e) => e.stopPropagation()}>
        <button className="ud-close" onClick={onClose} aria-label="Close">×</button>

        {!user && !error && <p className="ud-note">Loading…</p>}
        {error && <p className="ud-err">{error}</p>}

        {user && (
          <>
            <h2>{user.name}{isMe && <em> (you)</em>}</h2>
            <p className="ud-email">{user.email}</p>
            <div className="ud-pills">
              <span className={`ud-pill role-${user.role}`}>{user.role}</span>
              <span className={`ud-pill ${inactive ? 'st-off' : 'st-on'}`}>{inactive ? 'Deactivated' : 'Active'}</span>
            </div>

            <dl className="ud-grid">
              <div><dt>Joined</dt><dd>{fmt(user.createdAt)}</dd></div>
              <div><dt>Profile last updated</dt><dd>{fmt(user.updatedAt)}</dd></div>
            </dl>

            {stats && (
              <>
                <h3>Activity</h3>
                <div className="ud-stats">
                  <div><strong>{stats.farms}</strong><span>Farms</span></div>
                  <div><strong>{stats.reports}</strong><span>Reports</span></div>
                  <div><strong>{stats.pending}</strong><span>Pending</span></div>
                  <div><strong>{stats.verified}</strong><span>Verified</span></div>
                  <div><strong>{stats.rejected}</strong><span>Rejected</span></div>
                </div>
                <p className="ud-note">Last report: {fmt(stats.lastReportAt)}</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
