import { useState } from 'react';
import Layout from '../../../components/layout/Layout';
import SubscriptionBillingTab from './SubscriptionBillingTab.page';
import SubscriptionMyPlanTab from './SubscriptionMyPlanTab.page';
import SubscriptionInvoicesTab from './SubscriptionInvoicesTab.page';
import SubscriptionPaymentsTab from './SubscriptionPaymentsTab.page';
import { useSearchParams } from 'react-router-dom';

const subscriptionTabs = [
  { key: 'billing', label: 'Account/Billing Info', component: SubscriptionBillingTab },
  { key: 'my-plan', label: 'Available Plan & My Plan', component: SubscriptionMyPlanTab },
  { key: 'invoices', label: 'Invoices', component: SubscriptionInvoicesTab },
  { key: 'payments', label: 'Payment History', component: SubscriptionPaymentsTab },
];


export const SubscriptionSection = ({ defaultTab = 'my-plan' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'my-plan';
  const ActiveTabComponent = subscriptionTabs.find((t) => t.key === activeTab)?.component;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-dark-200 pb-2 overflow-x-auto">
        {subscriptionTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSearchParams({ tab: tab.key })}
            className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-primary-500 text-white' : 'text-dark-500 hover:bg-dark-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="card min-h-[280px]">
        {ActiveTabComponent && <ActiveTabComponent />}
      </div>
    </div>
  );
};

const AdminSubscriptionPage = ({ defaultTab = 'my-plan' }) => (
  <Layout title="Subscription" subtitle="Manage your plan and billing">
    <SubscriptionSection defaultTab={defaultTab} />
  </Layout>
);

export default AdminSubscriptionPage;

