import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useMembershipPlans } from '../../../shared/hooks/useMembershipPlans';
import { useAccountSystemSettings } from '../../../shared/hooks/useAccountSystemSettings';
import { formatCurrency, normalizeDate } from '../../../shared/utils/formatters';
import { Alert } from '../../../shared/utils/alert';
import { PLAN_CHANGE_MODE, DOWNGRADE_CREDIT_MODE, ACCOUNT_SYSTEM_SETTING_DEFAULTS } from '../../../shared/constants/accountSystemSettings';
import { CUSTOMER_MEMBERSHIP_STATUS } from '../../../shared/constants/customerMembership';

const MembershipPlanForm = ({ customerId, currentMembership, onSubmit, onCancel, isSubmitting = false }) => {
  const { data: membershipPlans = [], isLoading: loadingPlans } = useMembershipPlans();
  const { data: membershipSettings } = useAccountSystemSettings();
  const planChangeMode = membershipSettings?.planChangeMode ?? ACCOUNT_SYSTEM_SETTING_DEFAULTS.planChangeMode;
  const downgradeCreditMode = membershipSettings?.downgradeCreditMode ?? ACCOUNT_SYSTEM_SETTING_DEFAULTS.downgradeCreditMode;

  const [formData, setFormData] = useState({
    membershipPlanId: currentMembership?.membershipPlanId || '',
    membershipStartDate: currentMembership?.membershipStartDate
      ? new Date(currentMembership.membershipStartDate)
      : new Date(),
  });

  const selectedPlan = useMemo(() => {
    return membershipPlans.find((plan) => plan.id === Number(formData.membershipPlanId));
  }, [formData.membershipPlanId, membershipPlans]);

  // A real mid-cycle plan change: active membership switching to a different plan.
  const isPlanChange = useMemo(() => {
    if (!currentMembership || !selectedPlan) return false;
    if (currentMembership.status !== CUSTOMER_MEMBERSHIP_STATUS.ACTIVE) return false;
    return Number(selectedPlan.id) !== Number(currentMembership.membershipPlanId);
  }, [currentMembership, selectedPlan]);

  const isUpgrade = isPlanChange && Number(selectedPlan?.price) > Number(currentMembership?.membershipPlan?.price ?? 0);
  const isActiveMember = currentMembership?.status === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE;
  // Re-selecting the same plan for an active member would restart their period at full price — block it.
  const isSamePlanForActiveMember = isActiveMember && !!selectedPlan && !isPlanChange;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.membershipPlanId) {
      Alert.error('Please select a membership plan');
      return;
    }

    if (isSamePlanForActiveMember) {
      Alert.error('This member is already on this plan. Pick a different plan to change it.');
      return;
    }

    const submitData = {
      membershipPlanId: Number(formData.membershipPlanId),
      membershipStartDate: normalizeDate(formData.membershipStartDate),
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

      {currentMembership?.pendingPlan && (
        <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-lg text-sm text-amber-300">
          <strong>Scheduled change:</strong> switching to <strong>{currentMembership.pendingPlan.planName}</strong> at the next renewal.
        </div>
      )}

      {isSamePlanForActiveMember && (
        <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-lg text-sm text-amber-300">
          <strong>Already on this plan.</strong> Pick a different plan to change it — re-selecting the same plan would restart the current period.
        </div>
      )}

      {isActiveMember && planChangeMode === PLAN_CHANGE_MODE.NEXT_RENEWAL && (
        <div className="p-3 bg-blue-500/10 border border-blue-400/40 rounded-lg text-sm text-blue-300">
          <strong>Applies at next renewal.</strong>{' '}
          {isPlanChange
            ? <>The member keeps <strong>{currentMembership.membershipPlan?.planName}</strong> and their current paid period; the switch to <strong>{selectedPlan?.planName}</strong> takes effect when they renew. No charge now.</>
            : 'Plan changes take effect when the member renews — they keep their current plan and paid period until then. No charge now.'}
        </div>
      )}

      {isActiveMember && planChangeMode === PLAN_CHANGE_MODE.IMMEDIATE_PRORATION && (
        <div className="p-3 bg-blue-500/10 border border-blue-400/40 rounded-lg text-sm text-blue-300">
          <strong>Applies immediately (prorated).</strong>{' '}
          {isPlanChange
            ? (isUpgrade
                ? 'A prorated charge for the remaining days will be added as a bill.'
                : downgradeCreditMode === DOWNGRADE_CREDIT_MODE.EXTEND_DAYS
                  ? 'The unused value of the current plan becomes extra days on the new plan.'
                  : 'The unused value of the current plan is forfeited.')
            : 'Switching to a different plan takes effect now, with a prorated adjustment.'}
        </div>
      )}

      {currentMembership && !isActiveMember && (
        <div className="p-3 bg-blue-500/10 border border-blue-400/40 rounded-lg text-sm text-blue-300">
          <strong>Note:</strong> This will replace the current (inactive) membership with a new one starting on the chosen date.
          {currentMembership.membershipPlan && (
            <>
              <br />
              Current Plan: <strong>{currentMembership.membershipPlan.planName}</strong>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`flex-1 ${currentMembership ? 'btn-primary' : 'btn-success'}`}
          disabled={isSubmitting || !formData.membershipPlanId || isSamePlanForActiveMember}
        >
          {isSubmitting
            ? 'Saving...'
            : currentMembership ? 'Update Membership Plan' : 'Add Membership Plan'}
        </button>
      </div>
    </form>
  );
};

export default MembershipPlanForm;
