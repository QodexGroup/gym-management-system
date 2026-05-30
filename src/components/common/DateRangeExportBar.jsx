import { Download, Printer, Mail, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/** Parse a YYYY-MM-DD string into a local Date (avoids UTC-offset shift). */
const toDate = (str) => (str ? new Date(str + 'T00:00:00') : null);

/** Serialize a Date back to YYYY-MM-DD using LOCAL time (avoids UTC-offset shift). */
const toStr = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Reusable filter + export bar for report pages.
 *
 * Layout
 *  Mobile      → all items stacked full-width
 *  sm / md     → filters wrap in a row; [Apply · Print · PDF · Excel] share a second row
 *  lg+         → [Date From · Date To · filters · Apply] left | [Print · PDF · Excel] right
 *
 * The Apply button is rendered twice (once per group) and toggled with
 * `hidden lg:flex` / `lg:hidden` so it sits next to the filters on large
 * screens and next to the export buttons on smaller ones.
 */
const DateRangeExportBar = ({
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  onApply,
  extraFilters = null,
  reportTooLarge = false,
  onEmailReport,
  onPrint,
  onExportPdf,
  onExportExcel,
  className = '',
}) => {
  const selectedFrom = toDate(dateFrom);
  const selectedTo   = toDate(dateTo);

  const applyBtn = (extraClass = '') => (
    <button
      type="submit"
      className={`btn-primary w-full sm:w-auto flex items-center justify-center gap-2 ${extraClass}`}
    >
      <Check className="w-4 h-4" />
      Apply
    </button>
  );

  return (
    <div className={`card mb-6 no-print ${className}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); onApply?.(); }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        {/* ── Filters ──────────────────────────────────────────────
            Apply is included here on lg+ so it sits inline with
            the date pickers and extra filters.                     */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
          {/* Date From */}
          <div className="flex flex-col gap-1 sm:w-44">
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide">
              Date From
            </label>
            <DatePicker
              selected={selectedFrom}
              onChange={(date) => onDateFromChange?.(toStr(date))}
              selectsStart
              startDate={selectedFrom}
              endDate={selectedTo}
              maxDate={selectedTo ?? undefined}
              dateFormat="MMM d, yyyy"
              placeholderText="Start date"
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1 sm:w-44">
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide">
              Date To
            </label>
            <DatePicker
              selected={selectedTo}
              onChange={(date) => onDateToChange?.(toStr(date))}
              selectsEnd
              startDate={selectedFrom}
              endDate={selectedTo}
              minDate={selectedFrom ?? undefined}
              dateFormat="MMM d, yyyy"
              placeholderText="End date"
            />
          </div>

          {/* Extra filters (category, status, payment method, search…) */}
          {extraFilters && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
              {extraFilters}
            </div>
          )}

          {/* Apply — lg+ only (sits beside the filters) */}
          {onApply && applyBtn('hidden lg:flex')}
        </div>

        {/* ── Actions ──────────────────────────────────────────────
            Apply appears here on < lg so it shares a row with the
            export buttons on sm / md devices.                      */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {/* Apply — below lg only */}
          {onApply && applyBtn('lg:hidden')}

          {reportTooLarge ? (
            <button
              type="button"
              onClick={onEmailReport}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> Email Report
            </button>
          ) : (
            <>
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
              )}
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Excel
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
