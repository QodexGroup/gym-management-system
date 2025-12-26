import { useState } from 'react';
import { 
  FileText, Calendar, 
  Activity, Plus, Trash2, Edit, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCustomerScans, useDeleteCustomerScan } from '../../../hooks/useCustomerScan';
import { formatDate } from '../../../utils/formatters';
import { Alert } from '../../../utils/alert';
import { getFileUrl } from '../../../services/firebaseUrlService';
import ScansForm from './ScansForm';
import { PhotoThumbnail, FileIcon, ImageLightbox } from '../../../components/common';

const ScansTab = ({ member }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  // Use React Query hooks
  const { data, isLoading, isError, error } = useCustomerScans(member?.id, { page: currentPage, pagelimit: 50 });
  const deleteScanMutation = useDeleteCustomerScan();

  // Extract data and pagination from response
  const scans = data?.data || [];
  const pagination = data ? {
    currentPage: data.current_page,
    lastPage: data.last_page,
    from: data.from,
    to: data.to,
    total: data.total,
    perPage: data.per_page,
  } : null;
  const totalPages = pagination?.lastPage || 1;
  const paginatedScans = scans; // API handles pagination

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteScanMutation.mutateAsync(id);
      Alert.success('Deleted!', 'Scan has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      // Error already handled in mutation
      console.error('Error deleting scan:', error);
    }
  };

  // Handle edit
  const handleEdit = (scan) => {
    setSelectedScan(scan);
    setShowUploadModal(true);
  };

  // Handle form success (no-op, React Query will auto-refetch)
  const handleFormSuccess = () => {
    // React Query automatically invalidates and refetches on mutation success
  };

  const getScanTypeBadge = (type) => {
    return type === 'inbody'
      ? 'bg-primary-500 text-white'
      : 'bg-accent-500 text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">InBody Scans</p>
              <p className="text-3xl font-bold">{scans.filter(s => s.scanType === 'inbody').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Styku Scans</p>
              <p className="text-3xl font-bold">{scans.filter(s => s.scanType === 'styku').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Scans</p>
              <p className="text-3xl font-bold">{pagination?.total || scans.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scans List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark-50">Body Composition Scans</h3>
            <p className="text-sm text-dark-500">{pagination?.total || 0} records</p>
          </div>
          <button 
            onClick={() => {
              setSelectedScan(null);
              setShowUploadModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Scan
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-dark-500">Loading scans...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="text-center py-12">
            <p className="text-danger-500">Error: {error?.message || 'Failed to load scans'}</p>
          </div>
        )}

        {/* Table Header */}
        {!isLoading && !isError && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-dark-800 rounded-lg text-sm font-medium text-dark-300 mb-2">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Scan Type</div>
            <div className="col-span-2">Notes</div>
            <div className="col-span-2">Uploaded By</div>
            <div className="col-span-2">Photos</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        )}

        {/* Table Rows */}
        {!isLoading && !isError && paginatedScans.length > 0 ? (
          <div className="space-y-2">
            {paginatedScans.map((scan) => (
              <div 
                key={scan.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors items-center"
              >
                {/* Date */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-dark-400" />
                    <p className="font-medium text-dark-50">{formatDate(scan.scanDate)}</p>
                  </div>
                </div>

                {/* Scan Type */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {scan.scanType === 'inbody' ? (
                      <FileText className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Activity className="w-5 h-5 text-accent-600" />
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getScanTypeBadge(scan.scanType)}`}>
                      {scan.scanType}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <p className="text-sm text-dark-300 truncate">{scan.notes || '-'}</p>
                </div>

                {/* Uploaded By */}
                <div className="col-span-2">
                  <p className="text-sm text-dark-300">{scan.uploadedBy || '-'}</p>
                </div>
                {/* Photos */}
                <div className="col-span-2">
                  {scan.files && scan.files.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {scan.files.map((file, index) => (
                        file?.fileUrl && (
                          <div key={file.id || index}>
                            {/* Image Thumbnail - Clickable for Lightbox */}
                            {file.mimeType?.startsWith('image/') ? (
                              <PhotoThumbnail
                                photo={file}
                                index={index}
                                onView={async (photo, idx) => {
                                  const imageFiles = scan.files.filter(f => f.mimeType?.startsWith('image/'));
                                  const imageUrls = await Promise.all(
                                    imageFiles.map(async (imgFile) => {
                                      try {
                                        return await getFileUrl(imgFile.fileUrl);
                                      } catch (error) {
                                        console.error('Error loading image URL:', error);
                                        return null;
                                      }
                                    })
                                  );
                                  const validUrls = imageUrls.filter(url => url !== null);
                                  const currentIndex = imageFiles.findIndex(f => f.id === file.id);
                                  setLightboxImages(validUrls);
                                  setLightboxCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
                                  setLightboxImage(validUrls[currentIndex >= 0 ? currentIndex : 0]);
                                }}
                                showRemove={false}
                                className="rounded-lg border-2 border-dark-200 hover:border-primary-500 transition-colors"
                                wrapperClassName="relative group w-10 h-10 overflow-hidden"
                              />
                            ) : (
                              /* Non-image file icon */
                              <FileIcon file={file} />
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-dark-400">-</span>
                  )}
                </div>

                {/* File Preview / Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleEdit(scan)}
                    className="p-2 text-dark-400 hover:text-warning-400 hover:bg-dark-600 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(scan.id)}
                    className="p-2 text-dark-400 hover:text-danger-400 hover:bg-dark-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !isLoading && !isError ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">No scans uploaded yet</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="btn-primary mt-4"
            >
              Upload First Scan
            </button>
          </div>
        ) : null}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && !isError && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-100">
            <p className="text-sm text-dark-500">
              Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} scans
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-primary-500 text-white'
                      : 'border border-dark-200 hover:bg-dark-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scan Form Component */}
      <ScansForm
        member={member}
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedScan(null);
        }}
        selectedScan={selectedScan}
        onSuccess={handleFormSuccess}
        onEdit={handleEdit}
      />

      {/* Lightbox Modal */}
      <ImageLightbox
        image={lightboxImage}
        images={lightboxImages}
        currentIndex={lightboxCurrentIndex}
        onClose={() => {
          setLightboxImage(null);
          setLightboxImages([]);
          setLightboxCurrentIndex(0);
        }}
        onPrevious={() => {
          const prevIndex = lightboxCurrentIndex - 1;
          setLightboxCurrentIndex(prevIndex);
          setLightboxImage(lightboxImages[prevIndex]);
        }}
        onNext={() => {
          const nextIndex = lightboxCurrentIndex + 1;
          setLightboxCurrentIndex(nextIndex);
          setLightboxImage(lightboxImages[nextIndex]);
        }}
      />
    </div>
  );
};

export default ScansTab;

