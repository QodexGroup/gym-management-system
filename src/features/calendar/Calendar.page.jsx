import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Users, Dumbbell, UserCircle, CalendarDays } from 'lucide-react';
import Layout from '../../layout/Layout';
import { CalendarMonthView, CalendarListView, CalendarToolbar } from '../../components/Calendar';
import { SkeletonLoader } from '../../components/common';
import CalendarModals from './CalendarModals';
import CalendarSessionRoster from './CalendarSessionRoster';
import { getCalendarColumns } from './calendarTable.config';
import { Alert } from '../../shared/utils/alert';
import { useAuth } from '../../shared/context/AuthContext';
import { useSessionCalendar, MEMBER_STATUS_FILTERS } from '../../shared/hooks/useSessionCalendar';
import { useCustomers } from '../../shared/hooks/useCustomers';
import { useCancelClassScheduleSession } from '../../shared/hooks/useClassScheduleSessions';
import { useUpdateAttendanceStatus } from '../../shared/hooks/useClassSessionBookings';
import {
  useCreatePtBooking, useUpdatePtBooking, useCancelPtBooking, useCoachCancelPtBooking,
} from '../../shared/hooks/usePtBookings';
import {
  CALENDAR_KIND, CALENDAR_PERSPECTIVE, CALENDAR_PERSPECTIVE_LABELS, SESSION_TYPES,
} from '../../shared/constants/sessionSchedulingConstants';
import {
  BOOKING_STATUS, BOOKING_STATUS_LABELS,
} from '../../shared/constants/classSessionBookingConstants';
import { transformPtBookingToApiFormat } from '../../shared/models/ptBookingModel';

const VIEW_MODE = { CALENDAR: 'calendar', LIST: 'list' };

/**
 * The calendar page.
 *
 * Owns the modals and the mutations; every piece of calendar state and data comes from
 * useSessionCalendar, and every pixel comes from the presentational components in
 * components/Calendar.
 *
 * @returns {JSX.Element}
 */
