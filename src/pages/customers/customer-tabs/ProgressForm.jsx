import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Camera, X, Edit } from 'lucide-react';
import { Modal } from '../../../components/common';
import { calculateBMI, calculateBodyFatMass, formatDateForInput, formatDate } from '../../../utils/formatters';
import { useCreateCustomerProgress, useUpdateCustomerProgress } from '../../../hooks/useCustomerProgress';

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
  const [formData, setFormData] = useState({
    recordedDate: new Date(),
    dataSource: 'manual',
    weight: '',
    height: '',
    bodyFatPercentage: '',
    bmi: null,
    skeletalMuscleMass: '',
    bodyFatMass: null,
    totalBodyWater: '',
    visceralFatLevel: '',
    basalMetabolicRate: '',
    protein: '',
    minerals: '',
    chest: '',
    waist: '',
    hips: '',
    leftArm: '',
    rightArm: '',
    leftThigh: '',
    rightThigh: '',
    leftCalf: '',
    rightCalf: '',
    notes: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLog, setViewLog] = useState(null);

  // Use React Query mutations
  const createMutation = useCreateCustomerProgress();
  const updateMutation = useUpdateCustomerProgress();

  // Handle external view log trigger
  useEffect(() => {
    if (externalViewLog && !isOpen) {
      setViewLog(externalViewLog);
      setShowViewModal(true);
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
      setFormData({
        recordedDate: selectedLog.recordedDate ? new Date(selectedLog.recordedDate) : new Date(),
        dataSource: selectedLog.dataSource || 'manual',
        weight: selectedLog.weight || '',
        height: selectedLog.height || '',
        bodyFatPercentage: selectedLog.bodyFatPercentage || '',
        bmi: selectedLog.bmi || null,
        skeletalMuscleMass: selectedLog.skeletalMuscleMass || '',
        bodyFatMass: selectedLog.bodyFatMass || null,
        totalBodyWater: selectedLog.totalBodyWater || '',
        visceralFatLevel: selectedLog.visceralFatLevel || '',
        basalMetabolicRate: selectedLog.basalMetabolicRate || '',
        protein: selectedLog.protein || '',
        minerals: selectedLog.minerals || '',
        chest: selectedLog.chest || '',
        waist: selectedLog.waist || '',
        hips: selectedLog.hips || '',
        leftArm: selectedLog.leftArm || '',
        rightArm: selectedLog.rightArm || '',
        leftThigh: selectedLog.leftThigh || '',
        rightThigh: selectedLog.rightThigh || '',
        leftCalf: selectedLog.leftCalf || '',
        rightCalf: selectedLog.rightCalf || '',
        notes: selectedLog.notes || '',
      });
    } else if (!selectedLog && isOpen) {
      // Reset form for new entry
      setFormData({
        recordedDate: new Date(),
        dataSource: 'manual',
        weight: '',
        height: '',
        bodyFatPercentage: '',
        bmi: null,
        skeletalMuscleMass: '',
        bodyFatMass: null,
        totalBodyWater: '',
        visceralFatLevel: '',
        basalMetabolicRate: '',
        protein: '',
        minerals: '',
        chest: '',
        waist: '',
        hips: '',
        leftArm: '',
        rightArm: '',
        leftThigh: '',
        rightThigh: '',
        leftCalf: '',
        rightCalf: '',
        notes: '',
      });
      setUploadedPhotos([]);
    }
  }, [selectedLog, isOpen]);

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
          onSuccess: () => {
            onSuccess?.();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(
        { customerId: member.id, progressData: submitData },
        {
          onSuccess: () => {
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
              <div className="text-center">
                <Camera className="w-10 h-10 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-600 font-medium mb-1">Click to upload progress photos</p>
                <p className="text-sm text-dark-400">PNG, JPG up to 5MB each</p>
              </div>
            </div>
            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square bg-dark-100 rounded-lg border-2 border-dark-200 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-dark-300" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 p-1 bg-danger-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
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

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewLog(null);
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
    </>
  );
};

export default ProgressForm;

