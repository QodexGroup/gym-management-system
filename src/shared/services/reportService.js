import { authenticatedFetch } from './authService';
import { dashboardService } from './dashboardService';
import { MAX_REPORT_ROWS, getReportDateRange } from '../constants/reportConstants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Report Service - collection/summary payment-based; max 200 rows; email when >200.
 */
export const reportService = {
  async getDashboardStats() {
    return dashboardService.getAccountDashboardMetrics();
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
      dashboardService.getAccountDashboardMetrics(),
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
      // Collection (cash basis): payments actually received.
      totalCollection: payload.totalCollectedFromPayments ?? 0,
      todayCollection: payload.todayCollection ?? stats?.todayCollection ?? 0,
      // Revenue (accrual basis): amount billed, whether paid or not.
      totalRevenue: payload.totalRevenueBilled ?? 0,
      todayRevenue: payload.todayRevenue ?? stats?.todayRevenue ?? 0,
      reportTooLarge: payload.reportTooLarge ?? false,
      totalRows: payload.totalRows ?? 0,
    };
  },

  /**
   * Get revenue report data (bill-based) from API.
   */
  async getRevenueData(options = {}) {
    const { dateRange = 'this_month', customDateFrom, customDateTo } = options;
    const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
    const response = await authenticatedFetch(
      `${API_BASE_URL}/reports/revenue-data?${new URLSearchParams({ startDate: dateFrom, endDate: dateTo })}`
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load report data');
    }
    const json = await response.json();
    const payload = json.data ?? json;
    return {
      recentBills: payload.recentBills ?? [],
      // Revenue (accrual): amount billed. Collected: amount paid against those bills.
      totalRevenue: payload.totalRevenue ?? 0,
      totalCollected: payload.totalCollected ?? 0,
      totalOutstanding: payload.totalOutstanding ?? 0,
      todayRevenue: payload.todayRevenue ?? 0,
      reportTooLarge: payload.reportTooLarge ?? false,
      totalRows: payload.totalRows ?? 0,
    };
  },
};
