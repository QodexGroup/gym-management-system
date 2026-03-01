import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const subscriptionService = {
  async getPlans() {
    const res = await authenticatedFetch(`${API_BASE_URL}/platform-subscription-plans`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch plans');
    return json.success ? json.data : [];
  },

  async getSubscriptionRequests() {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/subscription-requests`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch requests');
    return json.success ? json.data : [];
  },

  async createSubscriptionRequest(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/subscription-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit request');
    return json.success ? json.data : null;
  },

  async getAdminSubscriptionRequests() {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/subscription-requests`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch requests');
    return json.success ? json.data : [];
  },

  async approveRequest(id) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/subscription-requests/${id}/approve`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to approve');
    return json.success ? json.data : null;
  },

  async rejectRequest(id, rejectionReason = null) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/subscription-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason: rejectionReason || '' }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reject');
    return json.success ? json.data : null;
  },

  async getBillingInformation() {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/billing-information`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch billing information');
    return json.success ? json.data : null;
  },

  async updateBillingInformation(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/billing-information`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save billing information');
    return json.success ? json.data : null;
  },
};
