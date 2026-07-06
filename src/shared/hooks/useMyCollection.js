import { useQuery } from '@tanstack/react-query';
import { myCollectionService } from '../services/myCollectionService';

export const myCollectionKeys = {
  all: ['myCollection'],
  stats: (options) => [...myCollectionKeys.all, 'stats', options],
};

export const useMyCollection = (options = {}) => {
  return useQuery({
    queryKey: myCollectionKeys.stats(options),
    queryFn: () => myCollectionService.getMyCollectionStats(options),
    staleTime: 60 * 1000,
  });
};
