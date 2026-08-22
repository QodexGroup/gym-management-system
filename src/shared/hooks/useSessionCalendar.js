import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from './usePermissions';
import { useCoaches } from './useUsers';
import { useClassScheduleSessions } from './useClassScheduleSessions';
import { useBookingSessions } from './useClassSessionBookings';
import { useCalendarPtBookings } from './usePtBookings';
import { mapClassScheduleSessionsToComponent } from '../models/classScheduleSessionModel';
import { mapBookingsToMemberGroupClassSessions } from '../models/classSessionBookingModel';
import { mapPtBookingsToSessions } from '../models/ptBookingModel';
import {
  CALENDAR_KIND,
  CALENDAR_PERMISSIONS,
  CALENDAR_PERSPECTIVE,
  getCalendarKind,
} from '../constants/sessionSchedulingConstants';
import { BOOKING_STATUS } from '../constants/classSessionBookingConstants';
import { PT_SESSION_PERMISSIONS } from '../constants/ptConstants';
import { GROUP_CLASS_SESSION_PERMISSIONS } from '../constants/sessionSchedulingConstants';
import {
  buildCoachRows,
  buildMemberRows,
  groupRowsByDate,
} from '../../features/calendar/calendarViewModel';

/** Booking statuses offered as filters in the member perspective. */
export const MEMBER_STATUS_FILTERS = [
  BOOKING_STATUS.BOOKED,
  BOOKING_STATUS.ATTENDED,
  BOOKING_STATUS.NO_SHOW,
];

/**
 * Everything the calendar page needs: permissions, perspective, filters, the two
 * perspective-scoped queries and the finished view model.
 *
 * The perspective is not a display toggle — it decides which queries run. In the Coach
 * Schedule perspective the month's member bookings are never fetched (a class of
 * fifteen is one row plus a lazily-loaded roster), and in the Member Bookings
 * perspective they are the subject.
 *
 * @param {{ handlers: Object }} params - Action handlers supplied by the page
 * @returns {Object} calendar state, data and setters
 */
