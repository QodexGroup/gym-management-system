const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer Appointment Service
 * Handles all API calls for customer appointments
 */
export const customerAppointmentService = {
  /**
   * Get all appointments for a customer
   * @param {number} customerId - Customer ID
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Object>} - Returns paginated data with data array and pagination info
   */
  async getAll(customerId, page = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/appointments/${customerId}?page=${page}`, {
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
      if (data.success) {
        // Handle paginated response
        if (data.data && data.data.data) {
          return {
            data: data.data.data,
            pagination: {
              currentPage: data.data.meta.current_page,
              lastPage: data.data.meta.last_page,
              perPage: data.data.meta.per_page,
              total: data.data.meta.total,
              from: data.data.meta.from,
              to: data.data.meta.to,
            }
          };
        }
        // Fallback for non-paginated response
        return {
          data: Array.isArray(data.data) ? data.data : [],
          pagination: null
        };
      }
      return { data: [], pagination: null };
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
      }
      throw error;
    }
  },

  /**
   * Create a new appointment
   * @param {number} customerId - Customer ID
   * @param {Object} appointmentData
   * @returns {Promise<Object>}
   */
  async create(customerId, appointmentData) {
    const response = await fetch(`${API_BASE_URL}/customers/appointments/${customerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create appointment');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update an appointment
   * @param {number} id
   * @param {Object} appointmentData
   * @returns {Promise<Object>}
   */
  async update(id, appointmentData) {
    const response = await fetch(`${API_BASE_URL}/customers/appointments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update appointment');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete an appointment
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/customers/appointments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete appointment');
    }

    const data = await response.json();
    return data.success;
  },
};

