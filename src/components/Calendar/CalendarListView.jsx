import { Badge } from '../common/index';
import { Calendar, Clock, User, Edit, X, Users, CheckCircle } from 'lucide-react';
import { SESSION_TYPES, getSessionTypeColors } from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS_VARIANTS } from '../../constants/classSessionBookingConstants';

const CalendarListView = ({ sessions = [] }) => {
  if (sessions.length === 0) {
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
        {sessions.map((session) => {
          const { id, type, title, subtitle, startTime, endTime, meta, notes, actions, status } = session;

          const colors = getSessionTypeColors(type);
          const isGroupClass = type === SESSION_TYPES.COACH_GROUP_CLASS;
          const isMemberBooking = type === SESSION_TYPES.MEMBER_GROUP_CLASS;
          const isPT = type === SESSION_TYPES.COACH_PT || type === SESSION_TYPES.MEMBER_PT;

          let badgeLabel = '';
          if (type === SESSION_TYPES.COACH_GROUP_CLASS) badgeLabel = 'Coach Group Class';
          else if (type === SESSION_TYPES.MEMBER_GROUP_CLASS) badgeLabel = 'Member Booking';
          else if (isPT) badgeLabel = 'PT Session';

          // Get hover border class based on type
          const hoverBorderClass = 
            type === SESSION_TYPES.COACH_GROUP_CLASS ? 'hover:border-blue-500' :
            type === SESSION_TYPES.MEMBER_GROUP_CLASS ? 'hover:border-purple-500' :
            type === SESSION_TYPES.COACH_PT ? 'hover:border-primary-500' :
            type === SESSION_TYPES.MEMBER_PT ? 'hover:border-orange-500' :
            'hover:border-dark-700';

          return (
            <div
              key={id}
              className={`bg-dark-800 rounded-lg border p-4 transition-colors ${colors.border} ${hoverBorderClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                      {isPT ? <Calendar className={`w-6 h-6 ${colors.textSolid}`} /> : <Users className={`w-6 h-6 ${colors.textSolid}`} />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-semibold ${colors.textSolid}`}>{title}</h4>
                      {badgeLabel && (
                        <Badge className={colors.badge}>
                          {badgeLabel}
                        </Badge>
                      )}
                      {status && (
                        <Badge 
                          size="sm" 
                          variant={BOOKING_STATUS_VARIANTS[status] || 'default'}
                        >
                          {status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-300">
                      {startTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(startTime).toLocaleDateString()}
                        </div>
                      )}
                      {startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {endTime ? ` - ${new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      )}
                      {subtitle && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {subtitle}
                        </div>
                      )}
                      {meta?.map((m, i) => (
                        <div key={i} className="flex items-center gap-1 text-dark-300 text-sm">
                          {m.icon && <m.icon className="w-4 h-4" />}
                          <span>{m.label}</span>
                        </div>
                      ))}
                    </div>
                    {notes && <p className="text-sm text-dark-400 mt-2">{notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {actions?.onEdit && (
                    <button
                      onClick={actions.onEdit}
                      className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit session"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {actions?.onCancel && (
                    <button
                      onClick={actions.onCancel}
                      className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Cancel session"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {actions?.onMarkAttendance && (
                    <button
                      onClick={actions.onMarkAttendance}
                      className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Mark attendance"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
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
