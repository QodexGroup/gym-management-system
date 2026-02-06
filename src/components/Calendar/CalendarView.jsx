import { useState, useEffect } from 'react';
import { Badge } from '../common/index';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameMonth, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { SESSION_TYPES, getSessionTypeColors } from '../../constants/sessionSchedulingConstants';
import { BOOKING_STATUS_VARIANTS, BOOKING_STATUS } from '../../constants/classSessionBookingConstants';

const CalendarView = ({
  calendarDate: initialCalendarDate,
  selectedCalendarDate: initialSelectedDate,
  onCalendarDateChange,
  onSelectDate,
  sessions = [], // generic session items
}) => {
  const [calendarDate, setCalendarDate] = useState(initialCalendarDate || new Date());
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || new Date());

  useEffect(() => {
    if (initialCalendarDate) setCalendarDate(initialCalendarDate);
  }, [initialCalendarDate]);

  useEffect(() => {
    if (initialSelectedDate) setSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);

  const nextMonth = () => {
    const newDate = addMonths(calendarDate, 1);
    setCalendarDate(newDate);
    onCalendarDateChange?.(newDate);
  };
  const prevMonth = () => {
    const newDate = subMonths(calendarDate, 1);
    setCalendarDate(newDate);
    onCalendarDateChange?.(newDate);
  };
  const goToToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDate(today);
    onCalendarDateChange?.(today);
    onSelectDate?.(today);
  };

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

  const sessionsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => format(new Date(s.startTime || s.sessionDate), 'yyyy-MM-dd') === dateStr);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  const selectedDateSessions = sessionsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-dark-700 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-dark-300" />
            </button>
            <h2 className="text-xl font-semibold text-dark-50 min-w-[180px] text-center">{format(calendarDate, 'MMMM yyyy')}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-dark-700 rounded-lg">
              <ChevronRight className="w-5 h-5 text-dark-300" />
            </button>
          </div>
          <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-primary-500 hover:bg-primary-500/10 rounded-lg">Today</button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-dark-400 py-2">{day}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const daySessions = sessionsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, calendarDate);

            return (
              <div
                key={idx}
                onClick={() => handleSelectDate(day)}
                className={`min-h-[100px] p-2 border border-dark-700 rounded-lg cursor-pointer transition-all ${
                  !isCurrentMonth ? 'bg-dark-900 opacity-50' : 'bg-dark-800'
                } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${isToday ? 'bg-primary-500/10' : ''} hover:bg-dark-700`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center' : isCurrentMonth ? 'text-dark-50' : 'text-dark-400'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {daySessions.slice(0, 2).map(s => {
                    const colors = getSessionTypeColors(s.type);
                    return (
                      <div
                        key={s.id}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer border ${colors.bg} ${colors.text} ${colors.border}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          s.actions?.onClick?.();
                        }}
                      >
                        {s.title}
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
            <h3 className="text-lg font-semibold text-dark-50">{format(selectedDate, 'EEEE, MMM d')}</h3>
            <Badge variant="default">{selectedDateSessions.length} sessions</Badge>
          </div>

          {selectedDateSessions.length > 0 ? (
            <div className="space-y-3">
              {selectedDateSessions.map(s => {
                const colors = getSessionTypeColors(s.type);
                const isGroupClass = s.type === SESSION_TYPES.COACH_GROUP_CLASS || s.type === SESSION_TYPES.MEMBER_GROUP_CLASS;
                const isPT = s.type === SESSION_TYPES.COACH_PT || s.type === SESSION_TYPES.MEMBER_PT;
                const isMemberBooking = s.type === SESSION_TYPES.MEMBER_GROUP_CLASS || s.type === SESSION_TYPES.MEMBER_PT;
                const isCoachSchedule = s.type === SESSION_TYPES.COACH_GROUP_CLASS || s.type === SESSION_TYPES.COACH_PT;
                
                // Get session date for comparison
                const sessionDate = s.startTime ? new Date(s.startTime) : (s.sessionDate ? new Date(s.sessionDate) : null);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const sessionDateOnly = sessionDate ? new Date(sessionDate) : null;
                if (sessionDateOnly) {
                  sessionDateOnly.setHours(0, 0, 0, 0);
                }
                const isSessionTodayOrPast = sessionDateOnly ? sessionDateOnly <= today : false;
                
                // Determine if edit/cancel should be hidden
                const shouldHideButtons = 
                  // For member bookings: hide if status is ATTENDED or NO_SHOW
                  (isMemberBooking && (s.status === BOOKING_STATUS.ATTENDED || s.status === BOOKING_STATUS.NO_SHOW)) ||
                  // For coach schedules: hide if date is today or in the past
                  (isCoachSchedule && isSessionTodayOrPast);
                
                let badgeLabel = '';
                if (s.type === SESSION_TYPES.COACH_GROUP_CLASS) badgeLabel = 'Coach Group Class';
                else if (s.type === SESSION_TYPES.MEMBER_GROUP_CLASS) badgeLabel = 'Member Booking';
                else if (isPT) badgeLabel = 'PT Session';
                
                return (
                  <div key={s.id} className={`p-4 rounded-xl border-l-4 ${colors.bg} ${colors.borderSolid}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-dark-50">{s.startTime ? format(new Date(s.startTime), 'HH:mm') : ''}</span>
                      <div className="flex items-center gap-2">
                        {badgeLabel && (
                          <Badge size="sm" className={colors.badge}>
                            {badgeLabel}
                          </Badge>
                        )}
                        {s.status && (
                          <Badge 
                            size="sm" 
                            variant={BOOKING_STATUS_VARIANTS[s.status] || 'default'}
                          >
                            {s.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className={`font-medium ${colors.textSolid}`}>{s.title}</p>
                      {s.subtitle && <p className="text-xs text-dark-400">{s.subtitle}</p>}
                    </div>
                    {s.meta && s.meta.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-dark-300">
                        {m.icon && <m.icon className="w-4 h-4" />}
                        <span>{m.label}</span>
                      </div>
                    ))}
                    {!shouldHideButtons && (
                      <div className="flex items-center gap-2 mt-3">
                        {s.actions?.onEdit && (
                          <button onClick={s.actions.onEdit} className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors">Edit</button>
                        )}
                        {s.actions?.onCancel && (
                          <button onClick={s.actions.onCancel} className="text-xs px-2 py-1 text-danger-500 hover:bg-danger-500/10 rounded transition-colors">Cancel</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-dark-400 mx-auto mb-3" />
              <p className="text-dark-400">No sessions on this day</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
