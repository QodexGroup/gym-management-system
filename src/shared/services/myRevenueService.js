import { authenticatedFetch } from './authService';
import { getReportDateRange } from '../constants/reportConstants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * My Revenue Service – coach bill-based report (date-range filtered).
 */
export const myRevenueService = {
  async getMyRevenueStats(options = {}) {
    const { dateRange = 'this_month', customDateFrom, customDateTo } = options;
    const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
    const response = await authenticatedFetch(
      `${API_BASE_URL}/dashboard/my-revenue?${new URLSearchParams({ startDate: dateFrom, endDate: dateTo })}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch My Revenue stats');
    return data.data;
  },
};
