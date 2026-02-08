import { useState, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { Modal, CardList, Pagination, SearchAndFilter } from '../../components/common';
import { Plus, Calendar, Clock, Users, UserCog } from 'lucide-react';
import { Alert } from '../../utils/alert';
import {
  useClassSchedules,
  useMyClassSchedules,
  useDeleteClassSchedule,
} from '../../hooks/useClassSchedules';
import { useCoaches } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import ClassScheduleForm from './forms/ClassScheduleForm';
import { formatDate, formatTimeFromDate } from '../../utils/formatters';
import { SCHEDULE_TYPE_LABELS, RECURRING_INTERVAL_LABELS, getCapacityStatus } from '../../constants/classScheduleConstants';
import { usePagination } from '../../hooks/usePagination';

const ClassScheduleList = () => {
  // Pagination state
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoach, setFilterCoach] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Get current user
  const { user, isTrainer } = useAuth();

  // Build query options (only for non-coaches)
  const scheduleOptions = useMemo(() => {
    if (isTrainer) {
      // For coaches, we'll use my-schedules endpoint which doesn't need filters
      return {
        page: currentPage,
        pagelimit: 50,
        filters: searchQuery ? { className: searchQuery } : undefined,
        relations: 'coach',
      };
    }

    const filters = {};
    if (searchQuery) {
      filters.className = searchQuery;
    }
    if (filterCoach !== 'all') {
      filters.coachId = filterCoach;
    }

    return {
      page: currentPage,
      pagelimit: 50,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      relations: 'coach',
    };
  }, [currentPage, searchQuery, filterCoach, isTrainer]);

  // Fetch data from backend - use different endpoint for coaches
  const { data: allSchedulesData, isLoading: loadingAll } = useClassSchedules({
    ...scheduleOptions,
    enabled: !isTrainer, // Only fetch all schedules if user is not a coach
  });
  const { data: mySchedulesData, isLoading: loadingMy } = useMyClassSchedules({
    ...scheduleOptions,
    enabled: isTrainer, // Only fetch my schedules if user is a coach
  });
  
  // Use appropriate data based on user role
  const schedulesData = isTrainer ? mySchedulesData : allSchedulesData;
  const loading = isTrainer ? loadingMy : loadingAll;
  const { data: coaches = [] } = useCoaches();
  const deleteMutation = useDeleteClassSchedule();

  const schedules = schedulesData?.data || [];
  const pagination = schedulesData?.pagination;

  const handleOpenModal = (schedule = null) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchedule(null);
  };

  const handleFormSubmit = () => {
    handleCloseModal();
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(scheduleId);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };


  // Prepare filter options for coaches
  const coachFilterOptions = useMemo(() => {
    if (isTrainer) return [];
    return coaches.map((coach) => ({
      id: coach.id,
      value: coach.id,
      label: `${coach.firstname} ${coach.lastname}`,
    }));
  }, [coaches, isTrainer]);

  if (loading) {
    return (
      <Layout title="Class Schedules" subtitle="Manage group class schedules">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading class schedules...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Class Schedules" subtitle="Manage group class schedules">
      <div className="card">
        <div className="mb-6">
          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search classes..."
            filterValue={filterCoach}
            onFilterChange={setFilterCoach}
            filterOptions={coachFilterOptions}
            filterLabel="All Coaches"
            onAddClick={() => handleOpenModal()}
            addButtonLabel="Create Class"
            addButtonIcon={Plus}
          />
        </div>

        {/* Class Schedules List */}
        <CardList
          cards={schedules}
          renderTitle={(schedule) => schedule.className}
          renderSubtitle={(schedule) => schedule.description}
          renderContent={(schedule) => {
            const coach = schedule.coach;
            const enrolled = schedule.attendanceCount || 0;
            const capacity = schedule.capacity || 0;
            
            return (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <UserCog className="w-4 h-4" />
                  {coach?.firstname} {coach?.lastname}
                </div>
                {schedule.startDate && (
                  <>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(schedule.startDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTimeFromDate(schedule.startDate)}
                    </div>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {enrolled}/{capacity} enrolled
                </div>
              </div>
            );
          }}
          showFooter={true}
          footerConfig={{
            field: 'recurringInterval',
            condition: (schedule) => schedule.scheduleType === 2 && schedule.recurringInterval,
            format: (value, schedule) => {
              const interval = RECURRING_INTERVAL_LABELS[value] || value;
              const sessions = schedule.numberOfSessions ? ` (${schedule.numberOfSessions} sessions)` : '';
              return `Repeats: ${interval}${sessions}`;
            },
          }}
          badges={[
            {
              variant: 'default',
              getValue: (schedule) => SCHEDULE_TYPE_LABELS[schedule.scheduleType] || 'One-time',
            },
            {
              getVariant: (schedule) => {
                const status = getCapacityStatus(schedule.attendanceCount || 0, schedule.capacity || 0);
                return status.color;
              },
              getValue: (schedule) => {
                const status = getCapacityStatus(schedule.attendanceCount || 0, schedule.capacity || 0);
                return status.text;
              },
            },
          ]}
          actions={{
            onEdit: handleOpenModal,
            onDelete: handleDeleteSchedule,
          }}
          emptyStateMessage="No class schedules found"
          emptyStateIcon={Calendar}
        />

        {/* Pagination */}
        {pagination?.lastPage > 1 && (
          <Pagination
            currentPage={currentPage}
            lastPage={pagination?.lastPage}
            from={pagination?.from}
            to={pagination?.to}
            total={pagination?.total}
            onPrev={goToPrev}
            onNext={() => goToNext(pagination?.lastPage)}
          />
        )}
      </div>

      {/* Create/Edit Class Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSchedule ? 'Edit Class Schedule' : 'Create Class Schedule'}
        size="lg"
      >
        <ClassScheduleForm
          schedule={selectedSchedule}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </Layout>
  );
};

export default ClassScheduleList;
