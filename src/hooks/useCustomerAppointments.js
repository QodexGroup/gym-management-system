import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { customerAppointmentService } from '../services/customerAppointmentService';
import { Toast } from '../utils/alert';

/**
 * Query keys for customer appointments
 */
export const customerAppointmentKeys = {
  all: ['customerAppointments'],
  lists: () => [...customerAppointmentKeys.all, 'list'],
  list: (customerId, page) => [...customerAppointmentKeys.lists(), customerId, page],
  details: () => [...customerAppointmentKeys.all, 'detail'],
  detail: (id) => [...customerAppointmentKeys.details(), id],
};

/**
 * Hook to fetch customer appointments with pagination
 */
export const useCustomerAppointments = (customerId, page = 1) => {
  return useQuery({
    queryKey: customerAppointmentKeys.list(customerId, page),
    queryFn: async () => {
      const result = await customerAppointmentService.getAll(customerId, page);
      return {
        data: result.data || [],
        pagination: result.pagination,
      };
    },
    enabled: !!customerId, // Only run query if customerId exists
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
  });
};

/**
 * Hook to create a new appointment
 */
export const useCreateCustomerAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, data }) => {
      return await customerAppointmentService.create(customerId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch appointments list for the customer
      queryClient.invalidateQueries({ 
        queryKey: customerAppointmentKeys.lists(),
      });
      Toast.success('Appointment created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create appointment');
    },
  });
};

/**
 * Hook to update an appointment
 */
export const useUpdateCustomerAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await customerAppointmentService.update(id, data);
    },
    onSuccess: (updatedAppointment, variables) => {
      // Update the cache with the returned data immediately
      if (updatedAppointment) {
        queryClient.setQueryData(customerAppointmentKeys.detail(variables.id), updatedAppointment);
      }
      
      // Invalidate to mark as stale and trigger refetch if query is active
      queryClient.invalidateQueries({ 
        queryKey: customerAppointmentKeys.lists(),
      });
      
      Toast.success('Appointment updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update appointment');
    },
  });
};

/**
 * Hook to delete an appointment
 */
export const useDeleteCustomerAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerAppointmentService.delete(id);
    },
    onSuccess: () => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: customerAppointmentKeys.lists() });
      Toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete appointment');
    },
  });
};

