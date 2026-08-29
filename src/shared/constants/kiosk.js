export const KIOSK_LOCK_KEY = 'kiosk_locked';
export const KIOSK_LOCKED_BY_KEY = 'kiosk_locked_by';
export const KIOSK_LOCKED_PATH_KEY = 'kiosk_locked_path';

export const KIOSK_QR_SCANNER_PATH = '/kiosk/qr-scanner';
export const KIOSK_REGISTRATION_PATH = '/kiosk/registration';

/** Every route that can run as an unattended kiosk. */
export const KIOSK_PATHS = [KIOSK_QR_SCANNER_PATH, KIOSK_REGISTRATION_PATH];

/**
 * Whether the kiosk lock is currently engaged on this device.
 *
 * @returns {boolean}
 */
export const isKioskLocked = () => {
  return localStorage.getItem(KIOSK_LOCK_KEY) === '1';
};

/**
 * The single kiosk screen the lock pins this device to.
 *
 * The lock is per-kiosk, not per-device: locking the QR scanner must not leave
 * the registration form reachable, and vice versa — otherwise anyone could hop
 * between them on an unattended tablet. Falls back to the scanner for locks
 * written before this key existed.
 *
 * @returns {string}
 */
export const getKioskLockedPath = () => {
  const path = localStorage.getItem(KIOSK_LOCKED_PATH_KEY);
  return KIOSK_PATHS.includes(path) ? path : KIOSK_QR_SCANNER_PATH;
};

/**
 * The user who engaged the lock, used to verify the unlock password.
 *
 * @returns {{ id: number, email: string, fullname: string }|null}
 */
export const getKioskLockedBy = () => {
  const lockedBy = localStorage.getItem(KIOSK_LOCKED_BY_KEY);
  return lockedBy ? JSON.parse(lockedBy) : null;
};

/**
 * Engage or release the kiosk lock, recording who engaged it and which kiosk
 * screen the device is pinned to.
 *
 * @param {boolean} value
 * @param {Object|null} [user] The locking user; required when engaging the lock.
 * @param {string|null} [path] The kiosk route to pin to; required when engaging.
 * @returns {void}
 */
export const setKioskLocked = (value, user = null, path = null) => {
  localStorage.setItem(KIOSK_LOCK_KEY, value ? '1' : '0');

  if (value && user) {
    localStorage.setItem(KIOSK_LOCKED_BY_KEY, JSON.stringify({
      id: user.id,
      email: user.email,
      fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
    }));
    localStorage.setItem(KIOSK_LOCKED_PATH_KEY, KIOSK_PATHS.includes(path) ? path : KIOSK_QR_SCANNER_PATH);
  } else {
    localStorage.removeItem(KIOSK_LOCKED_BY_KEY);
    localStorage.removeItem(KIOSK_LOCKED_PATH_KEY);
  }
};