const CalendarPage = () => {
  const { isTrainer } = useAuth();
  const [viewMode, setViewMode] = useState(VIEW_MODE.CALENDAR);

  /* ------------------------------- modals ------------------------------- */
  const [showPtForm, setShowPtForm] = useState(false);
  const [showClassAttendance, setShowClassAttendance] = useState(false);
  const [showGroupClassBooking, setShowGroupClassBooking] = useState(false);
  const [showClassSessionEdit, setShowClassSessionEdit] = useState(false);
  const [showPtAttendance, setShowPtAttendance] = useState(false);
  const [selectedPtSession, setSelectedPtSession] = useState(null);
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedPtAttendance, setSelectedPtAttendance] = useState(null);

  /* ------------------------------ mutations ----------------------------- */
  const cancelClassSessionMutation = useCancelClassScheduleSession();
  const updateAttendanceStatusMutation = useUpdateAttendanceStatus();
  const createPtBookingMutation = useCreatePtBooking();
  const updatePtBookingMutation = useUpdatePtBooking();
  const cancelPtBookingMutation = useCancelPtBooking();
  const coachCancelPtBookingMutation = useCoachCancelPtBooking();

  /* ------------------------------ handlers ------------------------------ */
  const handleEditSession = useCallback((session) => {
    setSelectedClassSession(session);
    setShowClassSessionEdit(true);
  }, []);

  const handleEditBooking = useCallback((session) => {
    setSelectedBooking(session.raw || session);
    setShowGroupClassBooking(true);
  }, []);

  const handleEditPtSession = useCallback((session) => {
    setSelectedPtSession(session);
    setShowPtForm(true);
  }, []);

  const handleMarkAttendance = useCallback((session) => {
    const isPt =
      session.type === SESSION_TYPES.COACH_PT || session.type === SESSION_TYPES.MEMBER_PT;
    if (isPt) {
      setSelectedPtAttendance(session);
      setShowPtAttendance(true);
      return;
    }
    setSelectedClassSession(session);
    setShowClassAttendance(true);
  }, []);

  const handleCancelBooking = useCallback(async (bookingId) => {
    const result = await Alert.confirm({
      title: 'Cancel Booking?',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    try {
      await updateAttendanceStatusMutation.mutateAsync({
        bookingId,
        status: BOOKING_STATUS.CANCELLED,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to cancel booking:', error);
    }
  }, [updateAttendanceStatusMutation]);

  /* The cancel path depends on what the row actually is, which needs the current row
     set. Handlers are built before useSessionCalendar runs, so the rows are read
     through a ref that the effect below keeps current — the handler only ever reads it
     in response to a click, never during render. */
  const rowsRef = useRef([]);
  const isMemberPerspectiveRef = useRef(false);

  /**
   * Cancel a session: a standalone PT booking, a PT booking linked to a class schedule
   * session, or a group class session (which cascades to its member bookings).
   *
   * @param {number} sessionId - class schedule session id, or PT booking id
   * @returns {Promise<void>}
   */
  const handleCancelSession = useCallback(async (sessionId) => {
    const result = await Alert.confirm({
      title: 'Cancel Session?',
      text: 'Are you sure you want to cancel this session?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;

    try {
      const rows = rowsRef.current;

      /* A PT booking row. Before the coach perspective de-duplicated schedule-linked
         PT slots there were two rows for one appointment, and cancelling the schedule
         row is what marked the booking COACH_CANCELLED. Now only the booking row
         survives, so the perspective decides who cancelled: from Coach Schedule it is
         the coach, from Member Bookings it is the member's own booking. */
      const ptRow = rows.find(
        (row) => row.kind === CALENDAR_KIND.PT && !row.sessionId && row.raw?.id === sessionId
      );
      if (ptRow) {
        const coachInitiated =
          !isMemberPerspectiveRef.current && Boolean(ptRow.raw?.classScheduleId);
        if (coachInitiated) {
          await coachCancelPtBookingMutation.mutateAsync(sessionId);
        } else {
          await cancelPtBookingMutation.mutateAsync(sessionId);
        }
        return;
      }

      /* An unbooked PT slot or a group class session still cancels the schedule row. */
      await cancelClassSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to cancel session:', error);
    }
  }, [cancelPtBookingMutation, coachCancelPtBookingMutation, cancelClassSessionMutation]);

  const handlers = useMemo(
    () => ({
      onEditSession: handleEditSession,
      onEditBooking: handleEditBooking,
      onEditPtSession: handleEditPtSession,
      onMarkAttendance: handleMarkAttendance,
      onCancelBooking: handleCancelBooking,
      onCancelSession: handleCancelSession,
    }),
    [
      handleEditSession, handleEditBooking, handleEditPtSession,
      handleMarkAttendance, handleCancelBooking, handleCancelSession,
    ]
  );

  const calendar = useSessionCalendar({ handlers });

  useEffect(() => {
    rowsRef.current = calendar.rows;
  }, [calendar.rows]);

  useEffect(() => {
    isMemberPerspectiveRef.current = calendar.isMemberPerspective;
  }, [calendar.isMemberPerspective]);

  const handlePtSessionSubmit = useCallback(async (formData) => {
    try {
      const apiData = transformPtBookingToApiFormat(formData);
      if (selectedPtSession?.raw?.id || selectedPtSession?.id) {
        await updatePtBookingMutation.mutateAsync({
          id: selectedPtSession.raw?.id ?? selectedPtSession.id,
          data: apiData,
        });
      } else {
        await createPtBookingMutation.mutateAsync(apiData);
      }
      setShowPtForm(false);
      setSelectedPtSession(null);
    } catch (error) {
      /* The mutation's onError already surfaced the backend message via Toast. */
      if (import.meta.env.DEV) console.error('Failed to save PT session:', error);
    }
  }, [selectedPtSession, updatePtBookingMutation, createPtBookingMutation]);

  const { data: customersData } = useCustomers(1);
  const customers = useMemo(() => customersData?.data || [], [customersData]);

  /* ------------------------------- toolbar ------------------------------ */
  const perspectiveConfig = calendar.canViewMemberBookings
    ? {
        value: calendar.perspective,
        onChange: calendar.setPerspective,
        options: [
          {
            key: CALENDAR_PERSPECTIVE.COACH,
            label: CALENDAR_PERSPECTIVE_LABELS[CALENDAR_PERSPECTIVE.COACH],
            shortLabel: 'Coach',
            icon: CalendarDays,
          },
          {
            key: CALENDAR_PERSPECTIVE.MEMBER,
            label: CALENDAR_PERSPECTIVE_LABELS[CALENDAR_PERSPECTIVE.MEMBER],
            shortLabel: 'Members',
            icon: UserCircle,
          },
        ],
      }
    : null;

  const typeFilters = useMemo(() => {
    const labels = calendar.isMemberPerspective
      ? { [CALENDAR_KIND.CLASS]: 'Class Bookings', [CALENDAR_KIND.PT]: 'PT Bookings' }
      : { [CALENDAR_KIND.CLASS]: 'Group Classes', [CALENDAR_KIND.PT]: 'PT Sessions' };
    return [CALENDAR_KIND.CLASS, CALENDAR_KIND.PT].map((kind) => ({
      key: kind,
      kind,
      label: labels[kind],
      shortLabel: kind === CALENDAR_KIND.PT ? 'PT' : 'Classes',
      isActive: calendar.kindFilters[kind] !== false,
    }));
  }, [calendar.isMemberPerspective, calendar.kindFilters]);

  const statusFilters = useMemo(() => {
    if (!calendar.isMemberPerspective) return [];
    return MEMBER_STATUS_FILTERS.map((status) => ({
      key: status,
      label: BOOKING_STATUS_LABELS[status],
      isActive: calendar.statusFilters[status] !== false,
    }));
  }, [calendar.isMemberPerspective, calendar.statusFilters]);

  const scopeConfig = useMemo(() => {
    if (calendar.lockedToOwnSchedule) {
      return { locked: true, lockedLabel: 'Your schedule only' };
    }
    /* Coach Schedule only — member bookings are filtered by status, not by coach. */
    if (calendar.isMemberPerspective) return null;
    return {
      locked: false,
      value: calendar.selectedCoachId,
      onChange: calendar.setSelectedCoachId,
      options: [
        { value: '', label: 'All coaches' },
        ...calendar.coaches.map((coach) => ({
          value: String(coach.id),
          label: `${coach.firstname} ${coach.lastname}`,
        })),
      ],
    };
  }, [
    calendar.lockedToOwnSchedule, calendar.isMemberPerspective,
    calendar.selectedCoachId, calendar.setSelectedCoachId, calendar.coaches,
  ]);

  const actionButtons = useMemo(() => {
    const buttons = [];
    if (!isTrainer && calendar.permissionFlags.canCreateGroupClass) {
      buttons.push({
        key: 'book-group-class',
        label: 'Book Group Class',
        icon: Users,
        variant: 'secondary',
        onClick: () => { setSelectedBooking(null); setShowGroupClassBooking(true); },
      });
    }
    if (calendar.permissionFlags.canCreatePt) {
      buttons.push({
        key: 'book-pt-session',
        label: 'Book PT Session',
        icon: Dumbbell,
        variant: 'primary',
        onClick: () => { setSelectedPtSession(null); setShowPtForm(true); },
      });
    }
    return buttons;
  }, [isTrainer, calendar.permissionFlags]);

  return (
    <Layout title="Calendar" subtitle="View and manage all sessions, classes, and appointments">
      <div className="space-y-6">
        <CalendarToolbar
          perspective={perspectiveConfig}
          typeFilterLabel={calendar.isMemberPerspective ? 'Booking type' : 'Session type'}
          typeFilters={typeFilters}
          onTypeFilterToggle={calendar.toggleKindFilter}
          statusFilters={statusFilters}
          onStatusFilterToggle={calendar.toggleStatusFilter}
          scope={scopeConfig}
          viewMode={viewMode}
          onViewModeToggle={() =>
            setViewMode((mode) => (mode === VIEW_MODE.LIST ? VIEW_MODE.CALENDAR : VIEW_MODE.LIST))
          }
          actionButtons={actionButtons}
        />

        {calendar.isLoading ? (
          <div className="card">
            <SkeletonLoader type="table" />
          </div>
        ) : viewMode === VIEW_MODE.CALENDAR ? (
          <CalendarMonthView
            calendarDate={calendar.calendarDate}
            onCalendarDateChange={calendar.setCalendarDate}
            eventsByDate={calendar.rowsByDate}
            openDay={calendar.openDay}
            onOpenDayChange={calendar.setOpenDay}
            expandedIds={calendar.expandedIds}
            onToggleExpand={calendar.toggleExpanded}
            groupDrawerRows={calendar.isMemberPerspective}
            RosterSlot={CalendarSessionRoster}
          />
        ) : (
          <CalendarListView
            columns={getCalendarColumns(calendar.perspective)}
            rows={calendar.rows}
            title={calendar.isMemberPerspective ? 'Member Bookings' : 'Sessions'}
            emptyMessage={
              calendar.isMemberPerspective
                ? 'No member bookings for this period'
                : 'No sessions for this period'
            }
          />
        )}
      </div>

      <CalendarModals
        modals={{
          showPtForm, showClassAttendance, showGroupClassBooking,
          showClassSessionEdit, showPtAttendance,
        }}
        selected={{
          ptSession: selectedPtSession,
          classSession: selectedClassSession,
          booking: selectedBooking,
          ptAttendanceSession: selectedPtAttendance,
        }}
        onClose={{
          closePtForm: () => { setShowPtForm(false); setSelectedPtSession(null); },
          closeClassAttendance: () => setShowClassAttendance(false),
          closeGroupClassBooking: () => { setShowGroupClassBooking(false); setSelectedBooking(null); },
          closeClassSessionEdit: () => { setShowClassSessionEdit(false); setSelectedClassSession(null); },
          closePtAttendance: () => { setShowPtAttendance(false); setSelectedPtAttendance(null); },
        }}
        data={{ customers, classSessions: calendar.classSessions }}
        handlers={{ onPtSessionSubmit: handlePtSessionSubmit }}
        isPending={{
          createPt: createPtBookingMutation.isPending,
          updatePt: updatePtBookingMutation.isPending,
        }}
      />
    </Layout>
  );
};

export default CalendarPage;
