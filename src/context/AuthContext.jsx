import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { authService, setLogoutFunction, setLoggingIn } from '../services/authService';
import { Alert } from '../utils/alert';
import { getPhilippinesTime } from '../utils/philippinesTime';
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
  const [account, setAccount] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('firebase_token'));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Session duration: 24 hours in milliseconds
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  // Firebase token refresh interval: 50 minutes (tokens expire after 1 hour)
  const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes

  // Decode JWT to get expiration timestamp
  const getTokenExpiration = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  };

  // Check if token is expired
  const isTokenExpired = () => {
    const expirationTime = localStorage.getItem('token_expiration');
    if (!expirationTime) return true; // No expiration means expired
    return getPhilippinesTime() >= parseInt(expirationTime, 10);
  };

  // Check if 24-hour session has passed (based on session_start_time)
  const isSessionDurationExceeded = () => {
    const sessionStartTime = localStorage.getItem('session_start_time');
    if (!sessionStartTime) return false; // No start time means new session
    const now = getPhilippinesTime();
    const elapsed = now - parseInt(sessionStartTime, 10);
    return elapsed >= SESSION_DURATION;
  };

  // Clear session data
  const clearSession = () => {
    setUser(null);
    setAccount(null);
    setUsage(null);
    setToken(null);
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('firebase_uid');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('session_start_time');
  };

  // Fetch user data from backend
  const fetchUserData = async (idToken) => {
    try {
      // Store token first so authService can use it
      if (idToken) {
        localStorage.setItem('firebase_token', idToken);
        
        // Store token expiration
        const exp = getTokenExpiration(idToken);
        localStorage.setItem('token_expiration', exp.toString());

        // Store session start time if not already set
        if (!localStorage.getItem('session_start_time')) {
          localStorage.setItem('session_start_time', getPhilippinesTime().toString());
        }
      }
      
      const data = await authService.getCurrentUser();
      
      // Backend returns permissions as an array of strings directly
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
        permissions: permissions,
        isPlatformAdmin: !!data.isPlatformAdmin,
        emailVerified: !!data.emailVerified,
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstname + ' ' + data.lastname)}&background=random`,
      };
      setUser(userData);
      setAccount(data.account || null);
      setUsage(data.usage || null);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error; // Re-throw so caller can handle it
    }
  };

  // Login function
  const login = async (idToken, firebaseUid) => {
    try {
      // Set logging in flag to prevent token expiration checks
      setIsLoggingIn(true);
      setLoggingIn(true); // Also set in authService
      
      // Store session start time
      localStorage.setItem('session_start_time', getPhilippinesTime().toString());
      localStorage.setItem('firebase_token', idToken);
      
      // Store token expiration
      const exp = getTokenExpiration(idToken);
      localStorage.setItem('token_expiration', exp.toString());
      
      if (firebaseUid) {
        localStorage.setItem('firebase_uid', firebaseUid);
      }
      
      // Set token state
      setToken(idToken);
      
      // Fetch user data (this will set user state)
      const userData = await fetchUserData(idToken);
      setUser(userData);
      
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
        // Check if token exists in localStorage
        const storedToken = localStorage.getItem('firebase_token');
        if (!storedToken) {
          // No token in localStorage, clear everything and redirect to login
          clearSession();
          setLoading(false);
          return;
        }

        // Check if 24-hour session duration exceeded FIRST
        if (isSessionDurationExceeded()) {
          // Session expired - check if token also expired
          if (isTokenExpired()) {
            // Both expired - redirect to login
            clearSession();
            Alert.error('Session Expired', 'Your session has expired. Please login again.', {
              showCancelButton: false,
              showDenyButton: false,
              confirmButtonText: 'OK',
            }).then(() => {
              window.location.href = '/login';
            });
            setLoading(false);
            return;
          }
          // Session expired but token still valid - allow user to continue until token expires
          // Don't redirect yet
        }

        // Check if token is expired (only if session is still valid)
        if (!isSessionDurationExceeded() && isTokenExpired()) {
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.', {
            showCancelButton: false,
            showDenyButton: false,
            confirmButtonText: 'OK',
          }).then(() => {
            window.location.href = '/login';
          });
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
            // Check if token was manually cleared from localStorage
            const storedToken = localStorage.getItem('firebase_token');
            if (!storedToken) {
              // Token was cleared from localStorage, sign out from Firebase
              clearSession();
              await firebaseSignOut(auth);
              setLoading(false);
              return;
            }

            // Check if 24-hour session duration exceeded FIRST
            if (isSessionDurationExceeded()) {
              // Session expired - check if token also expired
              if (isTokenExpired()) {
                // Both expired - redirect to login
                clearSession();
                await firebaseSignOut(auth);
                Alert.error('Session Expired', 'Your session has expired. Please login again.', {
                  showCancelButton: false,
                  showDenyButton: false,
                  confirmButtonText: 'OK',
                }).then(() => {
                  window.location.href = '/login';
                });
                setLoading(false);
                return;
              }
              // Session expired but token still valid - don't refresh token, just continue
              // Don't redirect yet, wait for token to expire
              setLoading(false);
              return;
            }

            // Check if token is expired (only if session is still valid)
            if (isTokenExpired()) {
              clearSession();
              await firebaseSignOut(auth);
              Alert.error('Session Expired', 'Your session has expired. Please login again.',{
                showCancelButton: false,
                showDenyButton: false,
                confirmButtonText: 'OK',
              }).then(() => {
                window.location.href = '/login';
              });
              setLoading(false);
              return;
            }
            
            try {
              // Only refresh token if session is still valid
              // Force refresh token to get a fresh one (even if current is still valid)
              const idToken = await firebaseUser.getIdToken(true);
              setToken(idToken);
              localStorage.setItem('firebase_token', idToken);
              localStorage.setItem('firebase_uid', firebaseUser.uid);
              
              // Update token expiration
              const exp = getTokenExpiration(idToken);
              localStorage.setItem('token_expiration', exp.toString());
              
              // Fetch user data from backend
              await fetchUserData(idToken);
            } catch (error) {
              console.error('Error getting token or fetching user data:', error);
              if (error.message.includes('Invalid token') || error.code === 'auth/user-token-expired') {
                clearSession();
                Alert.error('Session Expired', 'Your session has expired. Please login again.', {
                  showCancelButton: false,
                  showDenyButton: false,
                  confirmButtonText: 'OK',
                }).then(() => {
                  window.location.href = '/login';
                });
              } else {
                setUser(null);
              }
            }
          } else {
            // Firebase user is null, clear session
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

      const storedToken = localStorage.getItem('firebase_token');
      
      // If no token in localStorage, redirect to login
      if (!storedToken) {
        clearSession();
        return;
      }

      // Check if 24-hour session duration exceeded FIRST
      if (isSessionDurationExceeded()) {
        // Session expired - check if token also expired
        if (isTokenExpired()) {
          // Both expired - redirect to login
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.',{
            showCancelButton: false,
            showDenyButton: false,
            confirmButtonText: 'OK',
          }).then(() => {
            window.location.href = '/login';
          });
          return;
        }
        // Session expired but token still valid - allow user to continue until token expires
        // Don't redirect yet
        return;
      }

      // Check if token is expired (only if session is still valid)
      if (isTokenExpired()) {
        clearSession();
        Alert.error('Session Expired', 'Your session has expired. Please login again.',{
          showCancelButton: false,
          showDenyButton: false,
          confirmButtonText: 'OK',
        }).then(() => {
          window.location.href = '/login';
        });
        return;
      }

      if (storedToken && !user) {
        try {
          await fetchUserData(storedToken);
        } catch (error) {
          // Handle invalid token or other errors
          console.error('Error checking existing auth:', error);
          // Don't clear session if it's a network error - might be temporary
          if (error.message.includes('Cannot connect to API')) {
            return;
          }
          // Only clear and show error if it's an authentication error
          if (error.message.includes('Session expired') || 
              error.message.includes('invalid') || 
              error.message.includes('unauthorized')) {
            clearSession();
            Alert.error('Session Invalid', 'Your session is invalid. Please login again.', {
              showCancelButton: false,
              showDenyButton: false,
              confirmButtonText: 'OK',
            }).then(() => {
              window.location.href = '/login';
            });
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

  // Periodic token refresh and session checks
  useEffect(() => {
    if (!user || !token) return;

    const refreshToken = async () => {
      try {
        // Check if 24-hour session duration exceeded FIRST
        if (isSessionDurationExceeded()) {
          // Session expired - stop refreshing token, but don't logout yet
          // Wait for token to expire naturally
          console.log('Session expired - stopping token refresh');
          return;
        }

        // Check if token is expired (only if session is still valid)
        if (isTokenExpired()) {
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.', {
            showCancelButton: false,
            showDenyButton: false,
            confirmButtonText: 'OK',
          }).then(() => {
            window.location.href = '/login';
          });
          await logout();
          return;
        }

        const { auth } = await initializeFirebaseServices();
        if (!auth || !auth.currentUser) return;

        // Refresh Firebase token (force refresh to get new token)
        const newToken = await auth.currentUser.getIdToken(true);
        setToken(newToken);
        localStorage.setItem('firebase_token', newToken);
        
        // Update token expiration
        const exp = getTokenExpiration(newToken);
        localStorage.setItem('token_expiration', exp.toString());
        
        // Token refreshed successfully
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Error refreshing token:', error);
        // Only logout if session is expired AND token is expired
        if (isSessionDurationExceeded() && isTokenExpired()) {
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.', {
            showCancelButton: false,
            showDenyButton: false,
            confirmButtonText: 'OK',
          }).then(() => {
            window.location.href = '/login';
          });
          await logout();
        }
      }
    };

    // Refresh token every 50 minutes (before 1-hour expiration)
    // Only refresh if session is still valid
    const refreshInterval = setInterval(() => {
      if (!isSessionDurationExceeded()) {
        refreshToken();
      }
    }, TOKEN_REFRESH_INTERVAL);

    // Check session and token expiration every 5 minutes
    const sessionCheckInterval = setInterval(() => {
      // If session expired, check if token also expired
      if (isSessionDurationExceeded()) {
        if (isTokenExpired()) {
          // Both expired - logout now
          clearInterval(refreshInterval);
          clearInterval(sessionCheckInterval);
          clearSession();
          Alert.error('Session Expired', 'Your session has expired. Please login again.',{
            showCancelButton: false,
            showDenyButton: false,
            confirmButtonText: 'OK',
          }).then(() => {
            window.location.href = '/login';
          });
          logout();
        }
        // If session expired but token not expired yet, just stop refreshing
        // (already handled by refreshInterval check above)
      } else if (isTokenExpired()) {
        // Session valid but token expired - should not happen if refresh works
        clearInterval(refreshInterval);
        clearInterval(sessionCheckInterval);
        clearSession();
        Alert.error('Session Expired', 'Your session has expired. Please login again.',{
          showCancelButton: false,
          showDenyButton: false,
          confirmButtonText: 'OK',
        }).then(() => {
          window.location.href = '/login';
        });
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
  const isPlatformAdmin = !!user?.isPlatformAdmin;
  const isAuthenticated = !!user && !!token && !isTokenExpired() && !isSessionDurationExceeded();
  const isTrialExpired = account?.subscriptionStatus === 'trial_expired';

  return (
    <AuthContext.Provider value={{
      user,
      account,
      usage,
      token,
      loading,
      login,
      logout,
      isAdmin,
      isTrainer,
      isStaff,
      isPlatformAdmin,
      isAuthenticated,
      isTrialExpired,
      fetchUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
