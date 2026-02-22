import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Walkin Service
 * Handles all API calls for walkins
 */
export const walkinService = {
  /**
   * Get today's walkin
   * @returns {Promise<Object>}
   */
  async getTodayWalkin() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/walkins`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        return null;
      }
    
      return data.data || null;
      
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Create a new walkin
   * @param {Object} walkinData
   * @returns {Promise<Object>}
   */
  async create(walkinData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins`, {
      method: 'POST',
      body: JSON.stringify(walkinData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create walkin');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Get paginated walkin customers
   * @param {number} walkinId - Walkin ID
   * @param {number} page - Page number (default: 1)
   * @param {Object} options - Query options (pagelimit, sorts, filters, relations, etc.)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async getWalkinCustomers(walkinId, page = 1, options = {}) {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.relations) {
        // Handle relations as array or string
        const relationsValue = Array.isArray(options.relations) 
          ? options.relations.join(',') 
          : options.relations;
        params.append('relations', relationsValue);
      }
      
      // Handle sorts
      if (options.sorts && Array.isArray(options.sorts)) {
        options.sorts.forEach((sort, index) => {
          if (typeof sort === 'object' && sort.field && sort.direction) {
            params.append(`sorts[${index}][field]`, sort.field);
            params.append(`sorts[${index}][direction]`, sort.direction);
          } else if (typeof sort === 'string') {
            params.append(`sorts[${index}]`, sort);
          }
        });
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

      const response = await authenticatedFetch(
        `${API_BASE_URL}/walkins/${walkinId}/customers?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if response has the expected structure
      if (!data.success) {
        return { data: [], pagination: null };
      }
      
      // Handle paginated response (has nested data.data structure)
      if (data.data && data.data.data && Array.isArray(data.data.data)) {
        return normalizePaginatedResponse(data);
      }
      
      // Handle direct array response (non-paginated)
      if (Array.isArray(data.data)) {
        return {
          data: data.data,
          pagination: null,
        };
      }
      
      return { data: [], pagination: null };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Create a walkin customer (check-in)
   * @param {number} walkinId - Walkin ID
   * @param {Object} customerData - Customer data (customer_id)
   * @returns {Promise<Object>}
   */
  async createWalkinCustomer(walkinId, customerData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins/${walkinId}/customers`, {
      method: 'POST',
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check in customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Check out a walkin customer
   * @param {number} id - Walkin customer ID
   * @returns {Promise<Object>}
   */
  async checkOutWalkinCustomer(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins/customers/${id}/check-out`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check out customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Cancel a walkin customer
   * @param {number} id - Walkin customer ID
   * @returns {Promise<Object>}
   */
  async cancelWalkinCustomer(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins/customers/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Get paginated walkins by customer
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number (default: 1)
   * @param {Object} options - Query options (pagelimit, sorts, filters, relations, etc.)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async getWalkinsByCustomer(customerId, page = 1, options = {}) {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.relations) {
        // Handle relations as array or string
        const relationsValue = Array.isArray(options.relations) 
          ? options.relations.join(',') 
          : options.relations;
        params.append('relations', relationsValue);
      }
      
      // Handle sorts
      if (options.sorts && Array.isArray(options.sorts)) {
        options.sorts.forEach((sort, index) => {
          if (typeof sort === 'object' && sort.field && sort.direction) {
            params.append(`sorts[${index}][field]`, sort.field);
            params.append(`sorts[${index}][direction]`, sort.direction);
          } else if (typeof sort === 'string') {
            params.append(`sorts[${index}]`, sort);
          }
        });
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

      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/walkins?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if response has the expected structure
      if (!data.success) {
        return { data: [], pagination: null };
      }
      
      // Handle paginated response (has nested data.data structure)
      if (data.data && data.data.data && Array.isArray(data.data.data)) {
        return normalizePaginatedResponse(data);
      }
      
      // Handle direct array response (non-paginated)
      if (Array.isArray(data.data)) {
        return {
          data: data.data,
          pagination: null,
        };
      }
      
      return { data: [], pagination: null };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * QR Code Check-in (convenience method for kiosk)
   * @param {string} uuid - Customer QR code UUID
   * @returns {Promise<Object>}
   */
  async qrCheckIn(uuid) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins/qr-checkin`, {
      method: 'POST',
      body: JSON.stringify({ uuid }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check in customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * QR Code Check-out (convenience method for kiosk)
   * @param {string} uuid - Customer QR code UUID
   * @returns {Promise<Object>}
   */
  async qrCheckOut(uuid) {
    const response = await authenticatedFetch(`${API_BASE_URL}/walkins/qr-checkout`, {
      method: 'PUT',
      body: JSON.stringify({ uuid }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check out customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },
};
