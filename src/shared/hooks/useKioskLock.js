import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initializeFirebaseServices } from '../services/firebaseService';
import { Toast } from '../utils/alert';
import { getKioskLockedPath, isKioskLocked, setKioskLocked } from '../constants/kiosk';

/**
 * Lock/unlock behaviour shared by every kiosk screen.
 *
 * Both the QR scanner and the registration kiosk need the same thing: pin an
 * unattended tablet to this one screen, and require the locking user's password
 * to leave. Keeping it here means the two pages cannot drift apart — and any
 * future kiosk screen gets the behaviour for free.
 *
 * @param {string} kioskPath The route this kiosk locks the device to.
 * @returns {{
 *   isLocked: boolean,
 *   canLock: boolean,
 *   showUnlockModal: boolean,
 *   unlocking: boolean,
 *   firebaseAuth: Object|null,
 *   lock: () => void,
 *   requestUnlock: () => void,
 *   cancelUnlock: () => void,
 *   completeUnlock: () => Promise<void>
 * }}
 */
export const useKioskLock = (kioskPath) => {
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, isTrainer } = useAuth();

  const [isLocked, setIsLocked] = useState(() => isKioskLocked() && getKioskLockedPath() === kioskPath);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [firebaseAuth, setFirebaseAuth] = useState(null);

  const canLock = isAdmin || isStaff || isTrainer;

  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      const { auth } = await initializeFirebaseServices();
      if (!cancelled) setFirebaseAuth(auth || null);
    };
    initAuth();
    return () => { cancelled = true; };
  }, []);

  // Keep multiple tabs on the same device in step.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'kiosk_locked' || event.key === 'kiosk_locked_path') {
        setIsLocked(isKioskLocked() && getKioskLockedPath() === kioskPath);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [kioskPath]);

  /**
   * Pin the device to this kiosk screen.
   *
   * @returns {void}
   */
  const lock = useCallback(() => {
    if (!canLock || !user) return;
    setKioskLocked(true, user, kioskPath);
    setIsLocked(true);
    Toast.info('Kiosk locked. Unlock required to exit.');
  }, [canLock, user, kioskPath]);

  /**
   * Open the password prompt.
   *
   * @returns {void}
   */
  const requestUnlock = useCallback(() => {
    if (!canLock) return;
    setShowUnlockModal(true);
  }, [canLock]);

  /**
   * Dismiss the password prompt.
   *
   * @returns {void}
   */
  const cancelUnlock = useCallback(() => setShowUnlockModal(false), []);

  /**
   * Release the lock after a verified password and return to the dashboard.
   *
   * @returns {Promise<void>}
   */
  const completeUnlock = useCallback(async () => {
    setUnlocking(true);
    try {
      setKioskLocked(false);
      setIsLocked(false);
      setShowUnlockModal(false);
      Toast.success('Kiosk unlocked.');
      navigate('/dashboard');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Unlock error:', error);
      Toast.error(error.message || 'Unlock failed. Please try again.');
    } finally {
      setUnlocking(false);
    }
  }, [navigate]);

  return {
    isLocked,
    canLock,
    showUnlockModal,
    unlocking,
    firebaseAuth,
    lock,
    requestUnlock,
    cancelUnlock,
    completeUnlock,
  };
};
