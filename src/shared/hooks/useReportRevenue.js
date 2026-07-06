import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

export const reportRevenueKeys = {
  all: ['reportRevenue'],
  list: (filters) => [...reportRevenueKeys.all, 'list', filters],
};

export const useReportRevenue = (options = {}) => {
  return useQuery({
    queryKey: reportRevenueKeys.list(options),
    queryFn: () => reportService.getRevenueData(options),
    staleTime: 60 * 1000,
  });
};
