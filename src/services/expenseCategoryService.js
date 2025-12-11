import environment from '../environment/environment';

const API_BASE_URL = environment.API_BASE_URL;

/**
 * Expense Category Service
 * Handles all API calls for expense categories
 */
export const expenseCategoryService = {
  /**
   * Get all expense categories
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories`, {
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
   * Get a single expense category by ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Create a new expense category
   * @param {Object} categoryData
   * @returns {Promise<Object>}
   */
  async create(categoryData) {
    const response = await fetch(`${API_BASE_URL}/expense-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update an expense category
   * @param {number} id
   * @param {Object} categoryData
   * @returns {Promise<Object>}
   */
  async update(id, categoryData) {
    const response = await fetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete an expense category
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete expense category');
    }

    const data = await response.json();
    return data.success;
  },
};

