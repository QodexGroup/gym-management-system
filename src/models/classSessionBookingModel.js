/**
 * Class Session Booking Model
 * 
 */

import { SESSION_TYPES } from '../constants/sessionSchedulingConstants';
import { BOOKING_STATUS } from '../constants/classSessionBookingConstants';

/**
 * Map booking data from API to member group class session format
 * @param {Array} bookingsData - Array of booking objects from API
 * @returns {Array} Transformed array of member group class sessions
 */
export const mapBookingsToMemberGroupClassSessions = (bookingsData = []) => {
  return bookingsData
    .filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED)
    .map((booking) => {
      const session = booking.classScheduleSession || {};
      const schedule = session.classSchedule || {};
      const customer = booking.customer || {};
      
      if (!session.startTime) return null;

      return {
        id: booking.id,
        type: SESSION_TYPES.MEMBER_GROUP_CLASS,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionDate: session.startTime,
        className: schedule.className || 'Unknown Class',
        coach: schedule.coach,
        coachId: schedule.coachId,
        capacity: schedule.capacity,
        attendanceCount: session.attendanceCount || 0,
        scheduleId: schedule.id,
        sessionId: session.id,
        bookingId: booking.id,
        customer,
        customerId: customer.id,
        bookingStatus: booking.status,
        notes: booking.notes || '',
      };
    })
    .filter(Boolean);
};
