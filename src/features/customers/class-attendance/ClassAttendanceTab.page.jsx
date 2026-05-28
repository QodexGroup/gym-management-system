import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Modal, Pagination, CardList } from '../../../components/common';
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
      const dateA = new Date(sessionA.startTime);
      const dateB = new Date(sessionB.startTime);
      return dateB - dateA;
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

  const handleCloseModal = () => {
    setShowModal(false);
  };

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

  const getSessionDate = (booking) => {
    const session = booking.classScheduleSession;
    if (!session?.startTime) return null;
    return new Date(session.startTime).toISOString().split('T')[0];
  };

  const getSessionTime = (booking) => {
    const session = booking.classScheduleSession;
    if (!session?.startTime) return null;
    return new Date(session.startTime).toTimeString().slice(0, 5);
  };

  const getEndTime = (booking) => {
    const session = booking.classScheduleSession;
    if (!session?.endTime) return null;
    return new Date(session.endTime).toTimeString().slice(0, 5);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">Class Attendance</h3>
        {canCreate && (
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Class
          </button>
        )}
      </div>

      {/* Session History */}
      {isLoadingHistory ? (
        <div className="text-center py-8 text-dark-400">Loading attendance records...</div>
      ) : (
        <div>
          <CardList
            cards={sessionHistory}
            renderTitle={(booking) => {
              const schedule = booking.classScheduleSession?.classSchedule;
              return schedule?.className || 'Unknown Class';
            }}
            renderContent={(booking) => {
              const schedule = booking.classScheduleSession?.classSchedule;
              const coach = schedule?.coach;
              const startTime = getSessionTime(booking);
              const endTime = getEndTime(booking);

              return (
                <div className="flex items-center gap-4">
                  {startTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {startTime}{endTime ? ` - ${endTime}` : ''}
                    </div>
                  )}
                  {coach?.firstname && (
                    <div className="flex items-center gap-1">
                      <UserCog className="w-4 h-4" />
                      {coach.firstname} {coach.lastname}
                    </div>
                  )}
                </div>
              );
            }}
            showFooter={true}
            footerConfig="notes"
            badges={[
              {
                label: '',
                getValue: (booking) => {
                  const sessionDate = getSessionDate(booking);
                  return sessionDate ? formatDate(sessionDate) : '';
                },
                variant: 'default',
              },
              {
                label: '',
                getValue: (booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  return statusInfo.label;
                },
                getVariant: (booking) => {
                  const statusInfo = getStatusBadge(booking.status);
                  return statusInfo.variant;
                },
              },
            ]}
            showActions={false}
            emptyStateMessage="No attendance records found"
            emptyStateIcon={Calendar}
          />

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
        </div>
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
