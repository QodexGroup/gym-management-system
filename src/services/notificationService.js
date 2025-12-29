
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log('🔧 Notification Service API URL:', API_BASE_URL);

/**
 * Notification Service
 * Handles all API calls for notifications
 */
export const notificationService = {
    /**
     * Get all notifications (paginated)
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 20)
     * @param {boolean} unreadOnly - Filter unread only (default: false)
     * @returns {Promise<Object>} - Returns notifications and pagination info
     */
    async getNotifications(page = 1, limit = 20, unreadOnly = false) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                unread_only: unreadOnly.toString(),
            });

            const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                return {
                    notifications: data.data.notifications || [],
                    pagination: data.data.pagination || null,
                };
            }
            return { notifications: [], pagination: null };
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to API. Please check if the server is running.');
            }
            throw error;
        }
    },

    /**
     * Get unread notification count
     * @returns {Promise<number>}
     */
    async getUnreadCount() {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.success ? (data.data.count || 0) : 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0; // Return 0 on error to prevent UI issues
        }
    },

    /**
     * Mark a notification as read
     * @param {number} id - Notification ID
     * @returns {Promise<Object>}
     */
    async markAsRead(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<number>} - Number of notifications marked as read
     */
    async markAllAsRead() {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.success ? (data.data.marked_count || 0) : 0;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Get notification preferences
     * @returns {Promise<Object>} - Returns preference settings
     */
    async getPreferences() {
        try {
            const response = await fetch(`${API_BASE_URL}/notification-preferences`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data || {};
        } catch (error) {
            console.error('Error fetching preferences:', error);
            throw error;
        }
    },

    /**
     * Update notification preferences
     * @param {Object} preferences - Preference settings
     * @returns {Promise<Object>}
     */
    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${API_BASE_URL}/notification-preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data || {};
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    },
};
