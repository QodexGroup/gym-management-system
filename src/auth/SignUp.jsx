import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../utils/alert';

const SignUp = () => {
  const [formData, setFormData] = useState({
    accountName: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const { login, isAuthenticated, authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { auth } = await initializeFirebaseServices();
        if (auth) setFirebaseAuth(auth);
        else Toast.error('Failed to initialize Firebase.');
      } catch (error) {
        console.error('Firebase init error:', error);
        Toast.error('Failed to initialize Firebase authentication.');
      }
    };
    initAuth();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseAuth) {
      Toast.error('Firebase is not ready. Please try again.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Toast.error('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      Toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        formData.email,
        formData.password
      );

      await sendEmailVerification(userCredential.user);

      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('firebase_token', idToken);
      localStorage.setItem('firebase_uid', userCredential.user.uid);

      await authService.signUp(idToken, {
        accountName: formData.accountName,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phone || null,
      });

      await login(idToken, userCredential.user.uid);
      Toast.success('Account created! Check your email to verify your address. Your 7-day free trial has started.');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Sign-up error:', error);
      let msg = 'Sign-up failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (error.code === 'auth/weak-password') msg = 'Password is too weak.';
      else if (error.message) msg = error.message;
      Toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
        <div className="flex justify-center mb-6">
          <img src="/img/kaizen-logo2.png" alt="Kaizen" className="w-40 h-20 object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Create Your Gym Account</h1>
        <p className="text-gray-300 text-sm mb-6 text-center">Start your 7-day free trial</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Gym / Organization Name</label>
            <input
              name="accountName"
              type="text"
              required
              value={formData.accountName}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. FitPro Gym"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
              <input
                name="firstname"
                type="text"
                required
                value={formData.firstname}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
              <input
                name="lastname"
                type="text"
                required
                value={formData.lastname}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Phone (optional)</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Password (min 6 chars)</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !firebaseAuth}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
