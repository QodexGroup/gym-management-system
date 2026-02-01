import { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal } from '../../components/common';
import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import CalendarToolbar from '../../components/Calendar/CalendarToolbar';
import PtSessionForm from './forms/PtSessionForm';
import ClassAttendanceForm from './forms/ClassAttendanceForm';
import GroupClassBookingForm from './forms/GroupClassBookingForm';
import ClassScheduleSessionForm from './forms/ClassScheduleSessionForm';
import { Plus, User } from 'lucide-react';
import { Alert } from '../../utils/alert';
import { SESSION_STATUS } from '../../constants/ptConstants';
import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  VIEW_MODE,
  getFilterButtonColor,
  getSessionStyle,
} from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS } from '../../constants/classSessionBookingConstants';
import { useCoaches } from '../../hooks/useUsers';
import { useCustomers } from '../../hooks/useCustomers';
import { useClassScheduleSessions, useUpdateClassScheduleSession } from '../../hooks/useClassScheduleSessions';
import { useBookingSessions, useUpdateAttendanceStatus } from '../../hooks/useClassSessionBookings';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { mapClassScheduleSessionsToComponent } from '../../models/classScheduleSessionModel';
import { mapBookingsToMemberGroupClassSessions } from '../../models/classSessionBookingModel';
import { transformSessionsForCalendar } from './transformers/sessionCalendarTransformer';

