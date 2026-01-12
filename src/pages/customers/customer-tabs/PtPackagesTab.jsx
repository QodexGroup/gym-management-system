import { useState } from 'react';
import { Badge, Modal } from '../../../components/common';
import {
  Plus,
  Dumbbell,
  Clock,
  UserCog,
  X,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Alert, Toast } from '../../../utils/alert';
import {
  CUSTOMER_PT_PACKAGE_STATUS,
  CUSTOMER_PT_PACKAGE_STATUS_LABELS,
  CUSTOMER_PT_PACKAGE_STATUS_VARIANTS,
} from '../../../constants/ptConstants';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { mockCustomerPtPackages, mockPtPackages, mockTrainers } from '../../../data/mockData';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PtPackagesTab = ({ member }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    ptPackageId: '',
    trainerId: '',
    startDate: '',
  });

  // Use mock data directly
  const [customerPackagesList, setCustomerPackagesList] = useState(
    mockCustomerPtPackages.filter(pkg => pkg.customerId === member?.id)
  );
  const isLoading = false;
  const packages = mockPtPackages;
  const coaches = mockTrainers.map(t => ({
    id: t.id,
    firstname: t.name.split(' ')[0],
    lastname: t.name.split(' ').slice(1).join(' '),
    email: t.email,
  }));

  const customerPackages = customerPackagesList;

  const handleOpenModal = () => {
    setFormData({
      ptPackageId: '',
      trainerId: '',
      startDate: '',
    });
    setShowAssignModal(true);
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setFormData({
      ptPackageId: '',
      trainerId: '',
      startDate: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ptPackage = packages.find(p => p.id === parseInt(formData.ptPackageId));
    const trainer = coaches.find(c => c.id === parseInt(formData.trainerId));

    const packageData = {
      id: customerPackagesList.length + 1,
      customerId: member.id,
      ptPackageId: parseInt(formData.ptPackageId),
      trainerId: parseInt(formData.trainerId) || null,
      startDate: formData.startDate,
      classesTotal: ptPackage?.numberOfSessions || 0,
      classesCompleted: 0,
      classesRemaining: ptPackage?.numberOfSessions || 0,
      status: 'active',
      ptPackage: ptPackage,
      trainer: trainer,
    };

    setCustomerPackagesList(prev => [...prev, packageData]);
    Toast.success('PT Package assigned successfully');
    handleCloseModal();
  };

  const handleCancelPackage = async (packageId) => {
    const result = await Alert.confirm({
      title: 'Cancel PT Package?',
      text: 'Are you sure you want to cancel this PT package?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'No',
    });

    if (!result.isConfirmed) {
      return;
    }

    setCustomerPackagesList(prev => prev.filter(pkg => pkg.id !== packageId));
    Toast.success('PT Package cancelled successfully');
  };

  // Separate active and completed packages
  const activePackages = customerPackages.filter(
    (pkg) => pkg.status === CUSTOMER_PT_PACKAGE_STATUS.ACTIVE
  );
  const completedPackages = customerPackages.filter(
    (pkg) => pkg.status === CUSTOMER_PT_PACKAGE_STATUS.COMPLETED
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-500">Loading PT packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark-50">PT Packages</h3>
        <button
          onClick={handleOpenModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Package
        </button>
      </div>

      {/* Active Packages */}
      {activePackages.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Active Packages</h4>
          <div className="space-y-4">
            {activePackages.map((customerPackage) => {
              const ptPackage = customerPackage.ptPackage;
              const trainer = customerPackage.trainer;
              const sessionsRemaining = customerPackage.classesRemaining || 0;
              const sessionsTotal = customerPackage.classesTotal || ptPackage?.numberOfSessions || 0;
              const sessionsCompleted = sessionsTotal - sessionsRemaining;
              const progressPercentage = sessionsTotal > 0 ? (sessionsCompleted / sessionsTotal) * 100 : 0;

              return (
                <div
                  key={customerPackage.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-dark-50">
                          {ptPackage?.packageName || 'Unknown Package'}
                        </h5>
                        <Badge
                          variant={CUSTOMER_PT_PACKAGE_STATUS_VARIANTS[customerPackage.status] || 'default'}
                        >
                          {CUSTOMER_PT_PACKAGE_STATUS_LABELS[customerPackage.status] || customerPackage.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm text-dark-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Assigned: {formatDate(customerPackage.startDate)}</span>
                        </div>
                        {trainer && (
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4" />
                            <span>Trainer: {trainer.firstname} {trainer.lastname}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelPackage(customerPackage.id)}
                      className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Cancel package"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-dark-300">Sessions: {sessionsRemaining}/{sessionsTotal} remaining</span>
                      <span className="text-dark-300">{Math.round(progressPercentage)}% complete</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2.5">
                      <div
                        className="bg-primary-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Session Info */}
                  {customerPackage.nextSessionDate && (
                    <div className="bg-dark-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-dark-300">
                        <Clock className="w-4 h-4" />
                        <span>
                          Next Session: {formatDate(customerPackage.nextSessionDate)}
                          {customerPackage.nextSessionTime && ` at ${customerPackage.nextSessionTime}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Packages */}
      {completedPackages.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-dark-300 mb-4">Completed Packages</h4>
          <div className="space-y-4">
            {completedPackages.map((customerPackage) => {
              const ptPackage = customerPackage.ptPackage;

              return (
                <div
                  key={customerPackage.id}
                  className="bg-dark-800 rounded-xl border border-dark-700 p-6 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-semibold text-dark-50">
                          {ptPackage?.packageName || 'Unknown Package'}
                        </h5>
                        <Badge variant="primary">
                          {CUSTOMER_PT_PACKAGE_STATUS_LABELS[customerPackage.status] || customerPackage.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-dark-300">
                        <span>Completed: {formatDate(customerPackage.completedDate || customerPackage.updatedAt)}</span>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-primary-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {customerPackages.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-400 mb-4">No PT packages assigned</p>
          <button
            onClick={handleOpenModal}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign First Package
          </button>
        </div>
      )}

      {/* Assign Package Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={handleCloseModal}
        title="Assign PT Package"
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
              {packages
                .filter((pkg) => pkg.status === 'active')
                .map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.packageName} - {formatCurrency(pkg.price)} ({pkg.numberOfSessions} sessions)
                  </option>
                ))}
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
              Assign Package
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PtPackagesTab;

