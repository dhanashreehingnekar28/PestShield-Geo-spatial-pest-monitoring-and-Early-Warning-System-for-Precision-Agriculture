import { useAuth } from '../context/AuthContext';
import FarmerDashboard from './FarmerDashboard';
import AdminDashboard from './AdminDashboard';
import DashboardLayout from '../components/DashboardLayout';

// Shows the right dashboard for the logged-in role
const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <DashboardLayout isAdmin={isAdmin}>
      {isAdmin ? <AdminDashboard /> : <FarmerDashboard />}
    </DashboardLayout>
  );
};

export default Dashboard;
