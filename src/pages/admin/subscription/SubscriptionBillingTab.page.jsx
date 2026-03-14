import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useSubscriptionBilling } from '../../../hooks/useSubscriptionBilling';
import AccountBillingForm from '../forms/AccountBillingForm';

const SubscriptionBillingTab = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: billing, isLoading } = useSubscriptionBilling();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-dark-50 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" />
          Billing Information
        </h3>
        <button
          type="button"
          className="btn-secondary px-6 py-2.5 text-sm font-semibold"
          onClick={() => setShowModal(true)}
        >
          Edit Billing Info
        </button>
      </div>
      <p className="text-sm text-dark-400 mb-5">
        Used for invoices and official receipts. This doesn&apos;t affect how your gym appears to
        members.
      </p>

      <div className="bg-dark-800/70 border border-dark-700 rounded-2xl px-6 py-6 md:px-8 md:py-7 flex flex-col gap-8">
        <div className="flex-1 space-y-6">
          {/* Contact info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-dark-400 mb-1">Legal name</p>
              <p className="text-sm text-dark-100">
                {billing?.billingName || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-400 mb-1">Billing email</p>
              <p className="text-sm text-dark-100">
                {billing?.billingEmail || 'Not set'}
              </p>
            </div>
          </div>

          {/* Address info */}
          <div>
            <div className="space-y-4">
              {/* Address + Country side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-dark-400 mb-1">Address</p>
                  <p className="text-base font-medium text-dark-50">
                    {billing?.billingAddress ? billing.billingAddress : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Country</p>
                  <p className="text-base font-medium text-dark-50">
                    {billing?.billingCountry || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-dark-400 mb-1">City</p>
                  <p className="text-sm text-dark-100">
                    {billing?.billingCity || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">State / Province</p>
                  <p className="text-sm text-dark-100">
                    {billing?.billingProvince || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 mb-1">Postal code</p>
                  <p className="text-sm text-dark-100">
                    {billing?.billingZip || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccountBillingForm
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialBilling={billing}
      />
    </div>
  );
};

export default SubscriptionBillingTab;

