import { useEffect } from 'react';
import { initializeFirebaseServices } from '../services/firebaseService';
import { Alert } from '../utils/alert';
import {
  isSessionDurationExceeded,
  isTokenExpired,
  setStoredToken,
} from '../utils/sessionStorage';

const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;  // 5 minutes

/**
 * Handles periodic Firebase token refresh (every 50 min) and
 * 24-hour session enforcement (checked every 5 min).
 * Only active when user + token are present.
 */
export const useTokenRefresh = (user, token, setToken, logout, clearSession) => {
  useEffect(() => {
    if (!user || !token) return;

    const refreshToken = async () => {
      if (isSessionDurationExceeded()) return;

      try {
        const { auth } = await initializeFirebaseServices();
        if (!auth?.currentUser) return;

        const newToken = await auth.currentUser.getIdToken(true);
        setToken(newToken);
        setStoredToken(newToken);
        if (import.meta.env.DEV) console.log('Token refreshed successfully');
      } catch (error) {
        if (import.meta.env.DEV) console.error('Token refresh error:', error);
        if (isSessionDurationExceeded() && isTokenExpired()) {
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.', {
            showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
          }).then(() => { window.location.href = '/login'; });
          await logout();
        }
      }
    };

    const refreshInterval = setInterval(() => {
      if (!isSessionDurationExceeded()) refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    const sessionInterval = setInterval(() => {
      if (isSessionDurationExceeded()) {
        clearInterval(refreshInterval);
        clearInterval(sessionInterval);
        clearSession();
        Alert.error('Session Expired', 'Your session has expired. Please login again.', {
          showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
        }).then(() => { window.location.href = '/login'; });
        logout();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(sessionInterval);
    };
  }, [user, token, setToken, logout, clearSession]);
};
