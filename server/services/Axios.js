import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('pestshield_user');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token expired or the account was deactivated, end the session cleanly
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLoginCall && localStorage.getItem('pestshield_user')) {
      localStorage.removeItem('pestshield_user');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(err);
  }
);

export default api;