import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { authService, setLogoutFunction, setLoggingIn, getIsLoggingIn } from '../services/authService';
import { Alert } from '../utils/alert';
import {
  getStoredToken,
  setStoredToken,
  clearSessionStorage,
  initSessionStart,
  setSessionStart,
  isSessionDurationExceeded,
  isTokenExpired,
} from '../utils/sessionStorage';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { useAccountStatus } from '../hooks/useAccountStatus';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getStoredToken);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── Derived flags ─────────────────────────────────────────────────────────
  const accountStatus = useAccountStatus(user, account, token);

  // ─── Session helpers ───────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    setUser(null);
    setAccount(null);
    setUsage(null);
    setToken(null);
    clearSessionStorage();
  }, []);

  // ─── Fetch user data from backend ──────────────────────────────────────────
  const fetchUserData = useCallback(async (idToken) => {
    if (idToken) {
      setStoredToken(idToken);
      initSessionStart();
    }

    const data = await authService.getCurrentUser();

    const permissions = Array.isArray(data.permissions)
      ? data.permissions.filter((p) => typeof p === 'string')
      : [];

    const userData = {
      id: data.id,
      firstname: data.firstname,
      lastname: data.lastname,
      fullname: data.fullname || `${data.firstname} ${data.lastname}`,
      email: data.email,
      role: data.role || 'admin',
      phone: data.phone,
      firebase_uid: data.firebase_uid,
      permissions,
      isAccountOwner: !!data.isAccountOwner,
      emailVerified: !!data.emailVerified,
      avatar:
        data.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${data.firstname} ${data.lastname}`
        )}&background=random`,
    };

    setUser(userData);
    setAccount(data.account ?? null);
    setUsage(data.usage ?? null);
    return userData;
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (idToken, firebaseUid) => {
    try {
      setIsLoggingIn(true);
      setLoggingIn(true);

      setSessionStart();
      setStoredToken(idToken);
      if (firebaseUid) localStorage.setItem('firebase_uid', firebaseUid);
      setToken(idToken);

      const userData = await fetchUserData(idToken);

      setTimeout(() => {
        setIsLoggingIn(false);
        setLoggingIn(false);
      }, 2000);

      return userData;
    } catch (error) {
      setIsLoggingIn(false);
      setLoggingIn(false);
      if (
        error.message.includes('Session expired') ||
        error.message.includes('Invalid token') ||
        error.message.includes('Unauthorized')
      ) {
        clearSession();
      }
      throw error;
    }
  }, [fetchUserData, clearSession]);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      const { auth } = await initializeFirebaseServices();
      if (auth) await firebaseSignOut(auth);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Firebase sign out error:', error);
    }
    clearSession();
  }, [clearSession]);

  // Register logout with authService for global invalid-token handling
  useEffect(() => {
    setLogoutFunction(logout);
  }, [logout]);

  // ─── Firebase auth state listener ─────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getStoredToken();
        if (!storedToken) { clearSession(); setLoading(false); return; }

        if (isSessionDurationExceeded()) {
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.', {
            showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
          }).then(() => { window.location.href = '/login'; });
          setLoading(false);
          return;
        }

        const { auth } = await initializeFirebaseServices();
        if (!auth) { setLoading(false); return; }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const stored = getStoredToken();
            if (!stored && !getIsLoggingIn()) {
              clearSession();
              await firebaseSignOut(auth);
              setLoading(false);
              return;
            }

            if (isSessionDurationExceeded()) {
              clearSession();
              await firebaseSignOut(auth);
              Alert.error('Session Expired', 'Your session has expired. Please login again.', {
                showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
              }).then(() => { window.location.href = '/login'; });
              setLoading(false);
              return;
            }

            try {
              const idToken = await firebaseUser.getIdToken(true);
              setToken(idToken);
              setStoredToken(idToken);
              localStorage.setItem('firebase_uid', firebaseUser.uid);
              await fetchUserData(idToken);
            } catch (error) {
              if (import.meta.env.DEV) console.error('Error getting token or fetching user data:', error);
              if (getIsLoggingIn()) { setLoading(false); return; }
              if (error.message.includes('Invalid token') || error.code === 'auth/user-token-expired') {
                clearSession();
                Alert.error('Session Expired', 'Your session has expired. Please login again.', {
                  showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
                }).then(() => { window.location.href = '/login'; });
              } else {
                setUser(null);
              }
            }
          } else {
            clearSession();
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        if (import.meta.env.DEV) console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [clearSession, fetchUserData]);

  // ─── Fallback: check existing token when no user (e.g. page refresh) ───────
  useEffect(() => {
    if (!token || user || isLoggingIn) return;

    const timeoutId = setTimeout(async () => {
      if (isLoggingIn) return;
      if (isSessionDurationExceeded()) {
        clearSession();
        Alert.error('Session Expired', 'Your session has expired. Please login again.', {
          showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
        }).then(() => { window.location.href = '/login'; });
        return;
      }
      try {
        await fetchUserData(token);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error checking existing auth:', error);
        if (error.message.includes('Cannot connect to API')) return;
        if (
          error.message.includes('Session expired') ||
          error.message.includes('invalid') ||
          error.message.includes('unauthorized')
        ) {
          clearSession();
          Alert.error('Session Invalid', 'Your session is invalid. Please login again.', {
            showCancelButton: false, showDenyButton: false, confirmButtonText: 'OK',
          }).then(() => { window.location.href = '/login'; });
        }
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [token, user, isLoggingIn, clearSession, fetchUserData]);

  // ─── Periodic token refresh + 24-hour session enforcement ─────────────────
  useTokenRefresh(user, token, setToken, logout, clearSession);

  // ─── Context value ─────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        usage,
        token,
        loading,
        login,
        logout,
        fetchUserData,
        ...accountStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
