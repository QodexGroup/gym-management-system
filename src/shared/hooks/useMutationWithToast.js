import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Toast } from '../utils/alert';

/**
 * Wrapper around useMutation that handles Toast notifications and optional
 * query invalidation automatically — eliminates the 30+ duplicate
 * onSuccess/onError patterns across the hooks.
 *
 * @param {Function} mutationFn   — async function that performs the API call
 * @param {Object}   options
 * @param {string}   options.successMessage   — Toast shown on success
 * @param {string}   options.errorMessage     — Fallback Toast shown on error
 * @param {string[]} options.invalidateKeys   — Query keys to invalidate on success
 * @param {Function} options.onSuccess        — Optional extra success callback (data, variables) => void
 * @param {Function} options.onError          — Optional extra error callback (error) => void
 */
export const useMutationWithToast = (mutationFn, options = {}) => {
  const {
    successMessage,
    errorMessage = 'Operation failed. Please try again.',
    invalidateKeys = [],
    onSuccess,
    onError,
  } = options;

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      if (invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
          )
        );
      }
      if (successMessage) Toast.success(successMessage);
      if (onSuccess) onSuccess(data, variables, context);
    },
    onError: (error, variables, context) => {
      Toast.error(error?.message || errorMessage);
      if (onError) onError(error, variables, context);
    },
  });
};
