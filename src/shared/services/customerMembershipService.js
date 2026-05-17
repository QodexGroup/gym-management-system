import { authenticatedFetch, postWithIdempotency } from './authService';

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
   * @param {string} idempotencyKey - Optional idempotency key for deduplication
   * @returns {Promise<Object>} Response data
   */
  async createOrUpdate(customerId, membershipData, idempotencyKey = null) {
    const options = idempotencyKey ? { idempotencyKey } : {};
    const response = await postWithIdempotency(`${API_BASE_URL}/customers/${customerId}/membership`, membershipData, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create/update membership');
    }

    return await response.json();
  },
};

