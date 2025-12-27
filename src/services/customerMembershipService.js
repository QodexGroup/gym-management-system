import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Membership Service
 * Handles API calls for customer membership operations
 */
export const customerMembershipService = {
  /**
   * Create or update customer membership
   * @param {number} customerId - Customer ID
   * @param {Object} membershipData - Membership data
   * @param {number} membershipData.membershipPlanId - Membership plan ID
   * @param {string} [membershipData.membershipStartDate] - Optional start date (YYYY-MM-DD)
   * @returns {Promise<Object>} Response data
   */
  async createOrUpdate(customerId, membershipData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/${customerId}/membership`, {
      method: 'POST',
      body: JSON.stringify(membershipData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create/update membership');
    }

    return await response.json();
  },
};

