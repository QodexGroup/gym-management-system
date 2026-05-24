import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

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
      return normalizePaginatedResponse(data);
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

