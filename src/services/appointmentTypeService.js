const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Appointment Type Service
 * Handles all API calls for appointment types
 */
export const appointmentTypeService = {
  /**
   * Get all appointment types
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/appointment-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle { success: true, data: { data: [...] } } format (nested from collection)
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          return data.data;
        }
        if (data.data.data && Array.isArray(data.data.data)) {
          return data.data.data;
        }
      }
      
      // Handle { data: [...] } format (direct response)
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      // Handle { data: { data: [...] } } format (nested without success)
      if (data.data && data.data.data && Array.isArray(data.data.data)) {
        return data.data.data;
      }
      
      // Fallback: if data itself is an array
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },
};

