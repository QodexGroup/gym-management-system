import { FileText, Activity, Calendar, Edit, Trash, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { PhotoThumbnail, FileIcon } from '../../../components/common';
import { SCAN_TYPE } from '../../../constants/scanTypeConstant';

export const scanTableColumns = ({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onViewImage,
}) => [
  {
    key: 'scanDate',
    label: 'Date',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-dark-400" />
        <p className="font-medium text-dark-50">{formatDate(row.scanDate)}</p>
      </div>
    ),
  },
  {
    key: 'scanType',
    label: 'Type',
    render: (row) => {
      const scanType = String(row.scanType || '').toUpperCase();
      let typeClass;
      if (scanType === SCAN_TYPE.INBODY) {
        typeClass = 'bg-primary-500 text-white';
      } else if (scanType === SCAN_TYPE.STYKU) {
        typeClass = 'bg-accent-500 text-white';
      } else {
        typeClass = 'bg-dark-700 text-dark-200';
      }
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${typeClass}`}>
          {row.scanType}
        </span>
      );
    },
  },
  {
    key: 'notes',
    label: 'Notes',
    render: (row) => <p className="text-sm text-dark-300 truncate max-w-[200px]">{row.notes || '-'}</p>,
  },
  {
    key: 'uploadedBy',
    label: 'Uploaded By',
    render: (row) => <p className="text-sm text-dark-300">{row.uploadedByUser?.firstname } {row.uploadedByUser?.lastname }</p>,
  },
  {
    key: 'files',
    label: 'Photos',
    render: (row) => {
      const files = Array.isArray(row.files) ? row.files : [];
      if (files.length === 0) return <span className="text-sm text-dark-400">-</span>;

      return (
        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          {files.map((file, idx) => {
            if (!file?.fileUrl) return null;

            return file.mimeType?.startsWith('image/') ? (
              <PhotoThumbnail
                key={file.id || idx}
                photo={file}
                index={idx}
                onView={() => onViewImage?.(file, row)}
                showRemove={false}
                className="rounded-lg border-2 border-dark-200 hover:border-primary-500 transition-colors"
                wrapperClassName="relative group w-10 h-10 overflow-hidden"
              />
            ) : (
              <FileIcon key={file.id || idx} file={file} />
            );
          })}
        </div>
      );
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <button onClick={() => onEdit?.(row)} title="Edit">
            <Edit className="w-4 h-4" />
          </button>
        )}

        {canDelete && (
          <button onClick={() => onDelete?.(row.id)} title="Delete">
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
  },
];
