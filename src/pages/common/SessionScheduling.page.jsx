import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import { Modal } from '../../components/common';
import CalendarView from '../../components/Calendar/CalendarView';
import CalendarListView from '../../components/Calendar/CalendarListView';
import CalendarToolbar from '../../components/Calendar/CalendarToolbar';
import PtSessionForm from './forms/PtSessionForm';
import PtAttendanceForm from './forms/PtAttendanceForm';
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
import { useCreatePtBooking, useUpdatePtBooking, usePtBookings, usePtBookingsByCoach, useCancelPtBooking } from '../../hooks/usePtBookings';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { mapClassScheduleSessionsToComponent } from '../../models/classScheduleSessionModel';
import { mapBookingsToMemberGroupClassSessions } from '../../models/classSessionBookingModel';
import { transformPtBookingToApiFormat, mapPtBookingsToSessions } from '../../models/ptBookingModel';
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
  const [showPtAttendanceModal, setShowPtAttendanceModal] = useState(false);
  const [selectedPtSession, setSelectedPtSession] = useState(null);

  /* ------------------------------- hooks ------------------------------- */
  const { user, isTrainer } = useAuth();
  const { data: coaches = [] } = useCoaches();

  /* ------------------------------- filters ------------------------------- */
  const [typeFilters, setTypeFilters] = useState({
    [SESSION_TYPES.COACH_GROUP_CLASS]: true,
    [SESSION_TYPES.MEMBER_GROUP_CLASS]: true,
    [SESSION_TYPES.COACH_PT]: true,
    [SESSION_TYPES.MEMBER_PT]: true,
  });

  const [coachFilters, setCoachFilters] = useState({});
  const prevIsTrainerRef = useRef(isTrainer);

  // Update type filters when trainer status changes - remove coach filters for trainers
  useEffect(() => {
    // Only update if isTrainer status actually changed
    if (prevIsTrainerRef.current === isTrainer) {
      return;
    }
    
    const prevIsTrainer = prevIsTrainerRef.current;
    prevIsTrainerRef.current = isTrainer;

    if (isTrainer && !prevIsTrainer) {
      // Changed from non-trainer to trainer - remove coach filters
      setTypeFilters(prev => {
        // Only update if coach filters are still present
        if (SESSION_TYPES.COACH_GROUP_CLASS in prev || SESSION_TYPES.COACH_PT in prev) {
          const updated = { ...prev };
          // Remove coach-specific filters for trainers
          delete updated[SESSION_TYPES.COACH_GROUP_CLASS];
          delete updated[SESSION_TYPES.COACH_PT];
          return updated;
        }
        return prev;
      });
    } else if (!isTrainer && prevIsTrainer) {
      // Changed from trainer to non-trainer - add coach filters
      setTypeFilters(prev => {
        // Only update if coach filters are missing
        if (!(SESSION_TYPES.COACH_GROUP_CLASS in prev) || !(SESSION_TYPES.COACH_PT in prev)) {
          return {
            ...prev,
            [SESSION_TYPES.COACH_GROUP_CLASS]: true,
            [SESSION_TYPES.COACH_PT]: true,
          };
        }
        return prev;
      });
    }
  }, [isTrainer]);

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
  // Build filters for class schedule sessions
  const classScheduleFilters = useMemo(() => {
    const filters = { startDate: calendarStartDate, endDate: calendarEndDate };
    // If user is a trainer, only show their own sessions
    if (isTrainer && user?.id) {
      filters.coachId = user.id;
    }
    return filters;
  }, [calendarStartDate, calendarEndDate, isTrainer, user?.id]);

  const { data: classSessionsData, isLoading: isLoadingSessions } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
    filters: classScheduleFilters,
  });

  const { data: bookingsData } = useBookingSessions(calendarStartDate, calendarEndDate);
  const { data: customersData } = useCustomers(1);

  // Fetch PT bookings based on user role
  const ptBookingsOptions = {
    relations: 'ptPackage,customer,coach',
  };
  const { data: ptBookingsData } = isTrainer && user?.id
    ? usePtBookingsByCoach(user.id, calendarStartDate, calendarEndDate, ptBookingsOptions)
    : usePtBookings(calendarStartDate, calendarEndDate, ptBookingsOptions);

  /* ------------------------------- mutations ------------------------------- */
  const updateClassScheduleSessionMutation = useUpdateClassScheduleSession();
  const updateAttendanceStatusMutation = useUpdateAttendanceStatus();
  const createPtBookingMutation = useCreatePtBooking();
  const updatePtBookingMutation = useUpdatePtBooking();
  const cancelPtBookingMutation = useCancelPtBooking();

  const classScheduleSessions = useMemo(() => {
    const sessions = mapClassScheduleSessionsToComponent(classSessionsData?.data || []);
    // If user is a trainer, filter to only show their own sessions
    if (isTrainer && user?.id) {
      return sessions.filter(session => session.coachId === user.id);
    }
    return sessions;
  }, [classSessionsData, isTrainer, user?.id]);

  const memberGroupClassSessions = useMemo(() => {
    return mapBookingsToMemberGroupClassSessions(bookingsData);
  }, [bookingsData]);

  const ptSessions = useMemo(() => {
    const bookings = ptBookingsData || [];

    // Always show member PT bookings (booking perspective)
    return mapPtBookingsToSessions(bookings);
  }, [ptBookingsData]);

  const customers = useMemo(() => customersData?.data || [], [customersData]);

  const toggleTypeFilter = (type) => setTypeFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  const toggleCoachFilter = (coachId) => setCoachFilters((prev) => ({ ...prev, [coachId]: !prev[coachId] }));
  const getSessionStyleWrapper = (session) => getSessionStyle(session, SESSION_STATUS);

  /* ------------------------------- handlers ------------------------------- */
  const handleSessionClick = useCallback((session) => {
    if (!isTrainer && [SESSION_TYPES.MEMBER_GROUP_CLASS, SESSION_TYPES.MEMBER_PT].includes(session.type)) {
      return;
    }
    if ([SESSION_TYPES.COACH_GROUP_CLASS, SESSION_TYPES.MEMBER_GROUP_CLASS].includes(session.type)) {
      setSelectedClassSession(session);
      setShowAttendanceModal(true);
    } else if ([SESSION_TYPES.COACH_PT, SESSION_TYPES.MEMBER_PT].includes(session.type)) {
      if (session.sessionId) {
        setSelectedPtSession(session);
      } else {
        setSelectedPtSession(session);
      }
      setShowPtAttendanceModal(true);
    } else {
      setSelectedSession(session);
      setShowModal(true);
    }
  }, [isTrainer]);

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

  const handleEditPtSession = useCallback((session) => {
    setSelectedSession(session);
    setShowModal(true);
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
    
    try {
      // Check if it's a PT booking by looking for it in ptBookingsData
      const ptBookings = ptBookingsData || [];
      const ptBooking = ptBookings.find(b => b.id === sessionId);
      
      if (ptBooking) {
        // It's a PT booking
        await cancelPtBookingMutation.mutateAsync(sessionId);
      } else {
        // It's a class schedule session (not yet implemented)
        console.log('Cancel class schedule session', sessionId);
      }
    } catch (err) {
      console.error(err);
    }
  }, [ptBookingsData, cancelPtBookingMutation]);

  const handlePtSessionSubmit = useCallback(async (formData) => {
    try {
      // Transform form data to API format (snake_case)
      const apiData = transformPtBookingToApiFormat(formData);

      if (selectedSession?.id) {
        // Update existing PT booking
        await updatePtBookingMutation.mutateAsync({
          id: selectedSession.id,
          data: apiData,
        });
      } else {
        // Create new PT booking
        await createPtBookingMutation.mutateAsync(apiData);
      }

      setShowModal(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to save PT booking:', error);
      // Error is handled by the mutation's onError callback (shows toast)
    }
  }, [selectedSession, createPtBookingMutation, updatePtBookingMutation]);

  // Combine and filter all sessions into a single array, then transform for calendar/list views
  const sessions = useMemo(() => {
    const allSessions = [...classScheduleSessions, ...memberGroupClassSessions, ...ptSessions];

    // For trainers, filter to only show their own sessions
    let filtered = allSessions;
    if (isTrainer && user?.id) {
      filtered = filtered.filter(session => session.coachId === user.id);
    }

    // For PT sessions: if coach PT filter is enabled, show coach PT sessions
    // If member PT filter is enabled, show member PT sessions
    // We need to show both perspectives when both filters are enabled
    filtered = filtered
      .filter((session) => {
        // For PT sessions, check if the corresponding filter is enabled
        if (session.type === SESSION_TYPES.COACH_PT) {
          return typeFilters[SESSION_TYPES.COACH_PT] !== false;
        }
        if (session.type === SESSION_TYPES.MEMBER_PT) {
          return typeFilters[SESSION_TYPES.MEMBER_PT] !== false;
        }
        // For group class sessions, use normal filter
        return typeFilters[session.type] !== false;
      })
      .filter((session) => {
        // Only apply coach filters if user is not a trainer
        if (isTrainer) return true;
        return coachFilters[session.coachId] !== false;
      })
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
      onEditPtSession: handleEditPtSession,
      onCancelSession: handleCancelSession,
      onCancelBooking: handleCancelBooking,
      allowMemberAttendance: isTrainer,
    });
  }, 
  [classScheduleSessions, 
    memberGroupClassSessions,
    ptSessions,
    typeFilters, 
    coachFilters, 
    searchQuery, 
    handleSessionClick, 
    handleEditGroupClassSession, 
    handleCancelSession, 
    handleCancelBooking,
    isTrainer,
    user?.id
  ]);

  // Prepare type filters for CalendarToolbar
  // For trainers, exclude COACH_GROUP_CLASS and COACH_PT filters since they only see their own schedule
  const typeFiltersArray = useMemo(() => {
    return Object.entries(SESSION_TYPE_LABELS)
      .filter(([key]) => {
        // For trainers, exclude coach-specific filters
        if (isTrainer) {
          return key !== SESSION_TYPES.COACH_GROUP_CLASS && key !== SESSION_TYPES.COACH_PT;
        }
        return true;
      })
      .map(([key, label]) => ({
        key,
        label,
        isActive: typeFilters[key] !== false,
        getColorClass: getFilterButtonColor,
      }));
  }, [typeFilters, isTrainer]);

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
      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setSelectedSession(null);
        }} 
        title={selectedSession ? 'Edit PT Session' : 'Book PT Session'} 
        size="md"
      >
        <PtSessionForm
          session={selectedSession}
          customers={customers}
          onSubmit={handlePtSessionSubmit}
          onCancel={() => {
            setShowModal(false);
            setSelectedSession(null);
          }}
          isSubmitting={createPtBookingMutation.isPending || updatePtBookingMutation.isPending}
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

      <Modal 
        isOpen={showPtAttendanceModal} 
        onClose={() => {
          setShowPtAttendanceModal(false);
          setSelectedPtSession(null);
        }} 
        title={`Mark Attendance - ${
          selectedPtSession?.className ||
          (selectedPtSession?.customer
            ? `${selectedPtSession.customer.firstName || ''} ${selectedPtSession.customer.lastName || ''}`.trim()
            : SESSION_TYPE_LABELS[SESSION_TYPES.COACH_PT]?.replace(' Schedule', '') || 'PT Session')
        }`} 
        size="lg"
      >
        <PtAttendanceForm
          ptSession={selectedPtSession}
          onCancel={() => {
            setShowPtAttendanceModal(false);
            setSelectedPtSession(null);
          }}
          onSubmit={() => {
            setShowPtAttendanceModal(false);
            setSelectedPtSession(null);
          }}
          isSubmitting={false}
        />
      </Modal>
    </Layout>
  );
};

export default SessionScheduling;
