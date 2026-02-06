import { authenticatedFetch } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * My Collection Service – trainer-specific stats (real data).
 */
export const myCollectionService = {
  async getMyCollectionStats() {
    const response = await authenticatedFetch(`${API_BASE_URL}/dashboard/my-collection`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch My Collection stats');
    return data.data;
  },
};
