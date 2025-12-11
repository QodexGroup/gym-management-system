import environment from '../environment/environment';

const API_BASE_URL = environment.API_BASE_URL;

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
      const response = await fetch(`${API_BASE_URL}/membership-plans`, {
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
   * Create a new membership plan
   * @param {Object} planData
   * @returns {Promise<Object>}
   */
  async create(planData) {
    const response = await fetch(`${API_BASE_URL}/membership-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/membership-plans/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete membership plan');
    }

    const data = await response.json();
    return data.success;
  },
};

