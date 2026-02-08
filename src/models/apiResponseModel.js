/**
 * API Response Models
 * Standardized models for API responses with pagination support
 */

/**
 * Pagination metadata structure
 * @typedef {Object} PaginationMeta
 * @property {number} current_page - Current page number
 * @property {number} last_page - Last page number
 * @property {number} per_page - Items per page
 * @property {number} total - Total number of items
 * @property {number} from - Starting item number
 * @property {number} to - Ending item number
 */

/**
 * Pagination links structure
 * @typedef {Object} PaginationLinks
 * @property {string|null} first - First page URL
 * @property {string|null} last - Last page URL
 * @property {string|null} prev - Previous page URL
 * @property {string|null} next - Next page URL
 */

/**
 * Paginated response data structure
 * @typedef {Object} PaginatedResponseData
 * @property {Array} data - Array of items
 * @property {PaginationMeta} meta - Pagination metadata
 * @property {PaginationLinks} links - Pagination links
 */

/**
 * Standard API response structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {PaginatedResponseData|Array|Object|null} data - Response data
 * @property {string|null} message - Success or error message
 * @property {Object|null} error - Error details
 */

/**
 * Normalize paginated API response to standard format
 * GetApiResponseModel structure: { success: true, data: { data: [...], meta: {...}, links: {...} } }
 * @param {Object} response - Raw API response
 * @returns {Object} Normalized response with { data, pagination }
 */
export const normalizePaginatedResponse = (response) => {

  return {
    data: Array.isArray(response.data.data) ? response.data.data : [],
    pagination: {
      currentPage: response.data.meta.current_page,
      lastPage: response.data.meta.last_page,
      perPage: response.data.meta.per_page,
      total: response.data.meta.total,
      from: response.data.meta.from,
      to: response.data.meta.to,
    },
  };
};


/**
 * Normalize non-paginated API response
 * @param {Object} response - Raw API response
 * @returns {*} Response data or null
 */
export const normalizeResponse = (response) => {
  if (!response || !response.success) {
    return null;
  }
  return response.data || null;
};
