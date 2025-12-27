import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * User Service
 * Handles all API calls for users
 */
export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        return [];
      }

      // Handle paginated response - extract the data array from pagination object
      if (data.data && Array.isArray(data.data.data)) {
        return data.data.data; // Paginated response: { data: { data: [...], ...pagination } }
      }
      
      // Handle non-paginated response (fallback)
      if (Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get all active coaches
   * @returns {Promise<Array>}
   */
  async getCoaches() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/coaches`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        return [];
      }

      // Handle non-paginated response (coaches endpoint returns collection)
      if (Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Create a new user
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update a user
   * @param {number} id
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async update(id, userData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete a user
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Deactivate a user
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deactivate(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}/deactivate`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate user');
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Activate a user
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async activate(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}/activate`, {
      method: 'PUT',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to activate user');
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Reset user password
   * @param {number} id
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async resetPassword(id, password) {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }

    const data = await response.json();
    return data.success;
  },
};

