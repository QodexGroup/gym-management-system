import { useEffect, useState } from 'react';
import { SectionCard } from '../../../components/common';
import { useAccountSystemSettings, useUpdateAccountSystemSettings } from '../../../shared/hooks/useAccountSystemSettings';
import {
  ACCOUNT_SYSTEM_SETTING_DEFAULTS,
  BILLING_ANCHOR,
  PLAN_CHANGE_MODE,
  GRANT_MEMBERSHIP_ON,
  GRANT_MEMBERSHIP_ON_OPTIONS,
  PROMO_UNIT_OPTIONS,
  PLAN_CHANGE_MODE_OPTIONS,
  DOWNGRADE_CREDIT_MODE_OPTIONS,
  BILLING_ANCHOR_OPTIONS,
} from '../../../shared/constants/accountSystemSettings';

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 py-3 cursor-pointer">
    <span className="flex flex-col">
      <span className="text-sm font-medium text-dark-100">{label}</span>
      {hint && <span className="text-xs text-dark-400 mt-0.5">{hint}</span>}
    </span>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-5 h-5 shrink-0 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500 cursor-pointer"
    />
  </label>
);

const Field = ({ label, hint, children }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <span className="flex flex-col">
      <span className="text-sm font-medium text-dark-100">{label}</span>
      {hint && <span className="text-xs text-dark-400 mt-0.5">{hint}</span>}
    </span>
    <div className="shrink-0">{children}</div>
  </div>
);

// Reuse the global `.input` design token; override only the width for the
// compact right-aligned settings layout.
const selectCls = 'input w-auto';
const numberCls = 'input w-24';

const renderOptions = (options) => options.map((opt) => (
  <option key={opt.value} value={opt.value}>{opt.label}</option>
));