const SessionScheduling = () => {
  /* ------------------------------- state ------------------------------- */
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODE.CALENDAR);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showGroupClassModal, setShowGroupClassModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showGroupClassEditModal, setShowGroupClassEditModal] = useState(false);

  /* ------------------------------- filters ------------------------------- */
  const [typeFilters, setTypeFilters] = useState({
    [SESSION_TYPES.COACH_GROUP_CLASS]: true,
    [SESSION_TYPES.MEMBER_GROUP_CLASS]: true,
    [SESSION_TYPES.COACH_PT]: false,
    [SESSION_TYPES.MEMBER_PT]: false,
  });

  /* ------------------------------- hooks ------------------------------- */
  const { user, isTrainer } = useAuth();
  const { data: coaches = [] } = useCoaches();
  const [coachFilters, setCoachFilters] = useState({});

  useEffect(() => {
    if (!isTrainer && coaches.length > 0) {
      const initialFilters = {};
      coaches.forEach((coach) => (initialFilters[coach.id] = true));
      setCoachFilters(initialFilters);
    } else if (isTrainer && user?.id) {
      setCoachFilters({ [user.id]: true });
    }
  }, [coaches, isTrainer, user]);

  /* ------------------------------- calendar ------------------------------- */
  const calendarStartDate = useMemo(() => format(startOfWeek(startOfMonth(calendarDate)), 'yyyy-MM-dd'), [calendarDate]);
  const calendarEndDate = useMemo(() => format(endOfWeek(endOfMonth(calendarDate)), 'yyyy-MM-dd'), [calendarDate]);

  /* ------------------------------- data ------------------------------- */
  const { data: classSessionsData, isLoading: isLoadingSessions } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
    filters: { startDate: calendarStartDate, endDate: calendarEndDate },
  });

  const { data: bookingsData } = useBookingSessions(calendarStartDate, calendarEndDate);
  const { data: customersData } = useCustomers(1);

  /* ------------------------------- mutations ------------------------------- */
  const updateClassScheduleSessionMutation = useUpdateClassScheduleSession();
  const updateAttendanceStatusMutation = useUpdateAttendanceStatus();

  const classScheduleSessions = useMemo(() => mapClassScheduleSessionsToComponent(classSessionsData?.data || []), [classSessionsData]);

  const memberGroupClassSessions = useMemo(() => {
    return mapBookingsToMemberGroupClassSessions(bookingsData);
  }, [bookingsData]);

  const customers = useMemo(() => customersData?.data || [], [customersData]);

  const toggleTypeFilter = (type) => setTypeFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  const toggleCoachFilter = (coachId) => setCoachFilters((prev) => ({ ...prev, [coachId]: !prev[coachId] }));
  const getSessionStyleWrapper = (session) => getSessionStyle(session, SESSION_STATUS);

  /* ------------------------------- handlers ------------------------------- */
  const handleSessionClick = useCallback((session) => {
    if ([SESSION_TYPES.COACH_GROUP_CLASS, SESSION_TYPES.MEMBER_GROUP_CLASS].includes(session.type)) {
      setSelectedClassSession(session);
      setShowAttendanceModal(true);
    } else {
      setSelectedSession(session);
      setShowModal(true);
    }
  }, []);

  const handleEditGroupClassSession = useCallback((session) => {
    // If it's a member group class booking, open the booking form instead
    if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS && session.bookingId) {
      // Find the booking data - bookingsData might be an array or have a data property
      const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.data || []);
      const booking = bookings.find(b => b.id === session.bookingId);
      if (booking) {
        setSelectedBooking(booking);
        setShowGroupClassModal(true);
        return;
      }
    }
    // For coach group class sessions, open the session edit form
    setSelectedClassSession(session);
    setShowGroupClassEditModal(true);
  }, [bookingsData]);

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
      await updateAttendanceStatusMutation.mutateAsync({ bookingId, status: BOOKING_STATUS.CANCELLED });
    } catch (err) {
      console.error(err);
    }
  }, [updateAttendanceStatusMutation]);

  const handleCancelSession = useCallback(async (sessionId) => {
    const result = await Alert.confirm({
      title: 'Cancel Session?',
      text: 'Are you sure you want to cancel this session?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });
    if (!result.isConfirmed) return;
    console.log('Cancel session', sessionId);
  }, []);

  // Combine and filter all sessions into a single array, then transform for calendar/list views
  const sessions = useMemo(() => {
    const allSessions = [...classScheduleSessions, ...memberGroupClassSessions];

    const filtered = allSessions
      .filter((session) => typeFilters[session.type])
      .filter((session) => coachFilters[session.coachId] !== false)
      .filter((session) => {
        if (!searchQuery) return true;
        const customerName = session.customer
          ? `${session.customer.firstName || ''} ${session.customer.lastName || ''}`.trim()
          : '';
        return session.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               customerName.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Transform sessions for CalendarView and CalendarListView (UI concern)
    return transformSessionsForCalendar(filtered, {
      onSessionClick: handleSessionClick,
      onEditGroupClassSession: handleEditGroupClassSession,
      onCancelSession: handleCancelSession,
      onCancelBooking: handleCancelBooking,
    });
  }, 
  [classScheduleSessions, 
    memberGroupClassSessions, 
    typeFilters, 
    coachFilters, 
    searchQuery, 
    handleSessionClick, 
    handleEditGroupClassSession, 
    handleCancelSession, 
    handleCancelBooking
  ]);

  // Prepare type filters for CalendarToolbar
  const typeFiltersArray = useMemo(() => {
    return Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => ({
      key,
      label,
      isActive: typeFilters[key],
      getColorClass: getFilterButtonColor,
    }));
  }, [typeFilters]);

  // Prepare action buttons for CalendarToolbar
  const actionButtons = useMemo(() => [
    {
      key: 'book-group-class',
      label: 'Book Group Class',
      icon: Plus,
      onClick: () => setShowGroupClassModal(true),
      variant: 'secondary',
    },
    {
      key: 'book-pt-session',
      label: 'Book PT Session',
      icon: Plus,
      onClick: () => setShowModal(true),
      variant: 'primary',
    },
  ], []);

  // Prepare additional filters (coaches) for CalendarToolbar
  const additionalFilters = useMemo(() => {
    if (isTrainer) return null;

    return {
      label: 'Coaches',
      icon: User,
      items: coaches.map((coach) => ({
        id: coach.id,
        label: `${coach.firstname} ${coach.lastname}`,
        isActive: coachFilters[coach.id] !== false,
        onClick: toggleCoachFilter,
      })),
    };
  }, [isTrainer, coaches, coachFilters, toggleCoachFilter]);

  if (isLoadingSessions) {
    return (
      <Layout title="Calendar" subtitle="View and manage all sessions, classes, and appointments">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  /* ------------------------------- render ------------------------------- */
  return (
    <Layout title="Calendar" subtitle="View and manage all sessions, classes, and appointments">
      <div className="space-y-6">
        <CalendarToolbar
          typeFilters={typeFiltersArray}
          onTypeFilterToggle={toggleTypeFilter}
          typeFilterLabel="Schedule Types:"
          viewMode={viewMode}
          onViewModeToggle={() => setViewMode(viewMode === VIEW_MODE.LIST ? VIEW_MODE.CALENDAR : VIEW_MODE.LIST)}
          actionButtons={actionButtons}
          additionalFilters={additionalFilters}
          showViewToggle={true}
        />

        {viewMode === VIEW_MODE.CALENDAR ? (
          <CalendarView
            calendarDate={calendarDate}
            sessions={sessions}
            onCalendarDateChange={setCalendarDate}
          />
        ) : (
          <CalendarListView
            sessions={sessions}
          />
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedSession ? 'Edit Session' : 'Book PT Session'} size="md">
        <PtSessionForm
          session={selectedSession}
          customers={customers}
          coaches={coaches}
          onSubmit={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
          isSubmitting={false}
        />
      </Modal>

      <Modal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title={`Mark Attendance - ${selectedClassSession?.className || 'Class'}`} size="lg">
        <ClassAttendanceForm
          classSession={selectedClassSession}
          onCancel={() => setShowAttendanceModal(false)}
          onSubmit={() => setShowAttendanceModal(false)}
          isSubmitting={false}
        />
      </Modal>

      <Modal isOpen={showGroupClassModal} onClose={() => setShowGroupClassModal(false)} title={selectedBooking ? 'Edit Group Class Booking' : 'Book Group Class Session'} size="lg">
        <GroupClassBookingForm
          booking={selectedBooking}
          customers={customers}
          classSessions={classScheduleSessions}
          onSubmit={() => setShowGroupClassModal(false)}
          onCancel={() => setShowGroupClassModal(false)}
          isSubmitting={false}
        />
      </Modal>

      <Modal isOpen={showGroupClassEditModal} onClose={() => setShowGroupClassEditModal(false)} title={`Edit Session - ${selectedClassSession?.className || 'Class'}`} size="md">
        <ClassScheduleSessionForm
          session={selectedClassSession}
          onSubmit={() => {
            setShowGroupClassEditModal(false);
            setSelectedClassSession(null);
          }}
          onCancel={() => {
            setShowGroupClassEditModal(false);
            setSelectedClassSession(null);
          }}
          isSubmitting={false}
        />
      </Modal>
    </Layout>
  );
};

export default SessionScheduling;
