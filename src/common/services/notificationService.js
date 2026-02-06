import { authenticatedFetch } from '../../services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Notification Service (common)
 * Handles all API calls for notifications
 */
export const notificationService = {
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unread_only: unreadOnly.toString(),
    });
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      const raw = data.data?.notifications;
      const notifications = Array.isArray(raw) ? raw : (raw?.data ?? []);
      return {
        notifications,
        pagination: data.data?.pagination ?? null,
      };
    }
    return { notifications: [], pagination: null };
  },

  async getUnreadCount() {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? (data.data.count || 0) : 0;
  },

  async markAsRead(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : null;
  },

  async markAllAsRead() {
    const response = await authenticatedFetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? (data.data.marked_count ?? 0) : 0;
  },

  async getPreferences() {
    const response = await authenticatedFetch(`${API_BASE_URL}/notification-preferences`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || {};
  },

  async updatePreferences(preferences) {
    const response = await authenticatedFetch(`${API_BASE_URL}/notification-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || {};
  },
};
