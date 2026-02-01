import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Scan Service
 * Handles all API calls for customer scans (InBody/Styku)
 */
export const customerScanService = {
  /**
   * Get all scans for a customer
   * @param {number} customerId - Customer ID
   * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
   * @returns {Promise<Object>} - Returns paginated data
   */
  async getByCustomerId(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.sort) params.append('sort', options.sort);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);

      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle paginated response from Laravel paginator
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
        // Fallback for non-paginated response
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
   * Create a new scan
   * @param {number} customerId - Customer ID
   * @param {Object} scanData - Scan data
   * @returns {Promise<Object>}
   */
  async create(customerId, scanData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans`, {
        method: 'POST',
        body: JSON.stringify({ ...scanData, customerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create scan');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a scan
   * @param {number} id - Scan ID
   * @param {Object} scanData - Scan data
   * @returns {Promise<Object>}
   */
  async update(id, scanData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(scanData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update scan');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get scans by customer ID and scan type
   * @param {number} customerId - Customer ID
   * @param {string} scanType - Scan type ('inbody' or 'styku')
   * @returns {Promise<Array>} - Returns array of scans
   */
  async getByType(customerId, scanType) {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans/type/${scanType}?${params.toString()}`, {
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

  /**
   * Delete a scan
   * @param {number} id - Scan ID
   * @returns {Promise<Object>} - Returns { success: boolean, data: { fileUrls: string[] } }
   */
  async delete(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete scan');
      }

      const data = await response.json();
      return data; // Return full response object with fileUrls
    } catch (error) {
      throw error;
    }
  },
};

