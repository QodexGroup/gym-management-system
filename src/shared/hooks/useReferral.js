import { useQuery } from '@tanstack/react-query';
import { referralService } from '../services/referralService';

/**
 * Query keys for referrals
 */
export const referralKeys = {
  all: ['referrals'],
  summary: () => [...referralKeys.all, 'summary'],
};

/**
 * Hook to fetch the account owner's referral summary.
 * @param {Object} options - Extra react-query options (e.g. { enabled })
 */
export const useReferralSummary = (options = {}) => {
  return useQuery({
    queryKey: referralKeys.summary(),
    queryFn: async () => referralService.getSummary(),
    ...options,
  });
};
