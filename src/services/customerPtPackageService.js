import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer PT Package Service
 * Handles all API calls for customer PT packages
 */
export const customerPtPackageService = {
  /**
   * Get all PT packages for a customer
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
        `${API_BASE_URL}/customers/${customerId}/pt-packages?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Assign PT package to customer
   * @param {number} customerId
   * @param {Object} packageData
   * @returns {Promise<Object>}
   */
  async assign(customerId, packageData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-packages`,
        {
          method: 'POST',
          body: JSON.stringify(packageData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign PT package');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancel customer PT package
   * @param {number} customerId
   * @param {number} packageId
   * @returns {Promise<boolean>}
   */
  async cancel(customerId, packageId) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/pt-packages/${packageId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel PT package');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};

