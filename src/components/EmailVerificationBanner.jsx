import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initializeFirebaseServices } from '../services/firebaseService';
import { sendEmailVerification } from 'firebase/auth';
import { Toast } from '../utils/alert';
import { Mail, X } from 'lucide-react';

const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      const { auth } = await initializeFirebaseServices();
      if (auth?.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Toast.success('Verification email sent. Check your inbox.');
      } else {
        Toast.error('Please sign in again to resend.');
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to send verification email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-warning-500/15 border-b border-warning-500/30 px-4 py-2 flex items-center justify-between gap-4 text-dark-100">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-warning-500 flex-shrink-0" />
        <span className="text-sm">Please verify your email address.</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="text-sm font-medium text-warning-600 hover:text-warning-500 underline disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Resend email'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-dark-700/50 text-dark-400"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EmailVerificationBanner;
