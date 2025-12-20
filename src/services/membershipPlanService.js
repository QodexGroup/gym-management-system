import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Membership Plan Service
 * Handles all API calls for membership plans
 */
export const membershipPlanService = {
  /**
   * Get all membership plans
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/membership-plans`, {
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
   * Create a new membership plan
   * @param {Object} planData
   * @returns {Promise<Object>}
   */
  async create(planData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/membership-plans`, {
      method: 'POST',
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create membership plan');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update a membership plan
   * @param {number} id
   * @param {Object} planData
   * @returns {Promise<Object>}
   */
  async update(id, planData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update membership plan');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete a membership plan
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete membership plan');
    }

    const data = await response.json();
    return data.success;
  },
};

