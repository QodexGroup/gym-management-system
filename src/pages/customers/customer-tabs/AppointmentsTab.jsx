import { useState } from 'react';
import { CalendarDays, CheckCircle, AlertCircle, XCircle, UserCheck, Plus } from 'lucide-react';
import { Badge, Modal, Avatar } from '../../../components/common';
import { mockTrainers, appointmentTypes } from '../../../data/mockData';

const AppointmentsTab = ({ member, appointments }) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const upcomingAppointments = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const pastAppointments = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-warning-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-danger-500" />;
      default: return null;
    }
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
      <button onClick={() => setShowAppointmentModal(true)} className="btn-primary flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Schedule Appointment
      </button>

      {/* Upcoming Appointments */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Upcoming Appointments</h3>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 py-2 bg-primary-100 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold text-primary-600">{apt.time}</p>
                    <p className="text-xs text-primary-500">{apt.duration} min</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date} • with {apt.trainer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(apt.status)}
                  <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                    {apt.status}
                  </Badge>
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
                    <p className="text-xs text-dark-400">{apt.duration} min</p>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-700">{apt.type}</p>
                    <p className="text-sm text-dark-500">{apt.date} • with {apt.trainer}</p>
                  </div>
                </div>
                <Badge variant="default">{apt.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Schedule Appointment"
        size="lg"
      >
        <form className="space-y-4">
          <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
            <Avatar src={member.avatar} name={member.name} size="md" />
            <div>
              <p className="font-semibold text-dark-800">{member.name}</p>
              <p className="text-sm text-dark-500">{member.membership}</p>
            </div>
          </div>
          <div>
            <label className="label">Appointment Type</label>
            <select className="input">
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assign Trainer</label>
            <select className="input">
              <option value="">Select a trainer</option>
              {mockTrainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} - {trainer.specialization}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Duration</label>
            <select className="input">
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <textarea className="input" rows={2} placeholder="Add notes..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowAppointmentModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Schedule Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsTab;

