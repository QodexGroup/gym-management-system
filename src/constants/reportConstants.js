/**
 * Report limits and date range options (max 3 months: current + previous 2)
 */
export const MAX_REPORT_ROWS = 200;
export const MAX_REPORT_MONTHS = 3;

export const REPORT_DATE_RANGE_OPTIONS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * Get date range (YYYY-MM-DD) for report filter
 * @param {'this_month'|'last_month'|'last_3_months'|'custom'} key
 * @param {string} [customStart] - Required when key === 'custom' (YYYY-MM-DD)
 * @param {string} [customEnd] - Required when key === 'custom' (YYYY-MM-DD)
 * @returns {{ start: string, end: string }}
 */
export function getReportDateRange(key, customStart, customEnd) {
  const now = new Date();
  const toDate = (d) => d.toISOString().slice(0, 10);

  if (key === 'custom' && customStart && customEnd) {
    return { start: customStart.slice(0, 10), end: customEnd.slice(0, 10) };
  }

  switch (key) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: toDate(start), end: toDate(end) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toDate(start), end: toDate(end) };
    }
    case 'last_3_months': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: toDate(start), end: toDate(end) };
    }
    default:
      return getReportDateRange('this_month');
  }
}
