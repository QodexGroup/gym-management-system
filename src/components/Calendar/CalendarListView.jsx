import DataTable, { createActionColumn } from '../DataTable';
import { Badge } from '../common/index';
import { Calendar, Clock, User, Edit, X, Users, CheckCircle } from 'lucide-react';
import { SESSION_TYPES, getSessionTypeColors } from '../../shared/constants/sessionSchedulingConstants';
import { BOOKING_STATUS_VARIANTS, BOOKING_STATUS } from '../../shared/constants/classSessionBookingConstants';

const getSessionBadgeLabel = (type) => {
  if (type === SESSION_TYPES.COACH_GROUP_CLASS) return 'Coach Group Class';
  if (type === SESSION_TYPES.MEMBER_GROUP_CLASS) return 'Member Booking';
  if (type === SESSION_TYPES.COACH_PT || type === SESSION_TYPES.MEMBER_PT) return 'PT Session';
  return '';
};

const getShouldHideButtons = ({ type, status, startTime, sessionDate }) => {
  const isMemberBooking =
    type === SESSION_TYPES.MEMBER_GROUP_CLASS || type === SESSION_TYPES.MEMBER_PT;
  const isCoachSchedule =
    type === SESSION_TYPES.COACH_GROUP_CLASS || type === SESSION_TYPES.COACH_PT;

  const sessionDateObj = startTime
    ? new Date(startTime)
    : sessionDate
    ? new Date(sessionDate)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDateOnly = sessionDateObj ? new Date(sessionDateObj) : null;
  if (sessionDateOnly) sessionDateOnly.setHours(0, 0, 0, 0);
  const isSessionTodayOrPast = sessionDateOnly ? sessionDateOnly <= today : false;

  return (
    (isMemberBooking &&
      (status === BOOKING_STATUS.ATTENDED || status === BOOKING_STATUS.NO_SHOW)) ||
    (isCoachSchedule && isSessionTodayOrPast)
  );
};

const getActionItems = (session) => {
  const { actions = {} } = session;
  const hideButtons = getShouldHideButtons(session);
  const items = [];

  if (!hideButtons && actions.onEdit)
    items.push({ key: 'edit', label: 'Edit', icon: Edit, onClick: actions.onEdit });

  if (actions.onMarkAttendance)
    items.push({
      key: 'attendance',
      label: 'Mark Attendance',
      icon: CheckCircle,
      onClick: actions.onMarkAttendance,
    });

  if (!hideButtons && actions.onCancel)
    items.push({
      key: 'cancel',
      label: 'Cancel',
      icon: X,
      variant: 'danger',
      onClick: actions.onCancel,
    });

  return items;
};

const columns = [
  createActionColumn(getActionItems, { menuPosition: 'bottom-left' }),
  {
    key: 'session',
    label: 'Session',
    render: (session) => {
      const colors = getSessionTypeColors(session.type);
      const isPT =
        session.type === SESSION_TYPES.COACH_PT || session.type === SESSION_TYPES.MEMBER_PT;
      const badgeLabel = getSessionBadgeLabel(session.type);

      return (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}
          >
            {isPT ? (
              <Calendar className={`w-4 h-4 ${colors.textSolid}`} />
            ) : (
              <Users className={`w-4 h-4 ${colors.textSolid}`} />
            )}
          </div>
          <div>
            <p className={`font-semibold text-sm ${colors.textSolid}`}>{session.title}</p>
            {badgeLabel && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${colors.badge}`}
              >
                {badgeLabel}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: 'datetime',
    label: 'Date & Time',
    render: ({ startTime, endTime }) => {
      if (!startTime) return '-';
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-1 text-dark-200">
            <Calendar className="w-3.5 h-3.5 text-dark-400 shrink-0" />
            {new Date(startTime).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1 text-dark-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {endTime &&
              ` – ${new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
      );
    },
  },
  {
    key: 'details',
    label: 'Details',
    render: ({ subtitle, meta, notes }) => {
      const hasContent = subtitle || meta?.length || notes;
      if (!hasContent) return '-';
      return (
        <div className="text-sm space-y-1">
          {subtitle && (
            <div className="flex items-center gap-1 text-dark-300">
              <User className="w-3.5 h-3.5 text-dark-400 shrink-0" />
              {subtitle}
            </div>
          )}
          {meta?.map((m, i) => (
            <div key={i} className="flex items-center gap-1 text-dark-300">
              {m.icon && <m.icon className="w-3.5 h-3.5 text-dark-400 shrink-0" />}
              {m.label}
            </div>
          ))}
          {notes && <p className="text-dark-400 text-xs mt-1">{notes}</p>}
        </div>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: ({ status }) =>
      status ? (
        <Badge size="sm" variant={BOOKING_STATUS_VARIANTS[status] || 'default'}>
          {status}
        </Badge>
      ) : (
        '-'
      ),
  },
];

const CalendarListView = ({ sessions = [] }) => (
  <DataTable
    columns={columns}
    data={sessions}
    keyField="id"
    title="Upcoming Sessions"
    wrapperClassName="card"
    emptyMessage="No upcoming sessions"
  />
);

export default CalendarListView;
