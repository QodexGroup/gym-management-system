import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { userService } from '../services/userService';
import { Toast } from '../utils/alert';
import { useMutationWithToast } from './useMutationWithToast';

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
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (userData) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await userService.create(userData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      Toast.success('User created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to create user');
    },
  });
};

/**
 * Hook to update a user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Generate key once per mutation instance
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      
      return await userService.update(id, data, idempotencyKeyRef.current);
    },
    onSuccess: (data, variables) => {
      idempotencyKeyRef.current = null; // Reset after success
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      Toast.success('User updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null; // Reset on error
      Toast.error(error.message || 'Failed to update user');
    },
  });
};

/**
 * Hook to delete a user
 */
export const useDeleteUser = () => {
  return useMutationWithToast(
    async (id) => userService.delete(id),
    {
      successMessage: 'User deleted successfully',
      errorMessage: 'Failed to delete user',
      invalidateKeys: [userKeys.lists()],
    }
  );
};

/**
 * Hook to deactivate a user
 */
export const useDeactivateUser = () => {
  return useMutationWithToast(
    async (id) => userService.deactivate(id),
    {
      successMessage: 'User deactivated successfully',
      errorMessage: 'Failed to deactivate user',
      invalidateKeys: [userKeys.lists()],
    }
  );
};

/**
 * Hook to activate a user
 */
export const useActivateUser = () => {
  return useMutationWithToast(
    async (id) => userService.activate(id),
    {
      successMessage: 'User activated successfully',
      errorMessage: 'Failed to activate user',
      invalidateKeys: [userKeys.lists()],
    }
  );
};

/**
 * Hook to reset user password
 */
export const useResetPassword = () => {
  return useMutationWithToast(
    async ({ id, password }) => userService.resetPassword(id, password),
    {
      successMessage: 'Password reset successfully',
      errorMessage: 'Failed to reset password',
      invalidateKeys: [userKeys.lists()],
    }
  );
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

