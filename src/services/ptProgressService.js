import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * PT Progress Service
 * Handles all API calls for PT progress tracking
 */
export const ptProgressService = {
  /**
   * Get all PT progress records for a customer
   * @param {number} customerId
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getByCustomerId(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.relations) params.append('relations', options.relations);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-progress?${params.toString()}`,
        {
          method: 'GET',
        }
      );

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
   * Create a new PT progress record
   * @param {number} customerId
   * @param {Object} progressData
   * @returns {Promise<Object>}
   */
  async create(customerId, progressData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-progress`,
        {
          method: 'POST',
          body: JSON.stringify(progressData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create PT progress record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a PT progress record
   * @param {number} customerId
   * @param {number} id
   * @param {Object} progressData
   * @returns {Promise<Object>}
   */
  async update(customerId, id, progressData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-progress/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(progressData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update PT progress record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a PT progress record
   * @param {number} customerId
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(customerId, id) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-progress/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete PT progress record');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};

