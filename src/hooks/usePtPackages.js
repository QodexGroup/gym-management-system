import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ptPackageService } from '../services/ptPackageService';
import { Toast } from '../utils/alert';

/**
 * Query keys for PT packages
 */
export const ptPackageKeys = {
  all: ['ptPackages'],
  lists: () => [...ptPackageKeys.all, 'list'],
  list: (options) => [...ptPackageKeys.lists(), options],
  details: () => [...ptPackageKeys.all, 'detail'],
  detail: (id) => [...ptPackageKeys.details(), id],
};

/**
 * Hook to fetch all PT packages with pagination
 * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
 */
export const usePtPackages = (options = {}) => {
  return useQuery({
    queryKey: ptPackageKeys.list(options),
    queryFn: async () => {
      return await ptPackageService.getAll(options);
    },
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch a single PT package by ID
 */
export const usePtPackageById = (id) => {
  return useQuery({
    queryKey: ptPackageKeys.detail(id),
    queryFn: async () => {
      return await ptPackageService.getById(id);
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new PT package
 */
export const useCreatePtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageData) => {
      return await ptPackageService.create(packageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptPackageKeys.lists() });
      Toast.success('PT Package created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create PT package');
    },
  });
};

/**
 * Hook to update a PT package
 */
export const useUpdatePtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await ptPackageService.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ptPackageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ptPackageKeys.detail(variables.id) });
      Toast.success('PT Package updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update PT package');
    },
  });
};

/**
 * Hook to delete a PT package
 */
export const useDeletePtPackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await ptPackageService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ptPackageKeys.lists() });
      Toast.success('PT Package deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete PT package');
    },
  });
};

