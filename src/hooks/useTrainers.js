import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';

/**
 * Query keys for trainers
 */
export const trainerKeys = {
  all: ['trainers'],
  lists: () => [...trainerKeys.all, 'list'],
};

/**
 * Hook to fetch all trainers
 */
export const useTrainers = () => {
  return useQuery({
    queryKey: trainerKeys.lists(),
    queryFn: async () => {
      try {
        const result = await customerService.getTrainers();
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

