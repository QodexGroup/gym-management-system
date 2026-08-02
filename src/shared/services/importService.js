import { authenticatedFetch, getAuthToken } from './authService';
import { normalizePaginatedResponse } from '../models/apiResponseModel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Turn a fetch network failure into a friendly connection error.
 * @param {Error} error
 * @returns {Error}
 */
const asConnectionError = (error) => {
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return new Error('Cannot connect to API. Please check if the server is running and CORS is configured.');
  }
  return error;
};

/**
 * Import Service
 * Handles all API calls for the client (customer) data importer.
 */
export const importService = {
  /**
   * Get the list of available import types.
   * @returns {Promise<Array<Object>>}
   */
  async getTypes() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/import/types`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Get the field definitions and options for an import type.
   * @param {string} type
   * @returns {Promise<{importFields: Array<Object>, importOptions: Array<Object>}>}
   */
  async getFields(type) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/import/fields/${type}`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : { importFields: [], importOptions: [] };
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Upload a file and create a pending import job. Sends multipart/form-data,
   * so it does not go through authenticatedFetch (which forces a JSON body).
   * @param {File} file
   * @param {string} importType
   * @returns {Promise<Object>} Upload result: { importJobId, fileHeaders, totalRows, importFields, importOptions }.
   */
  async upload(file, importType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/import/upload`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Upload failed (${response.status})`);
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Save the column mapping and start the async import.
   * @param {number} importJobId
   * @param {Object<string, string>} columnMapping - field key => file column name.
   * @param {Object|null} options
   * @returns {Promise<Object>} The import job.
   */
  async execute(importJobId, columnMapping, options = null) {
    const response = await authenticatedFetch(`${API_BASE_URL}/import/execute`, {
      method: 'POST',
      body: JSON.stringify({ importJobId, columnMapping, options }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to start import');
    }
    return data.data;
  },

  /**
   * Get the status/progress of an import job.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getStatus(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/import/status/${id}`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Get the paginated import history.
   * @param {Object} options - Query options (page, pagelimit, filters).
   * @returns {Promise<{data: Array<Object>, pagination: Object}>}
   */
  async getHistory(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.pagelimit) params.append('pagelimit', options.pagelimit);
      if (options.filters) params.append('filters', JSON.stringify(options.filters));

      const response = await authenticatedFetch(`${API_BASE_URL}/import/history?${params.toString()}`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return normalizePaginatedResponse(data);
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Get the failed row results for an import job.
   * @param {number} id
   * @returns {Promise<Array<Object>>}
   */
  async getFailedResults(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/import/status/${id}/failed`, { method: 'GET' });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      throw asConnectionError(error);
    }
  },

  /**
   * Download the generated error file for an import job (triggers a browser download).
   * @param {number} id
   * @param {string} [filename]
   * @returns {Promise<void>}
   */
  async downloadResult(id, filename = 'import-errors.csv') {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/import/download-result/${id}`, {
      method: 'GET',
      headers: {
        Accept: 'text/csv',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'No result file available');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
