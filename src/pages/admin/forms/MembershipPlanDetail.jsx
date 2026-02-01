
import { Check, Users, PhilippinePeso, Edit, Badge } from 'lucide-react';
import { Modal } from '../../../components/common';
import { formatCurrency } from '../../../utils/formatters';

const MembershipPlanDetail = ({ isOpen, plan, onClose, onEdit }) => {
  if (!plan) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan.name} size="lg">
      <div className="space-y-6">
        <div className="bg-primary-50 p-6 rounded-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary-600">
              {formatCurrency(plan.price)}
            </span>
            <span className="text-dark-500">
              / {plan.duration} {plan.durationUnit}
              {plan.duration > 1 ? 's' : ''}
            </span>
          </div>
          {plan.popular && <Badge variant="primary" className="mt-2">Popular</Badge>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InfoCard icon={Users} label="Active Members" value={plan.activeMembers} />
          <InfoCard
            icon={PhilippinePeso}
            label="Est. Revenue"
            value={formatCurrency(plan.price * plan.activeMembers)}
          />
        </div>

        <div>
          <h3 className="font-semibold mb-3">Features</h3>
          {plan.features.length === 0 ? (
            <p className="text-dark-500 italic">No features listed.</p>
          ) : (
            <div className="space-y-2">
              {plan.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Check className="w-4 h-4 text-success-500" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onEdit} className="flex-1 btn-secondary flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Plan
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="bg-dark-50 p-4 rounded-lg">
    <div className="flex items-center gap-2 text-dark-600 mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold text-primary-900">{value}</p>
  </div>
);

export default MembershipPlanDetail;
