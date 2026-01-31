import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal, Avatar } from '../../components/common';
import CalendarView from '../../components/common/CalendarView';
import CalendarListView from '../../components/common/CalendarListView';
import PtSessionForm from './forms/PtSessionForm';
import ClassAttendanceForm from './forms/ClassAttendanceForm';
import GroupClassBookingForm from './forms/GroupClassBookingForm';
import ClassScheduleSessionForm from './forms/ClassScheduleSessionForm';
import {
  Plus,
  Calendar,
  User,
  List,
  Filter,
} from 'lucide-react';
import { Alert, Toast } from '../../utils/alert';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../../constants/ptConstants';
import { SESSION_TYPES, SESSION_TYPE_LABELS, VIEW_MODE, getFilterButtonColor, getSessionStyle } from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS } from '../../constants/classSessionBookingConstants';
import { useCoaches } from '../../hooks/useUsers';
import { useCustomers } from '../../hooks/useCustomers';
import { useClassScheduleSessions, useUpdateClassScheduleSession } from '../../hooks/useClassScheduleSessions';
import { useBookingSessions, useUpdateAttendanceStatus } from '../../hooks/useClassSessionBookings';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, formatTimeFromDate, formatDateShort } from '../../utils/formatters';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { mapClassScheduleSessionsToComponent } from '../../models/classScheduleSessionModel';

