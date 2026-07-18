import { useState } from 'react';
import { SectionCard } from '../../../components/common';
import { useAccountSystemSettings, useUpdateAccountSystemSettings } from '../../../shared/hooks/useAccountSystemSettings';
import {
  ACCOUNT_SYSTEM_SETTING_DEFAULTS,
  EMAIL_NOTIFICATION_SETTING_KEYS,
} from '../../../shared/constants/accountSystemSettings';

const pick = (obj, keys) => keys.reduce((out, key) => ({ ...out, [key]: obj[key] }), {});

const Toggle = ({ label, hint, checked, onChange, disabled = false }) => (
  <label className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <span className="flex flex-col">
      <span className="text-sm font-medium text-dark-100">{label}</span>
      {hint && <span className="text-xs text-dark-400 mt-0.5">{hint}</span>}
    </span>
    <input
      type="checkbox"
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-5 h-5 shrink-0 rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
    />
  </label>
);

/**
 * Email notification settings for members/clients. The master switch gates all
 * member emails; each type can also be toggled individually. These are
 * independent from the in-app alerts in the Notification Settings tab.
 */
const EmailNotificationSettingsTab = () => {
  const { data, isLoading, isError, error } = useAccountSystemSettings();
  const updateMutation = useUpdateAccountSystemSettings();
  // Local edits overlay the server values; until the user touches a toggle,
  // the tab renders straight from the query data (no effect needed).
  const [edits, setEdits] = useState(null);
  const form = edits ?? pick({ ...ACCOUNT_SYSTEM_SETTING_DEFAULTS, ...(data || {}) }, EMAIL_NOTIFICATION_SETTING_KEYS);

  const set = (key) => (value) => setEdits((prev) => ({ ...(prev ?? form), [key]: value }));

  const handleSave = () => updateMutation.mutate({ ...form }, { onSuccess: () => setEdits(null) });

  const emailsOff = !form.emailNotificationsEnabled;

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
        <SectionCard title="Member emails">
          <div className="divide-y divide-dark-700">
            <Toggle
              label="Enable email notifications"
              hint="Master switch for all emails sent to members/clients. When OFF, no member emails are sent regardless of the toggles below."
              checked={form.emailNotificationsEnabled}
              onChange={set('emailNotificationsEnabled')}
            />
            <Toggle
              label="Membership expiring reminder"
              hint="Email the member when their membership is about to expire."
              checked={form.emailMembershipExpiring}
              onChange={set('emailMembershipExpiring')}
              disabled={emailsOff}
            />
            <Toggle
              label="Payment confirmation"
              hint="Email the member a confirmation/receipt when their payment is recorded."
              checked={form.emailPaymentConfirmation}
              onChange={set('emailPaymentConfirmation')}
              disabled={emailsOff}
            />
            <Toggle
              label="Welcome email on registration"
              hint="Email a welcome message to newly registered members."
              checked={form.emailCustomerRegistration}
              onChange={set('emailCustomerRegistration')}
              disabled={emailsOff}
            />
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

export default EmailNotificationSettingsTab;
