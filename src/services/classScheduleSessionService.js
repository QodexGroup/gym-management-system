import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Schedule Session Service
 * Handles all API calls for class schedule sessions
 */
export const classScheduleSessionService = {
  /**
   * Get all class schedule sessions with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);
      if (options.sorts) params.append('sorts', JSON.stringify(options.sorts));

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedule-sessions?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        if (data.data && data.data.data) {
          return {
            data: data.data.data,
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: data.data.from,
            to: data.data.to,
          };
        }
        return {
          data: Array.isArray(data.data) ? data.data : [],
          current_page: 1,
          last_page: 1,
          per_page: data.data?.length || 0,
          total: data.data?.length || 0,
          from: 1,
          to: data.data?.length || 0,
        };
      }
      return {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 0,
        total: 0,
        from: 0,
        to: 0,
      };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Update a class schedule session
   * @param {number} id - Session ID
   * @param {Object} data - Update data (startTime, endTime, duration)
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedule-sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};
