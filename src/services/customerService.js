
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Service
 * Handles all API calls for customers
 */
export const customerService = {
  /**
   * Get a customer by ID
   * @param {number} id - Customer ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
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
   * Get all customers with pagination
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async getAll(page = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers?page=${page}`, {
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
   * Create a new customer
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  async create(customerData) {
    // COMMENTED OUT: Data saving disabled
    throw new Error('Data saving is currently disabled');
    
    /* COMMENTED OUT - Customer creation functionality
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
    */
  },

  /**
   * Update a customer
   * @param {number} id
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  async update(id, customerData) {
    // COMMENTED OUT: Data saving disabled
    throw new Error('Data saving is currently disabled');
    
    /* COMMENTED OUT - Customer update functionality
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update customer');
    }

    const data = await response.json();
    return data.success ? data.data : null;
    */
  },

  /**
   * Delete a customer
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete customer');
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Get all trainers
   * @returns {Promise<Array>}
   */
  async getTrainers() {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/trainers`, {
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
};

