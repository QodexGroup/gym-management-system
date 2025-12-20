import { useQuery } from '@tanstack/react-query';
import { appointmentTypeService } from '../services/appointmentTypeService';

/**
 * Query keys for appointment types
 */
export const appointmentTypeKeys = {
  all: ['appointmentTypes'],
  lists: () => [...appointmentTypeKeys.all, 'list'],
};

/**
 * Hook to fetch all appointment types
 */
export const useAppointmentTypes = () => {
  return useQuery({
    queryKey: appointmentTypeKeys.lists(),
    queryFn: async () => {
      try {
        const result = await appointmentTypeService.getAll();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

