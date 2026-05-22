/**
 * Group Class Booking Form Model
 * Defines the structure and initial state for group class booking form data
 */

/**
 * Get initial group class booking form data
 * @returns {Object} Initial form state
 */
export const getInitialGroupClassBookingFormData = () => ({
  customerId: '',
  sessionId: '',
  notes: '',
});

/**
 * Map booking data from API to form data
 * @param {Object} booking - Booking object from API
 * @returns {Object} Form data object
 */
export const mapGroupClassBookingToFormData = (booking) => {
  if (!booking) return getInitialGroupClassBookingFormData();
  
  return {
    customerId: booking.customerId || booking.customer?.id || '',
    sessionId: booking.sessionId || booking.classScheduleSessionId || '',
    notes: booking.notes || '',
  };
};
