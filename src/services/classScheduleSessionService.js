import { authenticatedFetch, putWithIdempotency } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Schedule Session Service
 * Handles all API calls for class schedule sessions
 */
export const classScheduleSessionService = {
  /**
   * Get all class schedule sessions with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);
      if (options.sorts) params.append('sorts', JSON.stringify(options.sorts));

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedule-sessions?${params.toString()}`, {
        method: 'GET',
      });

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

  /**
   * Update a class schedule session
   * @param {number} id - Session ID
   * @param {Object} data - Update data (startTime, endTime, duration)
   * @param {string} idempotencyKey - Optional idempotency key for deduplication
   * @returns {Promise<Object>}
   */
  async update(id, data, idempotencyKey = null) {
    try {
      const options = idempotencyKey ? { idempotencyKey } : {};
      const response = await putWithIdempotency(`${API_BASE_URL}/class-schedule-sessions/${id}`, data, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};
