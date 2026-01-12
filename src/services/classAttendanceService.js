import { authenticatedFetch } from './authService';

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
      if (data.success) {
        if (data.data && data.data.data) {
          return {
            data: data.data.data,
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: data.data.from,
            to: data.data.to,
          };
        }
        return {
          data: Array.isArray(data.data) ? data.data : [],
          current_page: 1,
          last_page: 1,
          per_page: data.data?.length || 0,
          total: data.data?.length || 0,
          from: 1,
          to: data.data?.length || 0,
        };
      }
      return {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 0,
        total: 0,
        from: 0,
        to: 0,
      };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};

