import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Lock, QrCode, ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initializeFirebaseServices } from '../../services/firebaseService';
import { walkinService } from '../../services/walkinService';
import { Toast } from '../../utils/alert';
import { isAdminRole, isCoachRole, isStaffRole } from '../../constants/userRoles';
import { isKioskLocked, setKioskLocked } from '../../constants/kiosk';
import { WALKIN_CUSTOMER_STATUS } from '../../constants/walkinConstant';
import UnlockKioskForm from './forms/UnlockKioskForm';

const QrScannerKiosk = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, isTrainer } = useAuth();
  const canLock = isAdmin || isStaff || isTrainer;
  const [isLocked, setIsLocked] = useState(() => isKioskLocked());
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [firebaseAuth, setFirebaseAuth] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const lastScanRef = useRef({ value: '', at: 0 });

  useEffect(() => {
    const initAuth = async () => {
      const { auth } = await initializeFirebaseServices();
      setFirebaseAuth(auth || null);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'kiosk_locked') {
        setIsLocked(isKioskLocked());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleScan = useCallback(async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    if (processing) return; // Prevent multiple simultaneous scans

    const code = detectedCodes[0];
    const value = code?.rawValue || '';
    if (!value) return;

    const now = Date.now();
    if (lastScanRef.current.value === value && now - lastScanRef.current.at < 2000) {
      return; // Prevent duplicate scans
    }

    lastScanRef.current = { value, at: now };
    setLastScan({
      value,
      format: code.format || 'unknown',
      at: new Date(),
    });

    setIsPaused(true);
    setProcessing(true);
    setLastResult(null);

    try {
      // Try to check in first
      try {
        const result = await walkinService.qrCheckIn(value);
        const customerName = result.customer 
          ? `${result.customer.firstName || ''} ${result.customer.lastName || ''}`.trim()
          : 'Customer';
        setLastResult({
          type: 'checkin',
          success: true,
          customer: result.customer,
          message: `${customerName} checked in successfully`,
        });
        Toast.success(`${customerName} checked in successfully`);
      } catch (checkInError) {
        // If already checked in, try to check out
        if (checkInError.message.includes('already checked in')) {
          try {
            const result = await walkinService.qrCheckOut(value);
            const customerName = result.customer 
              ? `${result.customer.firstName || ''} ${result.customer.lastName || ''}`.trim()
              : 'Customer';
            setLastResult({
              type: 'checkout',
              success: true,
              customer: result.customer,
              message: `${customerName} checked out successfully`,
            });
            Toast.success(`${customerName} checked out successfully`);
          } catch (checkOutError) {
            setLastResult({
              type: 'error',
              success: false,
              message: checkOutError.message || 'Failed to process check-out',
            });
            Toast.error(checkOutError.message || 'Failed to process check-out');
          }
        } else {
          setLastResult({
            type: 'error',
            success: false,
            message: checkInError.message || 'Failed to process check-in',
          });
          Toast.error(checkInError.message || 'Failed to process check-in');
        }
      }
    } catch (error) {
      setLastResult({
        type: 'error',
        success: false,
        message: error.message || 'An error occurred',
      });
      Toast.error(error.message || 'An error occurred');
    } finally {
      setProcessing(false);
      setTimeout(() => setIsPaused(false), 1500);
    }
  }, [processing]);

  const handleError = useCallback((error) => {
    // Keep console error for troubleshooting camera access or permissions.
    console.error('QR scanner error:', error);
  }, []);

  const handleLock = () => {
    if (!canLock || !user) return;
    setKioskLocked(true, user);
    setIsLocked(true);
    Toast.info('Kiosk locked. Unlock required to exit.');
  };

  const handleUnlock = () => {
    if (!canLock) return;
    setShowUnlockModal(true);
  };

  const handleUnlockSuccess = async () => {
    setUnlocking(true);

    try {
      // After successful password verification, unlock the kiosk
      setKioskLocked(false);
      setIsLocked(false);
      setShowUnlockModal(false);
      Toast.success('Kiosk unlocked.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Unlock error:', error);
      Toast.error(error.message || 'Unlock failed. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 flex flex-col">
      <div className="px-6 py-6 border-b border-dark-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-dark-800 border border-dark-700">
              <QrCode className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">QR Scanner Kiosk</h1>
              <p className="text-sm text-dark-400">Members can scan their QR card to check in.</p>
            </div>
          </div>
          {isLocked && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-xs text-dark-200">
              <ShieldCheck className="w-4 h-4 text-primary-400" />
              Kiosk Locked
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4 sm:p-6">
          <div className="relative w-full aspect-video bg-dark-800 rounded-2xl overflow-hidden border border-dark-700">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              scanDelay={800}
              paused={isPaused || showUnlockModal}
              constraints={{ facingMode: 'environment' }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
            />
            <div className="absolute inset-0 border-2 border-primary-400/70 rounded-2xl pointer-events-none" />
          </div>
            <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-dark-400">
              Camera access requires HTTPS or localhost.
            </div>
            <div className="text-sm text-dark-300">
              {processing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Scan ready'
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-dark-50">Last Scan</h2>
            <div className="mt-3 rounded-xl border border-dark-700 bg-dark-800 p-4">
              {lastScan ? (
                <div className="space-y-2">
                  <div className="text-sm text-dark-400">Code</div>
                  <div className="text-base text-dark-50 break-all font-mono text-xs">{lastScan.value}</div>
                  <div className="flex items-center justify-between text-xs text-dark-400">
                    <span className="uppercase">{lastScan.format}</span>
                    <span>{lastScan.at.toLocaleTimeString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-dark-400">No scans yet.</div>
              )}
            </div>
          </div>

          {lastResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-dark-50">Result</h2>
              <div className={`mt-3 rounded-xl border p-4 ${
                lastResult.success
                  ? 'border-success-500/50 bg-success-500/10'
                  : 'border-danger-500/50 bg-danger-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  {lastResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-danger-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    {lastResult.customer && (
                      <div className="text-base font-semibold text-dark-50 mb-1">
                        {lastResult.customer.firstName} {lastResult.customer.lastName}
                      </div>
                    )}
                    <div className={`text-sm ${
                      lastResult.success ? 'text-success-400' : 'text-danger-400'
                    }`}>
                      {lastResult.message}
                    </div>
                    {lastResult.type === 'checkin' && lastResult.success && (
                      <div className="mt-2 text-xs text-dark-400">
                        Check-in time: {new Date().toLocaleTimeString()}
                      </div>
                    )}
                    {lastResult.type === 'checkout' && lastResult.success && (
                      <div className="mt-2 text-xs text-dark-400">
                        Check-out time: {new Date().toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-dark-50">How It Works</h2>
            <ul className="mt-3 text-sm text-dark-300 space-y-2">
              <li>Hold the member QR card within the frame.</li>
              <li>Keep the code steady until it scans.</li>
              <li>First scan checks in, second scan checks out.</li>
              <li>Repeat for each member.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={isLocked ? handleUnlock : handleLock}
          disabled={!isLocked && !canLock}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
            isLocked || canLock
              ? isLocked
                ? 'bg-success-500 text-white hover:bg-success-600'
                : 'bg-danger-500 text-white hover:bg-danger-600'
              : 'bg-dark-800 text-dark-500 cursor-not-allowed'
          }`}
        >
          <Lock className="w-5 h-5" />
          {isLocked ? 'Unlock Kiosk' : 'Lock Kiosk'}
        </button>
        {!canLock && !isLocked && (
          <p className="mt-2 text-center text-xs text-dark-500">
            Staff, coach, or admin access required to lock this kiosk.
          </p>
        )}
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-dark-700 bg-dark-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-dark-50">Unlock Kiosk</h2>
                <p className="text-sm text-dark-400">Enter the password of the user who locked the kiosk.</p>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="text-sm text-dark-400 hover:text-dark-200"
                type="button"
                disabled={unlocking}
              >
                Close
              </button>
            </div>

            <UnlockKioskForm
              firebaseAuth={firebaseAuth}
              onSuccess={handleUnlockSuccess}
              onCancel={() => setShowUnlockModal(false)}
              isUnlocking={unlocking}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QrScannerKiosk;
