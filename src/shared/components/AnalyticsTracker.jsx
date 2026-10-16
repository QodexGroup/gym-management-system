import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initAnalytics, trackPageView, identifyUser, resetUser } from '../services/analyticsService';

/**
 * Headless component that wires Google Analytics 4 into the router and auth
 * state. Renders nothing.
 *
 * Must be mounted inside <Router> (for useLocation) and inside <AuthProvider>
 * (for useAuth). Mount it once, in App.jsx.
 */
const AnalyticsTracker = () => {
  const location = useLocation();
  const { user, account } = useAuth();
  const wasIdentified = useRef(false);

  // Kick off initialisation as early as possible.
  useEffect(() => {
    initAnalytics();
  }, []);

  // One page_view per client-side navigation (path + query).
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Attach / detach the signed-in user. Only non-PII identifiers are sent.
  useEffect(() => {
    if (user?.id) {
      identifyUser({
        id: user.id,
        role: user.role,
        accountId: account?.id ?? user.accountId ?? null,
        isAccountOwner: user.isAccountOwner,
      });
      wasIdentified.current = true;
    } else if (wasIdentified.current) {
      resetUser();
      wasIdentified.current = false;
    }
  }, [user?.id, user?.role, user?.isAccountOwner, user?.accountId, account?.id]);

  return null;
};

export default AnalyticsTracker;
