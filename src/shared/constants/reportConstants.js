/**
 * Report limits and date range options (max 3 months: current + previous 2)
 */
export const MAX_REPORT_ROWS = 200;

/** Chart hover and tooltip: themed via surface tokens so it matches light/dark mode (white card + dark text in light, dark card + light text in dark) */
export const CHART_TOOLTIP_STYLE = {
  background: 'rgb(var(--c-surface-800))',
  border: '1px solid rgb(var(--c-surface-600))',
  borderRadius: '8px',
  color: 'rgb(var(--c-surface-50))',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
};
export const CHART_CURSOR = { fill: 'transparent' };
export const CHART_PIE_ACTIVE = { opacity: 0.85 };
export const MAX_REPORT_MONTHS = 3;

/** Default date range: first day of current month → today (timezone-safe YYYY-MM-DD strings) */
const _now = new Date();
const _fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const DEFAULT_REPORT_DATE_FROM = _fmt(new Date(_now.getFullYear(), _now.getMonth(), 1));
export const DEFAULT_REPORT_DATE_TO   = _fmt(_now);

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
