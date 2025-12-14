const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Scan Service
 * Handles all API calls for customer scans (InBody/Styku)
 */
export const customerScanService = {
  /**
   * Get all scans for a customer
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} - Returns paginated data
   */
  async getByCustomerId(customerId, page = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/scans/${customerId}?page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle paginated response
        if (data.data && data.data.data) {
          return {
            data: data.data.data,
            pagination: {
              currentPage: data.data.meta.current_page,
              lastPage: data.data.meta.last_page,
              perPage: data.data.meta.per_page,
              total: data.data.meta.total,
              from: data.data.meta.from,
              to: data.data.meta.to,
            }
          };
        }
        // Fallback for non-paginated response
        return {
          data: Array.isArray(data.data) ? data.data : [],
          pagination: null
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
   * Get a scan by ID
   * @param {number} id - Scan ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/scans/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
   * Create a new scan
   * @param {number} customerId - Customer ID
   * @param {Object} scanData - Scan data
   * @returns {Promise<Object>}
   */
  async create(customerId, scanData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/scans/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(scanData),
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
      const response = await fetch(`${API_BASE_URL}/customers/scans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
      const response = await fetch(`${API_BASE_URL}/customers/scans/${customerId}/type/${scanType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
      const response = await fetch(`${API_BASE_URL}/customers/scans/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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

