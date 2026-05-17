import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';
import { initializeFirebaseServices } from '../../shared/services/firebaseService';
import { useAuth } from '../../shared/context/AuthContext';
import { Toast } from '../../shared/utils/alert';

const MIN_PASSWORD_LENGTH = 6;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const [codeError, setCodeError] = useState(false);
  const [authInitState, setAuthInitState] = useState('idle');

  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!oobCode) return;

    let cancelled = false;
    setAuthInitState('loading');

    const init = async () => {
      try {
        const { auth } = await initializeFirebaseServices();
        if (cancelled) return;
        if (auth) {
          setFirebaseAuth(auth);
          setAuthInitState('ready');
        } else {
          Toast.error('Failed to initialize Firebase.');
          setAuthInitState('failed');
        }
      } catch {
        if (!cancelled) {
          Toast.error('Failed to initialize Firebase authentication.');
          setAuthInitState('failed');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseAuth || !oobCode) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      Toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      Toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, password);
      Toast.success('Your password has been reset. You can sign in.');
      navigate('/login', { replace: true });
    } catch (error) {
      const code = error?.code || '';
      if (
        code === 'auth/invalid-action-code' ||
        code === 'auth/expired-action-code' ||
        code === 'auth/invalid-auth-event'
      ) {
        Toast.error('This link has expired or was already used. Please request a new reset link.');
        setCodeError(true);
      } else if (code === 'auth/weak-password') {
        Toast.error('Password is too weak. Try a stronger password.');
      } else {
        Toast.error('Could not reset your password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode || codeError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 text-center">
          <div className="flex justify-center mb-6">
            <img src="/img/gymhubph.png" alt="GymHubPH" className="w-40 h-20 object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link invalid</h1>
          <p className="text-gray-300 text-sm mb-6">
            This reset link may be missing, expired, or already used. You can request a new password reset email.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Request a new link
          </Link>
          <Link
            to="/login"
            className="block mt-4 text-sm text-blue-500 hover:text-blue-400 font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
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
          <h1 className="text-3xl font-bold text-white mb-2">Set a new password</h1>
          <p className="text-gray-300">Choose a strong password for your account.</p>
        </div>

        {authInitState === 'loading' && (
          <p className="text-gray-400 text-sm text-center mb-4">Initializing…</p>
        )}

        {authInitState === 'failed' && (
          <div className="mb-6 rounded-lg bg-red-900/40 border border-red-600 text-red-100 px-4 py-3 text-sm text-left space-y-3">
            <p>Firebase did not load. You can reload the page or try again later.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full bg-red-700/80 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition"
            >
              Reload page
            </button>
            <Link to="/forgot-password" className="block text-center text-blue-400 hover:text-blue-300 text-sm font-medium">
              Request a new reset link
            </Link>
          </div>
        )}

        {authInitState !== 'failed' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-200 mb-2">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-white placeholder-gray-400"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                required
                minLength={MIN_PASSWORD_LENGTH}
                disabled={loading || authInitState !== 'ready'}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-200 mb-2">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-white placeholder-gray-400"
                placeholder="Confirm new password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                disabled={loading || authInitState !== 'ready'}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || authInitState !== 'ready'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Updating...' : 'Reset password'}
            </button>

            <p className="text-center text-sm text-gray-400">
              <Link to="/forgot-password" className="text-blue-500 hover:text-blue-400 font-medium">
                Request a new reset link
              </Link>
              {' · '}
              <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
