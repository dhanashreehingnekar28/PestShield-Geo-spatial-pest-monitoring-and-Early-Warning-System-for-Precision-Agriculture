import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// adminOnly: only admins may open the page
// farmerOnly: only farmers may open the page
// Anyone who is logged in but not allowed is sent to their own dashboard.
const ProtectedRoute = ({ children, adminOnly = false, farmerOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until the session has been checked with the server
  if (loading) return <p style={{ padding: '2rem' }} role="status">Checking your session…</p>;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if ((adminOnly && user.role !== 'admin') || (farmerOnly && user.role !== 'farmer')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;
