import { useQuery } from '@tanstack/react-query';
import { myRevenueService } from '../services/myRevenueService';

export const myRevenueKeys = {
  all: ['myRevenue'],
  stats: (options) => [...myRevenueKeys.all, 'stats', options],
};

export const useMyRevenue = (options = {}) => {
  return useQuery({
    queryKey: myRevenueKeys.stats(options),
    queryFn: () => myRevenueService.getMyRevenueStats(options),
    staleTime: 60 * 1000,
  });
};
