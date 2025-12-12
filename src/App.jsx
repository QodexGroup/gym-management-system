import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AlertProvider from './components/AlertProvider';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Trainer Pages
import TrainerDashboard from './pages/trainer/Dashboard';

// Shared Pages
import CheckIn from './pages/CheckIn';
import CustomerList from './pages/customers/CustomerList';
import CustomerProfile from './pages/customers/CustomerProfile';
import MembershipPlans from './pages/MembershipPlans';
import Expenses from './pages/Expenses';
import Calendar from './pages/Calendar';
import CollectionReport from './pages/reports/CollectionReport';
import ExpenseReport from './pages/reports/ExpenseReport';
import SummaryReport from './pages/reports/SummaryReport';
import MyCollection from './pages/reports/MyCollection';
import UserManagement from './pages/UserManagement';
import Notifications from './pages/Notifications';
import MyAccount from './pages/MyAccount';
import Settings from './pages/Settings';

// Dashboard component that renders based on user role
const Dashboard = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <TrainerDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Check-In System */}
            <Route path="/check-in" element={<CheckIn />} />

            {/* Customer Management */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerProfile />} />

            {/* Membership Plans (Admin Only) */}
            <Route path="/membership-plans" element={<MembershipPlans />} />

            {/* Expenses (Admin Only) */}
            <Route path="/expenses" element={<Expenses />} />

            {/* Calendar */}
            <Route path="/calendar" element={<Calendar />} />

            {/* Reports */}
            <Route path="/reports/summary" element={<SummaryReport />} />
            <Route path="/reports/collection" element={<CollectionReport />} />
            <Route path="/reports/expense" element={<ExpenseReport />} />
            <Route path="/reports/my-collection" element={<MyCollection />} />

            {/* User Management (Admin Only) */}
            <Route path="/users" element={<UserManagement />} />

            {/* Notifications */}
            <Route path="/notifications" element={<Notifications />} />

            {/* My Account */}
            <Route path="/my-account" element={<MyAccount />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
