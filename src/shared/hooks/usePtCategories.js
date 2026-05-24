import { useQuery } from '@tanstack/react-query';
import { ptCategoryService } from '../services/ptCategoryService';

/**
 * Query keys for PT categories
 */
export const ptCategoryKeys = {
  all: ['ptCategories'],
  lists: () => [...ptCategoryKeys.all, 'list'],
  list: (options) => [...ptCategoryKeys.lists(), options],
};

/**
 * Hook to fetch all PT categories
 * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
 */
export const usePtCategories = (options = {}) => {
  return useQuery({
    queryKey: ptCategoryKeys.list(options),
    queryFn: async () => {
      return await ptCategoryService.getAll(options);
    },
  });
};
