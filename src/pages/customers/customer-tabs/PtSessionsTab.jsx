import { useState } from 'react';
import { Badge, Modal } from '../../../components/common';
import {
  Plus,
  Calendar,
  Clock,
  UserCog,
  X,
  Edit,
  CheckCircle,
} from 'lucide-react';
import { Alert, Toast } from '../../../utils/alert';
import { SESSION_STATUS, SESSION_STATUS_LABELS } from '../../../constants/ptConstants';
import { formatDate, formatTime } from '../../../utils/formatters';
import { mockPtSessions, mockCustomerPtPackages, mockTrainers } from '../../../data/mockData';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PtSessionsTab = ({ member }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    ptPackageId: '',
    trainerId: '',
    sessionDate: '',
    sessionTime: '',
    notes: '',
  });

  // Use mock data directly
  const [sessionsList, setSessionsList] = useState(
    mockPtSessions.filter(s => s.customerId === member?.id)
  );
  const customerPackages = mockCustomerPtPackages.filter(pkg => pkg.customerId === member?.id);
  const coaches = mockTrainers.map(t => ({
    id: t.id,
    firstname: t.name.split(' ')[0],
    lastname: t.name.split(' ').slice(1).join(' '),
    email: t.email,
  }));

  const customerSessions = sessionsList;

  // Separate upcoming and completed sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingSessions = customerSessions
    .filter((session) => {
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today && session.status === SESSION_STATUS.SCHEDULED;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.sessionDate} ${a.sessionTime}`);
      const dateB = new Date(`${b.sessionDate} ${b.sessionTime}`);
      return dateA - dateB;
    });

  const sessionHistory = customerSessions
    .filter((session) => {
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate < today || session.status !== SESSION_STATUS.SCHEDULED;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.sessionDate} ${a.sessionTime}`);
      const dateB = new Date(`${b.sessionDate} ${b.sessionTime}`);
      return dateB - dateA;
    });

  const handleOpenModal = (session = null) => {
    if (session) {
      setSelectedSession(session);
      setFormData({
        ptPackageId: session.ptPackageId?.toString() || '',
        trainerId: session.trainerId?.toString() || '',
        sessionDate: session.sessionDate || '',
        sessionTime: session.sessionTime || '',
        notes: session.notes || '',
      });
    } else {
      setSelectedSession(null);
      setFormData({
        ptPackageId: customerPackages.find((pkg) => pkg.status === 'active')?.ptPackageId?.toString() || '',
        trainerId: '',
        sessionDate: '',
        sessionTime: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setFormData({
      ptPackageId: '',
      trainerId: '',
      sessionDate: '',
      sessionTime: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerPackage = customerPackages.find(pkg => pkg.ptPackageId === parseInt(formData.ptPackageId));
    const ptPackage = customerPackage?.ptPackage;
    const trainer = coaches.find(c => c.id === parseInt(formData.trainerId));

    const sessionData = {
      id: selectedSession ? selectedSession.id : sessionsList.length + 1,
      customerId: member.id,
      ptPackageId: parseInt(formData.ptPackageId),
      trainerId: parseInt(formData.trainerId) || null,
      sessionDate: formData.sessionDate,
      sessionTime: formData.sessionTime,
      duration: ptPackage?.durationPerSession || 60,
      status: 'scheduled',
      notes: formData.notes,
      customer: member,
      ptPackage: ptPackage,
      trainer: trainer,
    };

    if (selectedSession) {
      setSessionsList(prev => prev.map(s => s.id === selectedSession.id ? sessionData : s));
      Toast.success('Session updated successfully');
    } else {
      setSessionsList(prev => [...prev, sessionData]);
      Toast.success('Session booked successfully');
    }
    handleCloseModal();
  };

  const handleCancelSession = async (sessionId) => {
    const result = await Alert.confirm({
      title: 'Cancel Session?',
      text: 'Are you sure you want to cancel this session?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) {
      return;
    }

    setSessionsList(prev => prev.filter(s => s.id !== sessionId));
    Toast.success('Session cancelled successfully');
  };

  // Get active PT packages
  const activePackages = customerPackages.filter((pkg) => pkg.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">PT Sessions</h3>
        {activePackages.length > 0 && (
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
      {upcomingSessions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Upcoming Sessions</h4>
          <div className="space-y-3">
            {upcomingSessions.map((session) => {
              const ptPackage = customerPackages.find(
                (pkg) => pkg.ptPackageId === session.ptPackageId
              )?.ptPackage;
              const trainer = coaches.find((c) => c.id === session.trainerId);

              return (
                <div
                  key={session.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-4 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-dark-50">
                          {formatDate(session.sessionDate)} at {formatTime(session.sessionTime)}
                        </h5>
                        <Badge variant="default">
                          {ptPackage?.packageName || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-dark-300">
                        {trainer && (
                          <div className="flex items-center gap-1">
                            <UserCog className="w-4 h-4" />
                            {trainer.firstname} {trainer.lastname}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {ptPackage?.durationPerSession || 60} minutes
                        </div>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-dark-400 mt-2">{session.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(session)}
                        className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit session"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancelSession(session.id)}
                        className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Cancel session"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Session History</h4>
          <div className="space-y-3">
            {sessionHistory.map((session) => {
              const ptPackage = customerPackages.find(
                (pkg) => pkg.ptPackageId === session.ptPackageId
              )?.ptPackage;
              const trainer = coaches.find((c) => c.id === session.trainerId);

              return (
                <div
                  key={session.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-dark-50">
                          {formatDate(session.sessionDate)} at {formatTime(session.sessionTime)}
                        </h5>
                        <Badge
                          variant={session.status === SESSION_STATUS.COMPLETED ? 'success' : 'default'}
                        >
                          {SESSION_STATUS_LABELS[session.status] || session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-dark-300">
                        {trainer && (
                          <div className="flex items-center gap-1">
                            <UserCog className="w-4 h-4" />
                            {trainer.firstname} {trainer.lastname}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {ptPackage?.packageName || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {customerSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-400 mb-4">No sessions scheduled</p>
          {activePackages.length > 0 && (
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Book First Session
            </button>
          )}
        </div>
      )}

      {/* Book/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedSession ? 'Edit Session' : 'Book PT Session'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">PT Package *</label>
            <select
              className="input"
              value={formData.ptPackageId}
              onChange={(e) => setFormData({ ...formData, ptPackageId: e.target.value })}
              required
            >
              <option value="">Select PT package</option>
              {activePackages.map((customerPackage) => {
                const pkg = customerPackage.ptPackage;
                return (
                  <option key={customerPackage.id} value={customerPackage.ptPackageId}>
                    {pkg?.packageName || 'Unknown'} ({customerPackage.classesRemaining || 0} remaining)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="label">Trainer (Optional)</label>
            <select
              className="input"
              value={formData.trainerId}
              onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
            >
              <option value="">No trainer assigned</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.firstname} {coach.lastname}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <DatePicker
                selected={formData.sessionDate ? new Date(formData.sessionDate) : null}
                onChange={(date) => {
                  const dateString = date ? date.toISOString().split('T')[0] : '';
                  setFormData({ ...formData, sessionDate: dateString });
                }}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select date"
                className="input w-full"
                minDate={new Date()}
                required
              />
            </div>
            <div>
              <label className="label">Time *</label>
              <input
                type="time"
                className="input"
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Add session notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {selectedSession ? 'Save Changes' : 'Book Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PtSessionsTab;

