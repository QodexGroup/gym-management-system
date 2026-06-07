import { useState, useMemo } from 'react';
import Layout from '../../layout/Layout';
import { Modal, Pagination, SearchAndFilter } from '../../components/common';
import DataTable from '../../components/DataTable';
import { Plus, Calendar } from 'lucide-react';
import { Alert } from '../../shared/utils/alert';
import {
  useClassSchedules,
  useMyClassSchedules,
  useDeleteClassSchedule,
} from '../../shared/hooks/useClassSchedules';
import { useCoaches } from '../../shared/hooks/useUsers';
import { useAuth } from '../../shared/context/AuthContext';
import ClassScheduleForm from './ClassScheduleForm';
import { classScheduleTableColumns } from './classScheduleTable.config';
import { usePagination } from '../../shared/hooks/usePagination';

const ClassScheduleList = () => {
  // Pagination state
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoach, setFilterCoach] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const { user, isTrainer, fetchUserData } = useAuth();
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

  const handleFormSubmit = async () => {
    handleCloseModal();
    await fetchUserData();
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(scheduleId);
      await fetchUserData();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting schedule:', error);
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

  return (
    <Layout title="Class Schedules" subtitle="Manage upcoming group class and PT sessions">
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
        <DataTable
          columns={classScheduleTableColumns({
            onEdit: handleOpenModal,
            onDelete: handleDeleteSchedule,
            isTrainer,
            userId: user?.id,
          })}
          data={schedules}
          loading={loading}
          emptyMessage="No class schedules found"
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
