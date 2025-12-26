import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Payment Service
 * Handles API calls for adding and deleting payments
 */
export const customerPaymentService = {
  /**
   * Create a new payment for a bill
   * @param {number} billId
   * @param {Object} paymentData
   * @returns {Promise<Object>}
   */
  async create(billId, paymentData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/bills/${billId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to record payment');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Get all payments for a bill
   * @param {number} billId
   * @param {Object} options - Optional query parameters (page, pagelimit, sort, filters, etc.)
   * @returns {Promise<Array|Object>} - Returns array if not paginated, or pagination object if paginated
   */
  async getByBillId(billId, options = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      if (options.page) queryParams.append('page', options.page);
      if (options.pagelimit) queryParams.append('pagelimit', options.pagelimit);
      if (options.sort) queryParams.append('sort', options.sort);
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            queryParams.append(`filters[${key}]`, value);
          }
        });
      }

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/customers/bills/${billId}/payments${queryString ? `?${queryString}` : ''}`;

      const response = await authenticatedFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to load payments');
      }

      const data = await response.json();
      if (!data.success) {
        return [];
      }

      // Handle paginated response - extract the data array from pagination object
      if (data.data && Array.isArray(data.data.data)) {
        return data.data; // Return full pagination object: { data: [...], current_page, total, etc. }
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
   * Delete a payment
   * @param {number} paymentId
   * @returns {Promise<boolean>}
   */
  async delete(paymentId) {
    const response = await authenticatedFetch(`${API_BASE_URL}/customers/bills/payments/${paymentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete payment');
    }

    const data = await response.json();
    return data.success;
  },
};


