import { Calendar, Edit, Trash, ChevronRight } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { getDataSourceBadge } from '../../../utils/uiHelpers';
import PhotoThumbnail from '../../../components/common/PhotoThumbnail';

export const progressTableColumns = ({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onImageClick,
}) => [
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit?.(row, { view: true })} title="View">
          <ChevronRight className="w-4 h-4" />
        </button>

        {canEdit && (
          <button onClick={() => onEdit(row)} title="Edit">
            <Edit className="w-4 h-4" />
          </button>
        )}

        {canDelete && (
          <button onClick={() => onDelete(row.id)} title="Delete">
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
  },
  {
    key: 'recordedDate',
    label: 'Date',
    render: (row) => (
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-dark-400" />
        <div>
          <p className="font-medium text-dark-50">
            {formatDate(row.recordedDate || row.date)}
          </p>
          {row.recordedBy && (
            <p className="text-xs text-dark-500">by {row.recordedByUser?.firstname} {row.recordedByUser?.lastname}</p>
          )}
        </div>
      </div>
    ),
  },

 

  {
    key: 'photos',
    label: 'Photos',
    render: (row) => {
      if (!row) return <span className="text-xs text-dark-400">-</span>;

      const progressImages = Array.isArray(row.files) 
        ? row.files.filter(f => f && f.remarks === 'progress_tracking' && 
        f.mimeType && typeof f.mimeType === 'string' &&
        f.mimeType.startsWith('image/')): [];
      
      const scanImages = Array.isArray(row.scan)
        ? row.scan.filter(f => f && f.mimeType && typeof f.mimeType === 'string' && f.mimeType.startsWith('image/'))
        : [];
      
      const allFiles = [...progressImages, ...scanImages];

      if (allFiles.length === 0) {
        return <span className="text-xs text-dark-400">-</span>;
      }

      return (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {allFiles.slice(0, 3).map((file, idx) => {
            if (!file || !file.id) return null;
            return (
              <PhotoThumbnail
                key={file.id}
                photo={file}
                index={idx}
                onView={() => onImageClick?.(file, row)}
                showRemove={false}
                className="rounded-lg border-2 border-dark-200 hover:border-primary-500 transition-colors"
                wrapperClassName="relative group w-10 h-10 overflow-hidden"
              />
            );
          })}
          {allFiles.length > 3 && (
            <div className="w-10 h-10 rounded-lg bg-primary-100 border-2 border-primary-300 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-700">+{allFiles.length - 3}</span>
            </div>
          )}
        </div>
      );
    },
  },

  {
    key: 'weight',
    label: 'Weight',
    render: (row) => row.weight ? `${row.weight} kg` : '-',
  },

  {
    key: 'bodyFatPercentage',
    label: 'Body Fat',
    render: (row) => row.bodyFatPercentage ? `${row.bodyFatPercentage}%` : '-',
  },

  {
    key: 'skeletalMuscleMass',
    label: 'Muscle',
    render: (row) => row.skeletalMuscleMass ? `${row.skeletalMuscleMass} kg` : '-',
  },

  {
    key: 'bmi',
    label: 'BMI',
    render: (row) => row.bmi || '-',
  },

  {
    key: 'dataSource',
    label: 'Source',
    render: (row) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getDataSourceBadge(row.dataSource)}`}>
        {row.dataSource || 'manual'}
      </span>
    ),
  },

  {
    key: 'notes',
    label: 'Notes',
    render: (row) => (
      <p className="truncate max-w-[200px]">{row.notes || '-'}</p>
    ),
  },
];