export const useSessionCalendar = ({ handlers }) => {
  const { user, isTrainer } = useAuth();
  const { hasPermission } = usePermissions();

  /* ----------------------------- permissions ----------------------------- */
  /* Staff and admins keep the access they already had; the permissions are the
     opt-in that widens a coach beyond their own schedule. */
  const canViewMemberBookings =
    !isTrainer || hasPermission(CALENDAR_PERMISSIONS.VIEW_MEMBER_BOOKINGS);
  const canViewAllCoaches = !isTrainer || hasPermission(CALENDAR_PERMISSIONS.VIEW_ALL_COACHES);
  const lockedToOwnSchedule = !canViewAllCoaches;

  const permissionFlags = useMemo(
    () => ({
      canCreatePt: hasPermission(PT_SESSION_PERMISSIONS.CREATE),
      canUpdatePt: hasPermission(PT_SESSION_PERMISSIONS.UPDATE),
      canCancelPt: hasPermission(PT_SESSION_PERMISSIONS.CANCEL),
      canCreateGroupClass: hasPermission(GROUP_CLASS_SESSION_PERMISSIONS.CREATE),
      canUpdateGroupClass: hasPermission(GROUP_CLASS_SESSION_PERMISSIONS.UPDATE),
      canCancelGroupClass: hasPermission(GROUP_CLASS_SESSION_PERMISSIONS.CANCEL),
    }),
    [hasPermission]
  );

  /* ------------------------------- state -------------------------------- */
  const [perspective, setPerspectiveState] = useState(CALENDAR_PERSPECTIVE.COACH);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [openDay, setOpenDay] = useState(null);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [kindFilters, setKindFilters] = useState({
    [CALENDAR_KIND.CLASS]: true,
    [CALENDAR_KIND.PT]: true,
  });
  const [statusFilters, setStatusFilters] = useState(() =>
    MEMBER_STATUS_FILTERS.reduce((acc, status) => ({ ...acc, [status]: true }), {})
  );
  const [selectedCoachId, setSelectedCoachId] = useState('');

  /* A coach who never had the permission cannot be left standing in member mode. */
  const activePerspective =
    perspective === CALENDAR_PERSPECTIVE.MEMBER && !canViewMemberBookings
      ? CALENDAR_PERSPECTIVE.COACH
      : perspective;
  const isMemberPerspective = activePerspective === CALENDAR_PERSPECTIVE.MEMBER;

  /* ------------------------------- scope -------------------------------- */
  const { data: coaches = [] } = useCoaches({ enabled: canViewAllCoaches });
  /* Locked users are pinned to themselves whatever the picker would have said. */
  const scopedCoachId = lockedToOwnSchedule ? user?.id ?? null : selectedCoachId || null;

  /* ------------------------------- range -------------------------------- */
  const startDate = useMemo(
    () => format(startOfWeek(startOfMonth(calendarDate)), 'yyyy-MM-dd'),
    [calendarDate]
  );
  const endDate = useMemo(
    () => format(endOfWeek(endOfMonth(calendarDate)), 'yyyy-MM-dd'),
    [calendarDate]
  );

  /* -------------------------------- data -------------------------------- */
  const classSessionFilters = useMemo(() => {
    const filters = { startDate, endDate };
    if (scopedCoachId) filters.coachId = scopedCoachId;
    return filters;
  }, [startDate, endDate, scopedCoachId]);

  const { data: classSessionsData, isLoading: isLoadingSessions } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
    filters: classSessionFilters,
  });

  /* Only fetched in the member perspective — this is the N-rows-per-class query. */
  const { data: bookingsData, isLoading: isLoadingBookings } = useBookingSessions(
    startDate,
    endDate,
    { enabled: isMemberPerspective }
  );

  const { data: ptBookingsData, isLoading: isLoadingPt } = useCalendarPtBookings(
    scopedCoachId,
    startDate,
    endDate,
    { relations: 'ptPackage,customer,coach' }
  );

  const classSessions = useMemo(
    () => mapClassScheduleSessionsToComponent(classSessionsData?.data || []),
    [classSessionsData]
  );
  const memberBookings = useMemo(
    () => mapBookingsToMemberGroupClassSessions(Array.isArray(bookingsData) ? bookingsData : bookingsData?.data || []),
    [bookingsData]
  );
  const ptBookings = useMemo(() => mapPtBookingsToSessions(ptBookingsData || []), [ptBookingsData]);

  /**
   * Coach-perspective source rows, with the PT double-count removed.
   *
   * Booking a PT session against a class schedule writes two records: a `pt_booking`
   * (titled with the client) and a `class_schedule_session` for the same slot (titled
   * with the package). They are one real appointment, so the calendar showed it twice.
   * The booking wins because it names the client and carries the booking status; an
   * unbooked PT slot has no matching booking and is kept as-is.
   */
  const coachSourceRows = useMemo(() => {
    const slotKey = (scheduleId, when) => {
      const date = new Date(when);
      return Number.isNaN(date.getTime())
        ? null
        : `${scheduleId}@${format(date, 'yyyy-MM-dd HH:mm')}`;
    };

    const bookedSlots = new Set(
      ptBookings
        .map((booking) =>
          booking.classScheduleId ? slotKey(booking.classScheduleId, booking.startTime) : null
        )
        .filter(Boolean)
    );

    const withoutDuplicates = classSessions.filter((session) => {
      if (getCalendarKind(session.type) !== CALENDAR_KIND.PT) return true;
      const key = slotKey(session.scheduleId, session.startTime);
      return !key || !bookedSlots.has(key);
    });

    return [...withoutDuplicates, ...ptBookings];
  }, [classSessions, ptBookings]);

  /* ------------------------------ filtering ------------------------------ */
  /**
   * Apply the kind, coach-scope, status and search filters shared by both
   * perspectives.
   * @param {Array<Object>} items
   * @returns {Array<Object>}
   */
  const applyFilters = useCallback(
    (items) =>
      items
        .filter((item) => kindFilters[getCalendarKind(item.type)] !== false)
        .filter((item) => !scopedCoachId || item.coachId === scopedCoachId)
        .filter((item) => {
          if (!isMemberPerspective) return true;
          const status = item.bookingStatus || item.status;
          return !status || statusFilters[status] !== false;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [kindFilters, scopedCoachId, statusFilters, isMemberPerspective]
  );

  const viewModelContext = useMemo(
    () => ({
      ...handlers,
      ...permissionFlags,
      allowAttendance: isMemberPerspective ? isTrainer : true,
    }),
    [handlers, permissionFlags, isMemberPerspective, isTrainer]
  );

  const rows = useMemo(() => {
    if (isMemberPerspective) {
      return buildMemberRows(applyFilters([...memberBookings, ...ptBookings]), viewModelContext);
    }
    return buildCoachRows(applyFilters(coachSourceRows), viewModelContext);
  }, [isMemberPerspective, memberBookings, ptBookings, coachSourceRows, applyFilters, viewModelContext]);

  /* Grouped once — the month grid looks a day up instead of re-filtering per cell. */
  const rowsByDate = useMemo(() => groupRowsByDate(rows), [rows]);

  /* ------------------------------ mutators ------------------------------ */
  /**
   * Change perspective. Switching dismisses the open day — the row set underneath it
   * is now a different thing entirely.
   * @param {string} next - CALENDAR_PERSPECTIVE value
   * @returns {void}
   */
  const setPerspective = useCallback((next) => {
    setPerspectiveState(next);
    setOpenDay(null);
    setExpandedIds(new Set());
  }, []);

  /**
   * Open, or dismiss, a day in the month grid.
   * @param {string|null} dayKey
   * @returns {void}
   */
  const setOpenDayKey = useCallback((dayKey) => {
    setOpenDay(dayKey);
    setExpandedIds(new Set());
  }, []);

  /**
   * Expand or collapse one session's roster inside the day drawer.
   * @param {string} id
   * @returns {void}
   */
  const toggleExpanded = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Toggle a kind filter, dismissing the open day if it emptied as a result.
   * @param {string} kind
   * @returns {void}
   */
  const toggleKindFilter = useCallback((kind) => {
    setKindFilters((prev) => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  /**
   * Toggle a booking-status filter.
   * @param {string} status
   * @returns {void}
   */
  const toggleStatusFilter = useCallback((status) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  /* A filter change keeps the drawer open unless that day is now empty. */
  const visibleOpenDay = openDay && rowsByDate.has(openDay) ? openDay : null;

  return {
    /* permissions */
    canViewMemberBookings,
    canViewAllCoaches,
    lockedToOwnSchedule,
    permissionFlags,
    /* perspective + view */
    perspective: activePerspective,
    setPerspective,
    isMemberPerspective,
    /* month */
    calendarDate,
    setCalendarDate,
    openDay: visibleOpenDay,
    setOpenDay: setOpenDayKey,
    expandedIds,
    toggleExpanded,
    /* filters */
    kindFilters,
    toggleKindFilter,
    statusFilters,
    toggleStatusFilter,
    coaches,
    selectedCoachId,
    setSelectedCoachId,
    /* data */
    rows,
    rowsByDate,
    classSessions,
    isLoading: isLoadingSessions || isLoadingPt || (isMemberPerspective && isLoadingBookings),
  };
};
