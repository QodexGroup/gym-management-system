import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Customer File Service
 * Handles all API calls for customer file metadata
 */
export const customerFileService = {
  /**
   * Create a file record for a progress entry
   * @param {number} progressId - Progress record ID
   * @param {Object} fileData - File metadata (without fileableType - determined by backend)
   * @returns {Promise<Object>}
   */
  async createProgressFile(progressId, fileData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/progress/${progressId}/files`, {
        method: 'POST',
        body: JSON.stringify(fileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save file record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a file record for a scan entry
   * @param {number} scanId - Scan record ID
   * @param {Object} fileData - File metadata (without fileableType - determined by backend)
   * @returns {Promise<Object>}
   */
  async createScanFile(scanId, fileData) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/scans/${scanId}/files`, {
        method: 'POST',
        body: JSON.stringify(fileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save file record');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all files for a customer
   * @param {number} customerId - Customer ID
   * @returns {Promise<Array>}
   */
  async getByCustomerId(customerId) {
    try {
      const params = new URLSearchParams();
      params.append('customerId', customerId);
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/files?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a file record
   * @param {number} id - File ID
   * @returns {Promise<{fileUrl: string}>}
   */
  async delete(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/customers/files/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file record');
      }

      const data = await response.json();
      return data.data || { fileUrl: null };
    } catch (error) {
      throw error;
    }
  },
};

