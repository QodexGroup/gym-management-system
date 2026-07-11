import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { accountSystemSettingService } from '../services/accountSystemSettingService';
import { Toast } from '../utils/alert';

export const accountSystemSettingsKeys = {
  all: ['accountSystemSettings'],
  detail: () => [...accountSystemSettingsKeys.all, 'detail'],
};

export const useAccountSystemSettings = () => {
  return useQuery({
    queryKey: accountSystemSettingsKeys.detail(),
    queryFn: () => accountSystemSettingService.get(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateAccountSystemSettings = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef(null);

  return useMutation({
    mutationFn: async (settings) => {
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = uuidv4();
      return accountSystemSettingService.update(settings, idempotencyKeyRef.current);
    },
    onSuccess: (data) => {
      idempotencyKeyRef.current = null;
      queryClient.setQueryData(accountSystemSettingsKeys.detail(), data);
      Toast.success('Settings saved');
    },
    onError: (error) => {
      idempotencyKeyRef.current = null;
      Toast.error(error.message || 'Failed to save settings');
    },
  });
};
