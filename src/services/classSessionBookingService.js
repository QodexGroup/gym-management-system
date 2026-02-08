import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Session Booking Service
 * Handles all API calls for class session bookings
 */
export const classSessionBookingService = {
  /**
   * Book a class session for a client
   * @param {number} sessionId - Class schedule session ID
   * @param {number} customerId - Customer ID
   * @param {string} notes - Optional booking notes
   * @returns {Promise<Object>}
   */
  async bookSession(sessionId, customerId, notes = '') {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerId,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get all bookings for a specific session
   * @param {number} sessionId - Class schedule session ID
   * @returns {Promise<Array>}
   */
  async getBookingsBySession(sessionId) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings/session/${sessionId}`, {
        method: 'GET',
      });

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
   * Update attendance status for a specific booking
   * @param {number} bookingId - Booking ID
   * @param {string} status - New status ('attended', 'no_show', 'cancelled')
   * @returns {Promise<Object>}
   */
  async updateAttendanceStatus(bookingId, status) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings/${bookingId}/attendance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get booking sessions for calendar view (by date range)
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>}
   */
  async getBookingSessions(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings?${params.toString()}`, {
        method: 'GET',
      });

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
   * Mark all bookings for a session as attended
   * @param {number} sessionId - Class schedule session ID
   * @returns {Promise<Object>}
   */
  async markAllAsAttended(sessionId) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings/session/${sessionId}/mark-all-attended`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Update a booking (customer, session, notes)
   * @param {number} bookingId - Booking ID
   * @param {Object} bookingData - Booking data to update
   * @returns {Promise<Object>}
   */
  async updateBooking(bookingId, bookingData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get a booking by ID
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>}
   */
  async getBookingById(bookingId) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-session-bookings/${bookingId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Get customer's class session booking history
   * @param {number} customerId - Customer ID
   * @param {Object} options - Query options (page, pagelimit, relations, etc.)
   * @returns {Promise<Object>}
   */
  async getCustomerHistory(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.relations) params.append('relations', options.relations);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/class-session-bookings/history?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return normalizePaginatedResponse(data);
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};
