import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { importService } from '../services/importService';
import { Toast } from '../utils/alert';
import { IMPORT_ACTIVE_STATUSES } from '../constants/importConstants';

/**
 * Query keys for the client importer.
 */
export const importKeys = {
  all: ['imports'],
  types: () => [...importKeys.all, 'types'],
  fields: (type) => [...importKeys.all, 'fields', type],
  histories: () => [...importKeys.all, 'history'],
  history: (options) => [...importKeys.histories(), options],
  status: (id) => [...importKeys.all, 'status', id],
};


/**
 * Hook to fetch the available import types.
 */
export const useImportTypes = () => {
  return useQuery({
    queryKey: importKeys.types(),
    queryFn: () => importService.getTypes(),
  });
};

/**
 * Hook to fetch field definitions + options for an import type.
 * @param {string} type
 * @param {boolean} [enabled]
 */
export const useImportFields = (type, enabled = true) => {
  return useQuery({
    queryKey: importKeys.fields(type),
    queryFn: () => importService.getFields(type),
    enabled: !!type && enabled,
    staleTime: Infinity,
  });
};

/**
 * Hook to fetch the paginated import history.
 * @param {Object} options
 */
export const useImportHistory = (options = {}) => {
  return useQuery({
    queryKey: importKeys.history(options),
    queryFn: () => importService.getHistory(options),
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to poll an import job's status while it is still processing.
 * @param {number|null} jobId
 * @param {boolean} [enabled]
 */
export const useImportStatus = (jobId, enabled = true) => {
  return useQuery({
    queryKey: importKeys.status(jobId),
    queryFn: () => importService.getStatus(jobId),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return IMPORT_ACTIVE_STATUSES.includes(status) ? 1500 : false;
    },
  });
};

/**
 * Hook to upload a file and create a pending import job.
 */
export const useUploadImport = () => {
  return useMutation({
    mutationFn: ({ file, importType }) => importService.upload(file, importType),
    onError: (error) => Toast.error(error.message || 'Failed to upload file'),
  });
};

/**
 * Hook to save the column mapping and start the async import.
 */
export const useExecuteImport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ importJobId, columnMapping, options }) =>
      importService.execute(importJobId, columnMapping, options),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: importKeys.histories() });
      if (job?.id) {
        queryClient.setQueryData(importKeys.status(job.id), job);
      }
    },
    onError: (error) => Toast.error(error.message || 'Failed to start import'),
  });
};
