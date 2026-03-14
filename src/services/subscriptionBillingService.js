import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Subscription Billing Service
 * Handles account billing information used for invoices.
 */
export const subscriptionBillingService = {
  async getBillingInformation() {
    const res = await authenticatedFetch(`${API_BASE_URL}/auth/account`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch billing information');
    }
    return json.success ? json.data : null;
  },

  async updateBillingInformation(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to save billing information');
    }
    return json.success ? json.data : null;
  },
};

