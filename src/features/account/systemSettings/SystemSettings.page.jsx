import { useState } from 'react';
import Layout from '../../../layout/Layout';
import MembershipSettingsTab from './MembershipSettingsTab.page';

const TABS = [
  { key: 'membership', label: 'Membership Settings' },
];

const SystemSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('membership');

  return (
    <Layout title="System Settings" subtitle="Configure how your gym operates">
      <div className="mb-6 border-b border-dark-700">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'membership' && <MembershipSettingsTab />}
    </Layout>
  );
};

export default SystemSettingsPage;
