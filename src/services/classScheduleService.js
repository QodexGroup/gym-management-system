import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Schedule Service
 * Handles all API calls for class schedules
 */
export const classScheduleService = {
  /**
   * Get my class schedules (for coaches)
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getMySchedules(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/my-schedules?${params.toString()}`, {
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
   * Get all class schedules with pagination
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

      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules?${params.toString()}`, {
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
   * Create a new class schedule
   * @param {Object} scheduleData
   * @returns {Promise<Object>}
   */
  async create(scheduleData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules`, {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create class schedule');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a class schedule
   * @param {number} id
   * @param {Object} scheduleData
   * @returns {Promise<Object>}
   */
  async update(id, scheduleData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update class schedule');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a class schedule
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/class-schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete class schedule');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};

