import axios from 'axios';

const KEY = 'pestshield_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* unreadable stored session: send the request without a token */ }
  return config;
});

// If the server says the token is no longer valid (expired, or the account was
// deactivated), end the session and send the person to the login page.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthForm && localStorage.getItem(KEY)) {
      localStorage.removeItem(KEY);
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login?expired=1');
    }
    return Promise.reject(err);
  }
);

export default api;