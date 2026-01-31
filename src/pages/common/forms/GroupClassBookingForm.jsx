import { useState, useMemo, useRef, useEffect } from 'react';
import { formatDate, formatTimeFromDate } from '../../../utils/formatters';
import { Calendar, Clock, Users, UserCog, Search, X } from 'lucide-react';
import { SearchableClientInput } from '../../../components/common';
import {
  useBookClassSession,
  useUpdateClassSessionBooking,
} from '../../../hooks/useClassSessionBookings';
import {
  getInitialGroupClassBookingFormData,
  mapGroupClassBookingToFormData,
} from '../../../models/groupClassBookingFormModel';

const GroupClassBookingForm = ({
  booking = null,
  customers = [],
  classSessions = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState(getInitialGroupClassBookingFormData());
  const [sessionSearch, setSessionSearch] = useState('');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const sessionInputRef = useRef(null);
  const sessionDropdownRef = useRef(null);

  // Filter available sessions (not full, future dates, or current booking session)
  const availableSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentBookingSessionId = booking?.sessionId || booking?.classScheduleSessionId;
    
    return classSessions.filter(session => {
      // Always include the current booking's session
      if (currentBookingSessionId && session.sessionId === currentBookingSessionId) {
        return true;
      }
      
      // Only show future sessions
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      if (sessionDate < today) return false;
      
      // Only show sessions with available spots
      const enrolled = session.attendanceCount || 0;
      const capacity = session.capacity || 0;
      return enrolled < capacity;
    }).sort((a, b) => {
      // Sort by date and time
      return new Date(a.startTime) - new Date(b.startTime);
    });
  }, [classSessions, booking]);

  // Helper function to get available spots
  const getAvailableSpots = (session) => {
    const enrolled = session.attendanceCount || 0;
    const capacity = session.capacity || 0;
    return capacity - enrolled;
  };

  // Filter sessions based on search
  const filteredSessions = useMemo(() => {
    if (!sessionSearch.trim()) {
      return availableSessions;
    }
    const searchLower = sessionSearch.toLowerCase();
    return availableSessions.filter(session => {
      const className = session.className?.toLowerCase() || '';
      const dateStr = formatDate(session.startTime).toLowerCase();
      const timeStr = formatTimeFromDate(session.startTime).toLowerCase();
      const coachName = session.coach 
        ? `${session.coach.firstname || ''} ${session.coach.lastname || ''}`.toLowerCase()
        : '';
      return className.includes(searchLower) ||
        dateStr.includes(searchLower) ||
        timeStr.includes(searchLower) ||
        coachName.includes(searchLower);
    });
  }, [availableSessions, sessionSearch]);

  // Get selected session display text
  const selectedSessionDisplay = useMemo(() => {
    if (!formData.sessionId) return '';
    const session = availableSessions.find(s => s.sessionId === formData.sessionId);
    if (!session) return '';
    const availableSpots = getAvailableSpots(session);
    return `${session.className} - ${formatDate(session.startTime)} at ${formatTimeFromDate(session.startTime)} (${availableSpots} spots available)`;
  }, [formData.sessionId, availableSessions]);

  // Initialize form data from booking
  useEffect(() => {
    if (booking) {
      const mappedData = mapGroupClassBookingToFormData(booking);
      setFormData(mappedData);
      
      // Set session search display if sessionId exists
      if (mappedData.sessionId && availableSessions.length > 0) {
        const session = availableSessions.find(s => s.sessionId === mappedData.sessionId);
        if (session) {
          const availableSpots = getAvailableSpots(session);
          const displayText = `${session.className} - ${formatDate(session.startTime)} at ${formatTimeFromDate(session.startTime)} (${availableSpots} spots available)`;
          setSessionSearch(displayText);
        } else {
          // If session not found in availableSessions, try to find it in all classSessions
          const allSession = classSessions.find(s => s.sessionId === mappedData.sessionId);
          if (allSession) {
            const displayText = `${allSession.className} - ${formatDate(allSession.startTime)} at ${formatTimeFromDate(allSession.startTime)}`;
            setSessionSearch(displayText);
          }
        }
      }
    } else {
      setFormData(getInitialGroupClassBookingFormData());
      setSessionSearch('');
    }
  }, [booking, availableSessions, classSessions]);

  // Initialize search with selected session
  useEffect(() => {
    if (selectedSessionDisplay && !sessionSearch) {
      setSessionSearch(selectedSessionDisplay);
    } else if (!formData.sessionId && sessionSearch && !booking) {
      setSessionSearch('');
    }
  }, [selectedSessionDisplay, formData.sessionId, booking]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sessionInputRef.current &&
        sessionDropdownRef.current &&
        !sessionInputRef.current.contains(event.target) &&
        !sessionDropdownRef.current.contains(event.target)
      ) {
        setShowSessionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const bookMutation = useBookClassSession();
  const updateMutation = useUpdateClassSessionBooking();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.sessionId) {
      return;
    }
    
    try {
      if (booking) {
        // Update existing booking
        await updateMutation.mutateAsync({
          bookingId: booking.id || booking.bookingId,
          data: {
            sessionId: parseInt(formData.sessionId),
            customerId: parseInt(formData.customerId),
            notes: formData.notes,
          },
        });
      } else {
        // Create new booking
        await bookMutation.mutateAsync({
          sessionId: parseInt(formData.sessionId),
          customerId: parseInt(formData.customerId),
          notes: formData.notes,
        });
        // Reset form
        setFormData(getInitialGroupClassBookingFormData());
        setSessionSearch('');
      }
      // Call onSubmit to close modal and refresh data
      onSubmit(formData);
    } catch (error) {
      // Error is handled by the mutation hook (Toast will show)
      console.error('Failed to save booking:', error);
    }
  };

  const handleCustomerChange = (customerId) => {
    setFormData({ ...formData, customerId });
  };

  const handleSelectSession = (session) => {
    const availableSpots = getAvailableSpots(session);
    const displayText = `${session.className} - ${formatDate(session.startTime)} at ${formatTimeFromDate(session.startTime)} (${availableSpots} spots available)`;
    setSessionSearch(displayText);
    setFormData({ ...formData, sessionId: session.sessionId });
    setShowSessionDropdown(false);
  };

  const handleClearSession = () => {
    setSessionSearch('');
    setFormData({ ...formData, sessionId: '' });
  };

  const handleSessionInputChange = (e) => {
    const newValue = e.target.value;
    setSessionSearch(newValue);
    setShowSessionDropdown(true);
    if (!newValue) {
      setFormData({ ...formData, sessionId: '' });
    }
  };

  const handleSessionInputFocus = () => {
    setShowSessionDropdown(true);
  };

  const selectedSession = useMemo(() => {
    return availableSessions.find(s => s.sessionId === formData.sessionId);
  }, [availableSessions, formData.sessionId]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div style={{ position: 'relative', zIndex: 50 }}>
        <SearchableClientInput
          customers={customers}
          value={formData.customerId}
          onChange={handleCustomerChange}
          label="Client"
          required
          placeholder="Search client by name .."
        />
      </div>

      <div className="relative mt-6" ref={sessionInputRef} style={{ zIndex: 1 }}>
        <label className="label">Class Session *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            className="input pl-10 pr-10"
            placeholder="Search class session by name, date, time, or coach..."
            value={sessionSearch}
            onChange={handleSessionInputChange}
            onFocus={handleSessionInputFocus}
            required
          />
          {formData.sessionId && (
            <button
              type="button"
              onClick={handleClearSession}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {showSessionDropdown && filteredSessions.length > 0 && (
          <div
            ref={sessionDropdownRef}
            className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSessions.map((session) => {
              const availableSpots = getAvailableSpots(session);
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => handleSelectSession(session)}
                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-dark-50 transition-colors"
                >
                  <div className="font-medium">
                    {session.className} - {formatDate(session.startTime)} at {formatTimeFromDate(session.startTime)}
                  </div>
                  <div className="text-xs text-dark-400">
                    {session.coach?.firstname} {session.coach?.lastname} • {availableSpots} spots available
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {showSessionDropdown && sessionSearch && filteredSessions.length === 0 && (
          <div
            ref={sessionDropdownRef}
            className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg p-4"
          >
            <p className="text-sm text-dark-400 text-center">No class sessions found</p>
          </div>
        )}
        {availableSessions.length === 0 && !sessionSearch && (
          <p className="text-sm text-dark-400 mt-2">
            No available class sessions found. All sessions are either full or in the past.
          </p>
        )}
        {formData.sessionId && (
          <input type="hidden" value={formData.sessionId} required />
        )}
      </div>

      {/* Selected Session Details */}
      {selectedSession && (
        <div className="bg-dark-700 rounded-lg p-4 space-y-3">
          <h4 className="text-dark-50 font-semibold text-sm mb-3">Session Details</h4>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date:
            </span>
            <span className="text-dark-50 font-semibold">
              {formatDate(selectedSession.startTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time:
            </span>
            <span className="text-dark-50 font-semibold">
              {formatTimeFromDate(selectedSession.startTime)} - {formatTimeFromDate(selectedSession.endTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-300 flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Coach:
            </span>
            <span className="text-dark-50 font-semibold">
              {selectedSession.coach?.firstname} {selectedSession.coach?.lastname}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Availability:
            </span>
            <span className="text-dark-50 font-semibold">
              {getAvailableSpots(selectedSession)} of {selectedSession.capacity} spots available
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="label">Notes (Optional)</label>
        <textarea
          className="input"
          rows="3"
          placeholder="Add booking notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={isSubmitting || bookMutation.isPending || updateMutation.isPending || !formData.customerId || !formData.sessionId}
        >
          {isSubmitting || bookMutation.isPending || updateMutation.isPending
            ? (booking ? 'Updating...' : 'Booking...')
            : (booking ? 'Update Booking' : 'Book Class')}
        </button>
      </div>
    </form>
  );
};

export default GroupClassBookingForm;
