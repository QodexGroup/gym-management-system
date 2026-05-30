import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Modal, Pagination, Badge, ReloadButton } from '../../../components/common';
import DataTable from '../../../components/DataTable';
import {
  Calendar,
  Clock,
  UserCog,
  Plus,
} from 'lucide-react';
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANTS,
} from '../../../shared/constants/classSessionBookingConstants';
import { GROUP_CLASS_SESSION_PERMISSIONS } from '../../../shared/constants/sessionSchedulingConstants';
import {
  isCustomerEligibleForGroupClassBooking,
  getCustomerGroupClassBookingBlockReason,
} from '../../../shared/constants/customerMembership';
import { formatDate } from '../../../shared/utils/formatters';
import { Alert } from '../../../shared/utils/alert';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useCustomerClassSessionBookingHistory } from '../../../shared/hooks/useClassSessionBookings';
import { useClassScheduleSessions } from '../../../shared/hooks/useClassScheduleSessions';
import { mapClassScheduleSessionsToComponent } from '../../../shared/models/classScheduleSessionModel';
import GroupClassBookingForm from '../../class-schedule/GroupClassBookingForm';

const ClassAttendanceTab = ({ member }) => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(GROUP_CLASS_SESSION_PERMISSIONS.CREATE);

  const [showModal, setShowModal] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 50;

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: classSessionsData } = useClassScheduleSessions({
    pagelimit: 0,
    relations: 'classSchedule,classSchedule.coach',
    filters: { startDate: today },
  });

  const classScheduleSessions = useMemo(() => {
    return mapClassScheduleSessionsToComponent(classSessionsData?.data || []);
  }, [classSessionsData]);

  // Fetch paginated class session booking history
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
  } = useCustomerClassSessionBookingHistory(
    member?.id,
    {
      page: historyPage,
      pagelimit: historyPageSize,
      relations: 'classScheduleSession.classSchedule.coach,customer',
      sorts: [{ field: 'classScheduleSession.start_time', direction: 'desc' }],
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

  // Sort history bookings by date and time (descending)
  const sessionHistory = useMemo(() => {
    return [...historyBookings].sort((a, b) => {
      const sessionA = a.classScheduleSession;
      const sessionB = b.classScheduleSession;
      if (!sessionA?.startTime || !sessionB?.startTime) return 0;
      return new Date(sessionB.startTime) - new Date(sessionA.startTime);
    });
  }, [historyBookings]);

  const handleOpenModal = async () => {
    if (!isCustomerEligibleForGroupClassBooking(member)) {
      const reason = getCustomerGroupClassBookingBlockReason(member);
      await Alert.warning('Cannot Book Class', reason);
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleHistoryPageChange = (newPage) => setHistoryPage(newPage);

  /* ---------------- Helpers ---------------- */
  const getStatusBadge = (status) => {
    const statusKey = status?.toUpperCase() || BOOKING_STATUS.BOOKED;
    return {
      label: BOOKING_STATUS_LABELS[statusKey] || status,
      variant: BOOKING_STATUS_VARIANTS[statusKey] || 'default',
    };
  };

  const getSessionDate = (booking) => {
    const t = booking.classScheduleSession?.startTime;
    return t ? new Date(t).toISOString().split('T')[0] : null;
  };

  const getSessionTime = (booking) => {
    const t = booking.classScheduleSession?.startTime;
    return t ? new Date(t).toTimeString().slice(0, 5) : null;
  };

  const getEndTime = (booking) => {
    const t = booking.classScheduleSession?.endTime;
    return t ? new Date(t).toTimeString().slice(0, 5) : null;
  };

  /* ---------------- Columns ---------------- */
  const columns = [
    {
      key: 'class',
      label: 'Class',
      render: (booking) => {
        const schedule = booking.classScheduleSession?.classSchedule;
        const sessionDate = getSessionDate(booking);
        return (
          <div>
            <p className="font-medium text-dark-50">{schedule?.className || 'Unknown Class'}</p>
            {sessionDate && (
              <p className="text-xs text-dark-400 mt-0.5">{formatDate(sessionDate)}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'time',
      label: 'Time',
      render: (booking) => {
        const startTime = getSessionTime(booking);
        const endTime = getEndTime(booking);
        if (!startTime) return <span className="text-dark-400">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <Clock className="w-3.5 h-3.5 text-dark-400" />
            {startTime}{endTime ? ` – ${endTime}` : ''}
          </span>
        );
      },
    },
    {
      key: 'coach',
      label: 'Coach',
      render: (booking) => {
        const coach = booking.classScheduleSession?.classSchedule?.coach;
        if (!coach?.firstname) return <span className="text-dark-400">—</span>;
        return (
          <span className="flex items-center gap-1 text-sm text-dark-200">
            <UserCog className="w-3.5 h-3.5 text-dark-400" />
            {coach.firstname} {coach.lastname}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (booking) => {
        const { label, variant } = getStatusBadge(booking.status);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (booking) =>
        booking.notes
          ? <span className="text-sm text-dark-400">{booking.notes}</span>
          : <span className="text-dark-500">—</span>,
    },
  ];

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">Class Attendance</h3>
        <div className="flex items-center gap-2">
          <ReloadButton onReload={refetchHistory} isReloading={isRefetchingHistory} />
          {canCreate && (
            <button onClick={handleOpenModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Book Class
            </button>
          )}
        </div>
      </div>

      {/* Session History */}
      <div className="card">
        <DataTable
          columns={columns}
          data={sessionHistory}
          loading={isLoadingHistory || isRefetchingHistory}
          emptyMessage="No attendance records found"
        />
      </div>

      {/* Pagination */}
      {historyPagination.lastPage > 1 && (
        <Pagination
          currentPage={historyPage}
          lastPage={historyPagination.lastPage}
          from={historyPagination.from}
          to={historyPagination.to}
          total={historyPagination.total}
          onPrev={() => handleHistoryPageChange(Math.max(historyPage - 1, 1))}
          onNext={() => handleHistoryPageChange(Math.min(historyPage + 1, historyPagination.lastPage || 1))}
        />
      )}

      {/* Book Group Class Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Book Group Class Session"
        size="lg"
      >
        <GroupClassBookingForm
          customers={member ? [member] : []}
          classSessions={classScheduleSessions}
          onSubmit={handleCloseModal}
          onCancel={handleCloseModal}
          showMemberSearch={false}
          customerId={member?.id}
        />
      </Modal>
    </div>
  );
};

export default ClassAttendanceTab;
