import { useState } from 'react';
import Layout from '../../layout/Layout';
import ImportWizard from './ImportWizard';
import ImportHistory from './ImportHistory';

/**
 * Import Data page — a client (customer) importer with a new-import wizard and
 * an import history tab.
 * @returns {JSX.Element}
 */
const ImportData = () => {
  const [tab, setTab] = useState('import');

  const tabs = [
    { key: 'import', label: 'Import Clients' },
    { key: 'history', label: 'Import History' },
  ];

  return (
    <Layout title="Import Data" subtitle="Bulk-import your clients from a CSV or Excel file">
      <div className="border-b border-dark-700 mb-6">
        <nav className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'import' ? <ImportWizard /> : <ImportHistory />}
    </Layout>
  );
};

export default ImportData;
