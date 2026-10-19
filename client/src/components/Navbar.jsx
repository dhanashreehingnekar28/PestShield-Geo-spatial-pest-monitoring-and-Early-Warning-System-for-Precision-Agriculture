import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brand from './Brand';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand" aria-label="PestShield home"><Brand /></Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {user.role === 'admin' ? (
              <>
                <Link to="/admin">All Reports</Link>
                <Link to="/admin/users">Users</Link>
                <Link to="/admin/pests">Pest Library</Link>
                <Link to="/map">Outbreak Map</Link>
              </>
            ) : (
              <>
                <Link to="/report-pest">Report Pest</Link>
                <Link to="/my-reports">My Reports</Link>
                <Link to="/activities">Activities</Link>
               </>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
