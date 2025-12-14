import { useState, useEffect } from 'react';
import { 
  FileText, Calendar, 
  Activity, Plus, Trash2, Edit, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useCustomerScans, useDeleteCustomerScan } from '../../../hooks/useCustomerScan';
import { formatDate } from '../../../utils/formatters';
import { Alert } from '../../../utils/alert';
import { getFileUrl } from '../../../services/firebaseUrlService';
import ScansForm from './ScansForm';

// Image Thumbnail Component
const ImageThumbnail = ({ file, onView }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThumbnail = async () => {
      try {
        const url = await getFileUrl(file.fileUrl);
        setThumbnailUrl(url);
      } catch (error) {
        console.error('Error loading thumbnail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (file?.fileUrl) {
      loadThumbnail();
    }
  }, [file]);

  if (loading || !thumbnailUrl) {
    return (
      <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
        <FileText className="w-4 h-4 text-dark-400" />
      </div>
    );
  }

  return (
    <button
      onClick={() => onView(thumbnailUrl)}
      className="w-10 h-10 rounded-lg overflow-hidden border-2 border-dark-200 hover:border-primary-500 transition-colors"
      title="View image"
    >
      <img
        src={thumbnailUrl}
        alt={file.fileName}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    </button>
  );
};

// File Icon Component for non-image files
const FileIcon = ({ file }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFileUrl = async () => {
      try {
        const url = await getFileUrl(file.fileUrl);
        setFileUrl(url);
      } catch (error) {
        console.error('Error loading file URL:', error);
      } finally {
        setLoading(false);
      }
    };

    if (file?.fileUrl) {
      loadFileUrl();
    }
  }, [file]);

  if (loading || !fileUrl) {
    return (
      <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
        <FileText className="w-4 h-4 text-dark-400" />
      </div>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-lg bg-dark-200 hover:bg-dark-300 flex items-center justify-center border-2 border-dark-200 hover:border-primary-500 transition-colors"
      title={`View ${file.fileName}`}
    >
      <FileText className="w-4 h-4 text-dark-400" />
    </a>
  );
};

const ScansTab = ({ member }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Use React Query hooks
  const { data, isLoading, isError, error } = useCustomerScans(member?.id, currentPage);
  const deleteScanMutation = useDeleteCustomerScan();

  const scans = data?.data || [];
  const pagination = data?.pagination || null;
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
      ? 'bg-primary-100 text-primary-700'
      : 'bg-accent-100 text-accent-700';
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
            <h3 className="text-lg font-semibold text-dark-800">Body Composition Scans</h3>
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
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-dark-50 rounded-lg text-sm font-medium text-dark-600 mb-2">
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
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors items-center"
              >
                {/* Date */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-dark-400" />
                    <p className="font-medium text-dark-800">{formatDate(scan.scanDate)}</p>
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
                  <p className="text-sm text-dark-600 truncate">{scan.notes || '-'}</p>
                </div>

                {/* Uploaded By */}
                <div className="col-span-2">
                  <p className="text-sm text-dark-600">{scan.uploadedBy || '-'}</p>
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
                              <ImageThumbnail
                                file={file}
                                onView={(url) => setLightboxImage(url)}
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
                    className="p-2 text-dark-400 hover:text-warning-500 hover:bg-warning-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(scan.id)}
                    className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
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
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-7xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Scan preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScansTab;

