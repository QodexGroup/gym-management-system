/**
 * Calendar view model.
 *
 * Turns domain objects (class schedule sessions, class session bookings, PT bookings)
 * into the flat, presentational rows the Calendar components render. Everything the UI
 * needs to decide what to draw is resolved here: colours by `kind`, labels, capacity
 * tone, badge variants and the already-filtered action list.
 *
 * The components never see SESSION_TYPES, BOOKING_STATUS or a gym concept of any sort.
 */

import { format } from 'date-fns';
import { Edit, X, CheckCircle } from 'lucide-react';
import {
  SESSION_TYPES,
  CALENDAR_KIND,
  getCalendarKind,
} from '../../shared/constants/sessionSchedulingConstants';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from '../../shared/constants/classSessionBookingConstants';

/** Ratio at or above which a class reads as nearly full. */
const NEARLY_FULL_RATIO = 0.75;

/**
 * Namespace a row id. Ids come from three different tables (class_schedule_sessions,
 * class_session_bookings, pt_bookings) and collide as bare numbers, which produced
 * duplicate React keys and duplicate DataTable rows.
 *
 * @param {string} source - 'session' | 'booking' | 'pt'
 * @param {number|string} id
 * @returns {string}
 */
export const rowId = (source, id) => `${source}:${id}`;

/**
 * Two-letter initials for an avatar bubble.
 * @param {string} name
 * @returns {string}
 */
export const initialsOf = (name = '') =>
  name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

/**
 * Full name of a customer record, tolerating both API shapes.
 * @param {Object|null} customer
 * @returns {string}
 */
const customerName = (customer) => {
  if (!customer) return '';
  const joined = `${customer.firstName || customer.firstname || ''} ${customer.lastName || customer.lastname || ''}`;
  return joined.trim() || customer.fullname || '';
};

/**
 * Display name of a coach record, tolerating both API shapes.
 * @param {Object|null} coach
 * @returns {string}
 */
const coachName = (coach) => {
  if (!coach) return '';
  return coach.fullname || `${coach.firstname || ''} ${coach.lastname || ''}`.trim();
};

/**
 * Capacity descriptor for a session row: a label plus the tone the UI paints it with.
 * A 1:1 PT appointment has no meaningful capacity, so it reads as "1:1".
 *
 * @param {Object} session
 * @param {string} kind - CALENDAR_KIND value
 * @returns {{ label: string, tone: string }}
 */
const capacityOf = (session, kind) => {
  if (kind === CALENDAR_KIND.PT || !session.capacity) {
    return { label: '1:1', tone: 'solo' };
  }
  const booked = session.attendanceCount || 0;
  const ratio = booked / session.capacity;
  const tone = ratio >= 1 ? 'full' : ratio >= NEARLY_FULL_RATIO ? 'warn' : 'ok';
  return { label: `${booked}/${session.capacity}`, tone };
};

/**
 * Badge descriptor for a booking status, or null when the row has no status.
 * @param {string|null} status - A BOOKING_STATUS value
 * @returns {{ label: string, variant: string }|null}
 */
const statusOf = (status) => {
  if (!status) return null;
  return {
    label: BOOKING_STATUS_LABELS[status] || status,
    variant: BOOKING_STATUS_VARIANTS[status] || 'default',
  };
};

/** Month-cell dot tone for a booking status. */
const STATUS_DOT_TONE = {
  [BOOKING_STATUS.BOOKED]: 'booked',
  [BOOKING_STATUS.ATTENDED]: 'attended',
  [BOOKING_STATUS.NO_SHOW]: 'noshow',
  [BOOKING_STATUS.CANCELLED]: 'cancelled',
  [BOOKING_STATUS.COACH_CANCELLED]: 'cancelled',
};

/**
 * Whether edit / cancel should be withheld for a row.
 *
 * Two rules, previously duplicated between CalendarView and CalendarListView and now
 * stated once: a member booking is frozen after it has been marked attended or no-show,
 * and a coach's own schedule entry cannot be edited on or after the day it runs.
 *
 * @param {Object} session
 * @param {Date|null} start
 * @returns {boolean}
 */
const isFrozen = (session, start) => {
  const isMemberBooking =
    session.type === SESSION_TYPES.MEMBER_GROUP_CLASS || session.type === SESSION_TYPES.MEMBER_PT;
  const isCoachSchedule =
    session.type === SESSION_TYPES.COACH_GROUP_CLASS || session.type === SESSION_TYPES.COACH_PT;
  const status = session.bookingStatus || session.status;

  if (isMemberBooking && (status === BOOKING_STATUS.ATTENDED || status === BOOKING_STATUS.NO_SHOW)) {
    return true;
  }
  if (isCoachSchedule && start) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(start);
    day.setHours(0, 0, 0, 0);
    return day <= today;
  }
  return false;
};

/**
 * Build the action menu for a row, already filtered by permission and freeze rules so
 * the components can render `actions` without deciding anything.
 *
 * @param {Object} session
 * @param {Date|null} start
 * @param {Object} ctx - handlers + permission flags
 * @returns {Array<{key,label,icon,variant,onClick}>}
 */
