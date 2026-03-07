import { authenticatedFetch } from './authService';
import { dashboardService } from './dashboardService';
import { MAX_REPORT_ROWS, getReportDateRange } from '../constants/reportConstants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Report Service - collection/summary payment-based; max 200 rows; email when >200.
 */
export const reportService = {
  async getDashboardStats() {
    return dashboardService.getDashboardStats();
  },

  /**
   * Check if report data for the given range is too large for direct export (> 200 rows).
   * @param {{ reportType: string, dateFrom: string, dateTo: string }} options (sent as startDate, endDate to API)
   * @returns {{ tooLarge: boolean, rowCount: number }}
   */
  async checkExportSize(options = {}) {
    const { reportType, dateFrom, dateTo } = options;
    const response = await authenticatedFetch(`${API_BASE_URL}/reports/check-export`, {
      method: 'POST',
      body: JSON.stringify({ reportType, startDate: dateFrom, endDate: dateTo }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to check export size');
    return data.data;
  },

  /**
   * Request email delivery of a report (placeholder – backend returns 202).
   * @param {{ reportType: string, format?: string, dateRange?: string, dateFrom?: string, dateTo?: string }} options (sent as startDate, endDate to API)
   */
  async emailReport(options = {}) {
    const response = await authenticatedFetch(`${API_BASE_URL}/reports/email`, {
      method: 'POST',
      body: JSON.stringify({
        reportType: options.reportType,
        format: options.format || 'pdf',
        dateRange: options.dateRange,
        startDate: options.dateFrom,
        endDate: options.dateTo,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to request report');
    return data;
  },

  /**
   * Get collection/summary report data (payment-based) from API.
   */
  async getCollectionData(options = {}) {
    const { dateRange = 'this_month', customDateFrom, customDateTo } = options;
    const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
    const [stats, collectionResponse] = await Promise.all([
      dashboardService.getDashboardStats(),
      authenticatedFetch(`${API_BASE_URL}/reports/collection-data?${new URLSearchParams({ startDate: dateFrom, endDate: dateTo })}`),
    ]);
    if (!collectionResponse.ok) {
      const err = await collectionResponse.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load report data');
    }
    const collectionJson = await collectionResponse.json();
    const payload = collectionJson.data ?? collectionJson;
    return {
      ...stats,
      recentTransactions: payload.recentTransactions ?? [],
      totalCollectedFromBills: payload.totalCollectedFromPayments ?? 0,
      todayRevenue: payload.todayRevenue ?? stats?.todayRevenue ?? 0,
      reportTooLarge: payload.reportTooLarge ?? false,
      totalRows: payload.totalRows ?? 0,
    };
  },
};
