/**
 * Philippines Time Utility Functions
 * Philippines is UTC+8 (PHT - Philippine Standard Time)
 */

/**
 * Get current time in Philippines timezone (UTC+8)
 * @returns {number} Current time in milliseconds (Philippines time)
 */
export const getPhilippinesTime = () => {
  const now = new Date();
  // Philippines is UTC+8
  const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  return utcTime + philippinesOffset;
};

/**
 * Convert a Date object to Philippines time
 * @param {Date} date - Date object to convert
 * @returns {number} Time in milliseconds (Philippines time)
 */
export const toPhilippinesTime = (date) => {
  const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  return utcTime + philippinesOffset;
};

/**
 * Get current Date object in Philippines timezone
 * @returns {Date} Date object representing current Philippines time
 */
export const getPhilippinesDate = () => {
  const philippinesTime = getPhilippinesTime();
  return new Date(philippinesTime);
};

