import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Subscription Plan Service
 * Handles fetching available subscription plans for the account owner.
 */
export const subscriptionPlanService = {
  async getPlans() {
    const res = await authenticatedFetch(`${API_BASE_URL}/auth/subscription-plans`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch plans');
    }
    return json.success ? json.data : [];
  },
};

