import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, Upload } from 'lucide-react';
import { Modal, ImageLightbox, PhotoThumbnail } from '../../../components/common';
import { calculateBMI, calculateBodyFatMass, formatDateForInput, formatDate } from '../../../utils/formatters';
import { useCreateCustomerProgress, useUpdateCustomerProgress } from '../../../hooks/useCustomerProgress';
import { Toast } from '../../../utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { customerProgressKeys } from '../../../hooks/useCustomerProgress';
import { getInitialProgressFormData, mapProgressToFormData } from '../../../models/progressModel';
import { customerScanService } from '../../../services/customerScanService';
import { useFileUpload } from '../../../hooks/useFileUpload';
import ProgressViewModal from '../customer-tabs/ProgressViewModal';
import { getFileUrl } from '../../../services/firebaseUrlService';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  const [availableScans, setAvailableScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  const queryClient = useQueryClient();
  const createMutation = useCreateCustomerProgress();
  const updateMutation = useUpdateCustomerProgress();

  // File upload hook
  const {
    uploadedFiles,
    uploadingFiles,
    uploadProgress,
    setUploadedFiles,
    handleRemoveFile,
    handleFileUpload,
    saveFiles,
    loadFiles,
    resetFiles,
  } = useFileUpload({
    customerId: member?.id,
    onInvalidate: () => {
      queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
    },
  });

  // Handle external view log trigger
  useEffect(() => {
    if (externalViewLog && !isOpen) {
      setViewLog(externalViewLog);
      setShowViewModal(true);
    }
  }, [externalViewLog, isOpen]);

  // Auto-calculate BMI
  useEffect(() => {
    const bmi = calculateBMI(formData.weight, formData.height);
    setFormData(prev => ({ ...prev, bmi }));
  }, [formData.weight, formData.height]);

  // Auto-calculate Body Fat Mass
  useEffect(() => {
    const bodyFatMass = calculateBodyFatMass(formData.weight, formData.bodyFatPercentage);
    setFormData(prev => ({ ...prev, bodyFatMass }));
  }, [formData.weight, formData.bodyFatPercentage]);

  // Load scans when data source is inbody or styku
  useEffect(() => {
    const loadScans = async () => {
      if (!member?.id || !isOpen) return;
      
      if (formData.dataSource === 'inbody' || formData.dataSource === 'styku') {
        setLoadingScans(true);
        try {
          const scans = await customerScanService.getByType(member.id, formData.dataSource);
          setAvailableScans(scans);
        } catch (error) {
          console.error('Error loading scans:', error);
          Toast.error('Failed to load scans');
          setAvailableScans([]);
        } finally {
          setLoadingScans(false);
        }
      } else {
        setAvailableScans([]);
        setFormData(prev => ({ ...prev, customerScanId: null }));
      }
    };

    loadScans();
  }, [formData.dataSource, member?.id, isOpen]);

  // Load selected log data when editing
  useEffect(() => {
    if (selectedLog && isOpen) {
      setFormData(mapProgressToFormData(selectedLog));
      const progressImages = selectedLog.files?.filter(f => f.remarks === 'progress_tracking') || [];
      const scanFiles = selectedLog.scan || [];
      loadFiles(progressImages, scanFiles);
    } else if (!selectedLog && isOpen) {
      setFormData(getInitialProgressFormData());
      resetFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLog, isOpen]);

  // Handle image click for lightbox
  const handleImageClick = async (file, index) => {
    // Use viewLog if available (from view modal), otherwise use selectedLog (from form)
    const currentLog = viewLog || selectedLog;
    if (!currentLog) return;

    const progressImages = (currentLog.files || [])
      .filter(f => f.remarks === 'progress_tracking' && f.mimeType?.startsWith('image/'));
    const scanImages = (currentLog.scan || [])
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.id) return;

    const submitData = {
      recordedDate: formatDateForInput(formData.recordedDate),
      dataSource: formData.dataSource,
      customerScanId: formData.customerScanId || null,
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

    const saveFilesAfterProgress = async (progressData) => {
      try {
        await saveFiles(progressData.id, formatDateForInput(formData.recordedDate));
        queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
      } catch (error) {
        console.error('Error saving files:', error);
        Toast.error('Progress saved but some files failed to save');
      }
    };

    if (selectedLog) {
      updateMutation.mutate(
        { id: selectedLog.id, progressData: submitData },
        {
          onSuccess: async (progressData) => {
            await saveFilesAfterProgress(progressData);
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
            await saveFilesAfterProgress(progressData);
            onSuccess?.();
            onClose();
          },
        }
      );
    }
  };

  const handleEditClick = (log) => {
    onEdit?.(log);
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
    setViewLog(null);
    onViewClose?.();
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
    <>
      {/* Create/Edit Progress Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={selectedLog ? "Edit Progress Log" : "Create Progress Tracking"}
        size="full"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Date, Data Source, and Scan Selection */}
          <div className={`grid gap-4 ${(formData.dataSource === 'inbody' || formData.dataSource === 'styku') ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value, customerScanId: null }))}
              >
                <option value="manual">Manual Entry</option>
                <option value="inbody">InBody Scan</option>
                <option value="styku">Styku Scan</option>
              </select>
            </div>
            {(formData.dataSource === 'inbody' || formData.dataSource === 'styku') && (
              <div>
                <label className="label">
                  Associate {formData.dataSource === 'inbody' ? 'InBody' : 'Styku'} Scan
                </label>
                {loadingScans ? (
                  <div className="input bg-dark-50 text-dark-400">Loading scans...</div>
                ) : availableScans.length === 0 ? (
                  <div className="input bg-dark-50 text-dark-400">
                    No {formData.dataSource === 'inbody' ? 'InBody' : 'Styku'} scans found
                  </div>
                ) : (
                  <select
                    className="input"
                    value={formData.customerScanId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerScanId: e.target.value ? parseInt(e.target.value) : null }))}
                  >
                    <option value="">Select a scan (optional)</option>
                    {availableScans.map((scan) => (
                      <option key={scan.id} value={scan.id}>
                        {formatDate(scan.scanDate)} - {scan.scanType || 'N/A'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
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
                  className="input bg-dark-700 text-dark-50" 
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
            <h4 className="font-semibold text-dark-50 mb-3">Body Composition</h4>
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
                  className="input bg-dark-700 text-dark-50" 
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
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {uploadedFiles.map((photo, idx) => (
                  <PhotoThumbnail
                    key={photo.id || idx}
                    photo={photo}
                    index={idx}
                    uploadProgress={uploadProgress[idx]}
                    onRemove={handleRemoveFile}
                    onView={handleImageClick}
                  />
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
      <ProgressViewModal
        isOpen={showViewModal}
        viewLog={viewLog}
        onClose={handleViewModalClose}
        onEdit={handleEditClick}
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
    </>
  );
};

export default ProgressForm;

