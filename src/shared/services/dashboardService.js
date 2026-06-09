import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Dashboard Service
 * Handles all API calls for dashboard statistics
 */
export const dashboardService = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>}
     */
    async getDashboardStats() {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/dashboard/stats`, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch dashboard stats');
            }

            return data.data;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to API. Please check if the server is running.');
            }
            throw error;
        }
    },

    /**
     * Full account metrics (admin/staff only). Use for reports and merges, not coach dashboards.
     * @returns {Promise<Object>}
     */
    async getAccountDashboardMetrics() {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/dashboard/account-metrics`, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch account metrics');
            }

            return data.data;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to API. Please check if the server is running.');
            }
            throw error;
        }
    },

    /**
     * @param {number} [limit=10]
     * @returns {Promise<{ groupSessions: { sessions: Array }, ptSessions: { sessions: Array } }>}
     */
    async getUpcomingSessions(limit = 10) {
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/dashboard/upcoming-sessions?limit=${encodeURIComponent(limit)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch upcoming sessions');
            }
            return data.data;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to API. Please check if the server is running.');
            }
            throw error;
        }
    },

    /**
     * Coach only. Assigned PT clients for dashboard.
     * @param {number} [limit=10]
     * @returns {Promise<{ members: Array, total: number }>}
     */
    async getCoachPtClients(limit = 10) {
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/dashboard/coach/pt-clients?limit=${encodeURIComponent(limit)}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch PT clients');
            }
            return data.data;
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('Cannot connect to API. Please check if the server is running.');
            }
            throw error;
        }
    },
};
