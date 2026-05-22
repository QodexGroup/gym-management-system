import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Subscription Payment Service
 * Handles subscription requests, invoices, and payment-related history.
 */
export const subscriptionPaymentService = {
  /**
   * Get subscription requests for the current account (used for invoices/payments history).
   * Backend only supports pagination (no filters).
   */
  async getAccountRequests(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.page) {
      searchParams.set('page', params.page);
    }
    if (params.pagelimit) {
      searchParams.set('pagelimit', params.pagelimit);
    }

    const url = `${API_BASE_URL}/accounts/payment-requests${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;

    const res = await authenticatedFetch(url);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch payment requests');
    }

    if (!json.success || !json.data) {
      return { data: [], pagination: null };
    }

    return normalizePaginatedResponse(json);
  },

  /**
   * Create a subscription plan change request (takes effect on next billing cycle).
   * This updates the plan selection without creating invoices or payment requests.
   */
  async createRequest(payload) {
    if (!payload.subscriptionPlanId) {
      throw new Error('subscriptionPlanId is required for plan changes');
    }
    
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/subscription-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to update subscription plan');
    }
    return json.success ? json.data : null;
  },

  /**
   * Create a payment request for an invoice (requires invoiceId and receipt).
   */
  async createInvoicePaymentRequest(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/payment-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to submit payment request');
    }
    return json.success ? json.data : null;
  },

  /**
   * Create a standalone reactivation payment request for the current account.
   */
  async createReactivationPaymentRequest(payload) {
    const res = await authenticatedFetch(`${API_BASE_URL}/accounts/reactivation-payment-request`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to submit reactivation payment');
    }
    return json.success ? json.data : null;
  },

  /**
   * Admin: get all subscription requests.
   */
  async getAdminRequests() {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/payment-requests`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to fetch admin subscription requests');
    }
    return json.success ? json.data : [];
  },

  async approveRequest(id) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/subscription-requests/${id}/approve`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to approve subscription request');
    }
    return json.success ? json.data : null;
  },

  async rejectRequest(id, rejectionReason = null) {
    const res = await authenticatedFetch(`${API_BASE_URL}/admin/subscription-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason: rejectionReason || '' }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to reject subscription request');
    }
    return json.success ? json.data : null;
  },
};

