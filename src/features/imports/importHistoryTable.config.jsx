import { Download, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '../../shared/utils/formatters';
import { IMPORT_STATUS, IMPORT_STATUS_STYLES } from '../../shared/constants/importConstants';

/**
 * Render a small colored status pill.
 * @param {string} status
 * @returns {JSX.Element}
 */
const renderStatusPill = (status) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${IMPORT_STATUS_STYLES[status] || IMPORT_STATUS_STYLES[IMPORT_STATUS.PENDING]}`}>
    {status}
  </span>
);

/**
 * Column config for the import history table.
 * @param {{ onDownload: Function }} handlers
 * @returns {Array<Object>}
 */
export const importHistoryColumns = ({ onDownload }) => [
  {
    key: 'file',
    label: 'File',
    render: (job) => (
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-5 h-5 text-primary-400 flex-shrink-0" />
        <div>
          <p className="font-medium text-dark-50 break-all">{job.originalFilename}</p>
          <p className="text-xs text-dark-400">{formatDate(job.createdAt)}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (job) => renderStatusPill(job.status),
  },
  {
    key: 'rows',
    label: 'Rows',
    render: (job) => <span className="text-dark-200">{job.totalRows}</span>,
  },
  {
    key: 'result',
    label: 'Result',
    render: (job) => (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-success-300">{job.successCount} imported</span>
        <span className="text-warning-300">{job.skippedCount} skipped</span>
        <span className="text-danger-300">{job.failureCount} failed</span>
      </div>
    ),
  },
  {
    key: 'actions',
    label: '',
    render: (job) =>
      job.hasResultFile ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDownload(job); }}
          className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300"
        >
          <Download className="w-4 h-4" /> Errors
        </button>
      ) : (
        <span className="text-dark-500">—</span>
      ),
  },
];
