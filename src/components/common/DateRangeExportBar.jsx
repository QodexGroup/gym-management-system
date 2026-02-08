import { Calendar, Filter, Download, Printer, Mail } from 'lucide-react';

/**
 * Reusable bar: date range (preset + custom), optional extra filters, and report actions (Print, Export PDF/Excel, Email).
 * Use on report pages (Collection, Expense, Summary).
 */
const DateRangeExportBar = ({
  dateRange,
  onDateRangeChange,
  dateRangeOptions = [],
  customDateFrom = '',
  customDateTo = '',
  inputDateFrom = '',
  inputDateTo = '',
  onCustomDateFromChange,
  onCustomDateToChange,
  extraFilters = null,
  reportTooLarge = false,
  onEmailReport,
  onPrint,
  onExportPdf,
  onExportExcel,
  className = '',
}) => {
  return (
    <div className={`card mb-6 no-print ${className}`}>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dark-400" />
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="px-4 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
            >
              {dateRangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={inputDateFrom}
                  onChange={(e) => onCustomDateFromChange?.(e.target.value)}
                  className="px-3 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                  title="From date"
                />
                <span className="text-dark-400">–</span>
                <input
                  type="date"
                  value={inputDateTo}
                  onChange={(e) => onCustomDateToChange?.(e.target.value)}
                  className="px-3 py-2 bg-transparent border border-dark-200 rounded-lg focus:border-primary-500 outline-none"
                  title="To date"
                />
              </>
            )}
          </div>
          {extraFilters && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-dark-400" />
              {extraFilters}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reportTooLarge ? (
            <button type="button" onClick={onEmailReport} className="btn-primary flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Report
            </button>
          ) : (
            <>
              {onPrint && (
                <button type="button" onClick={onPrint} className="btn-secondary flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print
                </button>
              )}
              {onExportPdf && (
                <button type="button" onClick={onExportPdf} className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              )}
              {onExportExcel && (
                <button type="button" onClick={onExportExcel} className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default DateRangeExportBar;
