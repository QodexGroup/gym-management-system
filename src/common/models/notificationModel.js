/**
 * Notification model helpers (common)
 * Maps API notification shape for UI
 */
export const mapNotification = (item) => ({
  id: item.id,
  type: item.type,
  title: item.title,
  message: item.message,
  data: item.data ?? {},
  isRead: item.isRead ?? !!(item.readAt ?? item.read_at),
  readAt: item.readAt ?? item.read_at,
  createdAt: item.createdAt ?? item.created_at,
  timeAgo: item.timeAgo ?? item.time_ago ?? '',
});

export const mapNotificationList = (list) => (Array.isArray(list) ? list.map(mapNotification) : []);
