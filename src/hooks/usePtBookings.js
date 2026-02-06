import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ptBookingService } from '../services/ptBookingService';
import { Toast } from '../utils/alert';

/**
 * Query keys for PT bookings
 */
export const ptBookingKeys = {
  all: ['pt-bookings'],
  lists: () => [...ptBookingKeys.all, 'list'],
  byDateRange: (startDate, endDate, options) => [...ptBookingKeys.lists(), { startDate, endDate, ...options }],
  byCoachId: (coachId, startDate, endDate, options) => [...ptBookingKeys.lists(), 'coach', coachId, { startDate, endDate, ...options }],
  bySessionId: (sessionId) => [...ptBookingKeys.lists(), 'session', sessionId],
};

/**
 * Hook to fetch PT bookings by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} options - Query options (relations, etc.)
 * @param {Object} queryOptions - React Query options
 */
export const usePtBookings = (startDate = null, endDate = null, options = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ptBookingKeys.byDateRange(startDate, endDate, options),
    queryFn: async () => {
      return await ptBookingService.getAll(startDate, endDate, options);
    },
    enabled: !!startDate && !!endDate,
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
};

/**
 * Hook to fetch PT bookings by coach ID and date range
 * @param {number} coachId - Coach ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} options - Query options (relations, etc.)
 * @param {Object} queryOptions - React Query options
 */
export const usePtBookingsByCoach = (coachId, startDate = null, endDate = null, options = {}, queryOptions = {}) => {
  return useQuery({
    queryKey: ptBookingKeys.byCoachId(coachId, startDate, endDate, options),
    queryFn: async () => {
      return await ptBookingService.getByCoachId(coachId, startDate, endDate, options);
    },
    enabled: !!coachId && !!startDate && !!endDate,
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
};

/**
 * Hook to create a PT booking
 */
export const useCreatePtBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData) => {
      return await ptBookingService.create(bookingData);
    },
    onSuccess: () => {
      // Invalidate all PT booking queries
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      // Invalidate class schedule sessions to refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['classScheduleSessions'] });
      Toast.success('PT session booked successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to book PT session');
    },
  });
};

/**
 * Hook to update a PT booking
 */
export const useUpdatePtBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await ptBookingService.update(id, data);
    },
    onSuccess: () => {
      // Invalidate all PT booking queries
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      // Invalidate class schedule sessions to refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['classScheduleSessions'] });
      Toast.success('PT session updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update PT session');
    },
  });
};

/**
 * Hook to cancel a PT booking
 */
export const useCancelPtBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await ptBookingService.markAsCancelled(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      // Invalidate class schedule sessions to refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['classScheduleSessions'] });
      Toast.success('PT session cancelled successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to cancel PT session');
    },
  });
};

/**
 * Hook to mark a PT booking as attended
 */
export const useMarkPtBookingAsAttended = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await ptBookingService.markAsAttended(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      // Invalidate class schedule sessions to refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['classScheduleSessions'] });
      Toast.success('PT session marked as attended');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark PT session as attended');
    },
  });
};

/**
 * Hook to mark a PT booking as no-show
 */
export const useMarkPtBookingAsNoShow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await ptBookingService.markAsNoShow(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptBookingKeys.all });
      // Invalidate class schedule sessions to refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['classScheduleSessions'] });
      Toast.success('PT session marked as no-show');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark PT session as no-show');
    },
  });
};

/**
 * Hook to fetch PT bookings by class schedule session ID
 * @param {number} sessionId - Class schedule session ID
 * @param {Object} queryOptions - React Query options
 */
export const usePtBookingsBySessionId = (sessionId, queryOptions = {}) => {
  return useQuery({
    queryKey: ptBookingKeys.bySessionId(sessionId),
    queryFn: async () => {
      return await ptBookingService.getBySessionId(sessionId);
    },
    enabled: !!sessionId,
    ...queryOptions,
  });
};
