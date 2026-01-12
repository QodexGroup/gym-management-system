import { useState, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal, Avatar } from '../../components/common';
import {
  Plus,
  Search,
  Edit,
  Trash,
  Calendar,
  Clock,
  Users,
  UserCog,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Alert, Toast } from '../../utils/alert';
import {
  CLASS_TYPE,
  CLASS_TYPE_LABELS,
  CLASS_STATUS,
  CLASS_STATUS_LABELS,
  ATTENDANCE_STATUS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_VARIANTS,
} from '../../constants/ptConstants';
import {
  useClassSchedules,
  useCreateClassSchedule,
  useUpdateClassSchedule,
  useDeleteClassSchedule,
} from '../../hooks/useClassSchedules';
import { useClassAttendances, useMarkAttendance } from '../../hooks/useClassAttendance';
import { useCoaches } from '../../hooks/useUsers';
import { formatDate, formatTime } from '../../utils/formatters';
import { mockClassSchedules, mockTrainers } from '../../data/mockData';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ClassScheduleList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedScheduleForAttendance, setSelectedScheduleForAttendance] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    className: '',
    description: '',
    trainerId: '',
    classType: CLASS_TYPE.GROUP,
    capacityLimit: '',
    durationMinutes: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    daysOfWeek: [],
    startDate: '',
    endDate: '',
    status: CLASS_STATUS.ACTIVE,
  });

  // Attendance form state
  const [attendanceData, setAttendanceData] = useState([]);

  // Build query options
  const scheduleOptions = useMemo(() => {
    const filters = {};
    if (searchQuery) {
      filters.className = searchQuery;
    }
    if (filterTrainer !== 'all') {
      filters.trainerId = filterTrainer;
    }

    return {
      page: currentPage,
      pagelimit: 10,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      relations: 'trainer',
    };
  }, [currentPage, searchQuery, filterTrainer]);

  // Use mock data directly
  const [schedulesList, setSchedulesList] = useState([...mockClassSchedules]);
  const loading = false;
  const coaches = mockTrainers.map(t => ({
    id: t.id,
    firstname: t.name.split(' ')[0],
    lastname: t.name.split(' ').slice(1).join(' '),
    email: t.email,
  }));

  // Apply filters to mock data
  const filteredSchedules = useMemo(() => {
    let filtered = [...schedulesList];
    
    if (searchQuery) {
      filtered = filtered.filter(schedule => 
        schedule.className.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterTrainer !== 'all') {
      filtered = filtered.filter(schedule => schedule.trainerId === parseInt(filterTrainer));
    }
    
    return filtered;
  }, [schedulesList, searchQuery, filterTrainer]);

  // Pagination
  const pagelimit = 10;
  const start = (currentPage - 1) * pagelimit;
  const end = start + pagelimit;
  const schedules = filteredSchedules.slice(start, end);
  const pagination = {
    current_page: currentPage,
    last_page: Math.ceil(filteredSchedules.length / pagelimit),
    per_page: pagelimit,
    total: filteredSchedules.length,
    from: filteredSchedules.length > 0 ? start + 1 : 0,
    to: Math.min(end, filteredSchedules.length),
  };

  const attendances = [];
  const isSubmitting = false;

  const daysOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      setSelectedSchedule(schedule);
      setFormData({
        className: schedule.className || '',
        description: schedule.description || '',
        trainerId: schedule.trainerId?.toString() || '',
        classType: schedule.classType || CLASS_TYPE.GROUP,
        capacityLimit: schedule.capacityLimit?.toString() || '',
        durationMinutes: schedule.durationMinutes?.toString() || '',
        startTime: schedule.startTime || '',
        endTime: schedule.endTime || '',
        isRecurring: schedule.isRecurring || false,
        daysOfWeek: schedule.daysOfWeek || [],
        startDate: schedule.startDate || '',
        endDate: schedule.endDate || '',
        status: schedule.status || CLASS_STATUS.ACTIVE,
      });
    } else {
      setSelectedSchedule(null);
      setFormData({
        className: '',
        description: '',
        trainerId: '',
        classType: CLASS_TYPE.GROUP,
        capacityLimit: '',
        durationMinutes: '',
        startTime: '',
        endTime: '',
        isRecurring: false,
        daysOfWeek: [],
        startDate: '',
        endDate: '',
        status: CLASS_STATUS.ACTIVE,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSchedule(null);
    setFormData({
      className: '',
      description: '',
      trainerId: '',
      classType: CLASS_TYPE.GROUP,
      capacityLimit: '',
      durationMinutes: '',
      startTime: '',
      endTime: '',
      isRecurring: false,
      daysOfWeek: [],
      startDate: '',
      endDate: '',
      status: CLASS_STATUS.ACTIVE,
    });
  };

  const handleOpenAttendanceModal = async (schedule) => {
    setSelectedScheduleForAttendance(schedule);
    // Load enrolled members for this class
    // For now, we'll use mock data structure
    setAttendanceData([]);
    setShowAttendanceModal(true);
  };

  const handleCloseAttendanceModal = () => {
    setShowAttendanceModal(false);
    setSelectedScheduleForAttendance(null);
    setAttendanceData([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const scheduleData = {
      id: selectedSchedule ? selectedSchedule.id : schedulesList.length + 1,
      className: formData.className,
      description: formData.description,
      trainerId: parseInt(formData.trainerId),
      classType: formData.classType,
      capacityLimit: parseInt(formData.capacityLimit),
      durationMinutes: parseInt(formData.durationMinutes),
      startTime: formData.startTime,
      endTime: formData.endTime,
      isRecurring: formData.isRecurring,
      daysOfWeek: formData.daysOfWeek,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      status: formData.status,
      enrolledCount: selectedSchedule ? selectedSchedule.enrolledCount || 0 : 0,
      trainer: coaches.find(c => c.id === parseInt(formData.trainerId)),
    };

    if (selectedSchedule) {
      setSchedulesList(prev => prev.map(s => s.id === selectedSchedule.id ? scheduleData : s));
      Toast.success('Class schedule updated successfully');
    } else {
      setSchedulesList(prev => [...prev, scheduleData]);
      Toast.success('Class schedule created successfully');
    }
    handleCloseModal();
  };

  const handleDeleteSchedule = async (scheduleId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    setSchedulesList(prev => prev.filter(s => s.id !== scheduleId));
    Toast.success('Class schedule deleted successfully');
  };

  const toggleDayOfWeek = (day) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const getCapacityStatus = (schedule) => {
    const enrolled = schedule.enrolledCount || 0;
    const capacity = schedule.capacityLimit || 0;
    const remaining = capacity - enrolled;

    if (remaining === 0) return { status: 'full', color: 'danger', text: 'Full' };
    if (remaining <= 3) return { status: 'low', color: 'warning', text: `${remaining} spots` };
    return { status: 'available', color: 'success', text: `${remaining} spots` };
  };

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <select
              value={filterTrainer}
              onChange={(e) => setFilterTrainer(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Trainers</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id} className="bg-dark-700 text-dark-50">
                  {coach.firstname} {coach.lastname}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        </div>

        {/* Class Schedules List */}
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-400">No class schedules found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const trainer = coaches.find((c) => c.id === schedule.trainerId);
              const capacityStatus = getCapacityStatus(schedule);
              const enrolled = schedule.enrolledCount || 0;
              const capacity = schedule.capacityLimit || 0;

              return (
                <div
                  key={schedule.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-dark-50">
                          {schedule.className}
                        </h3>
                        <Badge variant="default">
                          {CLASS_TYPE_LABELS[schedule.classType] || schedule.classType}
                        </Badge>
                        <Badge variant={capacityStatus.color}>
                          {capacityStatus.text}
                        </Badge>
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-dark-300 mb-3">{schedule.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-dark-300">
                        <div className="flex items-center gap-1">
                          <UserCog className="w-4 h-4" />
                          {trainer?.firstname} {trainer?.lastname}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {enrolled}/{capacity} enrolled
                        </div>
                      </div>
                      {schedule.isRecurring && schedule.daysOfWeek && (
                        <div className="mt-2">
                          <p className="text-xs text-dark-400">
                            Repeats: {schedule.daysOfWeek.map((day) => daysOfWeekOptions[day]?.label).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAttendanceModal(schedule)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Attendance
                      </button>
                      <button
                        onClick={() => handleOpenModal(schedule)}
                        className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit class"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Delete class"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-200">
            <div className="text-sm text-dark-300">
              Showing {pagination.from} to {pagination.to} of {pagination.total} classes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-dark-300">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={currentPage === pagination.last_page}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Class Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSchedule ? 'Edit Class Schedule' : 'Create Class Schedule'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Class Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Morning HIIT Class"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Enter class description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Trainer *</label>
              <select
                className="input"
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                required
              >
                <option value="">Select trainer</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstname} {coach.lastname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Class Type *</label>
              <select
                className="input"
                value={formData.classType}
                onChange={(e) => setFormData({ ...formData, classType: e.target.value })}
                required
              >
                {Object.entries(CLASS_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Capacity Limit *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 20"
                min="1"
                value={formData.capacityLimit}
                onChange={(e) => setFormData({ ...formData, capacityLimit: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Duration (minutes) *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 60"
                min="15"
                step="15"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time *</label>
              <input
                type="time"
                className="input"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Time *</label>
              <input
                type="time"
                className="input"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Schedule Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isRecurring"
                  checked={!formData.isRecurring}
                  onChange={() => setFormData({ ...formData, isRecurring: false })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>One-time</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={() => setFormData({ ...formData, isRecurring: true })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>Recurring</span>
              </label>
            </div>
          </div>

          {formData.isRecurring ? (
            <>
              <div>
                <label className="label">Days of Week *</label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeekOptions.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.daysOfWeek.includes(day.value)}
                        onChange={() => toggleDayOfWeek(day.value)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm text-dark-300">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date *</label>
                  <DatePicker
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date) => {
                      const dateString = date ? date.toISOString().split('T')[0] : '';
                      setFormData({ ...formData, startDate: dateString });
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    className="input w-full"
                    minDate={new Date()}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Date (Optional)</label>
                  <DatePicker
                    selected={formData.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) => {
                      const dateString = date ? date.toISOString().split('T')[0] : '';
                      setFormData({ ...formData, endDate: dateString });
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    className="input w-full"
                    minDate={formData.startDate ? new Date(formData.startDate) : new Date()}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="label">Date *</label>
              <DatePicker
                selected={formData.startDate ? new Date(formData.startDate) : null}
                onChange={(date) => {
                  const dateString = date ? date.toISOString().split('T')[0] : '';
                  setFormData({ ...formData, startDate: dateString });
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="input w-full"
                minDate={new Date()}
                required
              />
            </div>
          )}

          <div>
            <label className="label">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={CLASS_STATUS.ACTIVE}
                  checked={formData.status === CLASS_STATUS.ACTIVE}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>{CLASS_STATUS_LABELS[CLASS_STATUS.ACTIVE]}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={CLASS_STATUS.INACTIVE}
                  checked={formData.status === CLASS_STATUS.INACTIVE}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>{CLASS_STATUS_LABELS[CLASS_STATUS.INACTIVE]}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : selectedSchedule
                ? 'Save Changes'
                : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={handleCloseAttendanceModal}
        title={`Mark Attendance - ${selectedScheduleForAttendance?.className}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dark-300">Enrolled:</span>
              <span className="text-dark-50 font-semibold">
                {selectedScheduleForAttendance?.enrolledCount || 0}/
                {selectedScheduleForAttendance?.capacityLimit || 0}
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* This would be populated with enrolled members */}
            <p className="text-sm text-dark-400 text-center py-4">
              Attendance marking will be implemented with enrolled members list
            </p>
          </div>

          <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3">
            <p className="text-sm text-warning-500">
              ⚠️ Marking "Attended" will auto-deduct 1 session from member's PT package if applicable
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseAttendanceModal}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 btn-primary"
              disabled
            >
              Save Attendance
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ClassScheduleList;

