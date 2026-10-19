import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const KEY = 'pestshield_user';
const AuthContext = createContext(null);

// Only trust a stored session that has a token. Older entries saved without one
// (the previous register-then-auto-login flow) are discarded.
const readStored = () => {
  try {
    const u = JSON.parse(localStorage.getItem(KEY));
    return u && u.token ? u : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStored);
  const [loading, setLoading] = useState(() => !!readStored());

  const login = (userData) => {
    localStorage.setItem(KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  // On first load, ask the server who this token belongs to, so the role and
  // account status come from the database and not from editable browser storage.
  useEffect(() => {
    const stored = readStored();
    if (!stored) { localStorage.removeItem(KEY); setLoading(false); return; }
    let cancelled = false;
    api.get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;
        const fresh = { ...stored, name: data.data.name, email: data.data.email, role: data.data.role };
        localStorage.setItem(KEY, JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch((err) => {
        if (cancelled) return;
        // Invalid, expired or deactivated: end the session. A network error keeps it.
        if (err.response && [401, 403].includes(err.response.status)) logout();
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
