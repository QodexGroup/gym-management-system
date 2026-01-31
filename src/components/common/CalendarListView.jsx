import { Badge } from './index';
import {
  Calendar,
  Clock,
  User,
  Edit,
  X,
  Users,
  CheckCircle,
} from 'lucide-react';
import { formatDate, formatTime, formatTimeFromDate } from '../../utils/formatters';
import { SESSION_TYPES } from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS, BOOKING_STATUS_VARIANTS } from '../../constants/classSessionBookingConstants';

const CalendarListView = ({
  groupClassSessions = [],
  ptSessions = [],
  customers,
  packages,
  coaches,
  onSessionClick,
  onEditSession,
  onCancelSession,
  onCancelBooking,
}) => {
  const totalSessions = groupClassSessions.length + ptSessions.length;
  
  if (totalSessions === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-50 mb-4">Upcoming Sessions</h3>
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-400">No upcoming sessions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-dark-50 mb-4">Upcoming Sessions</h3>
      
      <div className="space-y-3">
        {/* Render group class sessions first */}
        {groupClassSessions.map((session) => {
          if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
            return (
              <div
                key={`coach-${session.id}`}
                className="bg-dark-800 rounded-lg border border-blue-500/30 p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-dark-50">
                          {session.className}
                        </h4>
                        <Badge variant="primary">
                          Group Class
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-dark-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.startTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeFromDate(session.startTime)} - {formatTimeFromDate(session.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {session.coach?.firstname} {session.coach?.lastname}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.attendanceCount || 0}/{session.capacity || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditSession(session)}
                      className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors flex items-center gap-1"
                      title="Edit session"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => onSessionClick(session)}
                      className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors flex items-center gap-1"
                      title="Mark attendance"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Mark Attendance
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          
          // Member Group Class Session
          if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
            const customer = session.customer || customers.find((c) => c.id === session.customerId);
            const customerName = customer?.name || 
              (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
              customer?.firstName || 'Unknown');
            
            return (
              <div
                key={`member-${session.id}-${session.customerId || session.bookingId || ''}`}
                className="bg-dark-800 rounded-lg border border-purple-500/30 p-4 hover:border-purple-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-dark-50">
                          {session.className}
                        </h4>
                        <Badge variant="default">
                          Member Booking
                        </Badge>
                        {session.bookingStatus && (
                          <Badge 
                            size="sm" 
                            variant={BOOKING_STATUS_VARIANTS[session.bookingStatus] || 'default'}
                          >
                            {session.bookingStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-dark-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.startTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTimeFromDate(session.startTime)} - {formatTimeFromDate(session.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {customerName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditSession(session)}
                      className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors flex items-center gap-1"
                      title="Edit booking"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    {session.bookingStatus !== BOOKING_STATUS.CANCELLED && (
                      <button
                        onClick={() => {
                          if (onCancelBooking && session.bookingId) {
                            onCancelBooking(session.bookingId);
                          }
                        }}
                        className="text-xs px-2 py-1 text-danger-500 hover:bg-danger-500/10 rounded transition-colors flex items-center gap-1"
                        title="Cancel booking"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // PT Session
          const customer = session.customer || customers.find((c) => c.id === session.customerId);
          const ptPackage = session.ptPackage || packages.find((p) => p.id === session.ptPackageId);
          const trainer = session.trainer || coaches.find((c) => c.id === session.trainerId);
          
          const customerName = customer?.name || 
            (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
            customer?.firstName || 'Unknown');
          
          const trainerName = trainer?.name || 
            (trainer?.firstname && trainer?.lastname ? `${trainer.firstname} ${trainer.lastname}` : 
            trainer?.firstname || 'Unknown');

          return (
            <div
              key={`pt-${session.id}`}
              className="bg-dark-800 rounded-lg border border-dark-700 p-4 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-dark-50">
                        {customerName}
                      </h4>
                      <Badge variant="default">
                        {ptPackage?.packageName || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.sessionDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(session.sessionTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {trainerName}
                      </div>
                    </div>
                    {session.notes && (
                      <p className="text-sm text-dark-400 mt-2">{session.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditSession(session)}
                    className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit session"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onCancelSession(session.id)}
                    className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Cancel session"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarListView;
