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
  
  // Use en-US so we get plain digits only (no ± or + from fil-PH)
  const formattedNumber = Math.abs(numAmount).toLocaleString('en-US', mergedOptions);
  
  return numAmount < 0 ? `-₱${formattedNumber}` : `₱${formattedNumber}`;
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

/**
 * Calculate BMI (Body Mass Index)
 * @param {number|string} weight - Weight in kg
 * @param {number|string} height - Height in cm
 * @returns {number|null} - BMI value rounded to 1 decimal place, or null if invalid inputs
 */
export const calculateBMI = (weight, height) => {
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  
  // Validate inputs
  if (!weightNum || !heightNum || weightNum <= 0 || heightNum <= 0) {
    return null;
  }
  
  // Convert height from cm to meters
  const heightInMeters = heightNum / 100;
  
  // Calculate BMI: weight (kg) / height (m)^2
  const bmi = weightNum / (heightInMeters * heightInMeters);
  
  // Round to 1 decimal place
  return Math.round(bmi * 10) / 10;
};

/**
 * Calculate Body Fat Mass
 * @param {number|string} weight - Weight in kg
 * @param {number|string} bodyFatPercentage - Body fat percentage
 * @returns {number|null} - Body fat mass in kg rounded to 1 decimal place, or null if invalid inputs
 */
export const calculateBodyFatMass = (weight, bodyFatPercentage) => {
  const weightNum = parseFloat(weight);
  const bodyFatNum = parseFloat(bodyFatPercentage);
  
  // Validate inputs
  if (!weightNum || bodyFatNum === null || bodyFatNum === undefined || weightNum <= 0 || bodyFatNum < 0 || bodyFatNum > 100) {
    return null;
  }
  
  // Calculate body fat mass: weight * (body fat % / 100)
  const bodyFatMass = weightNum * (bodyFatNum / 100);
  
  // Round to 1 decimal place
  return Math.round(bodyFatMass * 10) / 10;
};

/**
 * Format time string (HH:MM) to readable format (e.g., "10:00 AM")
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - Formatted time string or original if invalid
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  // Check if already in readable format
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  // Parse HH:MM format
  const [hours, minutes] = timeString.split(':');
  if (!hours || !minutes) return timeString;
  
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  if (isNaN(hour) || isNaN(minute)) return timeString;
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

/**
 * Format time from Date object to readable format (e.g., "10:00 AM")
 * @param {string|Date} dateString - Date object or date string
 * @returns {string} - Formatted time string or 'N/A' if invalid
 */
export const formatTimeFromDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return 'N/A';
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  return formatTime(timeString);
};

/**
 * Normalize phone number by removing spaces, dashes, and other non-digit characters
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string|null} - Normalized phone number or null if empty/invalid
 */
export const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return null;
  
  // Remove all non-digit characters
  const normalized = phoneNumber.replace(/\D/g, '');
  
  // Return null if empty, otherwise return the cleaned number
  return normalized.length > 0 ? normalized : null;
};

/**
 * Normalize date to YYYY-MM-DD format for API
 * @param {string|Date} dateValue - Date value to normalize
 * @returns {string|null} - Normalized date string (YYYY-MM-DD) or null if invalid
 */
export const normalizeDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // Try to parse as Date
  const date = new Date(dateValue);
  
  // Check for invalid date
  if (isNaN(date.getTime())) return null;
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
