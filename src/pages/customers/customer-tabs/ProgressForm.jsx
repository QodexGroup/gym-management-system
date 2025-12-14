import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, X, Edit, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../../components/common';
import { calculateBMI, calculateBodyFatMass, formatDateForInput, formatDate } from '../../../utils/formatters';
import { useCreateCustomerProgress, useUpdateCustomerProgress } from '../../../hooks/useCustomerProgress';
import { uploadMultipleFiles, deleteFile } from '../../../services/fileUploadService';
import { customerFileService } from '../../../services/customerFileService';
import { getFileUrl } from '../../../services/firebaseUrlService';
import { Toast, Alert } from '../../../utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { customerProgressKeys } from '../../../hooks/useCustomerProgress';
import { getInitialProgressFormData, mapProgressToFormData } from '../../../models/progressModel';

const ProgressForm = ({ 
  member, 
  isOpen, 
  onClose, 
  selectedLog, 
  onSuccess,
  onEdit,
  viewLog: externalViewLog,
  onViewClose
}) => {
  const [formData, setFormData] = useState(getInitialProgressFormData());
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [viewLogPhotoUrls, setViewLogPhotoUrls] = useState({}); // Cache for view modal photo URLs
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);

  // Use React Query mutations
  const queryClient = useQueryClient();
  const createMutation = useCreateCustomerProgress();
  const updateMutation = useUpdateCustomerProgress();

  // Handle external view log trigger
  useEffect(() => {
    if (externalViewLog && !isOpen) {
      setViewLog(externalViewLog);
      setShowViewModal(true);
      
        // Fetch URLs for photos in view log
        if (externalViewLog.files) {
          const progressImages = externalViewLog.files.filter(f => f.remarks === 'progress_tracking') || [];
          Promise.all(
            progressImages.map(async (img) => {
              const url = await getFileUrl(img.fileUrl); // fileUrl contains the path
              return { id: img.id, url };
            })
          ).then(urls => {
            const urlMap = {};
            urls.forEach(({ id, url }) => {
              urlMap[id] = url;
            });
            setViewLogPhotoUrls(urlMap);
          });
        }
    }
  }, [externalViewLog, isOpen]);

  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const bmi = calculateBMI(formData.weight, formData.height);
    setFormData(prev => ({ ...prev, bmi }));
  }, [formData.weight, formData.height]);

  // Auto-calculate Body Fat Mass when weight or body fat percentage changes
  useEffect(() => {
    const bodyFatMass = calculateBodyFatMass(formData.weight, formData.bodyFatPercentage);
    setFormData(prev => ({ ...prev, bodyFatMass }));
  }, [formData.weight, formData.bodyFatPercentage]);

  // Load selected log data when editing
  useEffect(() => {
    if (selectedLog && isOpen) {
      setFormData(mapProgressToFormData(selectedLog));
    } else if (!selectedLog && isOpen) {
      // Reset form for new entry
      setFormData(getInitialProgressFormData());
      setUploadedPhotos([]);
      setUploadProgress({});
    }
    
    // Load existing files when editing
    if (selectedLog && isOpen && selectedLog.files) {
      const progressImages = selectedLog.files.filter(f => f.remarks === 'progress_tracking') || [];
      // Fetch URLs for existing files (cached)
      Promise.all(
        progressImages.map(async (img) => {
          const url = await getFileUrl(img.fileUrl); // fileUrl contains the path
          return {
            id: img.id,
            fileUrl: img.fileUrl, // Path stored in fileUrl field
            url: url, // Cached URL for display
            fileName: img.fileName,
            fileSize: img.fileSize, // Numeric value in KB
            mimeType: img.mimeType,
          };
        })
      ).then(setUploadedPhotos);
    }
  }, [selectedLog, isOpen]);

  // Handle file removal with confirmation
  const handleRemoveFile = async (fileToRemove, index) => {
    if (!fileToRemove) return;

    // Check if it's an existing file (has a database ID that's not a timestamp)
    const isExistingFile = fileToRemove.id && fileToRemove.id.toString().length < 10;

    if (isExistingFile) {
      // Show confirmation dialog
      const result = await Alert.confirmDelete({
        title: 'Remove File',
        text: 'Are you sure you want to remove this file? This will be permanently deleted.',
        confirmButtonText: 'Yes, remove it!'
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        // Delete from database (backend will return fileUrl)
        const response = await customerFileService.delete(fileToRemove.id);
        
        // Delete from Firebase Storage if fileUrl is returned
        if (response?.fileUrl) {
          try {
            await deleteFile(response.fileUrl);
          } catch (firebaseError) {
            console.error('Failed to delete file from Firebase:', firebaseError);
            // Continue even if Firebase deletion fails (file might already be deleted)
          }
        }

        // Remove the file from the array
        setUploadedPhotos(prev => prev.filter(file => file.id !== fileToRemove.id));

        // Show success message
        Toast.success('File removed successfully');

        // Invalidate queries to refresh the progress list
        queryClient.invalidateQueries({ 
          queryKey: customerProgressKeys.lists(),
        });
      } catch (error) {
        console.error('Error removing file:', error);
        Toast.error(error.message || 'Failed to remove file');
      }
    } else {
      // It's a newly uploaded file (not saved to database yet), just remove from state
      setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 2 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      Toast.error(`Some files exceed 2MB limit. Please select smaller files.`);
      return;
    }

    if (!member?.id) {
      Toast.error('Customer ID is required');
      return;
    }

    setUploadingFiles(true);
    const accountId = 1; // Default account ID

    try {
      const uploadResults = await uploadMultipleFiles(
        files,
        accountId,
        member.id,
        (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }));
        }
      );

      // Add uploaded files to state
      // Fetch URLs for display (cached)
      const newPhotos = await Promise.all(
        uploadResults.map(async (result, index) => {
          const url = await getFileUrl(result.fileUrl); // fileUrl contains the path
          return {
            id: Date.now() + index,
            fileUrl: result.fileUrl, // Path stored in fileUrl field
            url: url, // Cached URL for display
            fileName: result.fileName,
            fileSize: result.fileSize, // Numeric value in KB
            mimeType: result.mimeType,
            file: files[index], // Keep file reference for potential re-upload
          };
        })
      );

      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      setUploadProgress({});
      Toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      Toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.id) return;

    const submitData = {
      recordedDate: formatDateForInput(formData.recordedDate),
      dataSource: formData.dataSource,
      weight: formData.weight || null,
      height: formData.height || null,
      bodyFatPercentage: formData.bodyFatPercentage || null,
      bmi: formData.bmi || null,
      skeletalMuscleMass: formData.skeletalMuscleMass || null,
      bodyFatMass: formData.bodyFatMass || null,
      totalBodyWater: formData.totalBodyWater || null,
      visceralFatLevel: formData.visceralFatLevel || null,
      basalMetabolicRate: formData.basalMetabolicRate || null,
      protein: formData.protein || null,
      minerals: formData.minerals || null,
      chest: formData.chest || null,
      waist: formData.waist || null,
      hips: formData.hips || null,
      leftArm: formData.leftArm || null,
      rightArm: formData.rightArm || null,
      leftThigh: formData.leftThigh || null,
      rightThigh: formData.rightThigh || null,
      leftCalf: formData.leftCalf || null,
      rightCalf: formData.rightCalf || null,
      notes: formData.notes || null,
    };

    if (selectedLog) {
      updateMutation.mutate(
        { id: selectedLog.id, progressData: submitData },
        {
          onSuccess: async (progressData) => {
            // Save files separately after progress is updated
            if (uploadedPhotos.length > 0) {
              try {
                const filePromises = uploadedPhotos
                  .filter(photo => !photo.id || photo.id.toString().length >= 10) // Only new files (timestamp IDs are 13 digits, database IDs are small)
                  .map(photo => 
                    customerFileService.createProgressFile(progressData.id, {
                      customerId: member.id,
                      remarks: 'progress_tracking',
                      fileName: photo.fileName,
                      fileUrl: photo.fileUrl, // Path stored in fileUrl field
                      fileSize: photo.fileSize, // Numeric value in KB
                      mimeType: photo.mimeType || null,
                      fileDate: formatDateForInput(formData.recordedDate),
                    })
                  );
                await Promise.all(filePromises);
                // Invalidate queries again after files are saved to refresh the list
                queryClient.invalidateQueries({ 
                  queryKey: customerProgressKeys.lists(),
                });
              } catch (error) {
                console.error('Error saving files:', error);
                Toast.error('Progress saved but some files failed to save');
              }
            }
            onSuccess?.();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(
        { customerId: member.id, progressData: submitData },
        {
          onSuccess: async (progressData) => {
            // Save files separately after progress is created
            if (uploadedPhotos.length > 0) {
              try {
                const filePromises = uploadedPhotos.map(photo => 
                  customerFileService.createProgressFile(progressData.id, {
                    customerId: member.id,
                    remarks: 'progress_tracking',
                    fileName: photo.fileName,
                    fileUrl: photo.fileUrl, // Path stored in fileUrl field
                    fileSize: photo.fileSize, // Numeric value in KB
                    mimeType: photo.mimeType || null,
                    fileDate: formatDateForInput(formData.recordedDate),
                  })
                );
                await Promise.all(filePromises);
                // Invalidate queries again after files are saved to refresh the list
                queryClient.invalidateQueries({ 
                  queryKey: customerProgressKeys.lists(),
                });
              } catch (error) {
                console.error('Error saving files:', error);
                Toast.error('Progress saved but some files failed to save');
              }
            }
            onSuccess?.();
            onClose();
          },
        }
      );
    }
  };


  // Handle edit
  const handleEditClick = (log) => {
    onEdit?.(log);
  };

  const getDataSourceBadge = (source) => {
    const styles = {
      manual: 'bg-dark-100 text-dark-700',
      inbody: 'bg-primary-100 text-primary-700',
      styku: 'bg-accent-100 text-accent-700',
    };
    return styles[source] || styles.manual;
  };

  return (
    <>
      {/* Create/Edit Progress Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={selectedLog ? "Edit Progress Log" : "Create Progress Tracking"}
        size="full"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Date and Data Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Record Date</label>
              <DatePicker
                selected={formData.recordedDate}
                onChange={(date) => setFormData(prev => ({ ...prev, recordedDate: date || new Date() }))}
                dateFormat="yyyy-MM-dd"
                className="input w-full"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                maxDate={new Date()}
                onKeyDown={(e) => {
                  if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div>
              <label className="label">Data Source</label>
              <select 
                className="input"
                value={formData.dataSource}
                onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value }))}
              >
                <option value="manual">Manual Entry</option>
                <option value="inbody">InBody Scan</option>
                <option value="styku">Styku Scan</option>
              </select>
            </div>
          </div>

          {/* Basic Measurements */}
          <div>
            <h4 className="font-semibold text-dark-800 mb-3">Basic Measurements</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="82.5"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Height (cm)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="175"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Body Fat %</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="18.5"
                  value={formData.bodyFatPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, bodyFatPercentage: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">BMI <span className="text-xs text-dark-400">(auto-calculated)</span></label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input bg-dark-50" 
                  placeholder="--"
                  value={formData.bmi || ''}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Body Composition */}
          <div>
            <h4 className="font-semibold text-dark-800 mb-3">Body Composition</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Muscle Mass (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="36.5"
                  value={formData.skeletalMuscleMass}
                  onChange={(e) => setFormData(prev => ({ ...prev, skeletalMuscleMass: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Body Fat Mass (kg) <span className="text-xs text-dark-400">(auto-calculated)</span></label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input bg-dark-50" 
                  placeholder="--"
                  value={formData.bodyFatMass || ''}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="label">Body Water (L)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="44.0"
                  value={formData.totalBodyWater}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalBodyWater: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Visceral Fat Level</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="10"
                  value={formData.visceralFatLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, visceralFatLevel: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">BMR (kcal)</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="1820"
                  value={formData.basalMetabolicRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, basalMetabolicRate: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Protein (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="10.5"
                  value={formData.protein}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Minerals (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="3.5"
                  value={formData.minerals}
                  onChange={(e) => setFormData(prev => ({ ...prev, minerals: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Body Measurements */}
          <div>
            <h4 className="font-semibold text-dark-800 mb-3">Body Measurements (cm)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Chest</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="104"
                  value={formData.chest}
                  onChange={(e) => setFormData(prev => ({ ...prev, chest: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Waist</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="82"
                  value={formData.waist}
                  onChange={(e) => setFormData(prev => ({ ...prev, waist: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Hips</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="96"
                  value={formData.hips}
                  onChange={(e) => setFormData(prev => ({ ...prev, hips: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Left Arm</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="37"
                  value={formData.leftArm}
                  onChange={(e) => setFormData(prev => ({ ...prev, leftArm: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Right Arm</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="37"
                  value={formData.rightArm}
                  onChange={(e) => setFormData(prev => ({ ...prev, rightArm: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Left Thigh</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="59"
                  value={formData.leftThigh}
                  onChange={(e) => setFormData(prev => ({ ...prev, leftThigh: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Right Thigh</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="60"
                  value={formData.rightThigh}
                  onChange={(e) => setFormData(prev => ({ ...prev, rightThigh: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Left Calf</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="38"
                  value={formData.leftCalf}
                  onChange={(e) => setFormData(prev => ({ ...prev, leftCalf: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Right Calf</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  placeholder="38"
                  value={formData.rightCalf}
                  onChange={(e) => setFormData(prev => ({ ...prev, rightCalf: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea 
              className="input" 
              rows={3} 
              placeholder="Add notes about this progress record..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Progress Photos */}
          <div>
            <label className="label">Progress Photos (Optional)</label>
            <div className="border-2 border-dashed border-dark-200 rounded-xl p-6 hover:border-primary-500 transition-colors cursor-pointer">
              <label htmlFor="progress-photo-upload" className="text-center cursor-pointer block">
                {uploadingFiles ? (
                  <>
                    <Upload className="w-10 h-10 text-primary-500 mx-auto mb-3 animate-pulse" />
                    <p className="text-dark-600 font-medium mb-1">Uploading files...</p>
                    <p className="text-sm text-dark-400">
                      {Object.keys(uploadProgress).length > 0 && 
                        `Progress: ${Math.round(Object.values(uploadProgress)[0] || 0)}%`}
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-600 font-medium mb-1">Click to upload progress photos</p>
                    <p className="text-sm text-dark-400">PNG, JPG, WebP up to 2MB each</p>
                  </>
                )}
                <input
                  id="progress-photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                />
              </label>
            </div>
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div key={photo.id || idx} className="relative group">
                    {photo.thumbnailUrl || photo.url ? (
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.fileName}
                        className="aspect-square object-cover rounded-lg border-2 border-dark-200"
                      />
                    ) : (
                      <div className="aspect-square bg-dark-100 rounded-lg border-2 border-dark-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-dark-300" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(photo, idx)}
                      className="absolute -top-2 -right-2 p-1 bg-danger-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 && (
                      <div className="absolute inset-0 bg-dark-900/50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {Math.round(uploadProgress[idx])}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {selectedLog ? 'Update Progress' : 'Save Progress'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Progress Detail Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewLog(null);
          setViewLogPhotoUrls({});
          onViewClose?.();
        }}
        title={`Progress Record - ${viewLog ? formatDate(viewLog.recordedDate || viewLog.date) : ''}`}
        size="lg"
      >
        {viewLog && (
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

            {/* Progress Photos */}
            {viewLog.files && viewLog.files.filter(f => f.remarks === 'progress_tracking').length > 0 && (
              <div>
                <h4 className="font-semibold text-dark-800 mb-2">Progress Photos</h4>
                <div className="grid grid-cols-4 gap-3">
                  {viewLog.files
                    .filter(f => f.remarks === 'progress_tracking')
                    .map((file, index) => (
                      <button
                        key={file.id}
                        onClick={async () => {
                          // Get all image URLs for this progress log
                          const imageFiles = viewLog.files.filter(f => f.remarks === 'progress_tracking' && f.mimeType?.startsWith('image/'));
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
                        className="relative group aspect-square overflow-hidden rounded-lg border-2 border-dark-200 hover:border-primary-500 transition-colors cursor-pointer"
                      >
                        {viewLogPhotoUrls[file.id] ? (
                          <img
                            src={viewLogPhotoUrls[file.id]}
                            alt={file.fileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-dark-100 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-dark-300" />
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewLog(null);
                  setViewLogPhotoUrls({});
                  onViewClose?.();
                }} 
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewLog(null);
                  setViewLogPhotoUrls({});
                  onViewClose?.();
                  handleEditClick(viewLog);
                }} 
                className="flex-1 btn-primary"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => {
            setLightboxImage(null);
            setLightboxImages([]);
            setLightboxCurrentIndex(0);
          }}
        >
          <button
            onClick={() => {
              setLightboxImage(null);
              setLightboxImages([]);
              setLightboxCurrentIndex(0);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Previous Button */}
          {lightboxImages.length > 1 && lightboxCurrentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const prevIndex = lightboxCurrentIndex - 1;
                setLightboxCurrentIndex(prevIndex);
                setLightboxImage(lightboxImages[prevIndex]);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 bg-black/50 rounded-full hover:bg-black/70"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {lightboxImages.length > 1 && lightboxCurrentIndex < lightboxImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextIndex = lightboxCurrentIndex + 1;
                setLightboxCurrentIndex(nextIndex);
                setLightboxImage(lightboxImages[nextIndex]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 p-2 bg-black/50 rounded-full hover:bg-black/70"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="max-w-7xl max-h-[90vh] p-4 relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Progress photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
          
          {/* Image Counter - Footer */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-10">
              {lightboxCurrentIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProgressForm;

