import { useState, useMemo } from 'react';
import { Modal, Pagination, CardList } from '../../../components/common';
import {
  Plus,
  Calendar,
  Clock,
  UserCog,
  CheckCircle,
} from 'lucide-react';
import { useConfirmAction } from '../../../shared/hooks/useConfirmAction';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS, BOOKING_STATUS_VARIANTS } from '../../../shared/constants/classSessionBookingConstants';
import { PT_SESSION_PERMISSIONS } from '../../../shared/constants/ptConstants';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import PtSessionForm from '../../personal-training/PtSessionForm';
import {
  useCustomerUpcomingPtBookings,
  useCustomerPtBookingHistory,
  useCreatePtBooking,
  useUpdatePtBooking,
  useCancelPtBooking,
} from '../../../shared/hooks/usePtBookings';
import { useCustomerPtPackages } from '../../../shared/hooks/useCustomerPtPackages';
import { transformPtBookingToApiFormat, mapPtBookingToFormData } from '../../../shared/models/ptBookingModel';

const PtSessionsTab = ({ member }) => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PT_SESSION_PERMISSIONS.CREATE);
  const canUpdate = hasPermission(PT_SESSION_PERMISSIONS.UPDATE);
  const canCancel = hasPermission(PT_SESSION_PERMISSIONS.CANCEL);

  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 50;

  // Fetch customer's active PT packages
  const { data: customerPtPackages = [] } = useCustomerPtPackages(member?.id, {
    relations: 'ptPackage,coach',
  });

  // Fetch upcoming PT bookings (non-paginated - returns all upcoming)
  const { data: upcomingBookingsData, isLoading: isLoadingUpcoming } = useCustomerUpcomingPtBookings(
    member?.id,
    {
      relations: 'ptPackage,customer,coach',
    }
  );

  // Ensure upcomingBookings is always an array
  const upcomingBookings = Array.isArray(upcomingBookingsData) ? upcomingBookingsData : [];

  // Fetch paginated PT booking history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useCustomerPtBookingHistory(
    member?.id,
    {
      page: historyPage,
      pagelimit: historyPageSize,
      relations: 'ptPackage,customer,coach',
    }
  );

  const historyBookings = historyData?.data || [];
  const historyPagination = historyData ? {
    currentPage: historyData.currentPage,
    lastPage: historyData.lastPage,
    from: historyData.from,
    to: historyData.to,
    total: historyData.total,
  } : {};

  /* ---------------- Mutations ---------------- */
  const createPtBookingMutation = useCreatePtBooking();
  const updatePtBookingMutation = useUpdatePtBooking();
  const cancelPtBookingMutation = useCancelPtBooking();

  /* ---------------- Data ---------------- */
  const activePackages = useMemo(() => {
    return customerPtPackages.filter((pkg) => pkg.status === 'active');
  }, [customerPtPackages]);

  // Sort upcoming sessions by date and time
  const upcomingSessions = useMemo(() => {
    return [...upcomingBookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate}T${a.bookingTime}`);
      const dateB = new Date(`${b.bookingDate}T${b.bookingTime}`);
      return dateA - dateB;
    });
  }, [upcomingBookings]);

  // Sort history sessions by date and time (descending)
  const sessionHistory = useMemo(() => {
    return [...historyBookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate}T${a.bookingTime}`);
      const dateB = new Date(`${b.bookingDate}T${b.bookingTime}`);
      return dateB - dateA;
    });
  }, [historyBookings]);

  /* ---------------- Handlers ---------------- */
  const handleOpenModal = (session = null) => {
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
  };

  const handleSubmit = async (formData) => {
    try {
      const apiData = transformPtBookingToApiFormat(formData);

      if (selectedSession) {
        await updatePtBookingMutation.mutateAsync({
          id: selectedSession.id,
          data: apiData,
        });
      } else {
        await createPtBookingMutation.mutateAsync(apiData);
      }

      handleCloseModal();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save PT session:', error);
    }
  };

  const handleCancelSession = useConfirmAction(
    (sessionId) => cancelPtBookingMutation.mutateAsync(sessionId),
    { title: 'Cancel Session?', text: 'Are you sure you want to cancel this session?', icon: 'warning', confirmText: 'Yes, cancel it' }
  );

  const handleHistoryPageChange = (newPage) => {
    setHistoryPage(newPage);
  };

  /* ---------------- Helpers ---------------- */
  const getStatusBadge = (status) => {
    const statusKey = status?.toUpperCase() || BOOKING_STATUS.BOOKED;
    const label = BOOKING_STATUS_LABELS[statusKey] || status;
    const variant = BOOKING_STATUS_VARIANTS[statusKey] || 'default';
    return { label, variant };
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">PT Sessions</h3>
        {canCreate && activePackages.length > 0 && (
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Session
          </button>
        )}
      </div>

      {/* Upcoming Sessions */}
      {isLoadingUpcoming ? (
        <div className="text-center py-8 text-dark-400">Loading upcoming sessions...</div>
      ) : (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Upcoming Sessions</h4>
          <CardList
            cards={upcomingSessions}
            renderTitle={(session) => `${formatDate(session.bookingDate)} at ${formatTime(session.bookingTime)}`}
            renderContent={(session) => {
              const ptPackage = session.ptPackage || {};
              const coach = session.coach || {};
              return (
                <div className="flex items-center gap-4">
                  {coach.firstname && (
                    <div className="flex items-center gap-1">
                      <UserCog className="w-4 h-4" />
                      {coach.firstname} {coach.lastname}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {session.duration || 60} minutes
                  </div>
                </div>
              );
            }}
            showFooter={true}
            footerConfig="bookingNotes"
            badges={[
              {
                label: '',
                getValue: (session) => {
                  const ptPackage = session.ptPackage || {};
                  return session.packageName || ptPackage.packageName || 'N/A';
                },
                variant: 'default',
              },
              {
                label: '',
                getValue: (session) => {
                  const statusInfo = getStatusBadge(session.status);
                  return statusInfo.label;
                },
                getVariant: (session) => {
                  const statusInfo = getStatusBadge(session.status);
                  return statusInfo.variant;
                },
              },
            ]}
            actions={{
              ...(canUpdate && { onEdit: handleOpenModal }),
              ...(canCancel && { onCancel: handleCancelSession }),
            }}
            emptyStateMessage="No upcoming sessions"
          />
        </div>
      )}

      {/* Session History */}
      {isLoadingHistory ? (
        <div className="text-center py-8 text-dark-400">Loading session history...</div>
      ) : (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Session History</h4>
          <CardList
            cards={sessionHistory}
            renderTitle={(session) => `${formatDate(session.bookingDate)} at ${formatTime(session.bookingTime)}`}
            renderContent={(session) => {
              const ptPackage = session.ptPackage || {};
              const coach = session.coach || {};
              return (
                <div className="flex items-center gap-4">
                  {coach.firstname && (
                    <div className="flex items-center gap-1">
                      <UserCog className="w-4 h-4" />
                      {coach.firstname} {coach.lastname}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {session.packageName || ptPackage.packageName || 'N/A'}
                  </div>
                </div>
              );
            }}
            showFooter={true}
            footerConfig="bookingNotes"
            badges={[
              {
                label: '',
                getValue: (session) => {
                  const statusInfo = getStatusBadge(session.status);
                  return statusInfo.label;
                },
                getVariant: (session) => {
                  const statusInfo = getStatusBadge(session.status);
                  return statusInfo.variant;
                },
              },
            ]}
            showActions={false}
            emptyStateMessage="No session history"
          />

          {/* Pagination */}
          <Pagination
            currentPage={historyPage}
            lastPage={historyPagination.lastPage}
            from={historyPagination.from}
            to={historyPagination.to}
            total={historyPagination.total}
            onPrev={() => handleHistoryPageChange(Math.max(historyPage - 1, 1))}
            onNext={() => handleHistoryPageChange(Math.min(historyPage + 1, historyPagination.lastPage || 1))}
          />
        </div>
      )}

      {/* Book/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSession ? 'Edit Session' : 'Book PT Session'}
        size="md"
      >
        <PtSessionForm
          session={selectedSession}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isSubmitting={createPtBookingMutation.isPending || updatePtBookingMutation.isPending}
          showMemberSearch={false}
          customerId={member?.id}
        />
      </Modal>
    </div>
  );
};

export default PtSessionsTab;
