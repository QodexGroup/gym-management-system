import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import AlertProvider from './components/AlertProvider';
import { queryClient } from './lib/queryClient';
import { isKioskLocked } from './constants/kiosk';

// Auth Pages
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import AuthAction from './auth/AuthAction';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';

// Trainer Pages
import TrainerDashboard from './pages/trainer/Dashboard';
import PtMembers from './pages/trainer/PtMembers';

// Shared Pages
import CheckIn from './pages/common/CheckIn.page';
import QrScannerKiosk from './pages/common/QrScannerKiosk.page';
import CustomerList from './pages/customers/CustomerList.page';
import CustomerProfile from './pages/customers/CustomerProfile.page';
import PtPackageList from './pages/admin/PtPackageList.page';
import SessionScheduling from './pages/common/SessionScheduling.page';
import ClassScheduleList from './pages/common/ClassScheduleList.page';
import Expenses from './pages/common/Expenses.page';
import SummaryReportPage from './pages/reports/SummaryReport.page';
import CollectionReportPage from './pages/reports/CollectionReport.page';
import ExpenseReportPage from './pages/reports/ExpenseReport.page';
import MyCollectionPage from './pages/reports/MyCollection.page';
import MembershipPlans from './pages/admin/MembershipPlans.page';
import UserManagement from './pages/admin/UserManagement.page';
import Notifications from './pages/Notifications';
import MyAccount from './pages/MyAccount.page';
import Settings from './pages/Settings';
import Subscription from './pages/admin/subscription/Subscription.page';
import ReactivationModal from './pages/admin/forms/ReactivationModal';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isTrialExpired, isAccountOwner } = useAuth();
  const location = useLocation();

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

  // Only redirect account owners when trial expires
  if (isTrialExpired && isAccountOwner && !location.pathname.startsWith('/my-account')) {
    return <Navigate to="/my-account?tab=my-plan" replace />;
  }

  return children;
};

// Admin Only Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard component that renders based on user role
const Dashboard = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <TrainerDashboard />;
};

const KioskLockGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isKioskLocked() && location.pathname !== '/kiosk/qr-scanner') {
      navigate('/kiosk/qr-scanner', { replace: true });
    }
  }, [location.pathname, navigate]);

  return children;
};

// Global guard for account-level subscription state (lock + trial)
const AccountStateGuard = ({ children }) => {
  const { isLocked, isTrialExpired, isAccountOwner } = useAuth();
  const location = useLocation();

  // Locked owners must stay on /my-account — block all other routes
  if (isLocked && isAccountOwner && !location.pathname.startsWith('/my-account')) {
    return <Navigate to="/my-account?tab=my-plan" replace />;
  }

  // Trial-expired owners must go to My Account plan tab
  if (isTrialExpired && isAccountOwner && !location.pathname.startsWith('/my-account')) {
    return <Navigate to="/my-account?tab=my-plan" replace />;
  }

  return (
    <>
      {children}
      {isLocked && isAccountOwner && <ReactivationModal />}
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
            <Router>
              <KioskLockGuard>
                <AccountStateGuard>
                  <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/auth/action" element={<AuthAction />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Check-In System */}
                <Route path="/check-in" element={<CheckIn />} />
                <Route path="/kiosk/qr-scanner" element={<QrScannerKiosk />} />

                {/* Customer Management */}
                <Route path="/members" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
                <Route path="/members/:id" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

                {/* PT & Class Management */}
                <Route path="/pt-packages" element={<ProtectedRoute><PtPackageList /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><SessionScheduling /></ProtectedRoute>} />
                <Route path="/classes" element={<ProtectedRoute><ClassScheduleList /></ProtectedRoute>} />

                {/* Trainer Routes */}
                <Route path="/trainer/pt-members" element={<ProtectedRoute><PtMembers /></ProtectedRoute>} />

                {/* Membership Plans (Admin Only) */}
                <Route path="/membership-plans" element={<AdminProtectedRoute><MembershipPlans /></AdminProtectedRoute>} />


                {/* Calendar */}
                {/* <Route path="/calendar" element={<Calendar />} /> */}

                {/* Reports */}
                <Route path="/reports/summary" element={<ProtectedRoute><SummaryReportPage /></ProtectedRoute>} />
                <Route path="/reports/collection" element={<ProtectedRoute><CollectionReportPage /></ProtectedRoute>} />
                <Route path="/reports/expense" element={<ProtectedRoute><ExpenseReportPage /></ProtectedRoute>} />
                <Route path="/reports/my-collection" element={<ProtectedRoute><MyCollectionPage /></ProtectedRoute>} />

                {/* User Management (Admin Only) */}
                <Route path="/users" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />

                {/* Notifications */}
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                {/* My Account */}
                <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />

                {/* Settings */}
                {/* <Route path="/settings" element={<Settings />} /> */}

                  {/* Catch all - redirect to dashboard or login */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AccountStateGuard>
              </KioskLockGuard>
            </Router>
          </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
