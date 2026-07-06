import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Referral Service
 * Account-owner invitation / referral discount program.
 */
export const referralService = {
  /**
   * Get the current account owner's referral summary.
   * @returns {Promise<Object>} { code, shareUrl, pendingCount, qualifiedCount,
   *                              totalDiscountsEarned, isEligibleNextInvoice, discountPercent }
   */
  async getSummary() {
    const response = await authenticatedFetch(`${API_BASE_URL}/accounts/referrals/summary`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json?.data ?? json;
  },
};
