import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [role, setRole] = useState('farmer');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { ...form, loginAs: role });
      login(data.data);
      // Both roles use /dashboard. It shows the farmer or admin dashboard by role.
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Login failed. Please try again.'
          : 'Cannot reach the server. Please check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <h2>{role === 'admin' ? 'Monitor and manage PestShield' : 'Protect your farm from pests'}</h2>
        <p>
          {role === 'admin'
            ? 'Verify farmer reports, watch outbreaks across the region, and manage users and the pest library.'
            : 'Report crop problems with a photo, get AI help identifying them, and receive early warnings about outbreaks near your farm.'}
        </p>
        <ul>
          <li>AI pest and disease detection</li>
          <li>Location-based outbreak alerts</li>
          <li>Treatment and prevention guidance</li>
        </ul>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-sub">Choose how you are logging in.</p>
          <div className="auth-tabs" role="tablist" aria-label="Login type">
            <button type="button" role="tab" aria-selected={role === 'farmer'} className={role === 'farmer' ? 'on' : ''} onClick={() => { setRole('farmer'); setError(''); }}>Farmer login</button>
            <button type="button" role="tab" aria-selected={role === 'admin'} className={role === 'admin' ? 'on' : ''} onClick={() => { setRole('admin'); setError(''); }}>Admin login</button>
          </div>
          {params.get('registered') && !error && <div className="auth-info" role="status">Registered successfully. Please login.</div>}
          {params.get('expired') && !error && !params.get('registered') && <div className="auth-info" role="status">Your session ended. Please log in again.</div>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label htmlFor="password">Password</label>
            <div className="auth-pw">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? 'Hide' : 'Show'}</button>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Logging in…' : role === 'admin' ? 'Log in as admin' : 'Log in as farmer'}
            </button>
          </form>
          {role === 'farmer' ? (
            <p className="auth-alt">New to PestShield? <Link to="/register">Create a farmer account</Link></p>
          ) : (
            <p className="auth-note">Admin accounts are not created through public registration. An existing administrator adds them from the Users page.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Login;
