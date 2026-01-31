import { authenticatedFetch } from './authService';
import { dashboardService } from './dashboardService';
import { customerBillService } from './customerBillService';
import { MAX_REPORT_ROWS, getReportDateRange } from '../constants/reportConstants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Report Service - collection/summary with max 3 months, 200 rows; email when >200.
 */
export const reportService = {
  async getDashboardStats() {
    return dashboardService.getDashboardStats();
  },

  /**
   * Check if report data for the given range is too large for direct export (> 200 rows).
   * @param {{ reportType: string, dateFrom: string, dateTo: string }} options
   * @returns {{ tooLarge: boolean, rowCount: number }}
   */
  async checkExportSize(options = {}) {
    const { reportType, dateFrom, dateTo } = options;
    const response = await authenticatedFetch(`${API_BASE_URL}/reports/check-export`, {
      method: 'POST',
      body: JSON.stringify({ reportType, dateFrom, dateTo }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to check export size');
    return data.data;
  },

  /**
   * Request email delivery of a report (placeholder – backend returns 202).
   * @param {{ reportType: string, format?: string, dateRange?: string, dateFrom?: string, dateTo?: string }} options
   */
  async emailReport(options = {}) {
    const response = await authenticatedFetch(`${API_BASE_URL}/reports/email`, {
      method: 'POST',
      body: JSON.stringify({
        reportType: options.reportType,
        format: options.format || 'pdf',
        dateRange: options.dateRange,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to request report');
    return data;
  },

  async getCollectionData(options = {}) {
    const { dateRange = 'this_month', customDateFrom, customDateTo } = options;
    const { start: dateFrom, end: dateTo } = getReportDateRange(dateRange, customDateFrom, customDateTo);
    const [stats, billsResult] = await Promise.all([
      dashboardService.getDashboardStats(),
      customerBillService.getAllBills({
        page: 1,
        pagelimit: MAX_REPORT_ROWS,
        filters: { dateFrom, dateTo },
      }),
    ]);
    const allBills = billsResult?.data ?? [];
    const total = billsResult?.total ?? allBills.length;
    const paidBills = allBills.filter((b) => b.billStatus === 'paid' && (parseFloat(b.paidAmount) || 0) > 0);
    paidBills.sort((a, b) => new Date(b.billDate || b.updatedAt) - new Date(a.billDate || a.updatedAt));
    const reportTooLarge = total > MAX_REPORT_ROWS;
    return {
      ...stats,
      recentTransactions: paidBills,
      totalCollectedFromBills: paidBills.reduce((sum, b) => sum + (parseFloat(b.paidAmount) || 0), 0),
      reportTooLarge,
      totalRows: total,
    };
  },
};
