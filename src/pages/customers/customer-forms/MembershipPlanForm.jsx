import { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMembershipPlans } from '../../../hooks/useMembershipPlans';
import { formatCurrency } from '../../../utils/formatters';
import { Alert } from '../../../utils/alert';

const MembershipPlanForm = ({ customerId, currentMembership, onSubmit, onCancel }) => {
  const { data: membershipPlans = [], isLoading: loadingPlans } = useMembershipPlans();

  const [formData, setFormData] = useState({
    membershipPlanId: currentMembership?.membershipPlanId || '',
    membershipStartDate: currentMembership?.membershipStartDate
      ? new Date(currentMembership.membershipStartDate)
      : new Date(),
  });

  // Get selected plan details
  const selectedPlan = useMemo(() => {
    return membershipPlans.find((plan) => plan.id === Number(formData.membershipPlanId));
  }, [formData.membershipPlanId, membershipPlans]);

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.membershipPlanId) {
      Alert.error('Please select a membership plan');
      return;
    }

    const submitData = {
      membershipPlanId: Number(formData.membershipPlanId),
      membershipStartDate: formData.membershipStartDate.toISOString().split('T')[0],
    };

    onSubmit(submitData);
  };

  if (loadingPlans) {
    return (
      <div className="text-center py-6 text-dark-400">
        Loading membership plans...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Membership Plan */}
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
          <div className="mt-1 text-xs text-dark-400">
            Price: <strong>{formatCurrency(selectedPlan.price)}</strong> | Duration: <strong>{selectedPlan.planPeriod} {selectedPlan.planInterval}</strong>
          </div>
        )}
      </div>

      {/* Start Date */}
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
          minDate={new Date()}
        />
      </div>

      {/* Warning for replacing current membership */}
      {currentMembership && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Note:</strong> This will deactivate the current membership plan and create a new one.
          {currentMembership.membershipPlan && (
            <>
              <br />
              Current Plan: <strong>{currentMembership.membershipPlan.planName}</strong>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`flex-1 ${currentMembership ? 'btn-primary' : 'btn-success'}`}
          disabled={!formData.membershipPlanId}
        >
          {currentMembership ? 'Update Membership Plan' : 'Add Membership Plan'}
        </button>
      </div>
    </form>
  );
};

export default MembershipPlanForm;
