/**
 * Appointment Form Model
 * Defines the structure and initial state for appointment form data
 */

/**
 * Get initial appointment form data
 * @returns {Object} Initial form state
 */
export const getInitialAppointmentFormData = () => {
  // Set default to current date and time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  
  return {
    appointmentTypeId: null,
    appointmentStart: defaultDateTime,
    duration: 60,
    trainerId: null,
    notes: '',
  };
};

/**
 * Map appointment data from API to form data
 * @param {Object} appointment - Appointment object from API
 * @returns {Object} Form data object
 */
export const mapAppointmentToFormData = (appointment) => {
  if (!appointment) return getInitialAppointmentFormData();
  
  return {
    appointmentTypeId: appointment.appointmentTypeId || null,
    appointmentStart: appointment.appointmentStart ? formatDateTimeForInput(appointment.appointmentStart) : '',
    duration: appointment.duration || 60,
    trainerId: appointment.trainerId || null,
    notes: appointment.notes || '',
  };
};

/**
 * Format datetime string for input field (YYYY-MM-DDTHH:mm)
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} Formatted datetime string
 */
const formatDateTimeForInput = (dateTimeString) => {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format appointment data for API submission
 * @param {Object} formData - Form data object
 * @returns {Object} API-ready data object
 */
export const formatAppointmentForApi = (formData) => {
  return {
    appointmentTypeId: formData.appointmentTypeId,
    duration: parseInt(formData.duration, 10),
    trainerId: formData.trainerId || null,
    notes: formData.notes || null,
  };
};

/**
 * Format appointment for display
 * @param {Object} appointment - Appointment object from API
 * @returns {Object} Formatted appointment for UI
 */
export const formatAppointmentForDisplay = (appointment) => {
  if (!appointment) return null;

  const startDate = new Date(appointment.appointmentStart);
  const endDate = new Date(appointment.appointmentEnd);

  return {
    id: appointment.id,
    type: appointment.appointmentType?.name || 'Unknown',
    date: formatDate(startDate),
    time: formatTime(startDate),
    duration: appointment.duration,
    status: appointment.appointmentStatus,
    notes: appointment.notes,
    appointmentTypeId: appointment.appointmentTypeId,
    appointmentStart: appointment.appointmentStart,
    appointmentEnd: appointment.appointmentEnd,
  };
};

/**
 * Format date for display (e.g., "Dec 15, 2024")
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time for display (e.g., "10:30 AM")
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

