import { useMemo, useState } from 'react';
import { Plus, Scale, Heart, Dumbbell, Target, Heart as HeartIcon, Droplet, Zap, Ruler } from 'lucide-react';

import DataTable from '../../../components/DataTable';
import { Pagination, ImageLightbox } from '../../../components/common';
import StatsCards from '../../../components/common/StatsCards';

import { useCustomerProgress, useDeleteCustomerProgress } from '../../../hooks/useCustomerProgress';
import { usePermissions } from '../../../hooks/usePermissions';
import { Alert } from '../../../utils/alert';
import { getFileUrl } from '../../../services/firebaseUrlService';

import ProgressForm from '../customer-forms/ProgressForm';
import ProgressViewModal from '../customer-forms/ProgressViewModal';
import { progressTableColumns } from '../tables/progressTable.config';

const ProgressTab = ({ member }) => {
  const { hasPermission } = usePermissions();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewLog, setViewLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  const { data, isLoading } = useCustomerProgress(member?.id, {
    page: currentPage,
    pagelimit: 50,
    relations: 'recordedByUser,files'
  });

  const deleteMutation = useDeleteCustomerProgress();

  const progressLogs = data?.data || [];
  const pagination = data?.pagination;

  /* ---------------- Stats ---------------- */
  const latest = progressLogs[0];

  const stats = useMemo(() => [
    { 
      title: 'Weight', 
      value: latest?.weight ? `${latest.weight} kg` : '--', 
      color: 'primary', 
      icon: Scale 
    },
    { 
      title: 'Body Fat', 
      value: latest?.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : '--', 
      color: 'accent', 
      icon: Heart 
    },
    { 
      title: 'Muscle', 
      value: latest?.skeletalMuscleMass ? `${latest.skeletalMuscleMass} kg` : '--', 
      color: 'success', 
      icon: Dumbbell 
    },
    { 
      title: 'BMI', 
      value: latest?.bmi ?? '--', 
      color: 'warning', 
      icon: Target 
    },
    { 
      title: 'Visceral Fat', 
      value: latest?.visceralFatLevel ?? '--', 
      color: 'danger', 
      icon: HeartIcon 
    },
    { 
      title: 'Body Water', 
      value: latest?.totalBodyWater ? `${latest.totalBodyWater} L` : '--', 
      color: 'primary', 
      icon: Droplet 
    },
    { 
      title: 'BMR', 
      value: latest?.basalMetabolicRate ?? '--', 
      color: 'warning', 
      icon: Zap 
    },
    { 
      title: 'Waist', 
      value: latest?.waist ? `${latest.waist} cm` : '-- cm', 
      color: 'accent', 
      icon: Ruler 
    },
  ], [latest]);

  /* ---------------- Table Columns ---------------- */
  const columns = useMemo(
    () =>
      progressTableColumns({
        canEdit: hasPermission('progress_tracking_update'),
        canDelete: hasPermission('progress_tracking_delete'),
        onEdit: (log, options) => {
          if (options?.view) {
            setViewLog(log);
            setShowViewModal(true);
          } else {
            setSelectedLog(log);
            setViewLog(null);
            setShowModal(true);
          }
        },
        onDelete: async (id) => {
          const result = await Alert.confirmDelete();
          if (!result.isConfirmed) return;
          await deleteMutation.mutateAsync(id);
        },
        onImageClick: async (file, row) => {
          if (!row) return;

          const progressImages = (row.files || [])
            .filter(f => f.remarks === 'progress_tracking' && f.mimeType?.startsWith('image/'));
          const scanImages = (row.scan || [])
            .filter(f => f.mimeType?.startsWith('image/'));
          const allImageFiles = [...progressImages, ...scanImages];
          
          const imageUrls = await Promise.all(
            allImageFiles.map(async (imgFile) => {
              try {
                return await getFileUrl(imgFile.fileUrl);
              } catch (error) {
                console.error('Error loading image URL:', error);
                return null;
              }
            })
          );
          
          const validUrls = imageUrls.filter(url => url !== null);
          const currentIndex = allImageFiles.findIndex(f => f.id === file.id);
          
          setLightboxImages(validUrls);
          setLightboxCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
          setLightboxImage(validUrls[currentIndex >= 0 ? currentIndex : 0]);
        },
      }),
    [hasPermission, progressLogs]
  );
  /* ---------------- Handlers ---------------- */
  const handleRowClick = (row) => {
    setViewLog(row);
    setShowViewModal(true);
  };

  const handleEditFromView = (log) => {
    setViewLog(null);
    setShowViewModal(false);
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleImageClick = async (file, index) => {
    if (!viewLog) return;

    const progressImages = (viewLog.files || [])
      .filter(f => f.remarks === 'progress_tracking' && f.mimeType?.startsWith('image/'));
    const scanImages = (viewLog.scan || [])
      .filter(f => f.mimeType?.startsWith('image/'));
    const allImageFiles = [...progressImages, ...scanImages];
    
    const imageUrls = await Promise.all(
      allImageFiles.map(async (imgFile) => {
        try {
          return await getFileUrl(imgFile.fileUrl);
        } catch (error) {
          console.error('Error loading image URL:', error);
          return null;
        }
      })
    );
    
    const validUrls = imageUrls.filter(url => url !== null);
    const currentIndex = allImageFiles.findIndex(f => f.id === file.id);
    
    setLightboxImages(validUrls);
    setLightboxCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
    setLightboxImage(validUrls[currentIndex >= 0 ? currentIndex : 0]);
  };

  const handleLightboxClose = () => {
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  const handleLightboxPrevious = () => {
    const prevIndex = lightboxCurrentIndex - 1;
    setLightboxCurrentIndex(prevIndex);
    setLightboxImage(lightboxImages[prevIndex]);
  };

  const handleLightboxNext = () => {
    const nextIndex = lightboxCurrentIndex + 1;
    setLightboxCurrentIndex(nextIndex);
    setLightboxImage(lightboxImages[nextIndex]);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards stats={stats} dark={true} size="sm" iconPosition="left" iconColor='light' />

      {/* Header */}
      {hasPermission('progress_tracking_create') && (
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Progress Tracking
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={progressLogs}
          loading={isLoading}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <Pagination
          currentPage={currentPage}
          lastPage={pagination.lastPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
          onNext={() => setCurrentPage(p => Math.min(p + 1, pagination.lastPage))}
        />
      )}

      {/* Edit/Create Modal */}
      <ProgressForm
        member={member}
        isOpen={showModal}
        selectedLog={selectedLog}
        onClose={() => {
          setShowModal(false);
          setSelectedLog(null);
        }}
      />

      {/* View Modal */}
      <ProgressViewModal
        isOpen={showViewModal}
        viewLog={viewLog}
        onClose={() => {
          setShowViewModal(false);
          setViewLog(null);
        }}
        onEdit={handleEditFromView}
        onImageClick={handleImageClick}
      />

      {/* Lightbox Modal */}
      <ImageLightbox
        image={lightboxImage}
        images={lightboxImages}
        currentIndex={lightboxCurrentIndex}
        onClose={handleLightboxClose}
        onPrevious={handleLightboxPrevious}
        onNext={handleLightboxNext}
      />
    </div>
  );
};

export default ProgressTab;
