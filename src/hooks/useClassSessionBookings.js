import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classSessionBookingService } from '../services/classSessionBookingService';
import { Toast } from '../utils/alert';
import { classScheduleSessionKeys } from './useClassScheduleSessions';

export const classSessionBookingKeys = {
  all: ['classSessionBookings'],
  lists: () => [...classSessionBookingKeys.all, 'list'],
  list: (options) => [...classSessionBookingKeys.lists(), options],
  bySession: (sessionId) => [...classSessionBookingKeys.all, 'session', sessionId],
  details: () => [...classSessionBookingKeys.all, 'detail'],
  detail: (id) => [...classSessionBookingKeys.details(), id],
};

/**
 * Hook to book a class session for a client
 */
export const useBookClassSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, customerId, notes = '' }) => {
      return await classSessionBookingService.bookSession(sessionId, customerId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classScheduleSessionKeys.all });
      // Invalidate booking sessions for calendar
      queryClient.invalidateQueries({ queryKey: [...classSessionBookingKeys.lists(), 'calendar'] });
      Toast.success('Class session booked successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to book class session');
    },
  });
};

/**
 * Hook to fetch all bookings for a specific session
 */
export const useClassSessionBookings = (sessionId, options = {}) => {
  return useQuery({
    queryKey: classSessionBookingKeys.bySession(sessionId),
    queryFn: async () => {
      return await classSessionBookingService.getBookingsBySession(sessionId);
    },
    enabled: !!sessionId && (options.enabled !== false),
    ...options,
  });
};

/**
 * Hook to update attendance status for a specific booking
 */
export const useUpdateAttendanceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }) => {
      return await classSessionBookingService.updateAttendanceStatus(bookingId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classScheduleSessionKeys.all });
      Toast.success('Attendance status updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update attendance status');
    },
  });
};

/**
 * Hook to fetch booking sessions for calendar view
 */
export const useBookingSessions = (startDate = null, endDate = null, options = {}) => {
  return useQuery({
    queryKey: [...classSessionBookingKeys.lists(), 'calendar', startDate, endDate],
    queryFn: async () => {
      return await classSessionBookingService.getBookingSessions(startDate, endDate);
    },
    enabled: (options.enabled !== false),
    ...options,
  });
};

/**
 * Hook to mark all bookings for a session as attended
 */
export const useMarkAllAsAttended = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId) => {
      return await classSessionBookingService.markAllAsAttended(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classScheduleSessionKeys.all });
      Toast.success('All bookings marked as attended');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark all as attended');
    },
  });
};

/**
 * Hook to update a booking
 */
export const useUpdateClassSessionBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, data }) => {
      return await classSessionBookingService.updateBooking(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classSessionBookingKeys.all });
      queryClient.invalidateQueries({ queryKey: classScheduleSessionKeys.all });
      queryClient.invalidateQueries({ queryKey: [...classSessionBookingKeys.lists(), 'calendar'] });
      Toast.success('Booking updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update booking');
    },
  });
};

/**
 * Hook to fetch a single booking by ID
 */
export const useClassSessionBookingById = (bookingId) => {
  return useQuery({
    queryKey: classSessionBookingKeys.detail(bookingId),
    queryFn: async () => {
      return await classSessionBookingService.getBookingById(bookingId);
    },
    enabled: !!bookingId,
  });
};
