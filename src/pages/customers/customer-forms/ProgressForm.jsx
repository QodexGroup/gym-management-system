import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, Upload } from 'lucide-react';
import { Modal, ImageLightbox, PhotoThumbnail } from '../../../components/common';
import { calculateBMI, calculateBodyFatMass, formatDateForInput, formatDate } from '../../../utils/formatters';
import { useCreateCustomerProgress, useUpdateCustomerProgress, customerProgressKeys } from '../../../hooks/useCustomerProgress';
import { Toast } from '../../../utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { getInitialProgressFormData, mapProgressToFormData } from '../../../models/progressModel';
import { customerScanService } from '../../../services/customerScanService';
import { useFileUpload } from '../../../hooks/useFileUpload';
import ProgressViewModal from './ProgressViewModal';
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

  // Handle external view log
  useEffect(() => {
    if (externalViewLog && !isOpen) {
      setViewLog(externalViewLog);
      setShowViewModal(true);
    }
  }, [externalViewLog, isOpen]);

  // Load scans
  useEffect(() => {
    const loadScans = async () => {
      if (!member?.id || !isOpen) return;

      if (formData.dataSource === 'inbody' || formData.dataSource === 'styku') {
        setLoadingScans(true);
        try {
          const scans = await customerScanService.getByType(member.id, formData.dataSource);
          setAvailableScans(scans);
        } catch (error) {
          console.error(error);
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

  // Load selected log
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
  }, [selectedLog, isOpen]);

  // Derived values
  const bmi = useMemo(() => calculateBMI(formData.weight, formData.height), [formData.weight, formData.height]);
  const bodyFatMass = useMemo(() => calculateBodyFatMass(formData.weight, formData.bodyFatPercentage), [formData.weight, formData.bodyFatPercentage]);

  const handleImageClick = async (file) => {
    const currentLog = viewLog || selectedLog;
    if (!currentLog) return;

    const progressImages = (currentLog.files || []).filter(f => f.remarks === 'progress_tracking' && f.mimeType?.startsWith('image/'));
    const scanImages = (currentLog.scan || []).filter(f => f.mimeType?.startsWith('image/'));
    const allImageFiles = [...progressImages, ...scanImages];

    const imageUrls = await Promise.all(allImageFiles.map(async imgFile => {
      try { return await getFileUrl(imgFile.fileUrl); } 
      catch (e) { console.error(e); return null; }
    }));

    const validUrls = imageUrls.filter(Boolean);
    const currentIndex = allImageFiles.findIndex(f => f.id === file.id);

    setLightboxImages(validUrls);
    setLightboxCurrentIndex(currentIndex >= 0 ? currentIndex : 0);
    setLightboxImage(validUrls[currentIndex >= 0 ? currentIndex : 0]);
  };

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
      bmi: bmi || null,
      skeletalMuscleMass: formData.skeletalMuscleMass || null,
      bodyFatMass: bodyFatMass || null,
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

    const saveFilesAfter = async (progressData) => {
      try {
        await saveFiles(progressData.id, formatDateForInput(formData.recordedDate));
        queryClient.invalidateQueries({ queryKey: customerProgressKeys.lists() });
      } catch (e) { Toast.error('Progress saved but some files failed to save'); }
    };

    if (selectedLog) {
      const submitDataWithCustomer = { ...submitData, customerId: member.id };
      updateMutation.mutate({ id: selectedLog.id, progressData: submitDataWithCustomer }, {
        onSuccess: async (data) => { await saveFilesAfter(data); onSuccess?.(); onClose(); }
      });
    } else {
      createMutation.mutate({ customerId: member.id, progressData: submitData }, {
        onSuccess: async (data) => { await saveFilesAfter(data); onSuccess?.(); onClose(); }
      });
    }
  };

  const handleViewModalClose = () => { setShowViewModal(false); setViewLog(null); onViewClose?.(); };
  const handleLightboxClose = () => { setLightboxImage(null); setLightboxImages([]); setLightboxCurrentIndex(0); };
  const handleLightboxPrevious = () => { const prev = lightboxCurrentIndex - 1; setLightboxCurrentIndex(prev); setLightboxImage(lightboxImages[prev]); };
  const handleLightboxNext = () => { const next = lightboxCurrentIndex + 1; setLightboxCurrentIndex(next); setLightboxImage(lightboxImages[next]); };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={selectedLog ? "Edit Progress Log" : "Create Progress Tracking"} size="full">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Header Fields */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Record Date</label>
              <DatePicker
                selected={formData.recordedDate}
                onChange={(d) => setFormData(prev => ({ ...prev, recordedDate: d || new Date() }))}
                dateFormat="yyyy-MM-dd"
                className="input w-full"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
              />
            </div>
            <div>
              <label className="label">Data Source</label>
              <select className="input" value={formData.dataSource} onChange={(e) => setFormData(prev => ({ ...prev, dataSource: e.target.value, customerScanId: null }))}>
                <option value="manual">Manual Entry</option>
                <option value="inbody">InBody Scan</option>
                <option value="styku">Styku Scan</option>
              </select>
            </div>
            {(formData.dataSource === 'inbody' || formData.dataSource === 'styku') && (
              <div>
                <label className="label">Associate Scan</label>
                {loadingScans ? (
                  <div className="input bg-dark-50 text-dark-400">Loading scans...</div>
                ) : availableScans.length === 0 ? (
                  <div className="input bg-dark-50 text-dark-400">No scans found</div>
                ) : (
                  <select className="input" value={formData.customerScanId || ''} onChange={e => setFormData(prev => ({ ...prev, customerScanId: e.target.value ? parseInt(e.target.value) : null }))}>
                    <option value="">Select a scan (optional)</option>
                    {availableScans.map(scan => <option key={scan.id} value={scan.id}>{formatDate(scan.scanDate)} - {scan.scanType || 'N/A'}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Basic Measurements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" value={formData.weight || ''} onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))} />
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" step="0.1" className="input" value={formData.height || ''} onChange={e => setFormData(prev => ({ ...prev, height: e.target.value }))} />
            </div>
            <div>
              <label className="label">Body Fat %</label>
              <input type="number" step="0.1" className="input" value={formData.bodyFatPercentage || ''} onChange={e => setFormData(prev => ({ ...prev, bodyFatPercentage: e.target.value }))} />
            </div>
            <div>
              <label className="label">BMI (auto)</label>
              <input type="number" step="0.1" className="input bg-dark-700 text-dark-50" value={bmi || ''} readOnly disabled />
            </div>
          </div>

          {/* Body Composition */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Muscle Mass (kg)</label>
              <input type="number" step="0.1" className="input" value={formData.skeletalMuscleMass || ''} onChange={e => setFormData(prev => ({ ...prev, skeletalMuscleMass: e.target.value }))} />
            </div>
            <div>
              <label className="label">Body Fat Mass (kg, auto)</label>
              <input type="number" step="0.1" className="input bg-dark-700 text-dark-50" value={bodyFatMass || ''} readOnly disabled />
            </div>
            <div>
              <label className="label">Total Body Water (L)</label>
              <input type="number" step="0.1" className="input" value={formData.totalBodyWater || ''} onChange={e => setFormData(prev => ({ ...prev, totalBodyWater: e.target.value }))} />
            </div>
            <div>
              <label className="label">Visceral Fat Level</label>
              <input type="number" className="input" value={formData.visceralFatLevel || ''} onChange={e => setFormData(prev => ({ ...prev, visceralFatLevel: e.target.value }))} />
            </div>
            <div>
              <label className="label">BMR (kcal)</label>
              <input type="number" className="input" value={formData.basalMetabolicRate || ''} onChange={e => setFormData(prev => ({ ...prev, basalMetabolicRate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Protein (kg)</label>
              <input type="number" step="0.1" className="input" value={formData.protein || ''} onChange={e => setFormData(prev => ({ ...prev, protein: e.target.value }))} />
            </div>
            <div>
              <label className="label">Minerals (kg)</label>
              <input type="number" step="0.1" className="input" value={formData.minerals || ''} onChange={e => setFormData(prev => ({ ...prev, minerals: e.target.value }))} />
            </div>
          </div>

          {/* Body Measurements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['chest','waist','hips','leftArm','rightArm','leftThigh','rightThigh','leftCalf','rightCalf'].map(field => (
              <div key={field}>
                <label className="label">{field.replace(/([A-Z])/g,' $1')}</label>
                <input type="number" step="0.1" className="input" value={formData[field] || ''} onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={formData.notes || ''} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
          </div>

          {/* Photos */}
          <div>
            <label className="label">Progress Photos</label>
            <div className="border-2 border-dashed border-dark-200 rounded-xl p-6 hover:border-primary-500 transition-colors cursor-pointer">
              <label htmlFor="progress-photo-upload" className="cursor-pointer block text-center">
                {uploadingFiles ? (
                  <>
                    <Upload className="w-10 h-10 text-primary-500 mx-auto mb-3 animate-pulse" />
                    <p>Uploading files...</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-dark-300 mx-auto mb-3" />
                    <p>Click to upload progress photos</p>
                  </>
                )}
                <input id="progress-photo-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} disabled={uploadingFiles} />
              </label>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {uploadedFiles.map((file, idx) => (
                  <PhotoThumbnail key={file.id || idx} photo={file} index={idx} uploadProgress={uploadProgress[idx]} onRemove={handleRemoveFile} onView={handleImageClick} />
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" className="flex-1 btn-primary">{selectedLog ? 'Update Progress' : 'Save Progress'}</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <ProgressViewModal isOpen={showViewModal} viewLog={viewLog} onClose={handleViewModalClose} onEdit={onEdit} onImageClick={handleImageClick} />

      {/* Lightbox */}
      <ImageLightbox image={lightboxImage} images={lightboxImages} currentIndex={lightboxCurrentIndex} onClose={handleLightboxClose} onPrevious={handleLightboxPrevious} onNext={handleLightboxNext} />
    </>
  );
};

export default ProgressForm;
