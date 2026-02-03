import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { usePtPackages } from '../../../hooks/usePtPackages';
import { useCoaches } from '../../../hooks/useUsers';
import { formatCurrency } from '../../../utils/formatters';

const PtPackageAssignmentForm = ({ customerId, onSubmit, onCancel }) => {
  const { data: ptPackagesData, isLoading: loadingPackages } = usePtPackages({ pagelimit: 0 });
  const { data: coachesData = [], isLoading: loadingCoaches } = useCoaches();

  const [formData, setFormData] = useState({
    ptPackageId: '',
    trainerId: '',
    startDate: new Date(),
  });

  const ptPackages = ptPackagesData?.data || ptPackagesData || [];
  const trainers = coachesData?.data || coachesData || [];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.ptPackageId) {
      return;
    }
    if (!formData.trainerId) {
      return;
    }

    const submitData = {
      ptPackageId: parseInt(formData.ptPackageId),
      coachId: formData.trainerId ? parseInt(formData.trainerId) : null,
      startDate: formData.startDate.toISOString().split('T')[0],
    };

    onSubmit(submitData);
  };

  if (loadingPackages || loadingCoaches) {
    return (
      <div className="text-center py-6 text-dark-400">
        Loading PT packages and trainers...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PT Package */}
      <div>
        <label className="label">
          PT Package <span className="text-danger-500">*</span>
        </label>
        <select
          className="input"
          value={formData.ptPackageId}
          onChange={(e) => setFormData((prev) => ({ ...prev, ptPackageId: e.target.value }))}
          required
        >
          <option value="">Select PT package</option>
          {ptPackages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.packageName} - {formatCurrency(pkg.price)} ({pkg.numberOfSessions} sessions)
            </option>
          ))}
        </select>
      </div>

      {/* Coach */}
      <div>
        <label className="label">Coach <span className="text-danger-500">*</span></label>
        <select
          className="input"
          value={formData.trainerId}
          onChange={(e) => setFormData((prev) => ({ ...prev, trainerId: e.target.value }))}
        >
          <option value="">Select coach</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.firstname} {trainer.lastname}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="label">
          Start Date <span className="text-danger-500">*</span>
        </label>
        <DatePicker
          selected={formData.startDate}
          onChange={(date) => setFormData((prev) => ({ ...prev, startDate: date || new Date() }))}
          dateFormat="yyyy-MM-dd"
          className="input w-full"
          minDate={new Date()}
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={!formData.ptPackageId}
        >
          Assign Package
        </button>
      </div>
    </form>
  );
};

export default PtPackageAssignmentForm;
