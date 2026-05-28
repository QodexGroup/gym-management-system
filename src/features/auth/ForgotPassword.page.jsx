import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../shared/services/authService';
import { useAuth } from '../../shared/context/AuthContext';
import { Toast } from '../../shared/utils/alert';
import { isValidEmail, normalizeEmail } from '../../shared/utils/validators/email';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalized = normalizeEmail(email);
    if (!normalized) {
      Toast.error('Please enter your email address.');
      return;
    }
    if (!isValidEmail(normalized)) {
      Toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const json = await authService.forgotPassword(normalized);
      setSuccessMessage(
        json.message ||
          'If an account exists for this email, you will receive password reset instructions.'
      );
      setSubmitted(true);
    } catch (err) {
      Toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-mode="dark" className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 p-8">
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
          <h1 className="text-3xl font-bold text-dark-50 mb-2">Forgot Password</h1>
          <p className="text-dark-300">Enter your email and we&apos;ll send reset instructions.</p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <p className="text-dark-300 text-sm text-center">{successMessage} Check your inbox and spam folder.</p>
            <Link
              to="/login"
              className="block w-full text-center bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
            >
              Back to Login
            </Link>
          </div>
        ) : (
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
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>

            <p className="text-center text-sm text-dark-400">
              <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
