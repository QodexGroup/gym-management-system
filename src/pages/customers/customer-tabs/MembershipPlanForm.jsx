import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMembershipPlans } from '../../../hooks/useMembershipPlans';
import { formatCurrency } from '../../../utils/formatters';

const MembershipPlanForm = ({ customerId, currentMembership, onSubmit, onCancel }) => {
  const { data: membershipPlans = [], isLoading: loadingPlans } = useMembershipPlans();
  
  const [formData, setFormData] = useState({
    membershipPlanId: currentMembership?.membershipPlanId || '',
    membershipStartDate: currentMembership?.membershipStartDate 
      ? new Date(currentMembership.membershipStartDate) 
      : new Date(),
  });

  // Get selected plan
  const selectedPlan = membershipPlans.find(
    (plan) => plan.id === parseInt(formData.membershipPlanId)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.membershipPlanId) {
      return;
    }

    const submitData = {
      membershipPlanId: parseInt(formData.membershipPlanId),
      membershipStartDate: formData.membershipStartDate.toISOString().split('T')[0],
    };

    onSubmit(submitData);
  };

  if (loadingPlans) {
    return <div className="text-center py-4">Loading membership plans...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">
          Membership Plan <span className="text-danger-500">*</span>
        </label>
        <select
          className="input"
          name="membershipPlanId"
          value={formData.membershipPlanId}
          onChange={(e) => setFormData((prev) => ({ ...prev, membershipPlanId: e.target.value }))}
          required
        >
          <option value="">Select a membership plan</option>
          {membershipPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.planName} - {formatCurrency(plan.price)} ({plan.planPeriod} {plan.planInterval})
            </option>
          ))}
        </select>
        {selectedPlan && (
          <p className="text-sm text-dark-500 mt-1">
            Price: {formatCurrency(selectedPlan.price)} | Duration: {selectedPlan.planPeriod} {selectedPlan.planInterval}
          </p>
        )}
      </div>

      <div>
        <label className="label">
          Start Date <span className="text-danger-500">*</span>
        </label>
        <DatePicker
          selected={formData.membershipStartDate}
          onChange={(date) => setFormData((prev) => ({ ...prev, membershipStartDate: date }))}
          dateFormat="yyyy-MM-dd"
          className="input w-full"
          required
        />
      </div>

      {currentMembership && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-800">
            <strong>Note:</strong> This will deactivate the current membership plan and create a new one.
            {currentMembership.membershipPlan && (
              <>
                <br />
                Current Plan: {currentMembership.membershipPlan.planName}
              </>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button type="submit" className="flex-1 btn-success" disabled={!formData.membershipPlanId}>
          {currentMembership ? 'Update Membership Plan' : 'Add Membership Plan'}
        </button>
      </div>
    </form>
  );
};

export default MembershipPlanForm;

