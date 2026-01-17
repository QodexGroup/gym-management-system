import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Schedule Service
 * Handles all API calls for class schedules
 */
export const classScheduleService = {
  /**
   * Get my class schedules (for coaches)
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getMySchedules(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/my-schedules?${params.toString()}`, {
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
   * Get all class schedules with pagination
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

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules?${params.toString()}`, {
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
   * Create a new class schedule
   * @param {Object} scheduleData
   * @returns {Promise<Object>}
   */
  async create(scheduleData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules`, {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create class schedule');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a class schedule
   * @param {number} id
   * @param {Object} scheduleData
   * @returns {Promise<Object>}
   */
  async update(id, scheduleData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update class schedule');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a class schedule
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete class schedule');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};

