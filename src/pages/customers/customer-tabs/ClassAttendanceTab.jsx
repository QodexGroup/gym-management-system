import { useState, useMemo } from 'react';
import { Badge } from '../../../components/common';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
} from '../../../constants/ptConstants';
import { formatDate, formatTime } from '../../../utils/formatters';
import { mockClassAttendances } from '../../../data/mockData';

const ClassAttendanceTab = ({ member }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Use mock data directly
  const filteredAttendances = mockClassAttendances.filter(att => att.customerId === member?.id);
  const isLoading = false;

  // Pagination
  const pagelimit = 20;
  const start = (currentPage - 1) * pagelimit;
  const end = start + pagelimit;
  const attendances = filteredAttendances.slice(start, end);
  const pagination = {
    current_page: currentPage,
    last_page: Math.ceil(filteredAttendances.length / pagelimit),
    per_page: pagelimit,
    total: filteredAttendances.length,
    from: filteredAttendances.length > 0 ? start + 1 : 0,
    to: Math.min(end, filteredAttendances.length),
  };

  // Group attendances by date
  const groupedAttendances = useMemo(() => {
    const grouped = {};
    attendances.forEach((attendance) => {
      const date = attendance.attendanceDate || attendance.classSchedule?.classDate;
      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(attendance);
    });

    // Sort dates descending
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .reduce((acc, [date, items]) => {
        acc[date] = items;
        return acc;
      }, {});
  }, [attendances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-500">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">Class Attendance</h3>
      </div>

      {/* Attendance Records */}
      {Object.keys(groupedAttendances).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedAttendances).map(([date, dateAttendances]) => (
            <div key={date}>
              <h4 className="text-md font-medium text-dark-300 mb-4">
                {formatDate(date)}
              </h4>
              <div className="space-y-3">
                {dateAttendances.map((attendance) => {
                  const classSchedule = attendance.classSchedule;
                  const status = attendance.status || ATTENDANCE_STATUS.ATTENDED;

                  return (
                    <div
                      key={attendance.id}
                      className="bg-dark-800 rounded-xl border border-dark-700 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-semibold text-dark-50">
                              {classSchedule?.className || 'Unknown Class'}
                            </h5>
                            <Badge variant={ATTENDANCE_STATUS_VARIANTS[status] || 'default'}>
                              {ATTENDANCE_STATUS_LABELS[status] || status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-dark-300">
                            {classSchedule?.startTime && classSchedule?.endTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(classSchedule.startTime)} - {formatTime(classSchedule.endTime)}
                              </div>
                            )}
                            {classSchedule?.trainer && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {classSchedule.trainer.firstname} {classSchedule.trainer.lastname}
                              </div>
                            )}
                          </div>
                          {attendance.notes && (
                            <p className="text-sm text-dark-400 mt-2">{attendance.notes}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {status === ATTENDANCE_STATUS.ATTENDED && (
                            <CheckCircle className="w-6 h-6 text-success-500" />
                          )}
                          {status === ATTENDANCE_STATUS.NO_SHOW && (
                            <XCircle className="w-6 h-6 text-warning-500" />
                          )}
                          {status === ATTENDANCE_STATUS.ABSENT && (
                            <AlertCircle className="w-6 h-6 text-danger-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-400">No attendance records found</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-dark-200">
          <div className="text-sm text-dark-300">
            Showing {pagination.from} to {pagination.to} of {pagination.total} records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 text-sm text-dark-300">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
              disabled={currentPage === pagination.last_page}
              className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassAttendanceTab;

