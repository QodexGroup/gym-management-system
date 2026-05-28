import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseServices } from '../../shared/services/firebaseService';
import { useAuth } from '../../shared/context/AuthContext';
import { setLoggingIn } from '../../shared/services/authService';
import { Toast } from '../../shared/utils/alert';
import { ACCOUNT_STATE } from '../../shared/constants/accountState';
import { isValidEmail, normalizeEmail } from '../../shared/utils/validators/email';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deactivatedMessage, setDeactivatedMessage] = useState('');
  const [trialExpiredMessage, setTrialExpiredMessage] = useState('');
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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
        if (import.meta.env.DEV) console.error('Firebase initialization error:', error);
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

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      Toast.error('Please enter both email and password.');
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      Toast.error('Please enter a valid email address.');
      return;
    }

    setLoggingIn(true);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      const firebaseUser = userCredential.user;

      const pwUpdatedAt = firebaseUser.reloadUserInfo?.passwordUpdatedAt;
      if (pwUpdatedAt) {
        localStorage.setItem('password_updated_at', String(pwUpdatedAt));
      }

      const idToken = await firebaseUser.getIdToken();

      const userData = await login(idToken, firebaseUser.uid);

      if (!userData) {
        throw new Error('Failed to fetch user data from server');
      }

      // Block non-owners on deactivated accounts
      if (userData.account?.status === ACCOUNT_STATE.DEACTIVATED && !userData.isAccountOwner) {
        localStorage.removeItem('firebase_token');
        localStorage.removeItem('firebase_uid');
        setDeactivatedMessage('Your account is deactivated. Please contact GymHubPH Tech Support to reactivate your account.');
        return;
      }

      // Block non-owners when trial has expired
      const activePlan = userData.account?.activeAccountSubscriptionPlan;
      const trialEndsAt = activePlan?.trialEndsAt ? new Date(activePlan.trialEndsAt) : null;
      const subscriptionStartsAt = activePlan?.subscriptionStartsAt ? new Date(activePlan.subscriptionStartsAt) : null;
      const isTrialExpired = trialEndsAt && trialEndsAt < new Date() && !subscriptionStartsAt;

      if (isTrialExpired && !userData.isAccountOwner) {
        localStorage.removeItem('firebase_token');
        localStorage.removeItem('firebase_uid');
        setTrialExpiredMessage('Your trial period has ended. Please contact the account owner to subscribe to a plan to continue using the app.');
        return;
      }

      Toast.success('Login successful!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Login error:', error);

      let errorMessage = 'Login failed. Please try again.';

      if (error?.message?.toLowerCase().includes('deactivated')) {
        setDeactivatedMessage(error.message);
        setTrialExpiredMessage('');
        setLoading(false);
        return;
      }

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please try again.';
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
          errorMessage = 'Login failed. Please try again.';
      }

      Toast.error(errorMessage);
      setLoggingIn(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-mode="dark" className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-24 flex items-center justify-center">
            <img
              src="/img/gymhubph.png"
              alt="GymHubPH Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-50 mb-2">Welcome Back</h1>
          <p className="text-dark-300">Sign in to your account to continue</p>
        </div>

        {deactivatedMessage && (
          <div className="mb-4 rounded-lg bg-danger-500/10 border border-danger-500/40 text-danger-500 px-4 py-3 text-sm text-left">
            {deactivatedMessage}
          </div>
        )}

        {trialExpiredMessage && (
          <div className="mb-4 rounded-lg bg-warning-500/10 border border-warning-500/40 text-warning-600 px-4 py-3 text-sm text-left">
            {trialExpiredMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-dark-50 placeholder-dark-400"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-dark-200">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-500 hover:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition text-dark-50 placeholder-dark-400"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !firebaseAuth}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
      </div>
    </div>
  );
};

export default Login;
