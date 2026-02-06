import { Mail } from 'lucide-react';

/**
 * Shown when report row count exceeds MAX_REPORT_ROWS. Prompts user to request report via email.
 */
const ReportTooLargeCard = ({
  totalRows,
  maxRows,
  onEmailReport,
  className = '',
}) => {
  return (
    <div className={`card no-print text-center py-12 ${className}`}>
      <p className="text-dark-200 text-lg mb-2">
        This report has more than {maxRows} rows ({totalRows} total).
      </p>
      <p className="text-dark-400 mb-4">We will email you the full PDF or Excel report instead.</p>
      <button
        type="button"
        onClick={onEmailReport}
        className="btn-primary flex items-center gap-2 mx-auto"
      >
        <Mail className="w-4 h-4" /> Email Report (PDF / Excel)
      </button>
    </div>
  );
};

export default ReportTooLargeCard;
