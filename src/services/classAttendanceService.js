import { authenticatedFetch } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Class Attendance Service
 * Handles all API calls for class attendance
 */
export const classAttendanceService = {
  /**
   * Get attendances for a class schedule
   * @param {number} scheduleId
   * @returns {Promise<Array>}
   */
  async getByScheduleId(scheduleId) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/class-schedules/${scheduleId}/attendances`,
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
   * Mark attendance for a class
   * @param {number} scheduleId
   * @param {Object} attendanceData
   * @returns {Promise<Object>}
   */
  async markAttendance(scheduleId, attendanceData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/class-schedules/${scheduleId}/attendances`,
        {
          method: 'POST',
          body: JSON.stringify(attendanceData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark attendance');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update attendance
   * @param {number} id
   * @param {Object} attendanceData
   * @returns {Promise<Object>}
   */
  async update(id, attendanceData) {
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/attendances/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(attendanceData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update attendance');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get customer's attendance history
   * @param {number} customerId
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async getByCustomerId(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/customers/${customerId}/attendances?${params.toString()}`,
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

