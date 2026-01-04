import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Expense Category Service
 * Handles all API calls for expense categories
 */
export const expenseCategoryService = {
  /**
   * Get all expense categories with pagination and filtering
   * @param {Object} options - Query options (page, pagelimit, sort, filters, relations)
   * @returns {Promise<Object>} - Returns paginated data
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.sort) params.append('sort', options.sort);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));
      if (options.relations) params.append('relations', options.relations);
      if (options.sorts) params.append('sorts', JSON.stringify(options.sorts));

      const response = await authenticatedFetch(`${API_BASE_URL}/expense-categories?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Handle paginated response from Laravel paginator
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
        // Fallback for non-paginated response
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

  /**
   * Get a single expense category by ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await authenticatedFetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Create a new expense category
   * @param {Object} categoryData
   * @returns {Promise<Object>}
   */
  async create(categoryData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/expense-categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Update an expense category
   * @param {number} id
   * @param {Object} categoryData
   * @returns {Promise<Object>}
   */
  async update(id, categoryData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/expense-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update expense category');
    }

    const data = await response.json();
    return data.success ? data.data : null;
  },

  /**
   * Delete an expense category
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/expense-categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete expense category');
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      throw error;
    }
  },
};
