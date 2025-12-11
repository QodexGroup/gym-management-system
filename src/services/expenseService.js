import environment from '../environment/environment';

const API_BASE_URL = environment.API_BASE_URL;

/**
 * Expense Service
 * Handles all API calls for expenses
 */
export const expenseService = {
  /**
   * Get all expenses
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
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
   * Create a new expense
   * @param {Object} expenseData
   * @returns {Promise<Object>}
   */
  async create(expenseData) {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create expense');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update an expense
   * @param {number} id
   * @param {Object} expenseData
   * @returns {Promise<Object>}
   */
  async update(id, expenseData) {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update expense');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete an expense
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete expense');
    }

    const data = await response.json();
    return data.success;
  },
};

