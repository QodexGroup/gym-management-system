import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { authService } from '../services/authService';
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

  // Session duration: 24 hours in milliseconds
  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Check if session has expired
  const isSessionExpired = () => {
    const loginTime = localStorage.getItem('login_timestamp');
    if (!loginTime) {
      return true;
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
          avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstname + ' ' + data.lastname)}&background=random`,
        };
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Login function
  const login = async (idToken, firebaseUid) => {
    setToken(idToken);
    localStorage.setItem('firebase_token', idToken);
    // Store login timestamp for 24-hour expiration
    localStorage.setItem('login_timestamp', Date.now().toString());
    if (firebaseUid) {
      localStorage.setItem('firebase_uid', firebaseUid);
    }
    
    const userData = await fetchUserData(idToken);
    return userData;
  };

  // Logout function
  const logout = async () => {
    try {
      const { auth } = await initializeFirebaseServices();
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Firebase sign out error:', error);
    }
    
    clearSession();
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if session has expired first
        if (isSessionExpired()) {
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
          // Check session expiration again
          if (isSessionExpired()) {
            clearSession();
            await firebaseSignOut(auth);
            setLoading(false);
            return;
          }

          if (firebaseUser) {
            try {
              const idToken = await firebaseUser.getIdToken();
              setToken(idToken);
              localStorage.setItem('firebase_token', idToken);
              localStorage.setItem('firebase_uid', firebaseUser.uid);
              
              // Fetch user data from backend
              await fetchUserData(idToken);
            } catch (error) {
              console.error('Error getting token:', error);
              setUser(null);
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

  // Check for existing token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Check session expiration first
      if (isSessionExpired()) {
        clearSession();
        Toast.error('Your session has expired. Please login again.');
        return;
      }

      const storedToken = localStorage.getItem('firebase_token');
      if (storedToken && !user) {
        const userData = await fetchUserData(storedToken);
        if (!userData) {
          // Token might be invalid, clear it
          clearSession();
        }
      }
    };

    if (token && !user) {
      checkExistingAuth();
    }
  }, [token, user]);

  // Periodic session expiration check (every 5 minutes)
  useEffect(() => {
    if (!user || !token) return;

    const checkInterval = setInterval(() => {
      if (isSessionExpired()) {
        clearInterval(checkInterval);
        logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [user, token]);

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
