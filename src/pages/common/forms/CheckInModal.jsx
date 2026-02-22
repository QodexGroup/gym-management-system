import { Modal, Avatar, Badge } from '../../../components/common';
import { Clock, UserCheck } from 'lucide-react';

const CheckInModal = ({ isOpen, onClose, customer, onConfirm, isSubmitting = false }) => {
  if (!customer) return null;

  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Check-In" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl">
          <Avatar src={customer.photo} name={fullName} size="xl" />
          <div>
            <h4 className="text-xl font-semibold text-dark-50">{fullName}</h4>
            {customer.currentMembership?.membershipPlan && (
              <p className="text-dark-300">{customer.currentMembership.membershipPlan.planName}</p>
            )}
            <Badge
              variant={customer.currentMembership?.status === 'active' ? 'success' : 'warning'}
              size="lg"
            >
              {customer.currentMembership?.status || 'No Membership'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-primary-500/10 border-l-4 border-primary-500 rounded-xl">
          <Clock className="w-5 h-5 text-primary-500" />
          <div>
            <p className="text-sm text-dark-400">Check-In Time</p>
            <p className="font-semibold text-dark-50">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn-success flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <UserCheck className="w-5 h-5" />
            {isSubmitting ? 'Checking In...' : 'Confirm Check-In'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CheckInModal;
