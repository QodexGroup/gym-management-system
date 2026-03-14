import { useEffect, useState } from 'react';
import { Modal } from '../../../components/common';
import { useUpdateSubscriptionBilling } from '../../../hooks/useSubscriptionBilling';
import {
  createEmptySubscriptionBilling,
  mapSubscriptionBillingToForm,
  mapSubscriptionBillingFormToPayload,
} from '../../../models/subscriptionBillingModel';

const AccountBillingForm = ({ isOpen, onClose, initialBilling, onSaved }) => {
  const [form, setForm] = useState(createEmptySubscriptionBilling());
  const updateMutation = useUpdateSubscriptionBilling();

  useEffect(() => {
    if (isOpen) {
      setForm(mapSubscriptionBillingToForm(initialBilling));
    }
  }, [isOpen, initialBilling]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = mapSubscriptionBillingFormToPayload(form, initialBilling);

    updateMutation.mutate(payload, {
      onSuccess: (data) => {
        onSaved?.(data);
        onClose?.();
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Billing Information"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Legal name</label>
          <input
            type="text"
            value={form.legalName}
            onChange={(e) => handleChange('legalName', e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
            placeholder="Full legal name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Billing email</label>
          <input
            type="email"
            value={form.billingEmail}
            onChange={(e) => handleChange('billingEmail', e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
            placeholder="billing@example.com"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-dark-300 mb-1">Address line</label>
            <input
              type="text"
              value={form.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              placeholder="Street, building"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Country (code)</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value.toUpperCase().slice(0, 2))}
              className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              placeholder="e.g. PH"
              maxLength={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">State / Province</label>
            <input
              type="text"
              value={form.stateProvince}
              onChange={(e) => handleChange('stateProvince', e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              placeholder="State or province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Postal code</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              placeholder="ZIP / Postal code"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save billing information'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountBillingForm;

