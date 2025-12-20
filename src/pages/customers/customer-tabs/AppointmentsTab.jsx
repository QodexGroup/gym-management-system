import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, UserCheck, Plus, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { Badge, Modal, Avatar, CustomTimeInput } from '../../../components/common';
import { useCustomerAppointments, useCreateCustomerAppointment, useUpdateCustomerAppointment, useDeleteCustomerAppointment } from '../../../hooks/useCustomerAppointments';
import { useAppointmentTypes } from '../../../hooks/useAppointmentTypes';
import { useTrainers } from '../../../hooks/useTrainers';
import { getInitialAppointmentFormData, mapAppointmentToFormData, formatAppointmentForApi, formatAppointmentForDisplay } from '../../../models/appointmentModel';
import { APPOINTMENT_STATUS, APPOINTMENT_STATUS_LABELS, APPOINTMENT_DURATION_OPTIONS, getDurationLabel, getStatusIcon } from '../../../constants/appointmentConstants';
import { Alert } from '../../../utils/alert';

const AppointmentsTab = ({ member }) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [formData, setFormData] = useState(getInitialAppointmentFormData());
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data: appointmentsData, isLoading } = useCustomerAppointments(member?.id);
  const { data: appointmentTypes, isLoading: isLoadingTypes } = useAppointmentTypes();
  const { data: trainers = [], isLoading: isLoadingTrainers } = useTrainers();
  const createAppointment = useCreateCustomerAppointment();
  const updateAppointment = useUpdateCustomerAppointment();
  const deleteAppointment = useDeleteCustomerAppointment();

  // Ensure appointmentTypes is always an array
  const appointmentTypesList = Array.isArray(appointmentTypes) ? appointmentTypes : [];

  // Set default trainer to first trainer when trainers are loaded and modal opens
  useEffect(() => {
    if (trainers.length > 0 && showAppointmentModal && !formData.trainerId) {
      setFormData((prev) => ({
        ...prev,
        trainerId: trainers[0].id,
      }));
    }
  }, [trainers, showAppointmentModal, formData.trainerId]);

  const appointments = appointmentsData?.data || [];
  const formattedAppointments = appointments.map(formatAppointmentForDisplay).filter(Boolean);
  
  const upcomingAppointments = formattedAppointments.filter((a) => 
    a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.PENDING
  );
  const pastAppointments = formattedAppointments.filter((a) => 
    a.status === APPOINTMENT_STATUS.COMPLETED || a.status === APPOINTMENT_STATUS.CANCELLED || a.status === APPOINTMENT_STATUS.NO_SHOW
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.appointmentTypeId) {
      alert('Please select an appointment type');
      return;
    }
    
    if (!formData.appointmentStart) {
      alert('Please select an appointment date and time');
      return;
    }

    const appointmentData = formatAppointmentForApi(formData);
    appointmentData.appointmentStart = formData.appointmentStart;

    try {
      if (editingAppointmentId) {
        // Update existing appointment
        await updateAppointment.mutateAsync({
          id: editingAppointmentId,
          data: appointmentData,
        });
      } else {
        // Create new appointment
        await createAppointment.mutateAsync({
          customerId: member.id,
          data: appointmentData,
        });
      }
      setShowAppointmentModal(false);
      setEditingAppointmentId(null);
      setFormData(getInitialAppointmentFormData());
    } catch (error) {
      // Error is handled by the hook
      console.error('Error saving appointment:', error);
    }
  };

  const handleEdit = (appointment) => {
    const appointmentToEdit = appointments.find(apt => apt.id === appointment.id);
    if (appointmentToEdit) {
      setFormData(mapAppointmentToFormData(appointmentToEdit));
      setEditingAppointmentId(appointment.id);
      setShowAppointmentModal(true);
    }
  };

  const handleDelete = async (id) => {
    const result = await Alert.confirmDelete({
      title: 'Delete Appointment?',
      text: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
    });

    if (result.isConfirmed) {
      try {
        await deleteAppointment.mutateAsync(id);
        setDeleteConfirmId(null);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    if (date) {
      // Format date for API (YYYY-MM-DDTHH:mm) - date.getHours() returns 24-hour format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setFormData((prev) => ({
        ...prev,
        appointmentStart: formattedDate,
      }));
    }
  };

  // Handle time change from CustomTimeInput
  // This is called by CustomTimeInput when time changes
  const handleTimeChange = (timeString) => {
    // timeString is in HH:mm format from CustomTimeInput
    const [hours, minutes] = timeString.split(':');
    const currentDate = formData.appointmentStart ? new Date(formData.appointmentStart) : new Date();
    currentDate.setHours(parseInt(hours, 10));
    currentDate.setMinutes(parseInt(minutes, 10));
    
    // Update formData with new date/time
    handleDateChange(currentDate);
  };

  const getAppointmentDate = () => {
    if (!formData.appointmentStart) {
      // Return current date/time if no date selected
      return new Date();
    }
    return new Date(formData.appointmentStart);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Appointments</p>
              <p className="text-3xl font-bold mt-1">{appointments.length}</p>
            </div>
            <CalendarDays className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Upcoming</p>
              <p className="text-3xl font-bold mt-1">{upcomingAppointments.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm">Walk-in Check-ins</p>
              <p className="text-3xl font-bold mt-1">{member.totalVisits}</p>
            </div>
            <UserCheck className="w-10 h-10 text-accent-200" />
          </div>
        </div>
      </div>

      {/* Action */}
      <button 
        onClick={() => {
          const initialData = getInitialAppointmentFormData();
          // Set default trainer to first trainer if available
          if (trainers.length > 0) {
            initialData.trainerId = trainers[0].id;
          }
          setFormData(initialData);
          setEditingAppointmentId(null);
          setShowAppointmentModal(true);
        }} 
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Schedule Appointment
      </button>

      {/* Upcoming Appointments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Upcoming Appointments</h3>
        {isLoading ? (
          <p className="text-dark-400 text-center py-8">Loading appointments...</p>
        ) : upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-primary-100 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold text-primary-600">{apt.time}</p>
                    <p className="text-xs text-primary-500">{getDurationLabel(apt.duration)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(apt.status)}
                  <Badge variant={apt.status === APPOINTMENT_STATUS.CONFIRMED ? 'success' : 'warning'}>
                    {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
                  </Badge>
                  <button
                    onClick={() => handleEdit(apt)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit appointment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete appointment"
                    disabled={deleteAppointment.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No upcoming appointments</p>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Past Appointments</h3>
          <div className="space-y-3">
            {pastAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl opacity-75">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-dark-200 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold text-dark-600">{apt.time}</p>
                    <p className="text-xs text-dark-400">{getDurationLabel(apt.duration)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-700">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">{APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}</Badge>
                  <button
                    onClick={() => handleEdit(apt)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit appointment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete appointment"
                    disabled={deleteAppointment.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setEditingAppointmentId(null);
          setFormData(getInitialAppointmentFormData());
        }}
        title={editingAppointmentId ? "Edit Appointment" : "Schedule Appointment"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
            <Avatar src={member?.avatar} name={member?.name} size="md" />
            <div>
              <p className="font-semibold text-dark-800">{member?.name}</p>
              <p className="text-sm text-dark-500">{member?.membership}</p>
            </div>
          </div>
          <div>
            <label className="label">Appointment Type <span className="text-danger-600">*</span></label>
            <select 
              name="appointmentTypeId"
              value={formData.appointmentTypeId || ''}
              onChange={handleInputChange}
              className="input"
              required
              disabled={isLoadingTypes}
            >
              <option value="">Select appointment type</option>
              {appointmentTypesList.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Appointment Date & Time <span className="text-danger-600">*</span></label>
            <DatePicker
              selected={getAppointmentDate()}
              onChange={handleDateChange}
              showTimeInput
              timeFormat="h:mm aa"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="input w-full"
              placeholderText="Select date and time"
              required
              minDate={new Date()}
              wrapperClassName="w-full"
              style={{ width: '100%' }}
              calendarClassName="react-datepicker-time-below"
              timeInputLabel=""
              customTimeInput={<CustomTimeInput onTimeChange={handleTimeChange} />}
            />
          </div>
          <div>
            <label className="label">Duration</label>
            <select 
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="input"
              required
            >
              {APPOINTMENT_DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assign Trainer</label>
            <select 
              name="trainerId"
              value={formData.trainerId || ''}
              onChange={handleInputChange}
              className="input"
              disabled={isLoadingTrainers}
            >
              {trainers.length === 0 && !isLoadingTrainers && (
                <option value="">No trainers available</option>
              )}
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name || `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="input" 
              rows={2} 
              placeholder="Add notes..." 
            />
          </div>
          <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAppointmentModal(false);
                      setEditingAppointmentId(null);
                      setFormData(getInitialAppointmentFormData());
                    }} 
                    className="flex-1 btn-secondary"
                    disabled={createAppointment.isPending || updateAppointment.isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 btn-primary"
                    disabled={createAppointment.isPending || updateAppointment.isPending}
                  >
                    {createAppointment.isPending || updateAppointment.isPending 
                      ? (editingAppointmentId ? 'Updating...' : 'Scheduling...') 
                      : (editingAppointmentId ? 'Update Appointment' : 'Schedule Appointment')}
                  </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsTab;

