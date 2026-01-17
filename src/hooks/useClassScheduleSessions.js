import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { classScheduleSessionService } from '../services/classScheduleSessionService';

export const classScheduleSessionKeys = {
  all: ['classScheduleSessions'],
  lists: () => [...classScheduleSessionKeys.all, 'list'],
  list: (options) => [...classScheduleSessionKeys.lists(), options],
  details: () => [...classScheduleSessionKeys.all, 'detail'],
  detail: (id) => [...classScheduleSessionKeys.details(), id],
};

export const useClassScheduleSessions = (options = {}) => {
  return useQuery({
    queryKey: classScheduleSessionKeys.list(options),
    queryFn: async () => {
      return await classScheduleSessionService.getAll(options);
    },
    placeholderData: keepPreviousData,
  });
};
