import { Calendar, Clock, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../../components/common';
import { createActionColumn } from '../../components/DataTable';
import { kindTokens, tonePill } from '../../components/Calendar';
import { CALENDAR_KIND, CALENDAR_PERSPECTIVE } from '../../shared/constants/sessionSchedulingConstants';
import { initialsOf } from './calendarViewModel';

/**
 * Render a start–end time cell from a view model row.
 * @param {Object} row
 * @returns {JSX.Element|string}
 */
const timeCell = (row) => {
  if (!row.start) return '-';
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-1 text-dark-200">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-dark-400" />
        {format(row.start, 'MMM d, yyyy')}
      </div>
      <div className="flex items-center gap-1 text-dark-400">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        {row.timeLabel}
        {row.endLabel && ` – ${row.endLabel}`}
      </div>
    </div>
  );
};

/**
 * Columns for the Coach Schedule perspective — one row per session the gym runs.
 * @returns {Array<Object>}
 */
const coachColumns = () => [
  createActionColumn((row) => row.actions || [], { menuPosition: 'bottom-left' }),
  {
    key: 'session',
    label: 'Session',
    render: (row) => {
      const tokens = kindTokens(row.kind);
      const Icon = row.kind === CALENDAR_KIND.PT ? Calendar : Users;
      return (
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tokens.soft}`}>
            <Icon className={`h-4 w-4 ${tokens.text}`} />
          </span>
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${tokens.text}`}>{row.title}</p>
            <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tokens.badge}`}>
              {row.kind === CALENDAR_KIND.PT ? 'PT Session' : 'Group Class'}
            </span>
          </div>
        </div>
      );
    },
  },
  { key: 'datetime', label: 'Date & Time', render: timeCell },
  {
    key: 'coach',
    label: 'Coach',
    render: (row) =>
      row.coachName ? (
        <span className="flex items-center gap-1 text-sm text-dark-200">
          <User className="h-3.5 w-3.5 shrink-0 text-dark-400" />
          {row.coachName}
        </span>
      ) : '-',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    render: (row) =>
      row.capacity ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tonePill(row.capacity.tone)}`}>
          {row.capacity.label}
        </span>
      ) : '-',
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) =>
      row.status ? <Badge size="sm" variant={row.status.variant}>{row.status.label}</Badge> : '-',
  },
];

/**
 * Columns for the Member Bookings perspective — one row per person who booked.
 * @returns {Array<Object>}
 */
const memberColumns = () => [
  createActionColumn((row) => row.actions || [], { menuPosition: 'bottom-left' }),
  {
    key: 'member',
    label: 'Member',
    render: (row) => (
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-700 text-[11px] font-bold text-dark-200">
          {initialsOf(row.memberName)}
        </span>
        <p className="truncate text-sm font-semibold text-dark-50">{row.memberName}</p>
      </div>
    ),
  },
  {
    key: 'session',
    label: 'Session',
    render: (row) => {
      const tokens = kindTokens(row.kind);
      return (
        <div className="min-w-0">
          <p className="truncate text-sm text-dark-200">{row.sessionTitle}</p>
          <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tokens.badge}`}>
            {row.kind === CALENDAR_KIND.PT ? 'PT Booking' : 'Class Booking'}
          </span>
        </div>
      );
    },
  },
  { key: 'datetime', label: 'Date & Time', render: timeCell },
  {
    key: 'coach',
    label: 'Coach',
    render: (row) => row.coachName || '-',
  },
  {
    key: 'status',
    label: 'Booking Status',
    render: (row) =>
      row.status ? <Badge size="sm" variant={row.status.variant}>{row.status.label}</Badge> : '-',
  },
];

/**
 * Column set for the calendar list view, chosen by the active perspective.
 *
 * @param {string} perspective - A CALENDAR_PERSPECTIVE value
 * @returns {Array<Object>} DataTable columns
 */
export const getCalendarColumns = (perspective) =>
  perspective === CALENDAR_PERSPECTIVE.MEMBER ? memberColumns() : coachColumns();
