import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PtSessionForm = ({
  session = null,
  customers = [],
  packages = [],
  coaches = [],
  getCustomerActivePackages,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    customerId: '',
    ptPackageId: '',
    trainerId: '',
    sessionDate: '',
    sessionTime: '',
    notes: '',
  });

  useEffect(() => {
    if (session) {
      setFormData({
        customerId: session.customerId?.toString() || '',
        ptPackageId: session.ptPackageId?.toString() || '',
        trainerId: session.trainerId?.toString() || '',
        sessionDate: session.sessionDate || '',
        sessionTime: session.sessionTime || '',
        notes: session.notes || '',
      });
    } else {
      setFormData({
        customerId: '',
        ptPackageId: '',
        trainerId: '',
        sessionDate: '',
        sessionTime: '',
        notes: '',
      });
    }
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Member *</label>
        <select
          className="input"
          value={formData.customerId}
          onChange={(e) => {
            setFormData({ ...formData, customerId: e.target.value, ptPackageId: '' });
          }}
          required
        >
          <option value="">Select member</option>
          {customers.map((customer) => {
            const customerName = customer.name || 
              (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 
              customer.firstName || 'Unknown');
            return (
              <option key={customer.id} value={customer.id}>
                {customerName}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="label">PT Package *</label>
        <select
          className="input"
          value={formData.ptPackageId}
          onChange={(e) => setFormData({ ...formData, ptPackageId: e.target.value })}
          required
        >
          <option value="">Select PT package</option>
          {formData.customerId &&
            getCustomerActivePackages(parseInt(formData.customerId)).map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.packageName} ({pkg.classesRemaining || pkg.numberOfSessions} remaining)
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="label">Trainer *</label>
        <select
          className="input"
          value={formData.trainerId}
          onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
          required
        >
          <option value="">Select trainer</option>
          {coaches.map((coach) => {
            const coachName = coach.name || 
              (coach.firstname && coach.lastname ? `${coach.firstname} ${coach.lastname}` : 
              coach.firstname || 'Unknown');
            return (
              <option key={coach.id} value={coach.id}>
                {coachName}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date *</label>
          <DatePicker
            selected={formData.sessionDate ? new Date(formData.sessionDate) : null}
            onChange={(date) => {
              const dateString = date ? date.toISOString().split('T')[0] : '';
              setFormData({ ...formData, sessionDate: dateString });
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Select date"
            className="input w-full"
            minDate={new Date()}
            required
          />
        </div>
        <div>
          <label className="label">Time *</label>
          <input
            type="time"
            className="input"
            value={formData.sessionTime}
            onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Notes (Optional)</label>
        <textarea
          className="input"
          rows="3"
          placeholder="Add session notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : session
            ? 'Save Changes'
            : 'Book Session'}
        </button>
      </div>
    </form>
  );
};

export default PtSessionForm;
