import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classAttendanceService } from '../services/classAttendanceService';
import { Toast } from '../utils/alert';

export const classAttendanceKeys = {
  all: ['classAttendance'],
  lists: () => [...classAttendanceKeys.all, 'list'],
  list: (scheduleId) => [...classAttendanceKeys.lists(), scheduleId],
  customerList: (customerId, options) => [...classAttendanceKeys.all, 'customer', customerId, options],
};

export const useClassAttendances = (scheduleId) => {
  return useQuery({
    queryKey: classAttendanceKeys.list(scheduleId),
    queryFn: async () => {
      return await classAttendanceService.getByScheduleId(scheduleId);
    },
    enabled: !!scheduleId,
  });
};

export const useCustomerAttendances = (customerId, options = {}) => {
  return useQuery({
    queryKey: classAttendanceKeys.customerList(customerId, options),
    queryFn: async () => {
      return await classAttendanceService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, attendanceData }) => {
      return await classAttendanceService.markAttendance(scheduleId, attendanceData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: classAttendanceKeys.list(variables.scheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: classAttendanceKeys.lists(),
      });
      Toast.success('Attendance marked successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark attendance');
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, attendanceData }) => {
      return await classAttendanceService.update(id, attendanceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: classAttendanceKeys.lists(),
      });
      Toast.success('Attendance updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update attendance');
    },
  });
};

