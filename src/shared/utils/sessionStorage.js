import { getPhilippinesTime } from './philippinesTime';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ─── Token helpers ──────────────────────────────────────────────────────────

export const getStoredToken = () => localStorage.getItem('firebase_token');

export const setStoredToken = (token) => {
  localStorage.setItem('firebase_token', token);
  const exp = getTokenExpiration(token);
  localStorage.setItem('token_expiration', exp.toString());
};

export const getTokenExpiration = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.exp * 1000;
};

export const isTokenExpired = () => {
  const expiration = localStorage.getItem('token_expiration');
  if (!expiration) return true;
  return getPhilippinesTime() >= parseInt(expiration, 10);
};

// ─── Session helpers ─────────────────────────────────────────────────────────

export const initSessionStart = () => {
  if (!localStorage.getItem('session_start_time')) {
    localStorage.setItem('session_start_time', getPhilippinesTime().toString());
  }
};

export const setSessionStart = () => {
  localStorage.setItem('session_start_time', getPhilippinesTime().toString());
};

export const isSessionDurationExceeded = () => {
  const start = localStorage.getItem('session_start_time');
  if (!start) return false;
  return getPhilippinesTime() - parseInt(start, 10) >= SESSION_DURATION;
};

// ─── Clear ───────────────────────────────────────────────────────────────────

export const clearSessionStorage = () => {
  localStorage.removeItem('firebase_token');
  localStorage.removeItem('firebase_uid');
  localStorage.removeItem('token_expiration');
  localStorage.removeItem('session_start_time');
  localStorage.removeItem('password_updated_at');
};
