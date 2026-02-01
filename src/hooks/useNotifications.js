import { useQuery, useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { notificationService } from '../common/services/notificationService';
import { mapNotificationList } from '../common/models/notificationModel';
import { Toast } from '../utils/alert';

export const notificationKeys = {
  all: ['notifications'],
  lists: () => [...notificationKeys.all, 'list'],
  list: (page, limit) => [...notificationKeys.lists(), { page, limit }],
  infiniteList: (limit) => [...notificationKeys.lists(), 'infinite', { limit }],
  unreadCount: () => [...notificationKeys.all, 'unreadCount'],
};

/**
 * Fetch notifications (single page) – e.g. for bell dropdown
 */
export const useNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: async () => {
      const result = await notificationService.getNotifications(page, limit, false);
      return {
        notifications: mapNotificationList(result.notifications),
        pagination: result.pagination,
      };
    },
    placeholderData: keepPreviousData,
  });
};

/** Normalize pagination (API may return snake_case/camelCase or string numbers) */
const getPageInfo = (p) => {
  if (!p) return null;
  const current = Number(p.current_page ?? p.currentPage ?? 1) || 1;
  let last = Number(p.last_page ?? p.lastPage ?? 1) || 1;
  if (last < 1) last = 1;
  return { currentPage: current, lastPage: last };
};

/**
 * Fetch notifications with infinite scroll / Load More.
 * Page 1 = newest (desc order), Load More fetches next page (older), appended so list stays newest-first.
 */
export const useNotificationsInfinite = (limit = 20) => {
  const query = useInfiniteQuery({
    queryKey: notificationKeys.infiniteList(limit),
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam) || 1;
      const result = await notificationService.getNotifications(page, limit, false);
      const p = result.pagination;
      const normalized = p
        ? {
            current_page: Number(p.current_page ?? p.currentPage ?? page),
            last_page: Number(p.last_page ?? p.lastPage ?? 1),
            per_page: Number(p.per_page ?? p.perPage ?? limit),
            total: Number(p.total ?? 0),
          }
        : null;
      return {
        notifications: mapNotificationList(result.notifications),
        pagination: normalized,
      };
    },
    getNextPageParam: (lastPage) => {
      const info = getPageInfo(lastPage?.pagination);
      if (!info || info.currentPage >= info.lastPage) return undefined;
      return info.currentPage + 1;
    },
    initialPageParam: 1,
  });

  const pages = query.data?.pages ?? [];
  const notifications = pages.flatMap((p) => p.notifications ?? []);
  const pagination = pages.length ? pages[pages.length - 1]?.pagination : null;

  return {
    ...query,
    notifications,
    pagination,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

/**
 * Unread notification count (refetch every 30s)
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30_000,
  });
};

/** Invalidate list queries but NOT the infinite list (so Load More state is kept) */
const invalidateListQueries = (queryClient) => {
  queryClient.invalidateQueries({
    queryKey: notificationKeys.lists(),
    predicate: (query) => !query.queryKey.some((k) => k === 'infinite'),
  });
};

/**
 * Mark one notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark as read');
    },
  });
};

/**
 * Mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      invalidateListQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      Toast.success('All notifications marked as read');
    },
    onError: (error) => {
      Toast.error(error.message || 'Failed to mark all as read');
    },
  });
};
