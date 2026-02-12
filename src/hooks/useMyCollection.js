import { useQuery } from '@tanstack/react-query';
import { myCollectionService } from '../services/myCollectionService';

export const myCollectionKeys = {
  all: ['myCollection'],
  stats: () => [...myCollectionKeys.all, 'stats'],
};

export const useMyCollection = () => {
  return useQuery({
    queryKey: myCollectionKeys.stats(),
    queryFn: () => myCollectionService.getMyCollectionStats(),
    staleTime: 60 * 1000,
  });
};
