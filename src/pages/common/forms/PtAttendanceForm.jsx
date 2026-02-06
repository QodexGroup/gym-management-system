import { formatDateShort, formatTimeFromDate } from '../../../utils/formatters';
import { useMarkPtBookingAsAttended, useMarkPtBookingAsNoShow, useCancelPtBooking, usePtBookingsBySessionId } from '../../../hooks/usePtBookings';
import { Badge } from '../../../components/common';
import { CheckCircle, XCircle, Ban, User } from 'lucide-react';
import { BOOKING_STATUS } from '../../../constants/classSessionBookingConstants';
import { SESSION_TYPES, SESSION_TYPE_LABELS } from '../../../constants/sessionSchedulingConstants';
import { Alert } from '../../../utils/alert';

const PtAttendanceForm = ({
  ptSession,
  onCancel,
  onSubmit,
  isSubmitting = false,
}) => {
  const markAttendedMutation = useMarkPtBookingAsAttended();
  const markNoShowMutation = useMarkPtBookingAsNoShow();
  const cancelMutation = useCancelPtBooking();

  // Check if this is a class schedule PT session (has sessionId and no customer attached)
  const isClassScheduleSession = !!ptSession?.sessionId && !ptSession?.customer && !ptSession?.customerId;
  const sessionId = ptSession?.sessionId || ptSession?.id;

  // Fetch PT bookings for class schedule session
  const { data: ptBookingsData, isLoading: isLoadingBookings } = usePtBookingsBySessionId(
    isClassScheduleSession ? sessionId : null,
    {
      relations: 'customer,coach,ptPackage',
    },
    {
      enabled: isClassScheduleSession && !!sessionId,
    }
  );

  const ptBookings = ptBookingsData || [];
  
  // If it's a class schedule session, use bookings from API
  // Otherwise, use the single session data
  const bookings = isClassScheduleSession ? ptBookings : (ptSession?.id ? [ptSession] : []);
  if (!ptSession) {
    return null;
  }

  const getStatusBadge = (status) => {
    const variants = {
      [BOOKING_STATUS.BOOKED]: { variant: 'default', label: 'Booked', icon: User },
      [BOOKING_STATUS.ATTENDED]: { variant: 'success', label: 'Attended', icon: CheckCircle },
      [BOOKING_STATUS.NO_SHOW]: { variant: 'warning', label: 'No Show', icon: XCircle },
      [BOOKING_STATUS.CANCELLED]: { variant: 'danger', label: 'Cancelled', icon: Ban },
    };
    return variants[status] || variants[BOOKING_STATUS.BOOKED];
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    if (!bookingId) {
      console.warn('No PT booking ID found');
      return;
    }

    // Guard: Check if any mutation is pending
    if (markAttendedMutation.isPending || markNoShowMutation.isPending || cancelMutation.isPending) {
      return;
    }
    
    let confirmResult;
    const customer = bookings.find(b => b.id === bookingId)?.customer || {};
    const customerName = getCustomerName(customer);

    try {
      if (newStatus === BOOKING_STATUS.ATTENDED) {
        confirmResult = await Alert.confirm({
          title: 'Mark as Attended?',
          text: `Are you sure you want to mark ${customerName || 'this booking'} as attended?`,
          icon: 'question',
          confirmButtonText: 'Yes, mark as attended',
          cancelButtonText: 'Cancel',
        });
        if (!confirmResult.isConfirmed) return;
        await markAttendedMutation.mutateAsync(bookingId);
      } else if (newStatus === BOOKING_STATUS.NO_SHOW) {
        confirmResult = await Alert.confirm({
          title: 'Mark as No Show?',
          text: `Are you sure you want to mark ${customerName || 'this booking'} as no show?`,
          icon: 'warning',
          confirmButtonText: 'Yes, mark as no show',
          cancelButtonText: 'Cancel',
        });
        if (!confirmResult.isConfirmed) return;
        await markNoShowMutation.mutateAsync(bookingId);
      } else if (newStatus === BOOKING_STATUS.CANCELLED) {
        confirmResult = await Alert.confirm({
          title: 'Cancel Booking?',
          text: `Are you sure you want to cancel ${customerName || 'this booking'}? This action cannot be undone.`,
          icon: 'warning',
          confirmButtonText: 'Yes, cancel it',
          cancelButtonText: 'No',
        });
        if (!confirmResult.isConfirmed) return;
        await cancelMutation.mutateAsync(bookingId);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const bookedCount = bookings.filter(b => b.status !== BOOKING_STATUS.CANCELLED).length;
  const attendedCount = bookings.filter(b => b.status === BOOKING_STATUS.ATTENDED).length;

  const statusInfo = getStatusBadge(ptSession.bookingStatus || ptSession.status || BOOKING_STATUS.BOOKED);
  const StatusIcon = statusInfo.icon;
  const customer = ptSession.customer || {};
  const coach = ptSession.coach || {};
  const getCustomerName = (customerData = {}) => {
    const firstName = customerData.firstName || customerData.firstname || customerData.first_name || '';
    const lastName = customerData.lastName || customerData.lastname || customerData.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || firstName || 'Unknown';
  };
  const getCoachName = (coachData = {}) => {
    return coachData.fullname || `${coachData.firstname || ''} ${coachData.lastname || ''}`.trim() || 'Unknown';
  };
  const customerName = getCustomerName(customer);
  const coachName = getCoachName(coach);
  
  // Calculate end time
  const startTime = ptSession.startTime ? new Date(ptSession.startTime) : null;
  const endTime = ptSession.endTime ? new Date(ptSession.endTime) : (startTime && ptSession.duration 
    ? new Date(startTime.getTime() + ptSession.duration * 60 * 1000) 
    : null);

  const isPast = startTime && startTime < new Date();
  const currentStatus = ptSession.bookingStatus || ptSession.status || BOOKING_STATUS.BOOKED;

  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Session Date:</span>
          <span className="text-dark-50 font-semibold">
            {startTime ? formatDateShort(startTime) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Time:</span>
          <span className="text-dark-50 font-semibold">
            {startTime && endTime 
              ? `${formatTimeFromDate(startTime)} - ${formatTimeFromDate(endTime)}`
              : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Booked:</span>
          <span className="text-dark-50 font-semibold">
            {bookedCount}/{ptSession.capacity || 1}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Attended:</span>
          <span className="text-dark-50 font-semibold">
            {attendedCount}
          </span>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-dark-50">
            Client Information
          </h4>
        </div>

        {isLoadingBookings ? (
          <div className="text-center py-8">
            <p className="text-sm text-dark-400">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <div className="text-center py-4">
              <p className="text-sm text-dark-400">No PT booking found for this session</p>
              <p className="text-xs text-dark-500 mt-2">
                {isClassScheduleSession 
                  ? `This is a scheduled PT session (${ptSession.className || SESSION_TYPE_LABELS[SESSION_TYPES.COACH_PT]?.replace(' Schedule', '') || 'PT Session'}), but no booking has been made yet.`
                  : 'This is a scheduled PT session, but no booking has been made yet.'}
              </p>
              {isClassScheduleSession && coachName && (
                <p className="text-xs text-dark-400 mt-2">Coach: {coachName}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookings.map((booking) => {
              const bookingStatusInfo = getStatusBadge(booking.status || booking.bookingStatus || BOOKING_STATUS.BOOKED);
              const BookingStatusIcon = bookingStatusInfo.icon;
              const bookingCustomer = booking.customer || {};
              const bookingCoach = booking.coach || {};
              const bookingCustomerName = getCustomerName(bookingCustomer);
              const bookingCoachName = getCoachName(bookingCoach);
              const bookingCurrentStatus = booking.status || booking.bookingStatus || BOOKING_STATUS.BOOKED;

              return (
                <div
                  key={booking.id}
                  className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-dark-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-sm font-semibold text-dark-50">
                          {bookingCustomerName}
                        </h5>
                        <Badge variant={bookingStatusInfo.variant}>
                          <BookingStatusIcon className="w-3 h-3 mr-1" />
                          {bookingStatusInfo.label}
                        </Badge>
                      </div>
                      {bookingCustomer.email && (
                        <p className="text-xs text-dark-400">{bookingCustomer.email}</p>
                      )}
                      {bookingCustomer.phoneNumber && (
                        <p className="text-xs text-dark-400">{bookingCustomer.phoneNumber}</p>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-dark-400">Coach: {bookingCoachName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bookingCurrentStatus === BOOKING_STATUS.BOOKED && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.ATTENDED)}
                            disabled={
                              !booking.id ||
                              markAttendedMutation.isPending || 
                              cancelMutation.isPending || 
                              markNoShowMutation.isPending ||
                              isLoadingBookings
                            }
                            className="px-3 py-1.5 text-xs bg-success-500/10 text-success-500 hover:bg-success-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark as Attended"
                          >
                            Attended
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.NO_SHOW)}
                            disabled={
                              !booking.id ||
                              markAttendedMutation.isPending || 
                              cancelMutation.isPending || 
                              markNoShowMutation.isPending ||
                              isLoadingBookings
                            }
                            className="px-3 py-1.5 text-xs bg-warning-500/10 text-warning-500 hover:bg-warning-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark as No Show"
                          >
                            No Show
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.CANCELLED)}
                            disabled={
                              !booking.id ||
                              markAttendedMutation.isPending || 
                              cancelMutation.isPending || 
                              markNoShowMutation.isPending ||
                              isLoadingBookings
                            }
                            className="px-3 py-1.5 text-xs bg-danger-500/10 text-danger-500 hover:bg-danger-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cancel Booking"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={isSubmitting || markAttendedMutation.isPending || cancelMutation.isPending || markNoShowMutation.isPending || isLoadingBookings}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PtAttendanceForm;
