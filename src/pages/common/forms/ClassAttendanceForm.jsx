import { formatDateShort, formatTimeFromDate } from '../../../utils/formatters';

const ClassAttendanceForm = ({
  classSession,
  onCancel,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!classSession) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Session Date:</span>
          <span className="text-dark-50 font-semibold">
            {formatDateShort(classSession.startTime)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Time:</span>
          <span className="text-dark-50 font-semibold">
            {formatTimeFromDate(classSession.startTime)} - {formatTimeFromDate(classSession.endTime)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Enrolled:</span>
          <span className="text-dark-50 font-semibold">
            {classSession.attendanceCount || 0}/{classSession.capacity || 0}
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <p className="text-sm text-dark-400 text-center py-4">
          Attendance marking will be implemented with enrolled members list
        </p>
      </div>

      <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3">
        <p className="text-sm text-warning-500">
          ⚠️ Marking "Attended" will auto-deduct 1 session from member's PT package if applicable
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
          type="button"
          onClick={onSubmit}
          className="flex-1 btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
};

export default ClassAttendanceForm;
