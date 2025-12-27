import { useState } from 'react';
import {
  Activity, Scale, Target, Calendar, TrendingUp, TrendingDown, 
  FileText, Plus, Ruler, Zap, Droplets, ChevronLeft, ChevronRight,
  Dumbbell, Heart, Eye, Edit, Trash2
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { getDataSourceBadge } from '../../../utils/uiHelpers';
import { useCustomerProgress, useDeleteCustomerProgress } from '../../../hooks/useCustomerProgress';
import ProgressForm from './ProgressForm';
import { Alert } from '../../../utils/alert';
import { getFileUrl } from '../../../services/firebaseUrlService';
import { PhotoThumbnail, ImageLightbox } from '../../../components/common';




const ProgressTab = ({ member }) => {
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [viewLog, setViewLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  // Use React Query hooks
  const { data, isLoading, isError, error } = useCustomerProgress(member?.id, { page: currentPage, pagelimit: 50 });
  const deleteProgressMutation = useDeleteCustomerProgress();
  
  // Extract data and pagination from response
  const progressLogs = data?.data || [];
  const pagination = data ? {
    currentPage: data.current_page,
    lastPage: data.last_page,
    from: data.from,
    to: data.to,
    total: data.total,
    perPage: data.per_page,
  } : null;

  // Handle edit
  const handleEdit = (log) => {
    setSelectedLog(log);
    setShowAddProgressModal(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteProgressMutation.mutateAsync(id);
      Alert.success('Deleted!', 'Progress record has been deleted.', {
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      // Error already handled in mutation
      console.error('Error deleting progress record:', error);
    }
  };

  // Handle form success (no-op, React Query will auto-refetch)
  const handleFormSuccess = () => {
    // React Query automatically invalidates and refetches on mutation success
  };

  const latestLog = progressLogs[0];
  const previousLog = progressLogs.length > 1 ? progressLogs[1] : null;

  // Pagination - API handles pagination, so we use the fetched logs directly
  const totalPages = pagination?.lastPage || 1;
  const paginatedLogs = progressLogs; // API already returns paginated data

  const calculateChange = (current, previous) => {
    if (!previous) return null;
    return (current - previous).toFixed(1);
  };

  const renderChangeIndicator = (current, previous, inverse = false) => {
    const change = calculateChange(current, previous);
    if (!change) return null;
    
    const isPositive = parseFloat(change) > 0;
    const isGood = inverse ? !isPositive : isPositive;
    
    return (
      <div className={`flex items-center gap-1 mt-1 ${isGood ? 'text-success-600' : 'text-warning-600'}`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {isPositive ? '+' : ''}{change}
        </span>
      </div>
    );
  };



  return (
    <div className="space-y-6">
      {/* Quick Stats Cards - 2 rows of 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Scale className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Weight</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.weight || '--'} kg</p>
              {renderChangeIndicator(latestLog?.weight, previousLog?.weight, true)}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Activity className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Body Fat</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.bodyFatPercentage || '--'}%</p>
              {renderChangeIndicator(latestLog?.bodyFatPercentage, previousLog?.bodyFatPercentage, true)}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Dumbbell className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Muscle</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.skeletalMuscleMass || '--'} kg</p>
              {renderChangeIndicator(latestLog?.skeletalMuscleMass, previousLog?.skeletalMuscleMass)}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Target className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">BMI</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.bmi || '--'}</p>
              {renderChangeIndicator(latestLog?.bmi, previousLog?.bmi, true)}
          </div>
        </div>
      </div>

        <div className="card border-l-4 border-l-danger-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-danger-100 rounded-lg">
              <Heart className="w-5 h-5 text-danger-600" />
          </div>
            <div>
              <p className="text-xs text-dark-500">Visceral Fat</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.visceralFatLevel || '--'}</p>
              {renderChangeIndicator(latestLog?.visceralFatLevel, previousLog?.visceralFatLevel, true)}
              </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-info-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Body Water</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.totalBodyWater || '--'} L</p>
              {renderChangeIndicator(latestLog?.totalBodyWater, previousLog?.totalBodyWater)}
          </div>
        </div>
      </div>

        <div className="card border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">BMR</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.basalMetabolicRate || '--'}</p>
              {renderChangeIndicator(latestLog?.basalMetabolicRate, previousLog?.basalMetabolicRate)}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Ruler className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Waist</p>
              <p className="text-lg font-bold text-dark-50">{latestLog?.waist || '--'} cm</p>
              {renderChangeIndicator(latestLog?.waist, previousLog?.waist, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracking List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark-50">Progress Tracking</h3>
            <p className="text-sm text-dark-500">{pagination?.total || 0} records</p>
          </div>
          <button 
            onClick={() => setShowAddProgressModal(true)} 
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Progress Tracking
          </button>
        </div>

        {/* List Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-dark-800 rounded-lg text-sm font-medium text-dark-300 mb-2">
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Photos</div>
          <div className="col-span-1">Weight</div>
          <div className="col-span-1">Body Fat</div>
          <div className="col-span-1">Muscle</div>
          <div className="col-span-1">BMI</div>
          <div className="col-span-1">Source</div>
          <div className="col-span-2">Notes</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-dark-500">Loading progress records...</p>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="text-center py-12">
            <p className="text-danger-500">Error: {error?.message || 'Failed to load progress records'}</p>
          </div>
        )}

        {/* List Items */}
        {!isLoading && !isError && (
          paginatedLogs.length > 0 ? (
            <div className="space-y-2">
              {paginatedLogs.map((log) => {
                const photoFiles = log.files?.filter(f => f.remarks === 'progress_tracking') || [];
                const scanFiles = Array.isArray(log.scan) ? log.scan : (log.scan?.files || []);
                const allFiles = [...photoFiles, ...scanFiles];
                return (
                  <div 
                    key={log.id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors items-center"
                  >
                    {/* Date */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                        <div>
                          <p className="font-medium text-dark-50">{formatDate(log.recordedDate) || formatDate(log.date)}</p>
                          {log.recordedBy && <p className="text-xs text-dark-500">by {log.recordedBy}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="col-span-1">
                      {allFiles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {allFiles.slice(0, 3).map((file, idx) => {
                            if (!file.mimeType?.startsWith('image/')) return null;
                            return (
                              <PhotoThumbnail
                                key={file.id || idx}
                                photo={file}
                                index={idx}
                                onView={async (photo, index) => {
                                  // Get all image URLs for this progress log (including scan files)
                                  const imageFiles = allFiles.filter(f => f.mimeType?.startsWith('image/'));
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
                            );
                          })}
                          {allFiles.length > 3 && (
                            <div className="w-10 h-10 rounded-lg bg-primary-100 border-2 border-primary-300 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary-700">+{allFiles.length - 3}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-dark-400">-</span>
                      )}
                    </div>

                    {/* Weight */}
                    <div className="col-span-1">
                      <p className="font-semibold text-dark-50">{log.weight ? `${log.weight} kg` : '-'}</p>
                    </div>

                    {/* Body Fat */}
                    <div className="col-span-1">
                      <p className="font-semibold text-dark-50">{log.bodyFatPercentage ? `${log.bodyFatPercentage}%` : '-'}</p>
                    </div>

                    {/* Muscle */}
                    <div className="col-span-1">
                      <p className="font-semibold text-dark-50">{log.skeletalMuscleMass ? `${log.skeletalMuscleMass} kg` : '-'}</p>
                    </div>

                    {/* BMI */}
                    <div className="col-span-1">
                      <p className="font-semibold text-dark-50">{log.bmi || '-'}</p>
                    </div>

                    {/* Source */}
                    <div className="col-span-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getDataSourceBadge(log.dataSource)}`}>
                        {log.dataSource || 'manual'}
                      </span>
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                      <p className="text-sm text-dark-300 truncate">{log.notes || '-'}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setViewLog(log)}
                        className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(log)}
                        className="p-2 text-dark-400 hover:text-warning-400 hover:bg-dark-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(log.id)}
                        className="p-2 text-dark-400 hover:text-danger-400 hover:bg-dark-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
                </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">No progress tracking records yet</p>
              <button 
                onClick={() => setShowAddProgressModal(true)}
                className="btn-primary mt-4"
              >
                Create First Record
              </button>
              </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-100">
            <p className="text-sm text-dark-500">
              Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} records
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

      {/* Progress Form Component */}
      <ProgressForm
        member={member}
        isOpen={showAddProgressModal}
        onClose={() => {
          setShowAddProgressModal(false);
          setSelectedLog(null);
        }}
        selectedLog={selectedLog}
        viewLog={viewLog}
        onSuccess={handleFormSuccess}
        onEdit={handleEdit}
        onViewClose={() => setViewLog(null)}
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

export default ProgressTab;
