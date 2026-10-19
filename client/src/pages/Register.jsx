import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // A logged-in person has no reason to register again
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Only name, email and password are sent. The server always creates a farmer.
      await api.post('/auth/register', form);
      // No auto-login: the person must log in before opening any dashboard.
      navigate('/login?registered=1', { replace: true });
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Registration failed'
          : 'Cannot reach the server. Please check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h2 className="stacked-form-title">Create your farmer account</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="stacked-form" onSubmit={handleSubmit}>
        <div className="stacked-field">
          <label htmlFor="register-name">Name</label>
          <input id="register-name" name="name" autoComplete="name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="stacked-field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="stacked-field">
          <label htmlFor="register-password">Password</label>
          <input id="register-password" name="new-password" type="password" autoComplete="new-password" required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <small>At least 8 characters, with a letter and a number.</small>
        </div>
        <button className="stacked-submit" type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;
