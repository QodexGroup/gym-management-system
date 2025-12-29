import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AlertProvider from './components/AlertProvider';
import { queryClient } from './lib/queryClient';

// Auth Pages
import Login from './auth/Login';

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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Dashboard component that renders based on user role
const Dashboard = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <TrainerDashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

              {/* Check-In System */}
              {/* <Route path="/check-in" element={<CheckIn />} /> */}

              {/* Customer Management */}
              <Route path="/members" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
              <Route path="/members/:id" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

              {/* Membership Plans (Admin Only) */}
              <Route path="/membership-plans" element={<ProtectedRoute><MembershipPlans /></ProtectedRoute>} />

              {/* Expenses (Admin Only) */}
              {/* <Route path="/expenses" element={<Expenses />} /> */}

              {/* Calendar */}
              {/* <Route path="/calendar" element={<Calendar />} /> */}

              {/* Reports */}
              {/* <Route path="/reports/summary" element={<SummaryReport />} />
              <Route path="/reports/collection" element={<CollectionReport />} />
              <Route path="/reports/expense" element={<ExpenseReport />} />
              <Route path="/reports/my-collection" element={<MyCollection />} /> */}

              {/* User Management (Admin Only) */}
              <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />

              {/* Notifications */}
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* My Account */}
              <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />

              {/* Settings */}
              {/* <Route path="/settings" element={<Settings />} /> */}

              {/* Catch all - redirect to dashboard or login */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
