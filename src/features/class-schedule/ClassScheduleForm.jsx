import { useState, useEffect } from 'react';
import { useCoaches } from '../../shared/hooks/useUsers';
import {
  useCreateClassSchedule,
  useUpdateClassSchedule,
} from '../../shared/hooks/useClassSchedules';
import {
  SCHEDULE_TYPE,
  SCHEDULE_TYPE_LABELS,
  RECURRING_INTERVAL,
  RECURRING_INTERVAL_LABELS,
  CLASS_DURATION_OPTIONS,
} from '../../shared/constants/classScheduleConstants';
import {
  getInitialClassScheduleFormData,
  mapClassScheduleToFormData,
} from '../../shared/models/classScheduleModel';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ClassScheduleForm = ({ schedule, onSubmit, onCancel }) => {
  const { data: coaches = [], isLoading: loadingCoaches } = useCoaches();
  const createMutation = useCreateClassSchedule();
  const updateMutation = useUpdateClassSchedule();

  const [formData, setFormData] = useState(getInitialClassScheduleFormData());

  useEffect(() => {
    setFormData(mapClassScheduleToFormData(schedule));
  }, [schedule]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine startDate and startTime into a single datetime string (without timezone conversion)
    let startDateTime = formData.startDate;
    if (formData.startDate && formData.startTime) {
      // Format as YYYY-MM-DD HH:mm:ss to avoid timezone conversion issues
      startDateTime = `${formData.startDate} ${formData.startTime}:00`;
    }

    const scheduleData = {
      className: formData.className,
      description: formData.description || null,
      coachId: parseInt(formData.coachId),
      capacity: parseInt(formData.capacity),
      duration: parseInt(formData.duration),
      startDate: startDateTime,
      scheduleType: parseInt(formData.scheduleType),
      recurringInterval: formData.scheduleType === SCHEDULE_TYPE.RECURRING ? formData.recurringInterval : null,
      numberOfSessions: formData.scheduleType === SCHEDULE_TYPE.RECURRING ? parseInt(formData.numberOfSessions) : null,
    };

    try {
      if (schedule) {
        await updateMutation.mutateAsync({ id: schedule.id, data: scheduleData });
      } else {
        await createMutation.mutateAsync(scheduleData);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (loadingCoaches) {
    return <div className="text-center py-4">Loading coaches...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Class Name *</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Morning HIIT Class"
          value={formData.className}
          onChange={(e) => setFormData({ ...formData, className: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows="3"
          placeholder="Enter class description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Coach *</label>
          <select
            className="input"
            value={formData.coachId}
            onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
            required
          >
            <option value="">Select coach</option>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.firstname} {coach.lastname}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Capacity *</label>
          <input
            type="number"
            className="input"
            placeholder="e.g., 20"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Duration *</label>
          <select
            className="input"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            required
          >
            <option value="">Select duration</option>
            {CLASS_DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start Time *</label>
          <input
            type="time"
            className="input"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Schedule Type *</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              checked={formData.scheduleType === SCHEDULE_TYPE.ONE_TIME}
              onChange={() => setFormData({ ...formData, scheduleType: SCHEDULE_TYPE.ONE_TIME })}
              className="w-4 h-4 text-primary-600"
            />
            <span>{SCHEDULE_TYPE_LABELS[SCHEDULE_TYPE.ONE_TIME]}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="scheduleType"
              checked={formData.scheduleType === SCHEDULE_TYPE.RECURRING}
              onChange={() => setFormData({ ...formData, scheduleType: SCHEDULE_TYPE.RECURRING })}
              className="w-4 h-4 text-primary-600"
            />
            <span>{SCHEDULE_TYPE_LABELS[SCHEDULE_TYPE.RECURRING]}</span>
          </label>
        </div>
      </div>

      {formData.scheduleType === SCHEDULE_TYPE.RECURRING && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Recurring Interval *</label>
              <select
                className="input"
                value={formData.recurringInterval}
                onChange={(e) => setFormData({ ...formData, recurringInterval: e.target.value })}
                required
              >
                {Object.entries(RECURRING_INTERVAL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Number of Sessions *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 10"
                min="1"
                value={formData.numberOfSessions}
                onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="label">Start Date *</label>
        <DatePicker
          selected={formData.startDate ? new Date(formData.startDate) : null}
          onChange={(date) => {
            const dateString = date ? date.toISOString().split('T')[0] : '';
            setFormData({ ...formData, startDate: dateString });
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select start date"
          className="input w-full"
          minDate={new Date()}
          required
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
            : schedule
            ? 'Save Changes'
            : 'Create Class'}
        </button>
      </div>
    </form>
  );
};

export default ClassScheduleForm;
