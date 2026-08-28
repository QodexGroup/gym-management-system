import { useState } from 'react';
import { Bell, Mail } from 'lucide-react';
import { SectionCard, ToggleSwitch } from '../../../components/common';
import { useAccountSystemSettings, useUpdateAccountSystemSettings } from '../../../shared/hooks/useAccountSystemSettings';
import {
  ACCOUNT_SYSTEM_SETTING_DEFAULTS,
  NOTIFICATION_SETTING_KEYS,
  EMAIL_NOTIFICATION_SETTING_KEYS,
} from '../../../shared/constants/accountSystemSettings';

const SETTING_KEYS = [...NOTIFICATION_SETTING_KEYS, ...EMAIL_NOTIFICATION_SETTING_KEYS];

const pick = (obj, keys) => keys.reduce((out, key) => ({ ...out, [key]: obj[key] }), {});

/**
 * Notification settings — in-app alerts and member emails on one page.
 *
 * They were two tabs saving the same endpoint with the same form, which read as two
 * different features. They are one subject with two audiences, so they are one tab with
 * a card each: "In-app notifications" is what staff see inside the app, "Member emails"
 * is what gets sent out. Both groups save together.
 *
 * @returns {JSX.Element}
 */
const NotificationSettingsTab = () => {
  const { data, isLoading, isError, error } = useAccountSystemSettings();
  const updateMutation = useUpdateAccountSystemSettings();
  // Local edits overlay the server values; until the user touches a toggle,
  // the tab renders straight from the query data (no effect needed).
  const [edits, setEdits] = useState(null);
  const form = edits ?? pick({ ...ACCOUNT_SYSTEM_SETTING_DEFAULTS, ...(data || {}) }, SETTING_KEYS);

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
        <SectionCard
          title="In-app notifications"
          subtitle="Alerts your staff see in the notification bell."
          icon={Bell}
        >
          <div className="divide-y divide-dark-700">
            <ToggleSwitch
              label="Membership expiry"
              hint="Alert when memberships are expiring soon."
              checked={form.notifyMembershipExpiry}
              onChange={set('notifyMembershipExpiry')}
            />
            <ToggleSwitch
              label="Payment alerts"
              hint="Notify when a new payment is received."
              checked={form.notifyPaymentReceived}
              onChange={set('notifyPaymentReceived')}
            />
            <ToggleSwitch
              label="New registrations"
              hint="Alert when a new member signs up."
              checked={form.notifyNewRegistration}
              onChange={set('notifyNewRegistration')}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Member emails"
          subtitle="Emails sent out to your members and clients."
          icon={Mail}
        >
          <div className="divide-y divide-dark-700">
            <ToggleSwitch
              label="Enable email notifications"
              hint="Master switch for all emails sent to members/clients. When OFF, no member emails are sent regardless of the toggles below."
              checked={form.emailNotificationsEnabled}
              onChange={set('emailNotificationsEnabled')}
            />
            <ToggleSwitch
              label="Membership expiring reminder"
              hint="Email the member when their membership is about to expire."
              checked={form.emailMembershipExpiring}
              onChange={set('emailMembershipExpiring')}
              disabled={emailsOff}
            />
            <ToggleSwitch
              label="Payment confirmation"
              hint="Email the member a confirmation/receipt when their payment is recorded."
              checked={form.emailPaymentConfirmation}
              onChange={set('emailPaymentConfirmation')}
              disabled={emailsOff}
            />
            <ToggleSwitch
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

export default NotificationSettingsTab;
