/**
 * PT Booking Form Model
 * Defines the structure and initial state for PT booking form data
 */

import { SESSION_TYPES } from '../constants/sessionSchedulingConstants';
import { BOOKING_STATUS } from '../constants/classSessionBookingConstants';

/**
 * Get initial PT booking form data
 * @returns {Object} Initial form state
 */
export const getInitialPtBookingFormData = () => {
  // Get current date and time in PH timezone (UTC+8)
  const now = new Date();
  const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // Add 8 hours for PH timezone
  
  const today = phTime.toISOString().split('T')[0];
  const currentTime = phTime.toTimeString().slice(0, 5); // HH:MM format

  return {
    customerId: '',
    customerPtPackageId: '',
    coachId: '',
    bookingDate: today,
    bookingTime: currentTime,
    duration: 60, // Default 1 hour
    bookingNotes: '',
  };
};

/**
 * Map PT booking data from API to form data
 * @param {Object} booking - PT booking object from API
 * @returns {Object} Form data object
 */
export const mapPtBookingToFormData = (booking) => {
  if (!booking) return getInitialPtBookingFormData();

  return {
    customerId: booking.customerId?.toString() || '',
    customerPtPackageId: booking.customerPtPackageId?.toString() || booking.ptPackageId?.toString() || '',
    coachId: booking.coachId?.toString() || '',
    bookingDate: booking.bookingDate || '',
    bookingTime: booking.bookingTime || '',
    duration: booking.duration || 60,
    bookingNotes: booking.bookingNotes || '',
  };
};

/**
 * Transform form data to API request format (camelCase)
 * @param {Object} formData - Form data object
 * @returns {Object} API request data object
 */
export const transformPtBookingToApiFormat = (formData) => {
  return {
    customerId: parseInt(formData.customerId),
    customerPtPackageId: parseInt(formData.customerPtPackageId),
    coachId: parseInt(formData.coachId),
    bookingDate: formData.bookingDate,
    bookingTime: formData.bookingTime,
    duration: parseInt(formData.duration),
    bookingNotes: formData.bookingNotes || '',
  };
};

/**
 * Map PT booking data from API to calendar session format
 * @param {Array} ptBookingsData - Array of PT booking objects from API
 * @returns {Array} Transformed array of PT sessions
 */
export const mapPtBookingsToSessions = (ptBookingsData = []) => {
  return ptBookingsData
    .filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED)
    .map((booking) => {
      const customer = booking.customer || {};
      const coach = booking.coach || {};
      const ptPackage = booking.ptPackage || {};

      // Combine booking date and time
      const bookingDateTime = booking.bookingDate && booking.bookingTime
        ? new Date(`${booking.bookingDate}T${booking.bookingTime}`)
        : null;

      if (!bookingDateTime) return null;

      // Calculate end time based on duration (duration is in minutes)
      const endTime = new Date(bookingDateTime.getTime() + (booking.duration || 60) * 60 * 1000);

      return {
        id: booking.id,
        type: SESSION_TYPES.MEMBER_PT,
        startTime: bookingDateTime.toISOString(),
        endTime: endTime.toISOString(),
        sessionDate: bookingDateTime.toISOString(),
        className: ptPackage.packageName || 'PT Session',
        coach,
        coachId: booking.coachId,
        customer,
        customerId: booking.customerId,
        bookingStatus: booking.status,
        status: booking.status, // Also include as status for consistency
        duration: booking.duration || 60,
        notes: booking.bookingNotes || '',
        bookingNotes: booking.bookingNotes || '', // Also include as bookingNotes for form mapping
        ptPackageId: booking.ptPackageId,
        customerPtPackageId: booking.customerPtPackageId || booking.ptPackageId, // For form mapping
        bookingDate: booking.bookingDate, // For form mapping
        bookingTime: booking.bookingTime, // For form mapping
      };
    })
    .filter(Boolean);
};
