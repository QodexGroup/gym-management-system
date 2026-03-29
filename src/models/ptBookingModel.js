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
    packageName: '',
    bookingDate: today,
    bookingTime: currentTime,
    duration: 60, // Default 1 hour
    bookingNotes: '',
  };
};

/**
 * PT booking rows use catalog `ptPackageId`; the session form `<select>` uses customer assignment row `id`.
 * Resolve the assignment id once `customerPtPackages` is loaded.
 *
 * @param {Object} booking
 * @param {Array} packages - customer PT package assignments (`useCustomerPtPackages` result)
 * @returns {string}
 */
export const resolveCustomerPtPackageRowId = (booking, packages = []) => {
  if (!booking || !Array.isArray(packages) || packages.length === 0) return '';

  if (booking.customerPtPackageId != null && booking.customerPtPackageId !== '') {
    const id = String(booking.customerPtPackageId);
    if (packages.some((p) => String(p.id) === id)) return id;
  }

  const masterId = booking.ptPackageId;
  if (masterId == null || masterId === '') return '';

  const sameMaster = packages.filter((p) => String(p.ptPackageId) === String(masterId));
  if (sameMaster.length === 0) return '';

  if (booking.coachId != null && sameMaster.length > 1) {
    const byCoach = sameMaster.find(
      (p) => String(p.coach?.id ?? '') === String(booking.coachId)
    );
    if (byCoach) return String(byCoach.id);
  }

  return String(sameMaster[0].id);
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
    customerPtPackageId: booking.customerPtPackageId?.toString() || '',
    coachId: booking.coachId?.toString() || '',
    packageName: booking.packageName || '',
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
    packageName: formData.packageName?.trim() || '',
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
      const packageLabel = booking.packageName || ptPackage.packageName;

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
        className: packageLabel || 'PT Session',
        coach,
        coachId: booking.coachId,
        customer,
        customerId: booking.customerId,
        packageName: packageLabel || null,
        bookingStatus: booking.status,
        status: booking.status, // Also include as status for consistency
        duration: booking.duration || 60,
        notes: booking.bookingNotes || '',
        bookingNotes: booking.bookingNotes || '', // Also include as bookingNotes for form mapping
        ptPackageId: booking.ptPackageId,
        customerPtPackageId: booking.customerPtPackageId,
        bookingDate: booking.bookingDate, // For form mapping
        bookingTime: booking.bookingTime, // For form mapping
      };
    })
    .filter(Boolean);
};
