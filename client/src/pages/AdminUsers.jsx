import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/BackButton';
import UserDetailModal from '../components/UserDetailModal';
import './AdminUsers.css';

const LIMIT = 10;

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [detailId, setDetailId] = useState(null);

  // Wait until the admin stops typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = () => {
    setLoading(true);
    return api
      .get('/admin/users', { params: { page, limit: LIMIT, role: role || undefined, search: search || undefined } })
      .then(({ data }) => {
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages || 1);
      })
      .catch((err) => setMsg({ type: 'error', text: err.response?.data?.message || 'Could not load users' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, role, search]);

  const act = async (id, request, okText) => {
    setBusyId(id);
    setMsg({ type: '', text: '' });
    try {
      await request();
      setMsg({ type: 'ok', text: okText });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u) => {
    const next = u.role === 'admin' ? 'farmer' : 'admin';
    const warn = next === 'admin'
      ? `Make ${u.name} an admin? They will get full access to users, reports and the pest library.`
      : `Change ${u.name} to a farmer? They will lose all admin access.`;
    if (!window.confirm(warn)) return;
    act(u._id, () => api.put(`/admin/users/${u._id}/role`, { role: next }), `${u.name} is now ${next === 'admin' ? 'an admin' : 'a farmer'}.`);
  };

  const toggleActive = (u) => {
    const next = u.isActive === false; // currently inactive -> activate
    if (!next && !window.confirm(`Deactivate ${u.name}? They will be signed out and cannot log in.`)) return;
    act(u._id, () => api.put(`/admin/users/${u._id}/status`, { isActive: next }), `${u.name} was ${next ? 'activated' : 'deactivated'}.`);
  };

  const remove = (u) => {
    if (!window.confirm(`Delete ${u.name} permanently? Their farms, activities and unverified reports will be removed. This cannot be undone. Deactivating is safer.`)) return;
    act(u._id, () => api.delete(`/admin/users/${u._id}`), `${u.name} was deleted.`);
  };

  return (
    <div className="au">
      <BackButton />
      <header className="au-head">
        <div>
          <h1>Users</h1>
          <p>{total} {total === 1 ? 'account' : 'accounts'}{role ? ` (${role}s)` : ''}. Change roles, suspend access, or remove accounts.</p>
        </div>
        <Link to="/dashboard" className="au-back">Back to dashboard</Link>
      </header>

      <div className="au-bar">
        <input
          type="search"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search users"
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="farmer">Farmers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {msg.text && <p className={msg.type === 'ok' ? 'au-ok' : 'au-err'} role="status">{msg.text}</p>}

      <div className="au-table-wrap">
        <table className="au-table">
          <thead>
            <tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u._id === me?._id;
              const inactive = u.isActive === false;
              return (
                <tr key={u._id} className={inactive ? 'au-inactive' : ''}>
                  <td>
                    <strong>{u.name}{isMe && <em> (you)</em>}</strong>
                    <span>{u.email}</span>
                  </td>
                  <td><span className={`au-pill role-${u.role}`}>{u.role}</span></td>
                  <td><span className={`au-pill ${inactive ? 'st-off' : 'st-on'}`}>{inactive ? 'Deactivated' : 'Active'}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="au-actions">
                      <button onClick={() => setDetailId(u._id)}>Details</button>
                      {isMe ? (
                        <span className="au-muted">Your own account</span>
                      ) : (
                        <>
                          <button disabled={busyId === u._id} onClick={() => changeRole(u)}>
                            {u.role === 'admin' ? 'Make farmer' : 'Make admin'}
                          </button>
                          <button disabled={busyId === u._id} onClick={() => toggleActive(u)}>
                            {inactive ? 'Activate' : 'Deactivate'}
                          </button>
                          <button className="danger" disabled={busyId === u._id} onClick={() => remove(u)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr><td colSpan="5" className="au-empty">No users match your search.</td></tr>
            )}
            {loading && users.length === 0 && (
              <tr><td colSpan="5" className="au-empty">Loading users…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="au-pager">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
      {detailId && (
        <UserDetailModal userId={detailId} isMe={detailId === me?._id} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
};

export default AdminUsers;
