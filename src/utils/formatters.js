/**
 * Utility functions for formatting dates, currency, and other common transformations
 * Date formatting uses English locale, currency uses Philippine locale (fil-PH)
 */

const PH_LOCALE = 'fil-PH';
const DATE_LOCALE = 'en-US'; // English for date formatting

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number|null} - Age in years or null if invalid date
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  // Check for invalid date
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date to English locale
 * @param {string|Date} dateString - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string or 'N/A' if invalid
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return date.toLocaleDateString(DATE_LOCALE, { ...defaultOptions, ...options });
};

/**
 * Format date to long format (e.g., "December 12, 2025")
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string or 'N/A' if invalid
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString(DATE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date to short format (e.g., "12/12/2025")
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string or 'N/A' if invalid
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString(DATE_LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string for input or empty string if invalid
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format currency to Philippine Peso (₱)
 * @param {number|string} amount - Amount to format
 * @param {Object} options - Additional options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 2)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const numAmount = parseFloat(amount) || 0;
  
  const defaultOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Format number with Philippine locale
  const formattedNumber = numAmount.toLocaleString(PH_LOCALE, mergedOptions);
  
  return `₱${formattedNumber}`;
};

/**
 * Format currency without decimal places
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted currency string without decimals
 */
export const formatCurrencyWhole = (amount) => {
  return formatCurrency(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Format number with Philippine locale
 * @param {number|string} number - Number to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} - Formatted number string
 */
export const formatNumber = (number, options = {}) => {
  const num = parseFloat(number) || 0;
  return num.toLocaleString(PH_LOCALE, options);
};

