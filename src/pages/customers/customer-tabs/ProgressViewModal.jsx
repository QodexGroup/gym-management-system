import { useState, useEffect } from 'react';
import { Edit, Camera } from 'lucide-react';
import { Modal } from '../../../components/common';
import { formatDate } from '../../../utils/formatters';
import { getDataSourceBadge } from '../../../utils/uiHelpers';
import { getFileUrl } from '../../../services/firebaseUrlService';
import PhotoThumbnail from '../../../components/common/PhotoThumbnail';

const ProgressViewModal = ({ 
  isOpen, 
  viewLog, 
  onClose, 
  onEdit,
  onImageClick 
}) => {
  const [photoUrls, setPhotoUrls] = useState({});

  useEffect(() => {
    if (viewLog && isOpen) {
      const progressImages = viewLog.files?.filter(f => f.remarks === 'progress_tracking') || [];
      const scanFiles = viewLog.scan || [];
      const allFiles = [...progressImages, ...scanFiles];
      
      if (allFiles.length > 0) {
        Promise.all(
          allFiles.map(async (img) => {
            const url = await getFileUrl(img.fileUrl);
            return { id: img.id, url };
          })
        ).then(urls => {
          const urlMap = {};
          urls.forEach(({ id, url }) => {
            urlMap[id] = url;
          });
          setPhotoUrls(urlMap);
        });
      }
    }
  }, [viewLog, isOpen]);

  if (!viewLog) return null;

  const progressFiles = viewLog.files?.filter(f => f.remarks === 'progress_tracking') || [];
  const scanFiles = viewLog.scan || [];
  const allFiles = [...progressFiles, ...scanFiles];
  const hasPhotos = allFiles.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Progress Record - ${formatDate(viewLog.recordedDate || viewLog.date)}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
          <div>
            <p className="text-sm text-dark-500">Recorded By</p>
            <p className="font-medium text-dark-800">{viewLog.recordedBy || 'N/A'}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full uppercase ${getDataSourceBadge(viewLog.dataSource)}`}>
            {viewLog.dataSource || 'manual'}
          </span>
        </div>

        {/* Basic Measurements */}
        <div>
          <h4 className="font-semibold text-dark-800 mb-3">Basic Measurements</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-primary-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary-700">{viewLog.weight || '--'}</p>
              <p className="text-xs text-dark-500">Weight (kg)</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-accent-700">{viewLog.bodyFatPercentage || '--'}%</p>
              <p className="text-xs text-dark-500">Body Fat</p>
            </div>
            <div className="p-3 bg-success-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-success-700">{viewLog.skeletalMuscleMass || '--'}</p>
              <p className="text-xs text-dark-500">Muscle (kg)</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-warning-700">{viewLog.bmi || '--'}</p>
              <p className="text-xs text-dark-500">BMI</p>
            </div>
          </div>
        </div>

        {/* Body Composition */}
        <div>
          <h4 className="font-semibold text-dark-800 mb-3">Body Composition</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-lg font-bold text-dark-800">{viewLog.visceralFatLevel || '--'}</p>
              <p className="text-xs text-dark-500">Visceral Fat Level</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-lg font-bold text-dark-800">{viewLog.totalBodyWater ? `${viewLog.totalBodyWater} L` : '--'}</p>
              <p className="text-xs text-dark-500">Body Water</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-lg font-bold text-dark-800">{viewLog.basalMetabolicRate ? `${viewLog.basalMetabolicRate} kcal` : '--'}</p>
              <p className="text-xs text-dark-500">BMR</p>
            </div>
          </div>
        </div>

        {/* Body Measurements */}
        <div>
          <h4 className="font-semibold text-dark-800 mb-3">Body Measurements (cm)</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-2 bg-dark-50 rounded-lg text-center">
              <p className="font-bold text-dark-800">{viewLog.chest || '--'}</p>
              <p className="text-xs text-dark-500">Chest</p>
            </div>
            <div className="p-2 bg-dark-50 rounded-lg text-center">
              <p className="font-bold text-dark-800">{viewLog.waist || '--'}</p>
              <p className="text-xs text-dark-500">Waist</p>
            </div>
            <div className="p-2 bg-dark-50 rounded-lg text-center">
              <p className="font-bold text-dark-800">{viewLog.hips || '--'}</p>
              <p className="text-xs text-dark-500">Hips</p>
            </div>
            <div className="p-2 bg-dark-50 rounded-lg text-center">
              <p className="font-bold text-dark-800">{viewLog.leftArm || '--'} / {viewLog.rightArm || '--'}</p>
              <p className="text-xs text-dark-500">Arms (L/R)</p>
            </div>
            <div className="p-2 bg-dark-50 rounded-lg text-center">
              <p className="font-bold text-dark-800">{viewLog.leftThigh || '--'} / {viewLog.rightThigh || '--'}</p>
              <p className="text-xs text-dark-500">Thighs (L/R)</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {viewLog.notes && (
          <div>
            <h4 className="font-semibold text-dark-800 mb-2">Notes</h4>
            <div className="p-4 bg-dark-50 rounded-xl">
              <p className="text-dark-600">{viewLog.notes}</p>
            </div>
          </div>
        )}

        {/* Photos */}
        {hasPhotos && (
          <div>
            <h4 className="font-semibold text-dark-800 mb-2">Photos</h4>
            <div className="grid grid-cols-4 gap-1">
              {allFiles.map((file, index) => (
                <PhotoThumbnail
                  key={file.id}
                  photo={{ ...file, url: photoUrls[file.id] }}
                  index={index}
                  onView={onImageClick}
                  showRemove={false}
                  className="rounded-lg border-2 border-dark-200 hover:border-primary-500 transition-colors cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button 
            onClick={onClose} 
            className="flex-1 btn-secondary"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onClose();
              onEdit?.(viewLog);
            }} 
            className="flex-1 btn-primary"
          >
            <Edit className="w-4 h-4 inline mr-2" />
            Edit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProgressViewModal;

