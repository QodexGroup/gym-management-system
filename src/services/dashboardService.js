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
};
