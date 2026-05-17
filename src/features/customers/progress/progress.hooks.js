import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerProgressService } from '../../../shared/services/customerProgressService';
import { deleteFiles } from '../../../shared/services/fileUploadService';
import { Toast } from '../../../shared/utils/alert';

export const customerProgressKeys = {
  all: ['customerProgress'],
  lists: () => [...customerProgressKeys.all, 'list'],
  list: (customerId, options) => [...customerProgressKeys.lists(), customerId, options],
  details: () => [...customerProgressKeys.all, 'detail'],
  detail: (id) => [...customerProgressKeys.details(), id],
};

export const useCustomerProgress = (customerId, options = {}) => {
  return useQuery({
    queryKey: customerProgressKeys.list(customerId, options),
    queryFn: async () => {
      return await customerProgressService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  });
};

export const useCreateCustomerProgress = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ customerId, progressData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerProgressService.create(customerId, progressData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
      Toast.success('Progress record created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to create progress record');
    },
  });
};

export const useUpdateCustomerProgress = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, progressData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerProgressService.update(id, progressData, idempotencyKeyRef.current);
    },
    onSuccess: async (updatedProgress, variables) => {
      idempotencyKeyRef.current = null;
      if (updatedProgress) {
        queryClient.setQueryData(customerProgressKeys.detail(variables.id), updatedProgress);
      }
      queryClient.invalidateQueries({ queryKey: customerProgressKeys.detail(variables.id), exact: true });
      queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
      Toast.success('Progress record updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to update progress record');
    },
  });
};

export const useDeleteCustomerProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerProgressService.delete(id);
    },
    onSuccess: async (response, variables) => {
      queryClient.removeQueries({ queryKey: customerProgressKeys.detail(variables), exact: true });
      queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
      if (response?.data?.fileUrls && response.data.fileUrls.length > 0) {
        try {
          await deleteFiles(response.data.fileUrls);
        } catch (error) {
          console.error('Failed to delete files from Firebase:', error);
        }
      }
      Toast.success('Progress record deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete progress record');
    },
  });
};
