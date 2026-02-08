import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Service
 * Handles all API calls for customers
 */
export const customerService = {
  /**
   * Get a customer by ID
   * @param {number|string} id - Customer ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const customerId = parseInt(id, 10);
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get all customers with pagination
   * @param {number} page - Page number (default: 1)
   * @param {Object} options - Query options (pagelimit, sorts, filters, relations, etc.)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async getAll(page = 1, options = {}) {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.relations) params.append('relations', options.relations);
      
      // Handle sorts - support both old string format and new array format
      if (options.sorts && Array.isArray(options.sorts)) {
        options.sorts.forEach((sort, index) => {
          if (typeof sort === 'object' && sort.field && sort.direction) {
            params.append(`sorts[${index}][field]`, sort.field);
            params.append(`sorts[${index}][direction]`, sort.direction);
          } else if (typeof sort === 'string') {
            params.append(`sorts[${index}]`, sort);
          }
        });
      } else if (options.sort) {
        // Legacy string format support
        params.append('sort', options.sort);
      }

      // Handle filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v, i) => {
              params.append(`filters[${key}][${i}]`, v);
            });
          } else {
            params.append(`filters[${key}]`, value);
          }
        });
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/customers?${params.toString()}`, {
        method: 'GET',
      });

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
   * Create a new customer
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  async create(customerData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update a customer
   * @param {number|string} id
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  async update(id, customerData) {
    const customerId = parseInt(id, 10);
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete a customer
   * @param {number|string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const customerId = parseInt(id, 10);
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/${customerId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete customer');
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Search customers by keyword (name, email, phone)
   * @param {string} keyword - Search keyword
   * @param {number} page - Page number (default: 1)
   * @param {number} pagelimit - Number of results per page (default: 50)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async searchCustomers(keyword = '', page = 1, pagelimit = 50) {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('pagelimit', pagelimit);
      
      // Add search filter if keyword is provided
      if (keyword && keyword.trim()) {
        params.append('filters[search]', keyword.trim());
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/customers?${params.toString()}`, {
        method: 'GET',
      });

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
   * Get all trainers (coaches)
   * @returns {Promise<Array>}
   */
  async getTrainers() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/coaches`, {
        method: 'GET',
      });

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
};

