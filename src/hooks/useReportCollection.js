import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/reportService';

export const reportCollectionKeys = {
  all: ['reportCollection'],
  list: (filters) => [...reportCollectionKeys.all, 'list', filters],
};

export const useReportCollection = (options = {}) => {
  return useQuery({
    queryKey: reportCollectionKeys.list(options),
    queryFn: () => reportService.getCollectionData(options),
    staleTime: 60 * 1000,
  });
};
