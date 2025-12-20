const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Bill Service
 * Handles all API calls for customer bills
 */
export const customerBillService = {
  /**
   * Get all bills for a customer
   * @param {number} customerId
   * @returns {Promise<Array>}
   */
  async getByCustomerId(customerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/bills/customer/${customerId}`, {
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
   * Create a new bill
   * @param {Object} billData
   * @returns {Promise<Object>}
   */
  async create(billData) {
    // COMMENTED OUT: Data saving disabled
    throw new Error('Data saving is currently disabled');
    
    /* COMMENTED OUT - Bill creation functionality
    const response = await fetch(`${API_BASE_URL}/customers/bills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create bill');
    }

    const data = await response.json();
    return data.success ? data.data : null;
    */
  },

  /**
   * Update a bill
   * @param {number} id
   * @param {Object} billData
   * @returns {Promise<Object>}
   */
  async update(id, billData) {
    // COMMENTED OUT: Data saving disabled
    throw new Error('Data saving is currently disabled');
    
    /* COMMENTED OUT - Bill update functionality
    const response = await fetch(`${API_BASE_URL}/customers/bills/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(billData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update bill');
    }

    const data = await response.json();
    return data.success ? data.data : null;
    */
  },

  /**
   * Delete a bill
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/customers/bills/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete bill');
    }

    const data = await response.json();
    return data.success;
  },
};

