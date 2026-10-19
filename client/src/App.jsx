import './styles/ui.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateFarm from './pages/CreateFarm';
import CropLifecycle from './pages/CropLifecycle';
import ReportPest from './pages/ReportPest';
import MyReports from './pages/MyReports';
import Activities from './pages/Activities';
import MapPage from './pages/MapPage';
import AdminPanel from './pages/AdminPanel';
import AdminUsers from './pages/AdminUsers';
import AdminPests from './pages/AdminPests';

function App() {
  const { pathname } = useLocation();
  return (
    <>
      {pathname !== '/' && pathname !== '/dashboard' && <Navbar />}
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Both roles: /dashboard shows the farmer or admin dashboard by role */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/crop-lifecycle/:crop" element={<ProtectedRoute><CropLifecycle /></ProtectedRoute>} />

        {/* Farmer pages */}
        <Route path="/create-farm" element={<ProtectedRoute farmerOnly><CreateFarm /></ProtectedRoute>} />
        <Route path="/report-pest" element={<ProtectedRoute farmerOnly><ReportPest /></ProtectedRoute>} />
        <Route path="/my-reports" element={<ProtectedRoute farmerOnly><MyReports /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute farmerOnly><Activities /></ProtectedRoute>} />

        {/* Admin pages */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/pests" element={<ProtectedRoute adminOnly><AdminPests /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
