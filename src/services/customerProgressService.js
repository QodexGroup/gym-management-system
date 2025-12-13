const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Progress Service
 * Handles all API calls for customer progress tracking
 */
export const customerProgressService = {
  /**
   * Get all progress records for a customer
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} - Returns paginated data
   */
  async getByCustomerId(customerId, page = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/progress/${customerId}?page=${page}`, {
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
   * Get a progress record by ID
   * @param {number} id - Progress record ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/progress/${id}`, {
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
   * Create a new progress record
   * @param {number} customerId - Customer ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object>}
   */
  async create(customerId, progressData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/progress/${customerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create progress record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a progress record
   * @param {number} id - Progress record ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object>}
   */
  async update(id, progressData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/progress/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update progress record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a progress record
   * @param {number} id - Progress record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/progress/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete progress record');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};

