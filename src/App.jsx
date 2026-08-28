import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import AlertProvider from './components/AlertProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { queryClient } from './shared/lib/queryClient';
import { getKioskLockedPath, isKioskLocked } from './shared/constants/kiosk';

// Auth Pages
import { Login, SignUp, AuthAction, ForgotPassword, ResetPassword } from './features/auth';

// Dashboard Pages
import { AdminDashboard, TrainerDashboard, PtMembers } from './features/dashboard';

// Customer Pages
import { CustomerList, CustomerProfile } from './features/customers';

// Check-In & Kiosk
import { CheckIn } from './features/walkin';
import { KioskRegistration, QrScannerKiosk } from './features/kiosk';

// PT & Class Management
import { PtPackageList } from './features/personal-training';
import { CalendarPage } from './features/calendar';
import { ClassScheduleList } from './features/class-schedule';

// Expenses
import { Expenses } from './features/expenses';

// Reports
import {
  SummaryReport as SummaryReportPage,
  CollectionReport as CollectionReportPage,
  RevenueReport as RevenueReportPage,
  ExpenseReport as ExpenseReportPage,
  MyCollection as MyCollectionPage,
  MyRevenue as MyRevenuePage,
} from './features/reports';

// Admin Management
import { MembershipPlans } from './features/membership-plans';
import { UserManagement } from './features/users';
import { ImportData } from './features/imports';

// Account
import {
  MyAccount,
  SystemSettings,
  Notifications,
  Settings,
  AdminSubscriptionPage as Subscription,
  ReactivationModal,
  LockedAccountNoticeModal,
} from './features/account';

// Appearance
import { Appearance } from './features/appearance';

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

// Dashboard: coaches see coach dashboard; admin, staff, and other roles see admin-style dashboard
const Dashboard = () => {
  const { isTrainer } = useAuth();
  if (isTrainer) {
    return <TrainerDashboard />;
  }
  return <AdminDashboard />;
};

const KioskLockGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // The lock pins the device to the ONE kiosk it was engaged on. Allowing any
    // kiosk route here would let someone hop from the registration form to the
    // scanner (or back) on an unattended tablet.
    const lockedPath = getKioskLockedPath();
    if (isKioskLocked() && location.pathname !== lockedPath) {
      navigate(lockedPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return children;
};

// Locked staff/coach experience: confined to the dashboard with a dismissible
// notice. Any attempt to visit another route bounces them back to the dashboard
// and re-shows the notice.
const LockedNonOwnerExperience = ({ children }) => {
  const location = useLocation();
  const [showNotice, setShowNotice] = useState(true);

  // Re-show the notice each time the user lands on (or is bounced back to) a route.
  useEffect(() => {
    setShowNotice(true);
  }, [location.pathname]);

  if (location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {children}
      <LockedAccountNoticeModal isOpen={showNotice} onClose={() => setShowNotice(false)} />
    </>
  );
};

// Global guard for account-level subscription state (lock + trial)
const AccountStateGuard = ({ children }) => {
  const { isLocked, isTrialExpired, isAccountOwner } = useAuth();
  const location = useLocation();

  // Locked or trial-expired owners must stay on /my-account to settle payment
  if (isAccountOwner && (isLocked || isTrialExpired) && !location.pathname.startsWith('/my-account')) {
    return <Navigate to="/my-account?tab=my-plan" replace />;
  }

  // Locked staff/coach (non-owners) are confined to the dashboard with a notice
  if (!isAccountOwner && isLocked) {
    return <LockedNonOwnerExperience>{children}</LockedNonOwnerExperience>;
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
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlertProvider>
            <Router>
              <ErrorBoundary>
              <KioskLockGuard>
                <AccountStateGuard>
                  <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/action" element={<AuthAction />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Check-In System */}
                <Route path="/check-in" element={<CheckIn />} />
                <Route path="/kiosk/qr-scanner" element={<QrScannerKiosk />} />
                <Route path="/kiosk/registration" element={<ProtectedRoute><KioskRegistration /></ProtectedRoute>} />

                {/* Customer Management */}
                <Route path="/members" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
                <Route path="/members/:id" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />

                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

                {/* PT & Class Management */}
                <Route path="/pt-packages" element={<ProtectedRoute><PtPackageList /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
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
                <Route path="/reports/revenue" element={<ProtectedRoute><RevenueReportPage /></ProtectedRoute>} />
                <Route path="/reports/expense" element={<ProtectedRoute><ExpenseReportPage /></ProtectedRoute>} />
                <Route path="/reports/my-collection" element={<ProtectedRoute><MyCollectionPage /></ProtectedRoute>} />
                <Route path="/reports/my-revenue" element={<ProtectedRoute><MyRevenuePage /></ProtectedRoute>} />

                {/* User Management (Admin Only) */}
                <Route path="/users" element={<AdminProtectedRoute><UserManagement /></AdminProtectedRoute>} />

                {/* Notifications */}
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                {/* My Account */}
                <Route path="/my-account" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
                <Route path="/system-settings" element={<AdminProtectedRoute><SystemSettings /></AdminProtectedRoute>} />
                <Route path="/imports" element={<AdminProtectedRoute><ImportData /></AdminProtectedRoute>} />

                {/* Themes & Appearance */}
                <Route path="/appearance" element={<ProtectedRoute><Appearance /></ProtectedRoute>} />

                {/* Settings */}
                {/* <Route path="/settings" element={<Settings />} /> */}

                  {/* Catch all - redirect to dashboard or login */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AccountStateGuard>
              </KioskLockGuard>
              </ErrorBoundary>
            </Router>
          </AlertProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
