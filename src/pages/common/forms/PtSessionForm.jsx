import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2 } from 'lucide-react';
import SearchableClientInput from '../../../components/common/SearchableClientInput';
import { CLASS_DURATION_OPTIONS } from '../../../constants/classScheduleConstants';
import { getInitialPtBookingFormData, mapPtBookingToFormData } from '../../../models/ptBookingModel';
import { useCustomerPtPackages } from '../../../hooks/useCustomerPtPackages';

const PtSessionForm = ({
  session = null,
  customers = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  showMemberSearch = true,
  customerId = null,
}) => {
  const [formData, setFormData] = useState(getInitialPtBookingFormData());

  // Fetch customer's active PT packages
  const { data: customerPtPackages = [], isLoading: isLoadingPackages } = useCustomerPtPackages(
    formData.customerId || null,
    {
      relations: 'ptPackage,coach',
    }
  );

  // Get selected package and its coach
  const selectedPackage = useMemo(() => {
    if (!formData.customerPtPackageId || !customerPtPackages.length) return null;
    return customerPtPackages.find(
      (pkg) => pkg.id.toString() === formData.customerPtPackageId.toString()
    );
  }, [formData.customerPtPackageId, customerPtPackages]);

  const coachName = useMemo(() => {
    if (!selectedPackage?.coach) return 'No coach assigned';
    return `${selectedPackage.coach.firstname || ''} ${selectedPackage.coach.lastname || ''}`.trim();
  }, [selectedPackage]);

  useEffect(() => {
    if (session) {
      setFormData(mapPtBookingToFormData(session));
    } else {
      const initialData = getInitialPtBookingFormData();
      // Pre-fill customerId if provided and member search is disabled
      if (!showMemberSearch && customerId) {
        initialData.customerId = customerId.toString();
      }
      setFormData(initialData);
    }
  }, [session, showMemberSearch, customerId]);

  // Auto-select coach when package is selected
  useEffect(() => {
    if (selectedPackage?.coach) {
      setFormData((prev) => ({
        ...prev,
        coachId: selectedPackage.coach.id.toString(),
      }));
    }
  }, [selectedPackage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCustomerChange = (customerId) => {
    setFormData({
      ...formData,
      customerId,
      customerPtPackageId: '', // Reset package when customer changes
      coachId: '', // Reset coach when customer changes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client Search */}
      {showMemberSearch && (
        <SearchableClientInput
          customers={customers}
          value={formData.customerId}
          onChange={handleCustomerChange}
          label="Member"
          required
          placeholder="Search member by name, email, or phone"
        />
      )}

      {/* PT Package Selection */}
      <div>
        <label className="label">PT Package *</label>
        <div className="relative">
          <select
            className="input"
            value={formData.customerPtPackageId}
            onChange={(e) =>
              setFormData({ ...formData, customerPtPackageId: e.target.value })
            }
            required
            disabled={!formData.customerId || isLoadingPackages}
          >
            <option value="">
              {!formData.customerId
                ? showMemberSearch ? 'Select a member first' : 'Loading packages...'
                : isLoadingPackages
                ? 'Loading packages...'
                : customerPtPackages.length === 0
                ? 'No active PT packages'
                : 'Select PT package'}
            </option>
            {formData.customerId && !isLoadingPackages &&
              customerPtPackages.map((pkg) => {
                const sessionsRemaining = pkg.numberOfSessionsRemaining || 0;
                const packageName = pkg.ptPackage?.packageName || 'Unknown Package';
                return (
                  <option key={pkg.id} value={pkg.id}>
                    {packageName} ({sessionsRemaining} sessions remaining)
                  </option>
                );
              })}
          </select>
          {isLoadingPackages && formData.customerId && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
            </div>
          )}
        </div>
        {formData.customerId && !isLoadingPackages && customerPtPackages.length === 0 && (
          <p className="text-xs text-warning-600 mt-1">
            This member has no active PT packages. Please assign one first.
          </p>
        )}
      </div>

      {/* Trainer (Auto-filled from package) */}
      <div>
        <label className="label">Trainer</label>
        <input
          type="text"
          className="input bg-dark-700 cursor-not-allowed"
          value={coachName}
          disabled
          readOnly
        />
        <p className="text-xs text-dark-400 mt-1">
          Trainer is assigned from the selected PT package
        </p>
      </div>

      {/* Date, Time, and Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date *</label>
          <DatePicker
            selected={
              formData.bookingDate ? new Date(formData.bookingDate + 'T00:00:00') : null
            }
            onChange={(date) => {
              const dateString = date ? date.toISOString().split('T')[0] : '';
              setFormData({ ...formData, bookingDate: dateString });
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
            value={formData.bookingTime}
            onChange={(e) =>
              setFormData({ ...formData, bookingTime: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="label">Duration *</label>
        <select
          className="input"
          value={formData.duration}
          onChange={(e) =>
            setFormData({ ...formData, duration: parseInt(e.target.value) })
          }
          required
        >
          {CLASS_DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes (Optional)</label>
        <textarea
          className="input"
          rows="3"
          placeholder="Add session notes..."
          value={formData.bookingNotes}
          onChange={(e) =>
            setFormData({ ...formData, bookingNotes: e.target.value })
          }
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