const buildActions = (session, start, ctx) => {
  const {
    onEditSession, onEditBooking, onEditPtSession,
    onCancelSession, onCancelBooking,
    onMarkAttendance,
    canUpdatePt, canCancelPt, canUpdateGroupClass, canCancelGroupClass,
    allowAttendance,
  } = ctx;

  const frozen = isFrozen(session, start);
  const isPt = getCalendarKind(session.type) === CALENDAR_KIND.PT;
  const canUpdate = isPt ? canUpdatePt : canUpdateGroupClass;
  const canCancel = isPt ? canCancelPt : canCancelGroupClass;
  const items = [];

  if (!frozen && canUpdate) {
    let onEdit = null;
    if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS && session.bookingId) {
      onEdit = () => onEditBooking?.(session);
    } else if (isPt && !session.sessionId) {
      onEdit = () => onEditPtSession?.(session);
    } else {
      onEdit = () => onEditSession?.(session);
    }
    items.push({ key: 'edit', label: 'Edit', icon: Edit, onClick: onEdit });
  }

  if (allowAttendance && onMarkAttendance) {
    items.push({
      key: 'attendance',
      label: 'Mark Attendance',
      icon: CheckCircle,
      onClick: () => onMarkAttendance(session),
    });
  }

  if (!frozen && canCancel) {
    const onCancel =
      session.type === SESSION_TYPES.MEMBER_GROUP_CLASS && session.bookingId
        ? () => onCancelBooking?.(session.bookingId)
        : () => onCancelSession?.(session.sessionId || session.id);
    items.push({ key: 'cancel', label: 'Cancel', icon: X, variant: 'danger', onClick: onCancel });
  }

  return items;
};

/**
 * Shared scaffolding for every row: id, times and kind.
 * @param {Object} session
 * @param {string} source
 * @returns {Object}
 */
const baseRow = (session, source) => {
  const start = session.startTime ? new Date(session.startTime) : null;
  const end = session.endTime ? new Date(session.endTime) : null;
  return {
    id: rowId(source, session.bookingId || session.id),
    kind: getCalendarKind(session.type),
    start,
    end,
    timeLabel: start ? format(start, 'HH:mm') : '',
    endLabel: end ? format(end, 'HH:mm') : '',
    sessionId: session.sessionId || null,
    coachId: session.coachId ?? null,
    coachName: coachName(session.coach),
    raw: session,
  };
};

/**
 * Coach perspective: one row per session the gym is running.
 *
 * @param {Array<Object>} sessions - Mapped class schedule sessions and PT bookings
 * @param {Object} ctx - handlers + permission flags
 * @returns {Array<Object>} view model rows
 */
export const buildCoachRows = (sessions, ctx) =>
  sessions.map((session) => {
    const row = baseRow(session, session.sessionId ? 'session' : 'pt');
    const isPt = row.kind === CALENDAR_KIND.PT;
    const client = customerName(session.customer);
    const capacity = capacityOf(session, row.kind);
    const title = isPt && client ? client : session.className || (isPt ? 'PT Session' : 'Group Class');
    const subtitle = [row.coachName, isPt ? 'Personal Training' : 'Group Class']
      .filter(Boolean)
      .join(' · ');

    return {
      ...row,
      title,
      subtitle,
      capacity,
      dot: { tone: capacity.tone },
      status: statusOf(session.bookingStatus || (isPt ? session.status : null)),
      /* Classes have a roster worth expanding; a 1:1 appointment does not. */
      expandable: !isPt && Boolean(session.sessionId),
      chipTitle: `${row.timeLabel} ${title} — ${isPt ? '1:1 session' : `${capacity.label} booked`}`,
      actions: buildActions(session, row.start, ctx),
    };
  });

/**
 * Member perspective: one row per person who booked.
 *
 * Rows are grouped in the day drawer by the session they belong to, so a class with
 * fourteen members reads as one heading and fourteen names rather than fourteen
 * unrelated calendar entries.
 *
 * @param {Array<Object>} bookings - Mapped member group-class bookings and PT bookings
 * @param {Object} ctx - handlers + permission flags
 * @returns {Array<Object>} view model rows
 */
export const buildMemberRows = (bookings, ctx) =>
  bookings.map((booking) => {
    const row = baseRow(booking, booking.bookingId ? 'booking' : 'pt');
    const isPt = row.kind === CALENDAR_KIND.PT;
    const member = customerName(booking.customer) || 'Member';
    const sessionTitle = booking.className || (isPt ? 'PT Session' : 'Group Class');
    const status = booking.bookingStatus || booking.status;

    return {
      ...row,
      title: member,
      subtitle: sessionTitle,
      memberName: member,
      sessionTitle,
      capacity: null,
      dot: { tone: STATUS_DOT_TONE[status] || 'booked' },
      status: statusOf(status),
      expandable: false,
      /* Group by the parent session; PT bookings group by their own row. */
      groupKey: booking.sessionId ? `session:${booking.sessionId}` : row.id,
      groupLabel: `${row.timeLabel} · ${sessionTitle}${row.coachName ? ` · ${row.coachName}` : ''}`,
      chipTitle: `${row.timeLabel} ${member} — ${sessionTitle}`,
      actions: buildActions(booking, row.start, ctx),
    };
  });

/**
 * Group rows by ISO date once, so the month grid can look a day up instead of
 * re-filtering the whole list for each of its forty-two cells.
 *
 * @param {Array<Object>} rows
 * @returns {Map<string, Array<Object>>}
 */
export const groupRowsByDate = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.start) return;
    const key = format(row.start, 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return map;
};
