import { useState, useEffect } from 'react';
import { Badge } from './index';
import {
  Calendar,
  Clock,
  User,
  Edit,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  X,
} from 'lucide-react';
import { format, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { formatTime, formatTimeFromDate, formatDate } from '../../utils/formatters';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../../constants/ptConstants';
import { SESSION_TYPES } from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS, BOOKING_STATUS_VARIANTS } from '../../constants/classSessionBookingConstants';

const CalendarView = ({
  calendarDate: initialCalendarDate,
  selectedCalendarDate: initialSelectedCalendarDate,
  onCalendarDateChange,
  groupClassSessions = [],
  ptSessions = [],
  customers,
  packages,
  coaches,
  onSelectDate,
  onSessionClick,
  onEditSession,
  onCancelSession,
  onCancelBooking,
  onBookSession,
  getSessionStyle,
}) => {
  // Internal state for calendar navigation
  const [calendarDate, setCalendarDate] = useState(initialCalendarDate || new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(initialSelectedCalendarDate || new Date());

  // Update internal state when props change
  useEffect(() => {
    if (initialCalendarDate) {
      setCalendarDate(initialCalendarDate);
    }
  }, [initialCalendarDate]);

  useEffect(() => {
    if (initialSelectedCalendarDate) {
      setSelectedCalendarDate(initialSelectedCalendarDate);
    }
  }, [initialSelectedCalendarDate]);

  // Calendar view functions
  const nextMonth = () => {
    const newDate = addMonths(calendarDate, 1);
    setCalendarDate(newDate);
    if (onCalendarDateChange) {
      onCalendarDateChange(newDate);
    }
  };
  
  const prevMonth = () => {
    const newDate = subMonths(calendarDate, 1);
    setCalendarDate(newDate);
    if (onCalendarDateChange) {
      onCalendarDateChange(newDate);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedCalendarDate(today);
    if (onCalendarDateChange) {
      onCalendarDateChange(today);
    }
    if (onSelectDate) {
      onSelectDate(today);
    }
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

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle date selection
  const handleSelectDate = (date) => {
    setSelectedCalendarDate(date);
    if (onSelectDate) {
      onSelectDate(date);
    }
  };
  // Handle group class sessions separately
  const getGroupClassSessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return groupClassSessions.filter((session) => {
      return session.startTime && format(new Date(session.startTime), 'yyyy-MM-dd') === dateStr;
    });
  };

  // Handle PT sessions separately
  const getPtSessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return ptSessions.filter((session) => {
      return session.sessionDate === dateStr;
    });
  };

  // Get all sessions for a date (for display only, but keep logic separate)
  const getSessionsForDate = (date) => {
    return [...getGroupClassSessionsForDate(date), ...getPtSessionsForDate(date)];
  };

  const selectedDateGroupClassSessions = getGroupClassSessionsForDate(selectedCalendarDate);
  const selectedDatePtSessions = getPtSessionsForDate(selectedCalendarDate);
  const totalSessionsCount = selectedDateGroupClassSessions.length + selectedDatePtSessions.length;

  return (
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
                onClick={() => handleSelectDate(day)}
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
                    let displayText = '';
                    if (session.type === SESSION_TYPES.COACH_GROUP_CLASS || session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
                      displayText = `${formatTimeFromDate(session.startTime)} ${session.className || 'Class'}`;
                    } else {
                      const customer = session.customer || customers.find((c) => c.id === session.customerId);
                      const customerName = customer?.name || 
                        (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
                        customer?.firstName || 'Unknown');
                      displayText = `${formatTime(session.sessionTime)} ${customerName.split(' ')[0]}`;
                    }
                    return (
                      <div
                        key={`${session.type}-${session.id}-${session.customerId || session.bookingId || ''}`}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer border ${getSessionStyle(session)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSessionClick(session);
                        }}
                      >
                        {displayText}
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
            <Badge variant="default">{totalSessionsCount} sessions</Badge>
          </div>

          {totalSessionsCount > 0 ? (
            <div className="space-y-3">
              {/* Render group class sessions first */}
              {selectedDateGroupClassSessions
                .sort((a, b) => {
                  const timeA = new Date(a.startTime);
                  const timeB = new Date(b.startTime);
                  return timeA - timeB;
                })
                .map((session) => {
                  // Coach Group Class Session
                  if (session.type === SESSION_TYPES.COACH_GROUP_CLASS) {
                    return (
                      <div
                        key={`coach-${session.id}`}
                        onClick={() => onSessionClick(session)}
                        className="p-4 rounded-xl border-l-4 bg-blue-500/10 border-blue-500 cursor-pointer hover:bg-blue-500/20 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-blue-500">
                            {formatTimeFromDate(session.startTime)}
                          </span>
                          <Badge size="sm" variant="primary">
                            Coach Group Class
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <p className="font-medium text-dark-50">{session.className}</p>
                          <p className="text-xs text-dark-400">Coach: {session.coach?.firstname} {session.coach?.lastname}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-dark-300">
                          <Users className="w-4 h-4" />
                          <span>{session.attendanceCount || 0}/{session.capacity || 0} enrolled</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                        {session.sessionDate < new Date() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSession(session);
                            }}
                            className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                         {session.sessionDate < new Date() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSessionClick(session);
                            }}
                            className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                          >
                            Mark Attendance
                          </button>
                        )}
                        </div>
                      </div>
                    );
                  }

                  // Member Group Class Session (Bookings)
                  if (session.type === SESSION_TYPES.MEMBER_GROUP_CLASS) {
                    const customer = session.customer || customers.find((c) => c.id === session.customerId);
                    const customerName = customer?.name || 
                      (customer?.firstName && customer?.lastName ? `${customer.firstName} ${customer.lastName}` : 
                      customer?.firstName || 'Unknown');
                    
                    return (
                      <div
                        key={`member-${session.id}-${session.customerId || session.bookingId || ''}`}
                        className="p-4 rounded-xl border-l-4 bg-purple-500/10 border-purple-500"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-purple-500">
                            {formatTimeFromDate(session.startTime)}
                          </span>
                          <Badge size="sm" variant="default">
                            Member Booking
                          </Badge>
                        </div>
                        <div className="mb-2">
                          <p className="font-medium text-dark-50">{session.className}</p>
                          <p className="text-xs text-dark-400">Client: {customerName}</p>
                          <p className="text-xs text-dark-400">Coach: {session.coach?.firstname} {session.coach?.lastname}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-dark-300 mb-3">
                          <Badge size="sm" variant={BOOKING_STATUS_VARIANTS[session.bookingStatus] || BOOKING_STATUS_VARIANTS[BOOKING_STATUS.BOOKED]}>
                            {session.bookingStatus || BOOKING_STATUS.BOOKED}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                        {session.bookingStatus == BOOKING_STATUS.BOOKED && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSession(session);
                            }}
                            className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          )}
                          {session.bookingStatus == BOOKING_STATUS.BOOKED && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCancelBooking && session.bookingId) {
                                  onCancelBooking(session.bookingId);
                                }
                              }}
                              className="text-xs px-2 py-1 text-danger-500 hover:bg-danger-500/10 rounded transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                })}
              
              {/* Render PT sessions separately */}
              {selectedDatePtSessions
                .sort((a, b) => {
                  const timeA = new Date(`${a.sessionDate} ${a.sessionTime}`);
                  const timeB = new Date(`${b.sessionDate} ${b.sessionTime}`);
                  return timeA - timeB;
                })
                .map((session) => {
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
                      key={`pt-${session.id}`}
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
                          onClick={() => onEditSession(session)}
                          className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onCancelSession(session.id)}
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
                onClick={() => onBookSession(selectedCalendarDate)}
                className="text-primary-500 hover:text-primary-400 text-sm font-medium mt-2"
              >
                Book session →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
