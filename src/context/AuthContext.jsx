import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { authService, setLogoutFunction, setLoggingIn } from '../services/authService';
import { Toast } from '../utils/alert';
import { USER_ROLES, isAdminRole, isStaffRole, isCoachRole } from '../constants/userRoles';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('firebase_token'));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Session duration: 24 hours in milliseconds
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  // Firebase token refresh interval: 50 minutes (tokens expire after 1 hour)
  const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  // Check if session has expired (based on login timestamp, not token expiration)
  const isSessionExpired = () => {
    const loginTime = localStorage.getItem('login_timestamp');
    if (!loginTime) {
      // If no login_timestamp, don't consider it expired if we have a token
      // This handles the case during login when timestamp hasn't been set yet
      const hasToken = localStorage.getItem('firebase_token');
      return !hasToken; // Only expired if there's no token either
    }
    
    const now = Date.now();
    const elapsed = now - parseInt(loginTime, 10);
    return elapsed >= SESSION_DURATION;
  };

  // Clear session data
  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('firebase_uid');
    localStorage.removeItem('login_timestamp');
  };

  // Fetch user data from backend
  const fetchUserData = async (idToken) => {
    try {
      // Store token first so authService can use it
      if (idToken) {
        localStorage.setItem('firebase_token', idToken);
      }
      
      const data = await authService.getCurrentUser();
      
      if (data) {
        const userData = {
          id: data.id,
          firstname: data.firstname,
          lastname: data.lastname,
          fullname: data.fullname || `${data.firstname} ${data.lastname}`,
          email: data.email,
          role: data.role || 'admin',
          phone: data.phone,
          firebase_uid: data.firebase_uid,
          permissions: data.permissions || [],
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstname + ' ' + data.lastname)}&background=random`,
        };
        setUser(userData);
        return userData;
      }
      throw new Error('Invalid user data received from server');
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error; // Re-throw so caller can handle it
    }
  };

  // Login function
  const login = async (idToken, firebaseUid) => {
    try {
      // Set logging in flag to prevent session expiration checks
      setIsLoggingIn(true);
      setLoggingIn(true); // Also set in authService
      
      // Store login timestamp FIRST to prevent isSessionExpired from returning true
      localStorage.setItem('login_timestamp', Date.now().toString());
      localStorage.setItem('firebase_token', idToken);
      if (firebaseUid) {
        localStorage.setItem('firebase_uid', firebaseUid);
      }
      
      // Set token state
      setToken(idToken);
      
      // Fetch user data (this will set user state)
      const userData = await fetchUserData(idToken);
      
      // Ensure user state is set
      if (userData) {
        setUser(userData);
      }
      
      // Clear logging in flag after a short delay to ensure all state is set
      setTimeout(() => {
        setIsLoggingIn(false);
        setLoggingIn(false);
      }, 2000);
      
      return userData;
    } catch (error) {
      // Clear logging in flag and session on error
      setIsLoggingIn(false);
      setLoggingIn(false);
      
      // Don't clear session if it's a "user not found" error - let the Login component handle it
      // Only clear if it's an actual authentication error
      if (error.message.includes('Session expired') || 
          error.message.includes('Invalid token') ||
          error.message.includes('Unauthorized')) {
        clearSession();
      }
      
      throw error;
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      const { auth } = await initializeFirebaseServices();
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    
    clearSession();
  }, []); // clearSession is stable, no dependencies needed

  // Register logout function with authService for global invalid token handling
  useEffect(() => {
    setLogoutFunction(logout);
  }, [logout]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if session has expired first (only if login_timestamp exists)
        // If no login_timestamp, it means user hasn't logged in yet, so skip the check
        const loginTime = localStorage.getItem('login_timestamp');
        if (loginTime && isSessionExpired()) {
          clearSession();
          setLoading(false);
          return;
        }

        const { auth } = await initializeFirebaseServices();
        if (!auth) {
          setLoading(false);
          return;
        }

        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Get current login timestamp
            const currentLoginTime = localStorage.getItem('login_timestamp');
            
            // If there's no login_timestamp, this is a fresh login - set it now
            // This happens when user logs in for the first time
            if (!currentLoginTime) {
              localStorage.setItem('login_timestamp', Date.now().toString());
            } else {
              // Skip session expiration check if we're currently logging in
              // or if login was very recent (within 10 seconds)
              const loginTimeValue = parseInt(currentLoginTime, 10);
              const timeSinceLogin = Date.now() - loginTimeValue;
              const FRESH_LOGIN_THRESHOLD = 10000; // 10 seconds
              
              // Only check expiration if login was more than 10 seconds ago
              // and we're not in the middle of a login
              if (timeSinceLogin > FRESH_LOGIN_THRESHOLD && !isLoggingIn && isSessionExpired()) {
                clearSession();
                await firebaseSignOut(auth);
                setLoading(false);
                return;
              }
            }
            
            try {
              // Force refresh token to get a fresh one (even if current is still valid)
              const idToken = await firebaseUser.getIdToken(true);
              setToken(idToken);
              localStorage.setItem('firebase_token', idToken);
              localStorage.setItem('firebase_uid', firebaseUser.uid);
              
              // Fetch user data from backend
              await fetchUserData(idToken);
            } catch (error) {
              console.error('Error getting token or fetching user data:', error);
              // Only clear session if it's actually expired (24 hours), not just token refresh failure
              const currentLoginTime = localStorage.getItem('login_timestamp');
              const loginTimeValue = currentLoginTime ? parseInt(currentLoginTime, 10) : null;
              const timeSinceLogin = loginTimeValue ? Date.now() - loginTimeValue : 0;
              const FRESH_LOGIN_THRESHOLD = 5000; // 5 seconds
              
              // Don't check expiration if it's a fresh login (within 5 seconds)
              if (loginTimeValue && timeSinceLogin > FRESH_LOGIN_THRESHOLD && isSessionExpired()) {
                clearSession();
                Toast.error('Your session has expired. Please login again.');
              } else if (error.message.includes('Invalid token') || error.code === 'auth/user-token-expired') {
                // Try to refresh the token
                try {
                  const refreshedToken = await firebaseUser.getIdToken(true);
                  localStorage.setItem('firebase_token', refreshedToken);
                  setToken(refreshedToken);
                  await fetchUserData(refreshedToken);
                } catch (refreshError) {
                  clearSession();
                  Toast.error('Your session is invalid. Please login again.');
                }
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
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Check for existing token on mount (only if user is not already set)
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Skip if user is already set (means login was successful)
      if (user) {
        return;
      }

      // Skip if we're currently logging in
      if (isLoggingIn) {
        return;
      }

      const loginTime = localStorage.getItem('login_timestamp');
      
      // If there's no login_timestamp, don't check expiration (might be fresh login)
      // Only check if login_timestamp exists and is old enough
      if (loginTime) {
        const loginTimeValue = parseInt(loginTime, 10);
        const timeSinceLogin = Date.now() - loginTimeValue;
        const FRESH_LOGIN_THRESHOLD = 10000; // 10 seconds - increased to be safe
        
        // Only check expiration if login was more than 10 seconds ago
        if (timeSinceLogin > FRESH_LOGIN_THRESHOLD && isSessionExpired()) {
          clearSession();
          Toast.error('Your session has expired. Please login again.');
          return;
        }
      }

      const storedToken = localStorage.getItem('firebase_token');
      if (storedToken && !user) {
        try {
          const userData = await fetchUserData(storedToken);
          if (!userData) {
            // Token might be invalid, clear it
            clearSession();
          }
        } catch (error) {
          // Handle invalid token or other errors
          console.error('Error checking existing auth:', error);
          // Don't clear session if it's a network error - might be temporary
          if (error.message.includes('Cannot connect to API')) {
            return;
          }
          // Only clear and show error if it's an authentication error
          // But don't clear if it's a fresh login (within 5 seconds)
          const loginTime = localStorage.getItem('login_timestamp');
          if (loginTime) {
            const loginTimeValue = parseInt(loginTime, 10);
            const timeSinceLogin = Date.now() - loginTimeValue;
            const FRESH_LOGIN_THRESHOLD = 5000;
            
            if (timeSinceLogin > FRESH_LOGIN_THRESHOLD) {
              if (error.message.includes('Session expired') || 
                  error.message.includes('invalid') || 
                  error.message.includes('unauthorized')) {
                clearSession();
                Toast.error('Your session is invalid. Please login again.');
              }
            }
          }
        }
      }
    };

    // Only check if we have a token but no user, and we're not in the middle of a login
    // Add a delay to avoid race conditions with login
    if (token && !user && !isLoggingIn) {
      const timeoutId = setTimeout(() => {
        // Double check we're still not logging in
        if (!isLoggingIn) {
          checkExistingAuth();
        }
      }, 2000); // Wait 2 seconds to let login complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [token, user, isLoggingIn]);

  // Periodic token refresh (every 50 minutes to keep Firebase token valid)
  useEffect(() => {
    if (!user || !token) return;

    const refreshToken = async () => {
      try {
        const { auth } = await initializeFirebaseServices();
        if (!auth || !auth.currentUser) return;

        // Check if 24-hour session has expired
        if (isSessionExpired()) {
          await logout();
          return;
        }

        // Refresh Firebase token (force refresh to get new token)
        const newToken = await auth.currentUser.getIdToken(true);
        setToken(newToken);
        localStorage.setItem('firebase_token', newToken);
        
        // Token refreshed successfully, session is still valid
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Only logout if 24-hour session expired, not if token refresh failed temporarily
        if (isSessionExpired()) {
          await logout();
        }
      }
    };

    // Refresh token every 50 minutes (before 1-hour expiration)
    const refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);

    // Also check session expiration every 5 minutes
    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        clearInterval(refreshInterval);
        clearInterval(sessionCheckInterval);
        logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(refreshInterval);
      clearInterval(sessionCheckInterval);
    };
  }, [user, token, logout]);

  const isAdmin = isAdminRole(user?.role);
  const isTrainer = isCoachRole(user?.role);
  const isStaff = isStaffRole(user?.role);
  const isAuthenticated = !!user && !!token && !isSessionExpired();

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading,
      login, 
      logout, 
      isAdmin, 
      isTrainer,
      isStaff,
      isAuthenticated,
      fetchUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
