import { formatDateShort, formatTimeFromDate } from '../../../utils/formatters';
import { useClassSessionBookings, useUpdateAttendanceStatus, useMarkAllAsAttended } from '../../../hooks/useClassSessionBookings';
import { Badge } from '../../../components/common';
import { CheckCircle, XCircle, Ban, Users } from 'lucide-react';
import { BOOKING_STATUS } from '../../../constants/classSessionBookingConstants';

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
      BOOKED: { variant: 'default', label: 'Booked', icon: Users },
      ATTENDED: { variant: 'success', label: 'Attended', icon: CheckCircle },
      NO_SHOW: { variant: 'warning', label: 'No Show', icon: XCircle },
      CANCELLED: { variant: 'danger', label: 'Cancelled', icon: Ban },
    };
    return variants[status] || variants.BOOKED;
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ bookingId, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleMarkAllAttended = async () => {
    if (!sessionId) return;
    try {
      await markAllMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to mark all as attended:', error);
    }
  };

  const bookedCount = bookings.filter(b => b.status !== 'CANCELLED').length;
  const attendedCount = bookings.filter(b => b.status === 'ATTENDED').length;

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
          {bookings.length > 0 && Date.parse(classSession.sessionDate) > new Date() &&  (
            <button
              type="button"
              onClick={handleMarkAllAttended}
              disabled={markAllMutation.isPending || updateStatusMutation.isPending}
              className="text-xs btn-primary px-3 py-1.5"
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
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 text-xs bg-success-500/10 text-success-500 hover:bg-success-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as Attended"
                          >
                            Attended
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.NO_SHOW)}
                            disabled={updateStatusMutation.isPending}
                            className="px-3 py-1.5 text-xs bg-warning-500/10 text-warning-500 hover:bg-warning-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as No Show"
                          >
                            No Show
                          </button>
                        </>
                      )}

                      { booking.status !== BOOKING_STATUS.CANCELLED && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.CANCELLED)}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 text-xs bg-danger-500/10 text-danger-500 hover:bg-danger-500/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancel Booking"
                        >
                          Cancel
                        </button>
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
