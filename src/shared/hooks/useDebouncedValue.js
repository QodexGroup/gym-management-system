import { useEffect, useState } from 'react';

/**
 * Debounce a rapidly changing value (typically a search box) so it can be used
 * as a query key without firing a request on every keystroke.
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {*} The value, updated only after it has been stable for `delay` ms
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebouncedValue;
