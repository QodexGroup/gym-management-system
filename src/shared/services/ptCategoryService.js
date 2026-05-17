import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * PT Category Service
 * Handles all API calls for PT categories
 */
export const ptCategoryService = {
  /**
   * Get all PT categories
   * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
   * @returns {Promise<Object>} - Returns data
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.sort) params.append('sort', options.sort);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);
      if (options.sorts) params.append('sorts', JSON.stringify(options.sorts));

      const response = await authenticatedFetch(`${API_BASE_URL}/pt-categories?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        if (data.data && data.data.data) {
          return data.data.data;
        }
        return Array.isArray(data.data) ? data.data : [];
      }
      return [];
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};
