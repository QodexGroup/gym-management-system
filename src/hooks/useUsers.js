import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { Toast } from '../utils/alert';

/**
 * Query keys for users
 */
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: () => [...userKeys.lists()],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
  coaches: () => [...userKeys.all, 'coaches'],
};

/**
 * Hook to fetch all users
 */
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      return await userService.getAll();
    },
  });
};

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      return await userService.create(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('User created successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to create user');
    },
  });
};

/**
 * Hook to update a user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await userService.update(id, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      Toast.success('User updated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to update user');
    },
  });
};

/**
 * Hook to delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await userService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('User deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete user');
    },
  });
};

/**
 * Hook to deactivate a user
 */
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await userService.deactivate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('User deactivated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to deactivate user');
    },
  });
};

/**
 * Hook to activate a user
 */
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await userService.activate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('User activated successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to activate user');
    },
  });
};

/**
 * Hook to reset user password
 */
export const useResetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }) => {
      return await userService.resetPassword(id, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('Password reset successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to reset password');
    },
  });
};

/**
 * Hook to fetch all coaches
 * Uses React Query caching to prevent unnecessary API calls
 */
export const useCoaches = () => {
  return useQuery({
    queryKey: userKeys.coaches(),
    queryFn: async () => {
      return await userService.getCoaches();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

