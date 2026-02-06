import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * PT Booking Service
 * Handles all API calls for PT bookings
 */
export const ptBookingService = {
  /**
   * Get PT bookings by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Query options (relations, etc.)
   * @returns {Promise<Array>}
   */
  async getAll(startDate = null, endDate = null, options = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (options.relations) params.append('relations', options.relations);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));

      const response = await authenticatedFetch(
        `${API_BASE_URL}/pt-bookings?${params.toString()}`,
        {
          method: 'GET',
        }
      );

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
   * Get PT bookings by coach ID and date range
   * @param {number} coachId - Coach ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {Object} options - Query options (relations, etc.)
   * @returns {Promise<Array>}
   */
  async getByCoachId(coachId, startDate = null, endDate = null, options = {}) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (options.relations) params.append('relations', options.relations);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));

      const response = await authenticatedFetch(
        `${API_BASE_URL}/pt-bookings/coach/${coachId}?${params.toString()}`,
        {
          method: 'GET',
        }
      );

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
   * Create a new PT booking
   * @param {Object} bookingData - Booking data in snake_case format
   * @returns {Promise<Object>}
   */
  async create(bookingData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pt-bookings`, {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create PT booking');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a PT booking
   * @param {number} id - Booking ID
   * @param {Object} bookingData - Booking data in snake_case format
   * @returns {Promise<Object>}
   */
  async update(id, bookingData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pt-bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update PT booking');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark a PT booking as cancelled
   * @param {number} id - Booking ID
   * @returns {Promise<Object>}
   */
  async markAsCancelled(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pt-bookings/${id}/cancel`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel PT booking');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark a PT booking as attended
   * @param {number} id - Booking ID
   * @returns {Promise<Object>}
   */
  async markAsAttended(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pt-bookings/${id}/attend`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark PT booking as attended');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark a PT booking as no-show
   * @param {number} id - Booking ID
   * @returns {Promise<Object>}
   */
  async markAsNoShow(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pt-bookings/${id}/no-show`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark PT booking as no-show');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get PT bookings by class schedule session ID
   * @param {number} sessionId - Class schedule session ID
   * @returns {Promise<Array>}
   */
  async getBySessionId(sessionId) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/pt-bookings/session/${sessionId}`,
        {
          method: 'GET',
        }
      );

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
};
