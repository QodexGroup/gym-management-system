import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { initializeFirebaseServices } from '../services/firebaseService';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [countdown, setCountdown] = useState(5);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const handleAction = async () => {
      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        return;
      }

      try {
        const { auth } = await initializeFirebaseServices();
        if (!auth) {
          setStatus('error');
          return;
        }
        await applyActionCode(auth, oobCode);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    handleAction();
  }, [mode, oobCode]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 text-center">
        <div className="flex justify-center mb-6">
          <img src="/img/gymhubph.png" alt="GymHubPH" className="w-40 h-20 object-cover" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-300 text-sm mb-6">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
            <p className="text-gray-500 text-xs mt-4">
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-300 text-sm mb-6">
              This link may have expired or already been used. Please request a new verification email.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthAction;
