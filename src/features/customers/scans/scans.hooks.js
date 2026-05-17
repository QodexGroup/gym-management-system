import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { customerScanService } from '../../../shared/services/customerScanService';
import { deleteFiles } from '../../../shared/services/fileUploadService';
import { Toast } from '../../../shared/utils/alert';

export const customerScanKeys = {
  all: ['customerScans'],
  lists: () => [...customerScanKeys.all, 'list'],
  list: (customerId, options) => [...customerScanKeys.lists(), customerId, options],
  details: () => [...customerScanKeys.all, 'detail'],
  detail: (id) => [...customerScanKeys.details(), id],
};

export const useCustomerScans = (customerId, options = {}) => {
  return useQuery({
    queryKey: customerScanKeys.list(customerId, options),
    queryFn: async () => {
      return await customerScanService.getByCustomerId(customerId, options);
    },
    enabled: !!customerId,
    placeholderData: keepPreviousData,
  });
};

export const useCreateCustomerScan = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ customerId, scanData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerScanService.create(customerId, scanData, idempotencyKeyRef.current);
    },
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      queryClient.invalidateQueries({ queryKey: customerScanKeys.lists() });
      Toast.success('Scan created successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to create scan');
    },
  });
};

export const useUpdateCustomerScan = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async ({ id, scanData }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuidv4();
      }
      return await customerScanService.update(id, scanData, idempotencyKeyRef.current);
    },
    onSuccess: async (updatedScan, variables) => {
      idempotencyKeyRef.current = null;
      if (updatedScan) {
        queryClient.setQueryData(customerScanKeys.detail(variables.id), updatedScan);
      }
      queryClient.invalidateQueries({ queryKey: customerScanKeys.detail(variables.id), exact: true });
      queryClient.invalidateQueries({ queryKey: customerScanKeys.lists() });
      Toast.success('Scan updated successfully');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to update scan');
    },
  });
};

export const useDeleteCustomerScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      return await customerScanService.delete(id);
    },
    onSuccess: async (response, variables) => {
      queryClient.removeQueries({ queryKey: customerScanKeys.detail(variables), exact: true });
      queryClient.invalidateQueries({ queryKey: customerScanKeys.lists() });
      if (response?.data?.fileUrls && response.data.fileUrls.length > 0) {
        try {
          await deleteFiles(response.data.fileUrls);
        } catch (error) {
          console.error('Failed to delete files from Firebase:', error);
        }
      }
      Toast.success('Scan deleted successfully');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to delete scan');
    },
  });
};
