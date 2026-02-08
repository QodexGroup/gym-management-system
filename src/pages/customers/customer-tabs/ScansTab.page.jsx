import { useMemo, useState } from 'react';
import { Plus, FileText, Activity, Calendar } from 'lucide-react';
import DataTable from '../../../components/DataTable';
import { Pagination, ImageLightbox } from '../../../components/common';
import StatsCards from '../../../components/common/StatsCards';
import { useCustomerScans, useDeleteCustomerScan } from '../../../hooks/useCustomerScan';
import { usePermissions } from '../../../hooks/usePermissions';
import { Alert } from '../../../utils/alert';
import { getFileUrl } from '../../../services/firebaseUrlService';
import ScansForm from '../customer-forms/ScansForm';
import { scanTableColumns } from '../tables/scanTable.config';
import { SCAN_TYPE } from '../../../constants/scanTypeConstant';

const ScansTab = ({ member }) => {
  const { hasPermission } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  const { data, isLoading } = useCustomerScans(member?.id, { page: currentPage, pagelimit: 50, relations: 'uploadedByUser,files' });
  const deleteMutation = useDeleteCustomerScan();

  const scans = data?.data || [];
  const pagination = data?.pagination;

  /* ---------------- Stats ---------------- */
  const stats = useMemo(() => [
    {
      title: 'InBody Scans',
      value: scans.filter(s => s.scanType === SCAN_TYPE.INBODY).length,
      color: 'primary',
      icon: FileText,
    },
    {
      title: 'Styku Scans',
      value: scans.filter(s => s.scanType === SCAN_TYPE.STYKU).length,
      color: 'accent',
      icon: Activity,
    },
    {
      title: 'Total Scans',
      value: pagination?.total || scans.length,
      color: 'success',
      icon: Calendar,
    },
  ], [scans, pagination]);

  /* ---------------- Table Columns ---------------- */
  const columns = useMemo(
    () =>
      scanTableColumns({
        canEdit: hasPermission('scans_update'),
        canDelete: hasPermission('scans_delete'),
        onEdit: (scan) => {
          setSelectedScan(scan);
          setShowModal(true);
        },
        onDelete: async (id) => {
          const result = await Alert.confirmDelete();
          if (!result.isConfirmed) return;
          await deleteMutation.mutateAsync(id);
        },
        onViewImage: async (file, row) => {
          if (!row) return;

          const files = row.files?.filter(f => f?.mimeType?.startsWith('image/')) || [];
          const urls = await Promise.all(
            files.map(async (f) => {
              try { return await getFileUrl(f.fileUrl); } catch { return null; }
            })
          );
          const validUrls = urls.filter(u => u !== null);
          const currentIndex = files.findIndex(f => f.id === file.id);
          setLightboxImages(validUrls);
          setLightboxCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
          setLightboxImage(validUrls[currentIndex >= 0 ? currentIndex : 0]);
        },
      }),
    [hasPermission, scans]
  );

  /* ---------------- Handlers ---------------- */
  const handleLightboxClose = () => {
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  const handleLightboxPrev = () => {
    const prev = lightboxCurrentIndex - 1;
    setLightboxCurrentIndex(prev);
    setLightboxImage(lightboxImages[prev]);
  };

  const handleLightboxNext = () => {
    const next = lightboxCurrentIndex + 1;
    setLightboxCurrentIndex(next);
    setLightboxImage(lightboxImages[next]);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards stats={stats} dark={true} size="sm" iconPosition="left" iconColor="light" columns={3} />

      {/* Upload Button */}
      {hasPermission('scans_create') && (
        <div className="flex justify-end">
          <button
            onClick={() => { setSelectedScan(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Scan
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <DataTable columns={columns} data={scans} loading={isLoading} />
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

      {/* Scan Form Modal */}
      <ScansForm
        member={member}
        isOpen={showModal}
        selectedScan={selectedScan}
        onClose={() => { setShowModal(false); setSelectedScan(null); }}
      />

      {/* Lightbox */}
      <ImageLightbox
        image={lightboxImage}
        images={lightboxImages}
        currentIndex={lightboxCurrentIndex}
        onClose={handleLightboxClose}
        onPrevious={handleLightboxPrev}
        onNext={handleLightboxNext}
      />
    </div>
  );
};

export default ScansTab;