const MembershipSettingsTab = () => {
  const { data, isLoading, isError, error } = useAccountSystemSettings();
  const updateMutation = useUpdateAccountSystemSettings();
  const [form, setForm] = useState(ACCOUNT_SYSTEM_SETTING_DEFAULTS);

  useEffect(() => {
    if (data) setForm({ ...ACCOUNT_SYSTEM_SETTING_DEFAULTS, ...data });
  }, [data]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    updateMutation.mutate({
      ...form,
      gracePeriodDays: Number(form.gracePeriodDays) || 0,
      reactivationFeeAmount: Number(form.reactivationFeeAmount) || 0,
      reactivationPromoLength: Number(form.reactivationPromoLength) || 1,
      fixedBillingDay: form.billingAnchor === BILLING_ANCHOR.FIXED_DAY ? (Number(form.fixedBillingDay) || 1) : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return <div className="card text-center py-12 text-danger-600">{error?.message || 'Failed to load settings'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
      <SectionCard title="Payments">
        <div className="divide-y divide-dark-700">
          <Field
            label="Grant membership on"
            hint={(
              <>
                When a paid renewal bill activates/extends coverage. A partial payment always grants the <strong>full</strong> period — never a half period.{' '}
                {form.grantMembershipOn === GRANT_MEMBERSHIP_ON.FULL_PAYMENT
                  ? 'Full payment: coverage waits until the bill is fully paid.'
                  : 'First payment: the first (even partial) payment extends the full period; the remainder stays as a balance.'}
              </>
            )}
          >
            <select className={selectCls} value={form.grantMembershipOn} onChange={(e) => set('grantMembershipOn')(e.target.value)}>
              {renderOptions(GRANT_MEMBERSHIP_ON_OPTIONS)}
            </select>
          </Field>
          <Toggle label="Allow partial payments" hint="When ON, staff can collect installments and leave a balance open. When OFF, every payment must settle the full remaining balance." checked={form.allowPartialPayments} onChange={set('allowPartialPayments')} />
        </div>
      </SectionCard>

      <SectionCard title="Grace & class booking">
        <div className="divide-y divide-dark-700">
          <Field
            label="Grace period (days)"
            hint={(
              <>
                Applies to <strong>group-class booking only</strong> (needs the toggle below). It does <strong>not</strong> extend the membership, delay expiry, or block gym check-in.
              </>
            )}
          >
            <input type="number" min="0" max="365" className={numberCls} value={form.gracePeriodDays} onChange={(e) => set('gracePeriodDays')(e.target.value)} />
          </Field>
          <Toggle label="Require active membership to book group classes" hint="Walk-in / facility use is always open; this only gates group-class booking." checked={form.requireMembershipForClassBooking} onChange={set('requireMembershipForClassBooking')} />
          <Toggle label="Allow class booking during grace period" hint="Let past-due members keep booking classes for the grace-period days after expiry. Off = booking stops the moment the membership expires." checked={form.allowClassBookingDuringGrace} onChange={set('allowClassBookingDuringGrace')} />
        </div>
      </SectionCard>

      <SectionCard title="Reactivation">
        <div className="divide-y divide-dark-700">
          <Toggle label="Require reactivation fee" hint="Charge a one-time fee when a lapsed member reactivates." checked={form.requireReactivationFee} onChange={set('requireReactivationFee')} />
          {form.requireReactivationFee && (
            <Field label="Reactivation fee amount">
              <input type="number" min="0" step="0.01" className={numberCls} value={form.reactivationFeeAmount} onChange={(e) => set('reactivationFeeAmount')(e.target.value)} />
            </Field>
          )}
          <Toggle
            label="Give a free/promo period on reactivation"
            hint={(
              <>
                Grant a complimentary period when a lapsed member pays a reactivation fee. This promo is granted <strong>only</strong> through the reactivation-fee flow — never on a normal renewal.
              </>
            )}
            checked={form.grantReactivationPromo}
            onChange={set('grantReactivationPromo')}
          />
          {form.grantReactivationPromo && (
            <Field label="Promo length">
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="36" className={numberCls} value={form.reactivationPromoLength} onChange={(e) => set('reactivationPromoLength')(e.target.value)} />
                <select className={selectCls} value={form.reactivationPromoUnit} onChange={(e) => set('reactivationPromoUnit')(e.target.value)}>
                  {renderOptions(PROMO_UNIT_OPTIONS)}
                </select>
              </div>
            </Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Plan change (mid-cycle)">
        <div className="divide-y divide-dark-700">
          <Field
            label="When a member changes plan"
            hint={form.planChangeMode === PLAN_CHANGE_MODE.IMMEDIATE_PRORATION
              ? 'Change now: an upgrade adds a prorated charge for the remaining days; a downgrade settles the leftover value per the option below.'
              : 'Apply at next renewal: the member keeps their current plan and paid period; the switch happens when they renew. No charge now.'}
          >
            <select className={selectCls} value={form.planChangeMode} onChange={(e) => set('planChangeMode')(e.target.value)}>
              {renderOptions(PLAN_CHANGE_MODE_OPTIONS)}
            </select>
          </Field>
          {form.planChangeMode === PLAN_CHANGE_MODE.IMMEDIATE_PRORATION && (
            <Field label="Downgrade leftover value" hint="On an immediate downgrade, what happens to the unused value of the pricier plan?">
              <select className={selectCls} value={form.downgradeCreditMode} onChange={(e) => set('downgradeCreditMode')(e.target.value)}>
                {renderOptions(DOWNGRADE_CREDIT_MODE_OPTIONS)}
              </select>
            </Field>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Manual billing">
        <div className="divide-y divide-dark-700">
          <Toggle label="Allow manual membership bills" hint="Let staff create ad-hoc membership bills." checked={form.allowManualMembershipBills} onChange={set('allowManualMembershipBills')} />
          <Toggle label="Allow paying previous-cycle bills" hint="Let staff collect outstanding balances from older cycles." checked={form.allowPayPreviousCycleBills} onChange={set('allowPayPreviousCycleBills')} />
          <Toggle label="Allow editing previous-cycle bills" hint="Let staff edit bills from a previous billing cycle (off = history is locked)." checked={form.allowEditPreviousCycleBills} onChange={set('allowEditPreviousCycleBills')} />
        </div>
      </SectionCard>

      <SectionCard title="Billing cycle">
        <div className="divide-y divide-dark-700">
          <Field
            label="Billing anchor"
            hint={(
              <>
                Bill on each member's join-date anniversary, or a fixed day of the month. Changing this only moves the <strong>date of the next automated renewal bill</strong> — it does not prorate or charge anything now.
              </>
            )}
          >
            <select className={selectCls} value={form.billingAnchor} onChange={(e) => set('billingAnchor')(e.target.value)}>
              {renderOptions(BILLING_ANCHOR_OPTIONS)}
            </select>
          </Field>
          {form.billingAnchor === BILLING_ANCHOR.FIXED_DAY && (
            <Field
              label="Billing day of month"
              hint="1–28. The next renewal moves to this day. Because the switch isn't prorated, the first aligned cycle can leave a short gap."
            >
              <input type="number" min="1" max="28" className={numberCls} value={form.fixedBillingDay} onChange={(e) => set('fixedBillingDay')(e.target.value)} />
            </Field>
          )}
        </div>
      </SectionCard>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {updateMutation.isPending ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

export default MembershipSettingsTab;
