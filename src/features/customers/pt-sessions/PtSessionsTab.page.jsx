import { useState, useMemo } from 'react';
import { Modal, Pagination, Badge, ReloadButton } from '../../../components/common';
import DataTable from '../../../components/DataTable';
import { createActionColumn } from '../../../components/DataTable';
import {
  Plus,
  Clock,
  UserCog,
  CheckCircle,
  Edit,
  X,
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
import { transformPtBookingToApiFormat } from '../../../shared/models/ptBookingModel';

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
    { relations: 'ptPackage,customer,coach' }
  );

  const upcomingBookings = Array.isArray(upcomingBookingsData) ? upcomingBookingsData : [];

  // Fetch paginated PT booking history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
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

  const upcomingSessions = useMemo(() => {
    return [...upcomingBookings].sort((a, b) => {
      return new Date(`${a.bookingDate}T${a.bookingTime}`) - new Date(`${b.bookingDate}T${b.bookingTime}`);
    });
  }, [upcomingBookings]);

  const sessionHistory = useMemo(() => {
    return [...historyBookings].sort((a, b) => {
      return new Date(`${b.bookingDate}T${b.bookingTime}`) - new Date(`${a.bookingDate}T${a.bookingTime}`);
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
        await updatePtBookingMutation.mutateAsync({ id: selectedSession.id, data: apiData });
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

  const handleHistoryPageChange = (newPage) => setHistoryPage(newPage);

  /* ---------------- Helpers ---------------- */
  const getStatusBadge = (status) => {
    const statusKey = status?.toUpperCase() || BOOKING_STATUS.BOOKED;
    return {
      label: BOOKING_STATUS_LABELS[statusKey] || status,
      variant: BOOKING_STATUS_VARIANTS[statusKey] || 'default',
    };
  };

  /* ---------------- Shared session columns (no actions) ---------------- */
  const sharedSessionColumns = [
    {
      key: 'datetime',
      label: 'Date & Time',
      render: (session) => (
        <div>
          <p className="font-medium text-dark-50">{formatDate(session.bookingDate)}</p>
          <p className="text-xs text-dark-400 mt-0.5">{formatTime(session.bookingTime)}</p>
        </div>
      ),
    },
    {
      key: 'coach',
      label: 'Coach',
      render: (session) => {
        const coach = session.coach || {};
        if (!coach.firstname) return <span className="text-dark-400">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <UserCog className="w-3.5 h-3.5 text-dark-400" />
            {coach.firstname} {coach.lastname}
          </span>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (session) => (
        <span className="flex items-center gap-1 text-sm text-dark-200">
          <Clock className="w-3.5 h-3.5 text-dark-400" />
          {session.duration || 60} min
        </span>
      ),
    },
    {
      key: 'package',
      label: 'Package',
      render: (session) => {
        const name = session.packageName || session.ptPackage?.packageName || 'N/A';
        return <Badge variant="default">{name}</Badge>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (session) => {
        const { label, variant } = getStatusBadge(session.status);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (session) =>
        session.bookingNotes
          ? <span className="text-sm text-dark-400">{session.bookingNotes}</span>
          : <span className="text-dark-500">—</span>,
    },
  ];

  /* ---------------- Upcoming columns (with actions) ---------------- */
  const upcomingColumns = [
    createActionColumn(
      (session) => {
        const items = [];
        if (canUpdate) {
          items.push({ key: 'edit', label: 'Edit', icon: Edit, onClick: () => handleOpenModal(session) });
        }
        if (canCancel) {
          items.push({ key: 'cancel', label: 'Cancel', icon: X, variant: 'danger', onClick: () => handleCancelSession(session.id) });
        }
        return items;
      },
      { menuPosition: 'bottom-left' }
    ),
    ...sharedSessionColumns,
  ];

  /* ---------------- History columns (read-only, swap package col for icon) ---------------- */
  const historyColumns = [
    ...sharedSessionColumns.map((col) =>
      col.key === 'duration'
        ? {
            ...col,
            label: 'Package',
            render: (session) => {
              const name = session.packageName || session.ptPackage?.packageName || 'N/A';
              return (
                <span className="flex items-center gap-1 text-sm text-dark-200">
                  <CheckCircle className="w-3.5 h-3.5 text-dark-400" />
                  {name}
                </span>
              );
            },
          }
        : col
    ).filter((col) => col.key !== 'package'),
  ];

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">PT Sessions</h3>
        <div className="flex items-center gap-2">
          <ReloadButton onReload={refetchHistory} isReloading={isRefetchingHistory} />
          {canCreate && activePackages.length > 0 && (
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Book Session
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h4 className="text-md font-medium text-dark-300 mb-4">Upcoming Sessions</h4>
        <div className="card">
          <DataTable
            columns={upcomingColumns}
            data={upcomingSessions}
            loading={isLoadingUpcoming}
            emptyMessage="No upcoming sessions"
          />
        </div>
      </div>

      {/* Session History */}
      <div>
        <h4 className="text-md font-medium text-dark-300 mb-4">Session History</h4>
        <div className="card">
          <DataTable
            columns={historyColumns}
            data={sessionHistory}
            loading={isLoadingHistory || isRefetchingHistory}
            emptyMessage="No session history"
          />
        </div>

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
