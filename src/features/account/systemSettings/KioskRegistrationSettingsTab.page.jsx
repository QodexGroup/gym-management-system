import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, UserPlus } from 'lucide-react';
import DataTable from '../../../components/DataTable';
import { Pagination, SectionCard, ToggleSwitch } from '../../../components/common';
import { useAuth } from '../../../shared/context/AuthContext';
import { useCustomers } from '../../../shared/hooks/useCustomers';
import {
  useAccountSystemSettings,
  useUpdateAccountSystemSettings,
} from '../../../shared/hooks/useAccountSystemSettings';
import {
  ACCOUNT_SYSTEM_SETTING_DEFAULTS,
  KIOSK_REGISTRATION_SETTING_KEYS,
} from '../../../shared/constants/accountSystemSettings';
import { CUSTOMER_REGISTRATION_SOURCE } from '../../../shared/constants/customerRegistrationSource';
import PublicLinkCard from './PublicLinkCard';
import { getKioskRegistrationColumns } from './kioskRegistrationTable.config';

const PAGE_SIZE = 10;

/**
 * Reduce an object to the given keys.
 *
 * @param {Object} source
 * @param {string[]} keys
 * @returns {Object}
 */
const pick = (source, keys) => keys.reduce((out, key) => ({ ...out, [key]: source[key] }), {});

/**
 * Kiosk membership registration settings.
 *
 * Controls the public /join/{publicCode} link: whether it is live, which
 * optional fields members must complete, and the copy shown to them. Also
 * lists everyone who has registered through it — public submissions are
 * written straight into the member list with no approval step, so this is the
 * only place they surface as a group.
 *
 * Saves only its own subset of the account settings, like the sibling tabs.
 *
 * @returns {JSX.Element}
 */
const KioskRegistrationSettingsTab = () => {
  const navigate = useNavigate();
  const { account } = useAuth();

  const { data, isLoading, isError, error } = useAccountSystemSettings();
  const updateMutation = useUpdateAccountSystemSettings();

  const [edits, setEdits] = useState(null);
  const [page, setPage] = useState(1);

  const form = edits ?? pick(
    { ...ACCOUNT_SYSTEM_SETTING_DEFAULTS, ...(data || {}) },
    KIOSK_REGISTRATION_SETTING_KEYS
  );

  const { data: registrations, isLoading: loadingRegistrations } = useCustomers(page, {
    pagelimit: PAGE_SIZE,
    filters: { registration_source: CUSTOMER_REGISTRATION_SOURCE.PUBLIC },
    sorts: [{ field: 'created_at', direction: 'desc' }],
  });

  /**
   * Curried setter for one settings field.
   *
   * @param {string} key
   * @returns {(value: *) => void}
   */
  const set = (key) => (value) => setEdits((previous) => ({ ...(previous ?? form), [key]: value }));

  /**
   * Persist this tab's settings.
   *
   * @returns {void}
   */
  const handleSave = () => updateMutation.mutate({ ...form }, { onSuccess: () => setEdits(null) });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card text-center py-12 text-danger-600">
        {error?.message || 'Failed to load settings'}
      </div>
    );
  }

  const pagination = registrations?.pagination;

  return (
    <div className="space-y-6">
      <SectionCard title="Public registration" icon={UserPlus}>
        <div className="divide-y divide-dark-700">
          <ToggleSwitch
            label="Enable public registration"
            hint="When off, the link below shows a 'not available' page. This is the only way to switch the link off."
            checked={form.kioskRegistrationEnabled}
            onChange={set('kioskRegistrationEnabled')}
          />
        </div>
      </SectionCard>

      <PublicLinkCard
        publicCode={account?.publicCode}
        isEnabled={!!form.kioskRegistrationEnabled}
        gymName={account?.accountName || 'gym'}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <SectionCard
          title="Required fields"
          subtitle="Name, birthday and mobile number are always required."
          icon={SlidersHorizontal}
        >
          <div className="divide-y divide-dark-700">
            <ToggleSwitch
              label="Require email"
              hint="Needed if you want to email receipts and expiry reminders."
              checked={form.kioskRegistrationRequireEmail}
              onChange={set('kioskRegistrationRequireEmail')}
            />
            <ToggleSwitch
              label="Require address"
              checked={form.kioskRegistrationRequireAddress}
              onChange={set('kioskRegistrationRequireAddress')}
            />
            <ToggleSwitch
              label="Require emergency contact"
              hint="Asks for a contact name and number."
              checked={form.kioskRegistrationRequireEmergencyContact}
              onChange={set('kioskRegistrationRequireEmergencyContact')}
            />
          </div>
        </SectionCard>

        <SectionCard title="Page wording" subtitle="Leave blank to use the default text.">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="kiosk-welcome-text">Welcome message</label>
              <textarea
                id="kiosk-welcome-text"
                rows="3"
                maxLength={500}
                className="input w-full"
                placeholder="Fill in your details below, then show this to the front desk when you arrive."
                value={form.kioskRegistrationWelcomeText || ''}
                onChange={(event) => set('kioskRegistrationWelcomeText')(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="kiosk-success-text">Confirmation message</label>
              <textarea
                id="kiosk-success-text"
                rows="3"
                maxLength={500}
                className="input w-full"
                placeholder="Please visit the front desk to finish setting up your membership."
                value={form.kioskRegistrationSuccessText || ''}
                onChange={(event) => set('kioskRegistrationSuccessText')(event.target.value)}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      <SectionCard
        title="Registered through the link"
        subtitle="These profiles were created by members themselves and have not been reviewed by staff."
        noPadding
      >
        <DataTable
          columns={getKioskRegistrationColumns()}
          data={registrations?.data || []}
          loading={loadingRegistrations}
          onRowClick={(customer) => navigate(`/members/${customer.id}`)}
          emptyMessage="No one has registered through the link yet."
        />
        {pagination && pagination.lastPage > 1 && (
          <Pagination
            currentPage={page}
            lastPage={pagination.lastPage}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
          />
        )}
      </SectionCard>
    </div>
  );
};

export default KioskRegistrationSettingsTab;
