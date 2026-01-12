import { useState, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal, Avatar } from '../../components/common';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  List,
} from 'lucide-react';
import { Alert, Toast } from '../../utils/alert';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../../constants/ptConstants';
import { useSessions, useBookSession, useUpdateSession, useCancelSession } from '../../hooks/useSessions';
import { usePtPackages } from '../../hooks/usePtPackages';
import { useCoaches } from '../../hooks/useUsers';
import { useCustomers } from '../../hooks/useCustomers';
import { formatDate, formatTime } from '../../utils/formatters';
import { mockPtSessions, mockPtPackages, mockMembers, mockTrainers, mockCustomerPtPackages } from '../../data/mockData';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SessionScheduling = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(null); // No date filter by default
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date()); // Current month for calendar view
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date()); // Selected date in calendar

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    ptPackageId: '',
    trainerId: '',
    sessionDate: '',
    sessionTime: '',
    notes: '',
  });

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

  // Use mock data directly
  const [sessionsList, setSessionsList] = useState([...mockPtSessions]);
  const loading = false;
  const packages = mockPtPackages;
  const coaches = mockTrainers.map(t => ({
    id: t.id,
    firstname: t.name.split(' ')[0],
    lastname: t.name.split(' ').slice(1).join(' '),
    email: t.email,
  }));
  const customers = mockMembers.map(m => ({
    id: m.id,
    firstName: m.name.split(' ')[0],
    lastName: m.name.split(' ').slice(1).join(' '),
    email: m.email,
  }));

  // Apply filters to mock data
  const filteredSessions = useMemo(() => {
    let filtered = [...sessionsList];
    
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
    
    return filtered;
  }, [sessionsList, searchQuery, filterDate, customers]);

  const sessions = filteredSessions;
  const pagination = null;
  const isSubmitting = false;

  // Get upcoming sessions (today and future)
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions.filter((session) => {
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today && session.status === SESSION_STATUS.SCHEDULED;
    }).sort((a, b) => {
      const dateA = new Date(`${a.sessionDate} ${a.sessionTime}`);
      const dateB = new Date(`${b.sessionDate} ${b.sessionTime}`);
      return dateA - dateB;
    });
  }, [sessions]);

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

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter((session) => {
      const matchesDate = session.sessionDate === dateStr;
      if (searchQuery) {
        const customer = session.customer || customers.find((c) => c.id === session.customerId);
        const name = customer?.name || 
          (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
          customer?.firstName || '');
        return matchesDate && name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return matchesDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDateSessions = getSessionsForDate(selectedCalendarDate);

  const handleOpenModal = (session = null) => {
    if (session) {
      setSelectedSession(session);
      setFormData({
        customerId: session.customerId?.toString() || '',
        ptPackageId: session.ptPackageId?.toString() || '',
        trainerId: session.trainerId?.toString() || '',
        sessionDate: session.sessionDate || '',
        sessionTime: session.sessionTime || '',
        notes: session.notes || '',
      });
    } else {
      setSelectedSession(null);
      setFormData({
        customerId: '',
        ptPackageId: '',
        trainerId: '',
        sessionDate: '',
        sessionTime: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setFormData({
      customerId: '',
      ptPackageId: '',
      trainerId: '',
      sessionDate: '',
      sessionTime: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sessionData = {
      id: selectedSession ? selectedSession.id : sessionsList.length + 1,
      customerId: parseInt(formData.customerId),
      ptPackageId: parseInt(formData.ptPackageId),
      trainerId: parseInt(formData.trainerId),
      sessionDate: formData.sessionDate,
      sessionTime: formData.sessionTime,
      duration: packages.find(p => p.id === parseInt(formData.ptPackageId))?.durationPerSession || 60,
      status: 'scheduled',
      notes: formData.notes,
      customer: customers.find(c => c.id === parseInt(formData.customerId)),
      ptPackage: packages.find(p => p.id === parseInt(formData.ptPackageId)),
      trainer: coaches.find(c => c.id === parseInt(formData.trainerId)),
    };

    if (selectedSession) {
      setSessionsList(prev => prev.map(s => s.id === selectedSession.id ? sessionData : s));
      Toast.success('Session updated successfully');
    } else {
      setSessionsList(prev => [...prev, sessionData]);
      Toast.success('Session booked successfully');
    }
    handleCloseModal();
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

    setSessionsList(prev => prev.filter(s => s.id !== sessionId));
    Toast.success('Session cancelled successfully');
  };

  // Get customer's active PT packages
  const getCustomerActivePackages = (customerId) => {
    const customerPackages = mockCustomerPtPackages.filter(
      pkg => pkg.customerId === customerId && pkg.status === 'active'
    );
    
    // Return the PT packages with remaining sessions info
    return customerPackages.map(customerPkg => ({
      id: customerPkg.ptPackageId,
      packageName: customerPkg.ptPackage?.packageName || 'Unknown Package',
      classesRemaining: customerPkg.classesRemaining || 0,
      numberOfSessions: customerPkg.ptPackage?.numberOfSessions || 0,
    }));
  };

  if (loading) {
    return (
      <Layout title="Session Scheduling" subtitle="Book and manage PT sessions">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading sessions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Session Scheduling" subtitle="Book and manage PT sessions">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
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
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Session
          </button>
        </div>

        {/* Calendar View or List View */}
        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 card">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-dark-300" />
                  </button>
                  <h2 className="text-xl font-semibold text-dark-50 min-w-[180px] text-center">
                    {format(calendarDate, 'MMMM yyyy')}
                  </h2>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-dark-300" />
                  </button>
                </div>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                >
                  Today
                </button>
              </div>

              {/* Week Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-dark-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  const daySessions = getSessionsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedCalendarDate);
                  const isCurrentMonth = isSameMonth(day, calendarDate);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCalendarDate(day)}
                      className={`min-h-[100px] p-2 border border-dark-700 rounded-lg cursor-pointer transition-all ${
                        !isCurrentMonth ? 'bg-dark-900 opacity-50' : 'bg-dark-800'
                      } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${
                        isToday ? 'bg-primary-500/10' : ''
                      } hover:bg-dark-700`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center'
                            : isCurrentMonth
                            ? 'text-dark-50'
                            : 'text-dark-400'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {daySessions.slice(0, 2).map((session) => {
                          const customer = session.customer || customers.find((c) => c.id === session.customerId);
                          const customerName = customer?.name || 
                            (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
                            customer?.firstName || 'Unknown');
                          return (
                            <div
                              key={session.id}
                              className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                session.status === SESSION_STATUS.SCHEDULED
                                  ? 'bg-primary-500/20 text-primary-400'
                                  : session.status === SESSION_STATUS.COMPLETED
                                  ? 'bg-success-500/20 text-success-400'
                                  : 'bg-dark-700 text-dark-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(session);
                              }}
                            >
                              {formatTime(session.sessionTime)} {customerName.split(' ')[0]}
                            </div>
                          );
                        })}
                        {daySessions.length > 2 && (
                          <div className="text-xs text-dark-400 text-center">
                            +{daySessions.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-dark-50">
                    {format(selectedCalendarDate, 'EEEE, MMM d')}
                  </h3>
                  <Badge variant="default">{selectedDateSessions.length} sessions</Badge>
                </div>

                {selectedDateSessions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateSessions.map((session) => {
                      const customer = session.customer || customers.find((c) => c.id === session.customerId);
                      const ptPackage = session.ptPackage || packages.find((p) => p.id === session.ptPackageId);
                      const trainer = session.trainer || coaches.find((c) => c.id === session.trainerId);
                      
                      const customerName = customer?.name || 
                        (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
                        customer?.firstName || 'Unknown');
                      const trainerName = trainer?.name || 
                        (trainer?.firstname && trainer?.lastname ? `${trainer.firstname} ${trainer.lastname}` : 
                        trainer?.firstname || 'Unknown');

                      return (
                        <div
                          key={session.id}
                          className={`p-4 rounded-xl border-l-4 ${
                            session.status === SESSION_STATUS.SCHEDULED
                              ? 'bg-primary-500/10 border-primary-500'
                              : session.status === SESSION_STATUS.COMPLETED
                              ? 'bg-success-500/10 border-success-500'
                              : 'bg-dark-700 border-dark-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-primary-500">{formatTime(session.sessionTime)}</span>
                            <Badge
                              size="sm"
                              variant={session.status === SESSION_STATUS.SCHEDULED ? 'default' : 'success'}
                            >
                              {SESSION_STATUS_LABELS[session.status] || session.status}
                            </Badge>
                          </div>
                          <div className="mb-2">
                            <p className="font-medium text-dark-50">{customerName}</p>
                            <p className="text-xs text-dark-400">{ptPackage?.packageName || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-dark-300">
                            <User className="w-4 h-4" />
                            <span>{trainerName}</span>
                            <span className="text-dark-500">•</span>
                            <Clock className="w-4 h-4" />
                            <span>{session.duration || 60} min</span>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-dark-400 mt-2 pt-2 border-t border-dark-700">
                              {session.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleOpenModal(session)}
                              className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelSession(session.id)}
                              className="text-xs px-2 py-1 text-danger-500 hover:bg-danger-500/10 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                    <p className="text-dark-400">No sessions on this day</p>
                    <button
                      onClick={() => {
                        setFormData(prev => ({ ...prev, sessionDate: format(selectedCalendarDate, 'yyyy-MM-dd') }));
                        handleOpenModal();
                      }}
                      className="text-primary-500 hover:text-primary-400 text-sm font-medium mt-2"
                    >
                      Book session →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View - Upcoming Sessions */
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Upcoming Sessions</h3>
            
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <p className="text-dark-400">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  // Use embedded objects from session or fallback to finding them
                  const customer = session.customer || customers.find((c) => c.id === session.customerId);
                  const ptPackage = session.ptPackage || packages.find((p) => p.id === session.ptPackageId);
                  const trainer = session.trainer || coaches.find((c) => c.id === session.trainerId);
                  
                  // Handle different customer name formats
                  const customerName = customer?.name || 
                    (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
                    customer?.firstName || 'Unknown');
                  
                  // Handle different trainer name formats
                  const trainerName = trainer?.name || 
                    (trainer?.firstname && trainer?.lastname ? `${trainer.firstname} ${trainer.lastname}` : 
                    trainer?.firstname || 'Unknown');

                  return (
                    <div
                      key={session.id}
                      className="bg-dark-800 rounded-lg border border-dark-700 p-4 hover:border-primary-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-primary-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-dark-50">
                                {customerName}
                              </h4>
                              <Badge variant="default">
                                {ptPackage?.packageName || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-dark-300">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(session.sessionDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(session.sessionTime)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {trainerName}
                              </div>
                            </div>
                            {session.notes && (
                              <p className="text-sm text-dark-400 mt-2">{session.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(session)}
                            className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit session"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Cancel session"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSession ? 'Edit Session' : 'Book PT Session'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Member *</label>
            <select
              className="input"
              value={formData.customerId}
              onChange={(e) => {
                setFormData({ ...formData, customerId: e.target.value, ptPackageId: '' });
              }}
              required
            >
              <option value="">Select member</option>
              {customers.map((customer) => {
                const customerName = customer.name || 
                  (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}` : 
                  customer.firstName || 'Unknown');
                return (
                  <option key={customer.id} value={customer.id}>
                    {customerName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label">PT Package *</label>
            <select
              className="input"
              value={formData.ptPackageId}
              onChange={(e) => setFormData({ ...formData, ptPackageId: e.target.value })}
              required
            >
              <option value="">Select PT package</option>
              {formData.customerId &&
                getCustomerActivePackages(parseInt(formData.customerId)).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName} ({pkg.classesRemaining || pkg.numberOfSessions} remaining)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="label">Trainer *</label>
            <select
              className="input"
              value={formData.trainerId}
              onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              required
            >
              <option value="">Select trainer</option>
              {coaches.map((coach) => {
                const coachName = coach.name || 
                  (coach.firstname && coach.lastname ? `${coach.firstname} ${coach.lastname}` : 
                  coach.firstname || 'Unknown');
                return (
                  <option key={coach.id} value={coach.id}>
                    {coachName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <DatePicker
                selected={formData.sessionDate ? new Date(formData.sessionDate) : null}
                onChange={(date) => {
                  const dateString = date ? date.toISOString().split('T')[0] : '';
                  setFormData({ ...formData, sessionDate: dateString });
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="input w-full"
                minDate={new Date()}
                required
              />
            </div>
            <div>
              <label className="label">Time *</label>
              <input
                type="time"
                className="input"
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Add session notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : selectedSession
                ? 'Save Changes'
                : 'Book Session'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default SessionScheduling;

