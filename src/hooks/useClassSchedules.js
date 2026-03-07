import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { classScheduleService } from '../services/classScheduleService';
import { Toast } from '../utils/alert';

export const classScheduleKeys = {
  all: ['classSchedules'],
  lists: () => [...classScheduleKeys.all, 'list'],
  list: (options) => [...classScheduleKeys.lists(), options],
  details: () => [...classScheduleKeys.all, 'detail'],
  detail: (id) => [...classScheduleKeys.details(), id],
};

export const useClassSchedules = (options = {}) => {
  const { enabled, ...queryOptions } = options;
  return useQuery({
    queryKey: classScheduleKeys.list(queryOptions),
    queryFn: async () => {
      return await classScheduleService.getAll(queryOptions);
    },
    enabled: enabled !== false, // Default to true if not specified
    placeholderData: keepPreviousData,
  });
};

export const useMyClassSchedules = (options = {}) => {
  const { enabled, ...queryOptions } = options;
  return useQuery({
    queryKey: [...classScheduleKeys.all, 'my-schedules', queryOptions],
    queryFn: async () => {
      return await classScheduleService.getMySchedules(queryOptions);
    },
    enabled: enabled !== false, // Default to true if not specified
    placeholderData: keepPreviousData,
  });
};

export const useCreateClassSchedule = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (scheduleData) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await classScheduleService.create(scheduleData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...classScheduleKeys.all, 'my-schedules'] });
      Toast.success('Class schedule created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to create class schedule');
    },
  });
};

export const useUpdateClassSchedule = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await classScheduleService.update(id, data, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...classScheduleKeys.all, 'my-schedules'] });
      Toast.success('Class schedule updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to update class schedule');
    },
  });
};

export const useDeleteClassSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await classScheduleService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classScheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...classScheduleKeys.all, 'my-schedules'] });
      Toast.success('Class schedule deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete class schedule');
    },
  });
};

