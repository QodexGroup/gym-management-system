import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock } from 'lucide-react';
import { getKioskLockedBy } from '../../../constants/kiosk';

const UnlockKioskForm = ({ firebaseAuth, onSuccess, onCancel, isUnlocking }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const lockedBy = getKioskLockedBy();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    if (!firebaseAuth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (!lockedBy || !lockedBy.email) {
      setError('Unable to determine who locked the kiosk.');
      return;
    }

    try {
      await signInWithEmailAndPassword(firebaseAuth, lockedBy.email, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Unlock error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('User account not found.');
      } else {
        setError(error.message || 'Unlock failed. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {lockedBy && (
        <div className="mb-4 p-3 rounded-lg bg-dark-800 border border-dark-700">
          <p className="text-xs text-dark-400 mb-1">Locked by</p>
          <p className="text-sm font-medium text-dark-200">{lockedBy.fullname || lockedBy.email}</p>
        </div>
      )}

      <div>
        <label htmlFor="unlock-password" className="block text-sm text-dark-300 mb-2">
          Password
        </label>
        <input
          id="unlock-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-dark-50 focus:border-primary-500 focus:outline-none"
          placeholder="Enter password"
          disabled={isUnlocking}
          required
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-danger-400">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-dark-700 text-dark-300 hover:text-dark-100"
            disabled={isUnlocking}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isUnlocking || !password}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 flex items-center gap-2"
        >
          <Lock className="w-4 h-4" />
          {isUnlocking ? 'Unlocking...' : 'Unlock'}
        </button>
      </div>
    </form>
  );
};

export default UnlockKioskForm;
