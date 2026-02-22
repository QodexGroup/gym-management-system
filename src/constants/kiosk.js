export const KIOSK_LOCK_KEY = 'kiosk_locked';
export const KIOSK_LOCKED_BY_KEY = 'kiosk_locked_by';

export const isKioskLocked = () => {
  return localStorage.getItem(KIOSK_LOCK_KEY) === '1';
};

export const getKioskLockedBy = () => {
  const lockedBy = localStorage.getItem(KIOSK_LOCKED_BY_KEY);
  return lockedBy ? JSON.parse(lockedBy) : null;
};

export const setKioskLocked = (value, user = null) => {
  localStorage.setItem(KIOSK_LOCK_KEY, value ? '1' : '0');
  if (value && user) {
    localStorage.setItem(KIOSK_LOCKED_BY_KEY, JSON.stringify({
      id: user.id,
      email: user.email,
      fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
    }));
  } else {
    localStorage.removeItem(KIOSK_LOCKED_BY_KEY);
  }
};
