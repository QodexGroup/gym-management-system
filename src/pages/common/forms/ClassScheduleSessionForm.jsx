import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { CLASS_DURATION_OPTIONS } from '../../../constants/classScheduleConstants';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  getInitialClassScheduleSessionFormData,
  mapClassScheduleSessionToFormData,
} from '../../../models/classScheduleSessionFormModel';

const ClassScheduleSessionForm = ({
  session = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(getInitialClassScheduleSessionFormData());

  useEffect(() => {
    setFormData(mapClassScheduleSessionToFormData(session));
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format as YYYY-MM-DD HH:mm:ss to avoid timezone conversion issues
    const startTime = formData.startDate && formData.startTime
      ? `${formData.startDate} ${formData.startTime}:00`
      : null;

    onSubmit({
      startTime,
      duration: formData.duration ? parseInt(formData.duration) : null,
    });
  };

  const handleDurationChange = (e) => {
    setFormData(prev => ({
      ...prev,
      duration: e.target.value,
    }));
  };

  const handleStartDateChange = (date) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    setFormData(prev => ({
      ...prev,
      startDate: dateString,
    }));
  };

  const handleStartTimeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      startTime: e.target.value,
    }));
  };

  if (!session) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4 space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Class Name:</span>
          <span className="text-dark-50 font-semibold">{session.className}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Coach:</span>
          <span className="text-dark-50 font-semibold">
            {session.coach?.firstname} {session.coach?.lastname}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Capacity:</span>
          <span className="text-dark-50 font-semibold">{session.capacity}</span>
        </div>
      </div>

      <div>
        <label className="label flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Start Date *
        </label>
        <DatePicker
          selected={formData.startDate ? new Date(formData.startDate) : null}
          onChange={handleStartDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select start date"
          className="input w-full"
          required
        />
      </div>

      <div>
        <label className="label flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Start Time *
        </label>
        <input
          type="time"
          className="input"
          value={formData.startTime}
          onChange={handleStartTimeChange}
          required
        />
      </div>

      <div>
        <label className="label flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration *
        </label>
        <select
          className="input"
          value={formData.duration}
          onChange={handleDurationChange}
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

      <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3">
        <p className="text-sm text-warning-500">
          ⚠️ Updating the session time/date will update all existing client bookings for this class session
        </p>
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
          disabled={isSubmitting || !formData.startDate || !formData.startTime || !formData.duration}
        >
          {isSubmitting ? 'Updating...' : 'Update Session'}
        </button>
      </div>
    </form>
  );
};

export default ClassScheduleSessionForm;