const SessionScheduling = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(null); // No date filter by default
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODE.CALENDAR);
  const [calendarDate, setCalendarDate] = useState(new Date()); // Current month for calendar view
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date()); // Selected date in calendar
  const [showFilters, setShowFilters] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const [showGroupClassModal, setShowGroupClassModal] = useState(false);
  const [showGroupClassEditModal, setShowGroupClassEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Type filters (checkboxes)
  const [typeFilters, setTypeFilters] = useState({
    [SESSION_TYPES.COACH_GROUP_CLASS]: true,
    [SESSION_TYPES.MEMBER_GROUP_CLASS]: true,
    [SESSION_TYPES.COACH_PT]: false, // Disabled - PT sessions not implemented yet
    [SESSION_TYPES.MEMBER_PT]: false, // Disabled - PT sessions not implemented yet
  });

  // Get current user
  const { user, isTrainer } = useAuth();

  // Coach filters (checkboxes)
  const { data: coaches = [] } = useCoaches();
  const [coachFilters, setCoachFilters] = useState({});


  // Initialize coach filters - all selected by default (only for non-coaches)
  useEffect(() => {
    if (!isTrainer && coaches.length > 0) {
      const initialFilters = {};
      coaches.forEach(coach => {
        initialFilters[coach.id] = true;
      });
      setCoachFilters(initialFilters);
    } else if (isTrainer && user?.id) {
      // If user is a coach, only show their own sessions
      setCoachFilters({ [user.id]: true });
    }
  }, [coaches, isTrainer, user]);

  // Calculate date range for calendar month to fetch sessions
  const calendarStartDate = useMemo(() => {
    const monthStart = startOfMonth(calendarDate);
    const weekStart = startOfWeek(monthStart);
    return format(weekStart, 'yyyy-MM-dd');
  }, [calendarDate]);

  const calendarEndDate = useMemo(() => {
    const monthEnd = endOfMonth(calendarDate);
    const weekEnd = endOfWeek(monthEnd);
    return format(weekEnd, 'yyyy-MM-dd');
  }, [calendarDate]);

  // Fetch class schedule sessions with date range filter (like bookings)
  const { data: sessionsData, isLoading: isLoadingSessions } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
    filters: {
      startDate: calendarStartDate,
      endDate: calendarEndDate,
    },
  });

  // Fetch PT sessions - DISABLED: PT sessions not implemented yet
  // const { data: ptSessionsData, isLoading: isLoadingPtSessions } = useSessions({
  //   pagelimit: 0,
  //   relations: 'customer,ptPackage,trainer',
  // });
  const ptSessionsData = null;
  const isLoadingPtSessions = false;

  // Fetch PT packages - DISABLED: PT sessions not implemented yet
  // const { data: packagesData } = usePtPackages({
  //   pagelimit: 0,
  // });
  const packagesData = null;

  // Fetch customers
  const { data: customersData } = useCustomers(1);

  // Fetch booking sessions for calendar view
  const { data: bookingsData } = useBookingSessions(calendarStartDate, calendarEndDate);

  // Initialize mutations - DISABLED: PT sessions not implemented yet
  // const bookSessionMutation = useBookSession();
  // const updateSessionMutation = useUpdateSession();
  // const cancelSessionMutation = useCancelSession();
  const bookSessionMutation = { isPending: false, mutateAsync: async () => {} };
  const updateSessionMutation = { isPending: false, mutateAsync: async () => {} };
  const cancelSessionMutation = { isPending: false, mutateAsync: async () => {} };
  
  // Class schedule session mutations
  const updateClassScheduleSessionMutation = useUpdateClassScheduleSession();
  
  // Booking mutations
  const updateAttendanceStatusMutation = useUpdateAttendanceStatus();

  // Transform class schedule sessions to match the expected format using model
  const classScheduleSessions = useMemo(() => {
    const sessions = sessionsData?.data || [];
    return mapClassScheduleSessionsToComponent(sessions);
  }, [sessionsData]);

  // Transform booking sessions to member group class sessions
  const memberGroupClassSessions = useMemo(() => {
    const bookings = bookingsData || [];
    return bookings
      .filter(booking => booking.status !== BOOKING_STATUS.CANCELLED)
      .map(booking => {
        const session = booking.classScheduleSession || {};
        const schedule = session.classSchedule || {};
        const customer = booking.customer || {};
        
        if (!session.startTime) {
          return null; // Skip if no session data
    }

    return {
          id: booking.id,
          type: SESSION_TYPES.MEMBER_GROUP_CLASS,
          startTime: session.startTime,
          endTime: session.endTime,
          sessionDate: session.startTime ? format(new Date(session.startTime), 'yyyy-MM-dd') : '',
          sessionTime: session.startTime ? formatTimeFromDate(session.startTime) : '',
          className: schedule.className || 'Unknown Class',
          coach: schedule.coach,
          coachId: schedule.coachId,
          capacity: schedule.capacity,
          attendanceCount: session.attendanceCount || 0,
          scheduleId: schedule.id,
          sessionId: session.id,
          bookingId: booking.id,
          customer: customer,
          customerId: customer.id,
          bookingStatus: booking.status,
          notes: booking.notes || '',
        };
      })
      .filter(session => session !== null);
  }, [bookingsData]);

  // Transform PT sessions data
  const sessionsList = useMemo(() => {
    return ptSessionsData?.data || [];
  }, [ptSessionsData]);

  // Transform packages data
  const packages = useMemo(() => {
    return packagesData?.data || [];
  }, [packagesData]);

  // Transform customers data
  const customers = useMemo(() => {
    return customersData?.data || [];
  }, [customersData]);

  const loading = isLoadingSessions || isLoadingPtSessions;

  // Apply filters to PT sessions
  const filteredPtSessions = useMemo(() => {
    let filtered = [...sessionsList];
    
    // Filter by type
    if (!typeFilters[SESSION_TYPES.COACH_PT] && !typeFilters[SESSION_TYPES.MEMBER_PT]) {
      filtered = [];
    }
    
    // Filter by coach - if user is a coach, only show their own sessions
    filtered = filtered.filter(session => {
      if (isTrainer && user?.id) {
        return session.trainerId === user.id;
      }
      return coachFilters[session.trainerId] !== false;
    });
    
    if (searchQuery) {
      filtered = filtered.filter(session => {
        const customer = customers.find(c => c.id === session.customerId);
        const name = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
        return name.includes(searchQuery.toLowerCase());
      });
    }
    if (filterDate) {
      const dateStr = filterDate.toISOString().split('T')[0];
      filtered = filtered.filter(session => session.sessionDate === dateStr);
    }
    
    // Add type to PT sessions
    return filtered.map(session => ({
      ...session,
      type: SESSION_TYPES.COACH_PT, // PT sessions are coach PT
    }));
  }, [sessionsList, searchQuery, filterDate, customers, typeFilters, coachFilters, isTrainer, user]);

  // Apply filters to class schedule sessions (coach group class)
  const filteredClassSessions = useMemo(() => {
    let filtered = [...classScheduleSessions];
    
    // Filter by type
    if (!typeFilters[SESSION_TYPES.COACH_GROUP_CLASS]) {
      filtered = [];
    }
    
    // Filter by coach - if user is a coach, only show their own sessions
    filtered = filtered.filter(session => {
      if (isTrainer && user?.id) {
        return session.coachId === user.id;
      }
      return coachFilters[session.coachId] !== false;
    });
    
    if (searchQuery) {
      filtered = filtered.filter(session => {
        return session.className?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return filtered;
  }, [classScheduleSessions, searchQuery, typeFilters, coachFilters, isTrainer, user]);

  // Apply filters to member group class sessions (bookings)
  const filteredMemberGroupClassSessions = useMemo(() => {
    let filtered = [...memberGroupClassSessions];
    
    // Filter by type
    if (!typeFilters[SESSION_TYPES.MEMBER_GROUP_CLASS]) {
      filtered = [];
    }
    
    // Filter by coach
    filtered = filtered.filter(session => {
      return coachFilters[session.coachId] !== false;
    });
    
    if (searchQuery) {
      filtered = filtered.filter(session => {
        const customerName = session.customer 
          ? (session.customer.firstName && session.customer.lastName
            ? `${session.customer.firstName} ${session.customer.lastName}`
            : session.customer.firstName || '')
          : '';
        return session.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               customerName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    return filtered;
  }, [memberGroupClassSessions, searchQuery, typeFilters, coachFilters]);

  // Keep sessions separate - no combination
  const pagination = null;
  const isSubmitting = bookSessionMutation?.isPending || updateSessionMutation?.isPending || updateClassScheduleSessionMutation.isPending || false;

  // Get upcoming group class sessions (today and future) - separate from PT
  const upcomingGroupClassSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allGroupClassSessions = [...filteredClassSessions, ...filteredMemberGroupClassSessions];
    return allGroupClassSessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    }).sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA - dateB;
    });
  }, [filteredClassSessions, filteredMemberGroupClassSessions]);

  // Get upcoming PT sessions (today and future) - separate from group class
  const upcomingPtSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredPtSessions.filter((session) => {
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today && session.status === SESSION_STATUS.SCHEDULED;
    }).sort((a, b) => {
      const dateA = new Date(`${a.sessionDate} ${a.sessionTime}`);
      const dateB = new Date(`${b.sessionDate} ${b.sessionTime}`);
      return dateA - dateB;
    });
  }, [filteredPtSessions]);


  // Toggle type filter
  const toggleTypeFilter = (type) => {
    setTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Toggle coach filter
  const toggleCoachFilter = (coachId) => {
    setCoachFilters(prev => ({
      ...prev,
      [coachId]: !prev[coachId],
    }));
  };

  // Wrapper function to pass SESSION_STATUS to getSessionStyle
  const getSessionStyleWrapper = (session) => {
    return getSessionStyle(session, SESSION_STATUS);
  };

  // Handle session click
  const handleSessionClick = (session) => {
    if (session.type === SESSION_TYPES.COACH_GROUP_CLASS || session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
      setSelectedClassSession(session);
      setShowAttendanceModal(true);
    } else {
      // For PT sessions, open edit modal
      handleOpenModal(session);
    }
  };

  // Handle edit group class session
  const handleEditGroupClassSession = (session) => {
    setSelectedClassSession(session);
    setShowGroupClassEditModal(true);
  };

  // Handle update group class session
  const handleSubmitClassScheduleSession = async (formData) => {
    if (!selectedClassSession) return;
    
    try {
      await updateClassScheduleSessionMutation.mutateAsync({
        id: selectedClassSession.sessionId || selectedClassSession.id,
        data: {
          startTime: formData.startTime,
          duration: formData.duration,
        },
      });
      setShowGroupClassEditModal(false);
      setSelectedClassSession(null);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };


  const handleOpenModal = (session = null) => {
      setSelectedSession(session);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  const handleSubmitSession = async (formData) => {
    try {
      if (selectedSession) {
        await updateSessionMutation.mutateAsync({
          id: selectedSession.id,
          data: {
      customerId: parseInt(formData.customerId),
      ptPackageId: parseInt(formData.ptPackageId),
      trainerId: parseInt(formData.trainerId),
      sessionDate: formData.sessionDate,
      sessionTime: formData.sessionTime,
      notes: formData.notes,
          },
        });
    } else {
        await bookSessionMutation.mutateAsync({
          customerId: parseInt(formData.customerId),
          ptPackageId: parseInt(formData.ptPackageId),
          trainerId: parseInt(formData.trainerId),
          sessionDate: formData.sessionDate,
          sessionTime: formData.sessionTime,
          notes: formData.notes,
        });
    }
    handleCloseModal();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Failed to save session:', error);
    }
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedClassSession(null);
  };

  const handleSubmitAttendance = async () => {
    // Attendance is handled directly in ClassAttendanceForm via mutations
    // This handler is kept for compatibility but doesn't need to do anything
    handleCloseAttendanceModal();
  };

  const handleOpenGroupClassModal = () => {
    setSelectedBooking(null);
    setShowGroupClassModal(true);
  };

  const handleCloseGroupClassModal = () => {
    setShowGroupClassModal(false);
    setSelectedBooking(null);
  };

  const handleSubmitGroupClassBooking = async (formData) => {
    // Booking is handled directly in GroupClassBookingForm via mutation
    // This handler is kept for compatibility but doesn't need to do anything
    handleCloseGroupClassModal();
  };

  // Handle cancel booking (for member group class bookings)
  const handleCancelBooking = async (bookingId) => {
    const result = await Alert.confirm({
      title: 'Cancel Booking?',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await updateAttendanceStatusMutation.mutateAsync({
        bookingId,
        status: BOOKING_STATUS.CANCELLED,
      });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  // Handle edit booking (for member group class bookings)
  const handleEditBooking = (session) => {
    // Extract booking data from session
    const bookingData = {
      id: session.bookingId,
      customerId: session.customerId,
      customer: session.customer,
      sessionId: session.sessionId,
      classScheduleSessionId: session.sessionId,
      notes: session.notes || '',
      status: session.bookingStatus,
    };
    setSelectedBooking(bookingData);
    setShowGroupClassModal(true);
  };

  const handleCancelSession = async (sessionId) => {
    const result = await Alert.confirm({
      title: 'Cancel Session?',
      text: 'Are you sure you want to cancel this session?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await cancelSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to cancel session:', error);
    }
  };

  // Get customer's active PT packages
  const getCustomerActivePackages = (customerId) => {
    // This will be called from PtSessionForm, so we need to fetch the packages
    // For now, return empty array - the form component should handle fetching
    // or we can use useCustomerPtPackages hook if needed
    if (!customerId) return [];
    
    // Note: This function is passed to PtSessionForm, which should ideally
    // use useCustomerPtPackages hook internally for better data management
    return [];
  };

  if (loading) {
    return (
      <Layout title="Calendar" subtitle="View and manage all sessions, classes, and appointments">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Calendar" subtitle="View and manage all sessions, classes, and appointments">
      <div className="space-y-6">
        {/* Modern Filter Bar and Actions */}
        <div className="card">
          <div className="space-y-4">
            {/* Top Row: Schedule Types and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Schedule Types - Inline Toggles */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-medium text-dark-400 flex items-center gap-2 whitespace-nowrap">
                  <Filter className="w-4 h-4" />
                  Schedule Types:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleTypeFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${getFilterButtonColor(key, typeFilters[key])}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === VIEW_MODE.LIST ? VIEW_MODE.CALENDAR : VIEW_MODE.LIST)}
            className="btn-secondary flex items-center gap-2"
          >
            {viewMode === VIEW_MODE.CALENDAR ? (
              <>
                <List className="w-4 h-4" />
                List View
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Calendar View
              </>
            )}
          </button>
                <button
                  onClick={handleOpenGroupClassModal}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Book Group Class
                </button>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
                  Book PT Session
                  </button>
                </div>
              </div>

            {/* Bottom Row: Coaches - Separate Row (only show if user is not a coach) */}
            {!isTrainer && (
              <div className="flex items-center gap-3 pt-3 border-t border-dark-700">
                <span className="text-sm font-medium text-dark-400 flex items-center gap-2 whitespace-nowrap">
                  <User className="w-4 h-4" />
                  Coaches:
                </span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {coaches.map((coach) => (
                    <button
                      key={coach.id}
                      onClick={() => toggleCoachFilter(coach.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        coachFilters[coach.id] !== false
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                      }`}
                            >
                      {coach.firstname} {coach.lastname}
                    </button>
                  ))}
                            </div>
                          </div>
                        )}
              </div>
            </div>

        {/* Calendar View or List View */}
        {viewMode === VIEW_MODE.CALENDAR ? (
          <CalendarView
            calendarDate={calendarDate}
            selectedCalendarDate={selectedCalendarDate}
            onCalendarDateChange={setCalendarDate}
            groupClassSessions={[...filteredClassSessions, ...filteredMemberGroupClassSessions]}
            ptSessions={filteredPtSessions}
            customers={customers}
            packages={packages}
            coaches={coaches}
            onSelectDate={setSelectedCalendarDate}
            onSessionClick={handleSessionClick}
            onEditSession={(session) => {
              if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
                handleEditGroupClassSession(session);
              } else if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
                handleEditBooking(session);
              } else {
                handleOpenModal(session);
              }
            }}
            onCancelSession={handleCancelSession}
            onCancelBooking={handleCancelBooking}
            onBookSession={(date) => {
              // Open modal for booking - the form will handle date selection
                        handleOpenModal();
                      }}
            getSessionStyle={getSessionStyleWrapper}
          />
        ) : (
          <CalendarListView
            groupClassSessions={upcomingGroupClassSessions}
            ptSessions={upcomingPtSessions}
            customers={customers}
            packages={packages}
            coaches={coaches}
            onSessionClick={handleSessionClick}
            onEditSession={(session) => {
              if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
                handleEditGroupClassSession(session);
              } else if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
                handleEditBooking(session);
              } else {
                handleOpenModal(session);
              }
            }}
            onCancelSession={handleCancelSession}
            onCancelBooking={handleCancelBooking}
          />
        )}
      </div>

      {/* Book/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSession ? 'Edit Session' : 'Book PT Session'}
        size="md"
      >
        <PtSessionForm
          session={selectedSession}
          customers={customers}
          packages={packages}
          coaches={coaches}
          getCustomerActivePackages={getCustomerActivePackages}
          onSubmit={handleSubmitSession}
          onCancel={handleCloseModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Mark Attendance Modal for Group Classes */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={handleCloseAttendanceModal}
        title={`Mark Attendance - ${selectedClassSession?.className || 'Class'}`}
        size="lg"
            >
        <ClassAttendanceForm
          classSession={selectedClassSession}
          onCancel={handleCloseAttendanceModal}
          onSubmit={handleSubmitAttendance}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Book/Edit Group Class Modal */}
      <Modal
        isOpen={showGroupClassModal}
        onClose={handleCloseGroupClassModal}
        title={selectedBooking ? 'Edit Group Class Booking' : 'Book Group Class Session'}
        size="lg"
      >
        <GroupClassBookingForm
          booking={selectedBooking}
          customers={customers}
          classSessions={classScheduleSessions}
          onSubmit={handleSubmitGroupClassBooking}
          onCancel={handleCloseGroupClassModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Group Class Session Modal */}
      <Modal
        isOpen={showGroupClassEditModal}
        onClose={() => {
          setShowGroupClassEditModal(false);
          setSelectedClassSession(null);
                }}
        title={`Edit Session - ${selectedClassSession?.className || 'Class'}`}
        size="md"
      >
        <ClassScheduleSessionForm
          session={selectedClassSession}
          onSubmit={handleSubmitClassScheduleSession}
          onCancel={() => {
            setShowGroupClassEditModal(false);
            setSelectedClassSession(null);
          }}
          isSubmitting={updateClassScheduleSessionMutation.isPending}
        />
      </Modal>
    </Layout>
  );
};

export default SessionScheduling;

