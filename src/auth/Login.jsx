import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../utils/alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const { login, isAuthenticated, user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  useEffect(() => {
    const storedToken = localStorage.getItem('firebase_token');
    const hasToken = token || storedToken;
    const hasUser = user;
    
    if (!authLoading && hasUser && hasToken) {
      // We have user and token, so we should be authenticated
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, token, authLoading, navigate]);

  useEffect(() => {
    // Initialize Firebase Auth
    const initAuth = async () => {
      try {
        const { auth } = await initializeFirebaseServices();
        if (auth) {
          setFirebaseAuth(auth);
        } else {
          Toast.error('Failed to initialize Firebase. Please check your configuration.');
        }
      } catch (error) {
        console.error('Firebase initialization error:', error);
        Toast.error('Failed to initialize Firebase authentication.');
      }
    };

    initAuth();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firebaseAuth) {
      Toast.error('Firebase authentication is not initialized. Please try again.');
      return;
    }

    if (!email || !password) {
      Toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;

      // Get the ID token
      const idToken = await user.getIdToken();

      // Store token in localStorage
      localStorage.setItem('firebase_token', idToken);
      localStorage.setItem('firebase_uid', user.uid);

      // Call login function from AuthContext which will fetch user data from backend
      const userData = await login(idToken, user.uid);
      
      if (!userData) {
        throw new Error('Failed to fetch user data from server');
      }

      Toast.success('Login successful!');
      
      // Wait for React to process state updates
      // Poll for isAuthenticated to become true (max 2 seconds)
      // Check localStorage directly since state updates are asynchronous
      let attempts = 0;
      const maxAttempts = 20;
      
      const waitForAuth = () => {
        return new Promise((resolve) => {
          const checkAuth = () => {
            attempts++;
            // Check localStorage directly for token since state might not be updated yet
            const storedToken = localStorage.getItem('firebase_token');
            const storedLoginTime = localStorage.getItem('login_timestamp');
            const hasToken = !!storedToken;
            const hasUser = !!user || !!userData;
            const hasLoginTime = !!storedLoginTime;
            
            // Check if we have all required data
            const currentAuth = isAuthenticated || (hasUser && hasToken && hasLoginTime);
            
            if (currentAuth || attempts >= maxAttempts) {
              resolve(currentAuth);
            } else {
              setTimeout(checkAuth, 100);
            }
          };
          checkAuth();
        });
      };
      
      await waitForAuth();
      
      navigate('/dashboard', { replace: true });
      
      // Final fallback: if still on login page after 2 seconds, force redirect
      setTimeout(() => {
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          window.location.href = '/dashboard';
        }
      }, 2000);
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      Toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-24 flex items-center justify-center">
            <img
              src="/img/kaizen-logo2.png"
              alt="Kaizen Gym Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-white placeholder-gray-400"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-white placeholder-gray-400"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !firebaseAuth}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Don't have an account? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

