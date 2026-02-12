import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Bill Service
 * Handles all API calls for customer bills
 */
export const customerBillService = {
  /**
   * Get all bills for the account (no customerId). Single request for reports.
   * @param {Object} options - page, pagelimit, sort, filters
   * @returns {Promise<Object>} - { data: [], current_page, last_page, total }
   */
  async getAllBills(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page);
      if (options.pagelimit) queryParams.append('pagelimit', options.pagelimit);
      if (options.sort) queryParams.append('sort', options.sort);
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(`filters[${key}]`, value);
          }
        });
      }
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/customers/bills${queryString ? `?${queryString}` : ''}`;
      const response = await authenticatedFetch(url, { method: 'GET' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) return { data: [], current_page: 1, last_page: 1, total: 0 };
      if (data.data && Array.isArray(data.data.data)) return data.data;
      if (Array.isArray(data.data)) return { data: data.data, current_page: 1, last_page: 1, total: data.data.length };
      return { data: [], current_page: 1, last_page: 1, total: 0 };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get all bills for a customer
   * @param {number} customerId
   * @param {Object} options - Optional query parameters (page, pagelimit, sort, filters, etc.)
   * @returns {Promise<Array|Object>} - Returns array if not paginated, or pagination object if paginated
   */
  async getByCustomerId(customerId, options = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      queryParams.append('customerId', customerId);
      if (options.page) queryParams.append('page', options.page);
      if (options.pagelimit) queryParams.append('pagelimit', options.pagelimit);
      if (options.sort) queryParams.append('sort', options.sort);
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(`filters[${key}]`, value);
          }
        });
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/customers/bills?${queryString}`;

      const response = await authenticatedFetch(url, {
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
   * Create a new bill
   * @param {Object} billData
   * @returns {Promise<Object>}
   */
  async create(billData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/bills`, {
      method: 'POST',
      body: JSON.stringify(billData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create bill');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update a bill
   * @param {number} id
   * @param {Object} billData
   * @returns {Promise<Object>}
   */
  async update(id, billData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update bill');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete a bill
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/bills/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete bill');
    }

    const data = await response.json();
    return data.success;
  },
};

