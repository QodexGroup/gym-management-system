import { formatDateShort, formatTimeFromDate } from '../../shared/utils/formatters';
import { useClassSessionBookings, useUpdateAttendanceStatus, useMarkAllAsAttended } from '../../shared/hooks/useClassSessionBookings';
import { Badge } from '../../components/common';
import { CheckCircle, XCircle, Ban, Users } from 'lucide-react';
import { BOOKING_STATUS } from '../../shared/constants/classSessionBookingConstants';
import { Alert } from '../../shared/utils/alert';

const ClassAttendanceForm = ({
  classSession,
  onCancel,
  onSubmit,
  isSubmitting = false,
}) => {
  const sessionId = classSession?.sessionId || classSession?.id;

  // Fetch bookings for this session
  const { data: bookingsData, isLoading: isLoadingBookings } = useClassSessionBookings(sessionId, {
    enabled: !!sessionId,
  });

  const bookings = bookingsData || [];
  const updateStatusMutation = useUpdateAttendanceStatus();
  const markAllMutation = useMarkAllAsAttended();

  if (!classSession) {
    return null;
  }

  const getStatusBadge = (status) => {
    const variants = {
      [BOOKING_STATUS.BOOKED]: { variant: 'default', label: 'Booked', icon: Users },
      [BOOKING_STATUS.ATTENDED]: { variant: 'success', label: 'Attended', icon: CheckCircle },
      [BOOKING_STATUS.NO_SHOW]: { variant: 'warning', label: 'No Show', icon: XCircle },
      [BOOKING_STATUS.CANCELLED]: { variant: 'danger', label: 'Cancelled', icon: Ban },
    };
    return variants[status] || variants[BOOKING_STATUS.BOOKED];
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    // Guard: Check if mutation is pending or no booking ID
    if (!bookingId || updateStatusMutation.isPending) {
      return;
    }

    let confirmResult;
    const booking = bookings.find(b => b.id === bookingId);
    const customer = booking?.customer || {};
    const customerName = customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.firstName || 'this booking';

    try {
      if (newStatus === BOOKING_STATUS.ATTENDED) {
        confirmResult = await Alert.confirm({
          title: 'Mark as Attended?',
          text: `Are you sure you want to mark ${customerName} as attended?`,
          icon: 'question',
          confirmButtonText: 'Yes, mark as attended',
          cancelButtonText: 'Cancel',
        });
        if (!confirmResult.isConfirmed) return;
      } else if (newStatus === BOOKING_STATUS.NO_SHOW) {
        confirmResult = await Alert.confirm({
          title: 'Mark as No Show?',
          text: `Are you sure you want to mark ${customerName} as no show?`,
          icon: 'warning',
          confirmButtonText: 'Yes, mark as no show',
          cancelButtonText: 'Cancel',
        });
        if (!confirmResult.isConfirmed) return;
      } else if (newStatus === BOOKING_STATUS.CANCELLED) {
        confirmResult = await Alert.confirm({
          title: 'Cancel Booking?',
          text: `Are you sure you want to cancel ${customerName}? This action cannot be undone.`,
          icon: 'warning',
          confirmButtonText: 'Yes, cancel it',
          cancelButtonText: 'No',
        });
        if (!confirmResult.isConfirmed) return;
      }

      await updateStatusMutation.mutateAsync({ bookingId, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleMarkAllAttended = async () => {
    // Guard: Check conditions
    if (!sessionId) return;
    if (markAllMutation.isPending || updateStatusMutation.isPending) return;

    // Get booked bookings
    const bookedBookings = bookings.filter(b => b.status === BOOKING_STATUS.BOOKED);
    if (bookedBookings.length === 0) return;

    // Confirmation dialog
    const confirmResult = await Alert.confirm({
      title: 'Mark All as Attended?',
      text: `Are you sure you want to mark all ${bookedBookings.length} booked client(s) as attended?`,
      icon: 'question',
      confirmButtonText: 'Yes, mark all as attended',
      cancelButtonText: 'Cancel',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await markAllMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to mark all as attended:', error);
    }
  };

  const bookedCount = bookings.filter(b => b.status !== BOOKING_STATUS.CANCELLED).length;
  const attendedCount = bookings.filter(b => b.status === BOOKING_STATUS.ATTENDED).length;

  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Session Date:</span>
          <span className="text-dark-50 font-semibold">
            {formatDateShort(classSession.startTime)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Time:</span>
          <span className="text-dark-50 font-semibold">
            {formatTimeFromDate(classSession.startTime)} - {formatTimeFromDate(classSession.endTime)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-300">Booked:</span>
          <span className="text-dark-50 font-semibold">
            {bookedCount}/{classSession.capacity || 0}
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
          <h4 className="text-sm font-semibold text-dark-50">Booked Clients</h4>
          {bookings.length > 0 && Date.parse(classSession.sessionDate) > new Date() && (
            <button
              type="button"
              onClick={handleMarkAllAttended}
              disabled={
                !sessionId ||
                markAllMutation.isPending ||
                updateStatusMutation.isPending ||
                isLoadingBookings ||
                bookings.filter(b => b.status === BOOKING_STATUS.BOOKED).length === 0
              }
              className="text-xs btn-primary px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllMutation.isPending ? 'Marking...' : 'Mark All as Attended'}
            </button>
          )}
        </div>

        {isLoadingBookings ? (
          <div className="text-center py-8">
            <p className="text-sm text-dark-400">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-dark-400">No bookings found for this session</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status);
              const StatusIcon = statusInfo.icon;
              const customer = booking.customer || {};
              const customerName = customer.firstName && customer.lastName
                ? `${customer.firstName} ${customer.lastName}`
                : customer.firstName || 'Unknown';

              return (
                <div
                  key={booking.id}
                  className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-dark-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-sm font-semibold text-dark-50">
                          {customerName}
                        </h5>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      {customer.email && (
                        <p className="text-xs text-dark-400">{customer.email}</p>
                      )}
                      {customer.phoneNumber && (
                        <p className="text-xs text-dark-400">{customer.phoneNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === BOOKING_STATUS.BOOKED && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.ATTENDED)}
                            disabled={
                              !booking.id ||
                              updateStatusMutation.isPending ||
                              markAllMutation.isPending ||
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
                              updateStatusMutation.isPending ||
                              markAllMutation.isPending ||
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
                              updateStatusMutation.isPending ||
                              markAllMutation.isPending ||
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
          disabled={isSubmitting || updateStatusMutation.isPending || markAllMutation.isPending}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ClassAttendanceForm;
