import { authenticatedFetch, putWithIdempotency } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Account System Settings service (admin-only write). Backed by the generic
 * /system-settings endpoint.
 */
export const accountSystemSettingService = {
  async get() {
    const response = await authenticatedFetch(`${API_BASE_URL}/system-settings`, { method: 'GET' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.success ? data.data : null;
  },

  async update(settings, idempotencyKey = null) {
    const options = idempotencyKey ? { idempotencyKey } : {};
    const response = await putWithIdempotency(`${API_BASE_URL}/system-settings`, settings, options);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update settings');
    }
    const data = await response.json();
    return data.success ? data.data : null;
  },
};
