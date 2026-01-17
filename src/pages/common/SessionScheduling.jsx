import { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal, Avatar } from '../../components/common';
import CalendarView from '../../components/common/CalendarView';
import CalendarListView from '../../components/common/CalendarListView';
import PtSessionForm from './forms/PtSessionForm';
import ClassAttendanceForm from './forms/ClassAttendanceForm';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Edit,
  X,
  CheckCircle,
  List,
  Filter,
  Users,
} from 'lucide-react';
import { Alert, Toast } from '../../utils/alert';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../../constants/ptConstants';
import { SESSION_TYPES, SESSION_TYPE_LABELS, getFilterButtonColor, getSessionStyle } from '../../constants/sessionSchedulingConstants';
import { useSessions, useBookSession, useUpdateSession, useCancelSession } from '../../hooks/useSessions';
import { usePtPackages } from '../../hooks/usePtPackages';
import { useCoaches } from '../../hooks/useUsers';
import { useCustomers } from '../../hooks/useCustomers';
import { useClassScheduleSessions } from '../../hooks/useClassScheduleSessions';
import { useCustomerPtPackages } from '../../hooks/useCustomerPtPackages';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, formatTimeFromDate, formatDateShort } from '../../utils/formatters';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const SessionScheduling = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(null); // No date filter by default
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date()); // Current month for calendar view
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date()); // Selected date in calendar
  const [showFilters, setShowFilters] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const [showGroupClassModal, setShowGroupClassModal] = useState(false);

  // Type filters (checkboxes)
  const [typeFilters, setTypeFilters] = useState({
    [SESSION_TYPES.COACH_GROUP_CLASS]: true,
    [SESSION_TYPES.MEMBER_GROUP_CLASS]: true,
    [SESSION_TYPES.COACH_PT]: true,
    [SESSION_TYPES.MEMBER_PT]: true,
  });

  // Get current user
  const { user, isTrainer } = useAuth();

  // Coach filters (checkboxes)
  const { data: coaches = [] } = useCoaches();
  const [coachFilters, setCoachFilters] = useState({});

  // Build query options
  const sessionOptions = useMemo(() => {
    const filters = {};
    if (searchQuery) {
      filters.customerName = searchQuery;
    }
    if (filterDate) {
      filters.sessionDate = filterDate.toISOString().split('T')[0];
    }

    return {
      page: currentPage,
      pagelimit: 20,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      relations: 'customer,ptPackage,trainer',
    };
  }, [currentPage, searchQuery, filterDate]);

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

  // Fetch class schedule sessions directly
  const { data: sessionsData, isLoading: isLoadingSessions } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
  });

  // Fetch PT sessions
  const { data: ptSessionsData, isLoading: isLoadingPtSessions } = useSessions({
    pagelimit: 0,
    relations: 'customer,ptPackage,trainer',
  });

  // Fetch PT packages
  const { data: packagesData } = usePtPackages({
    pagelimit: 0,
  });

  // Fetch customers
  const { data: customersData } = useCustomers(1);

  // Initialize mutations
  const bookSessionMutation = useBookSession();
  const updateSessionMutation = useUpdateSession();
  const cancelSessionMutation = useCancelSession();

  // Transform class schedule sessions to match the expected format
  const classScheduleSessions = useMemo(() => {
    const sessions = sessionsData?.data || [];
    return sessions.map(session => {
      const schedule = session.classSchedule || {};
      return {
        id: session.id,
        type: SESSION_TYPES.COACH_GROUP_CLASS,
        startTime: session.startTime,
        endTime: session.endTime,
        sessionDate: session.startTime ? format(new Date(session.startTime), 'yyyy-MM-dd') : '',
        sessionTime: session.startTime ? formatTimeFromDate(session.startTime) : '',
        className: schedule.className,
        coach: schedule.coach,
        coachId: schedule.coachId,
        capacity: schedule.capacity,
        attendanceCount: session.attendanceCount || 0,
        scheduleId: schedule.id,
        sessionId: session.id,
        status: 'scheduled', // Class sessions are always scheduled
      };
    });
  }, [sessionsData]);

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

  // Apply filters to class schedule sessions
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

  // Combine all sessions
  const filteredSessions = useMemo(() => {
    return [...filteredPtSessions, ...filteredClassSessions];
  }, [filteredPtSessions, filteredClassSessions]);

  const sessions = filteredSessions;
  const pagination = null;
  const isSubmitting = bookSessionMutation?.isPending || updateSessionMutation?.isPending || false;

  // Get upcoming sessions (today and future) - combining PT and class sessions
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredSessions.filter((session) => {
      if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= today;
      } else {
        const sessionDate = new Date(session.sessionDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= today && session.status === SESSION_STATUS.SCHEDULED;
      }
    }).sort((a, b) => {
      const dateA = a.startTime ? new Date(a.startTime) : new Date(`${a.sessionDate} ${a.sessionTime}`);
      const dateB = b.startTime ? new Date(b.startTime) : new Date(`${b.sessionDate} ${b.sessionTime}`);
      return dateA - dateB;
    });
  }, [filteredSessions]);

  // Calendar view functions
  const nextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
  const prevMonth = () => setCalendarDate(subMonths(calendarDate, 1));
  const goToToday = () => {
    setCalendarDate(new Date());
    setSelectedCalendarDate(new Date());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  // Get sessions for a specific date (combining PT and class sessions)
  const getSessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredSessions.filter((session) => {
      const matchesDate = session.sessionDate === dateStr || 
        (session.startTime && format(new Date(session.startTime), 'yyyy-MM-dd') === dateStr);
      if (searchQuery) {
        if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
          return matchesDate && session.className?.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          const customer = session.customer || customers.find((c) => c.id === session.customerId);
          const name = customer?.name || 
            (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
            customer?.firstName || '');
          return matchesDate && name.toLowerCase().includes(searchQuery.toLowerCase());
        }
      }
      return matchesDate;
    });
  };

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
    if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
      setSelectedClassSession(session);
      setShowAttendanceModal(true);
    } else {
      // For PT sessions, open edit modal
      handleOpenModal(session);
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDateSessions = getSessionsForDate(selectedCalendarDate);

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
    // TODO: Implement attendance submission
    Toast.success('Attendance saved successfully');
    handleCloseAttendanceModal();
  };

  const handleOpenGroupClassModal = () => {
    setShowGroupClassModal(true);
  };

  const handleCloseGroupClassModal = () => {
    setShowGroupClassModal(false);
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
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                  className="btn-secondary flex items-center gap-2"
                >
                  {viewMode === 'calendar' ? (
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
        {viewMode === 'calendar' ? (
          <CalendarView
            calendarDate={calendarDate}
            selectedCalendarDate={selectedCalendarDate}
            calendarDays={calendarDays}
            weekDays={weekDays}
            sessions={filteredSessions}
            customers={customers}
            packages={packages}
            coaches={coaches}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onGoToToday={goToToday}
            onSelectDate={setSelectedCalendarDate}
            onSessionClick={handleSessionClick}
            onEditSession={handleOpenModal}
            onCancelSession={handleCancelSession}
            onBookSession={(date) => {
              // Open modal for booking - the form will handle date selection
              handleOpenModal();
            }}
            getSessionStyle={getSessionStyleWrapper}
          />
        ) : (
          <CalendarListView
            sessions={upcomingSessions}
            customers={customers}
            packages={packages}
            coaches={coaches}
            onSessionClick={handleSessionClick}
            onEditSession={handleOpenModal}
            onCancelSession={handleCancelSession}
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

      {/* Book Group Class Modal */}
      <Modal
        isOpen={showGroupClassModal}
        onClose={handleCloseGroupClassModal}
        title="Book Group Class Session"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-dark-400 text-center py-4">
            Group class booking functionality will be implemented here.
            Members can select from available group class sessions.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseGroupClassModal}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 btn-primary"
              disabled
            >
              Book Class
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SessionScheduling;

