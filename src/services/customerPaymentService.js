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
    const response = await fetch(`${API_BASE_URL}/customers/bills/${billId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
   * @returns {Promise<Array>}
   */
  async getByBillId(billId) {
    const response = await fetch(`${API_BASE_URL}/customers/bills/${billId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to load payments');
    }

    const data = await response.json();
    return data.success ? data.data : [];
  },

  /**
   * Delete a payment
   * @param {number} paymentId
   * @returns {Promise<boolean>}
   */
  async delete(paymentId) {
    const response = await fetch(`${API_BASE_URL}/customers/bills/payments/${paymentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete payment');
    }

    const data = await response.json();
    return data.success;
  },
};


