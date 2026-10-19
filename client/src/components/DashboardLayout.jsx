import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';
import './DashboardLayout.css';

const farmerLinks = [
  { to: '/dashboard', label: 'Overview', icon: 'grid', end: true },
  { to: '/create-farm', label: 'Add a farm', icon: 'farm' },
  { to: '/report-pest', label: 'Report a pest', icon: 'report' },
  { to: '/my-reports', label: 'My reports', icon: 'list' },
  { to: '/activities', label: 'Field activities', icon: 'activity' },
];

const adminLinks = [
  { to: '/dashboard', label: 'Overview', icon: 'grid', end: true },
  { to: '/admin', label: 'All reports', icon: 'list' },
  { to: '/admin/users', label: 'Manage users', icon: 'users' },
  { to: '/admin/pests', label: 'Pest library', icon: 'pest' },
  { to: '/map', label: 'Outbreak map', icon: 'map' },
];

const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  farm: <><path d="M3 10 12 3l9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  report: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15m6-12v15" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  pest: <><path d="M12 22v-8m0 0c0-5 4-8 9-8-1 5-4 8-9 8Zm0 0c0-4-3-7-8-7 0 4 3 7 8 7Z" /><path d="M12 22c-1-4-4-6-8-6" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
};

const DashboardIcon = ({ name, size = 19 }) => <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;

const DashboardLayout = ({ isAdmin, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = isAdmin ? adminLinks : farmerLinks;
  const initials = (user?.name || 'P').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const signOut = () => { logout(); navigate('/login'); };

  return (
    <div className={`dashboard-shell ${menuOpen ? 'dashboard-menu-open' : ''}`}>
      {menuOpen && <button type="button" className="dashboard-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
        <NavLink to="/dashboard" className="dashboard-brand" aria-label="PestShield dashboard" onClick={() => setMenuOpen(false)}><Brand /></NavLink>
        <div className="dashboard-side-caption">{isAdmin ? 'ADMIN CONSOLE' : 'FARM WORKSPACE'}</div>
        <nav className="dashboard-side-nav" aria-label="Workspace">
          {links.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `dashboard-side-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            <DashboardIcon name={item.icon} /><span>{item.label}</span>{item.label === 'Report a pest' && <span className="dashboard-side-plus" aria-hidden="true">+</span>}
          </NavLink>)}
        </nav>
        <div className="dashboard-sidebar-note"><span className="dashboard-live-dot" /><span>Field intelligence<br /><b>Monitoring is active</b></span></div>
        <button type="button" className="dashboard-sidebar-logout" onClick={signOut}><DashboardIcon name="logout" size={18} />Sign out</button>
      </aside>

      <div className="dashboard-main-column">
        <header className="dashboard-topbar">
          <button type="button" className="dashboard-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><DashboardIcon name={menuOpen ? 'close' : 'menu'} /></button>
          <div className="dashboard-topbar-title"><span>{isAdmin ? 'Administration' : 'Farmer workspace'}</span><small>Geo-spatial pest monitoring & early warning</small></div>
          <div className="dashboard-profile"><span className="dashboard-avatar" aria-hidden="true">{initials}</span><span><b>{user?.name || 'PestShield user'}</b><small>{isAdmin ? 'Administrator' : 'Farmer'}</small></span><button type="button" className="dashboard-top-logout" onClick={signOut} aria-label="Sign out"><DashboardIcon name="logout" size={18} /></button></div>
        </header>
        <main className="dashboard-scroll-area" id="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
