import { useEffect, useRef } from 'react';

/** User interactions that count as activity for the purposes of the idle timer. */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'pointerdown', 'wheel'];

/**
 * Run a callback after a period of no user interaction.
 *
 * Built for shared kiosk screens, where an abandoned form must clear itself
 * before the next person walks up. The timer restarts on any activity and is
 * fully torn down when `enabled` is false.
 *
 * @param {() => void} onIdle Called once when the idle threshold is reached.
 * @param {number} timeoutMs Milliseconds of inactivity before firing.
 * @param {boolean} [enabled] When false, no listeners are attached and no timer runs.
 * @returns {void}
 */
export const useIdleTimer = (onIdle, timeoutMs, enabled = true) => {
  const onIdleRef = useRef(onIdle);

  // Keep the latest callback without restarting the timer on every render.
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) return undefined;

    let timeoutId = null;

    const restart = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => onIdleRef.current?.(), timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, restart, { passive: true });
    });
    restart();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, restart);
      });
    };
  }, [timeoutMs, enabled]);
};
