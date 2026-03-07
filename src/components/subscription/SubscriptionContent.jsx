import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionService } from '../../services/subscriptionService';
import { uploadReceipt } from '../../services/fileUploadService';
import { getFileUrl } from '../../services/firebaseUrlService';
import DataTable from '../DataTable';
import { Toast } from '../../utils/alert';
import { CreditCard, Upload, CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react';

const PAGE_SIZE = 20;

const TABS = [
  { key: 'billing', label: 'Account/Billing Info' },
  { key: 'plans', label: 'Plans' },
  { key: 'my-plan', label: 'My Plan' },
  { key: 'payments', label: 'Payments' },
];

export default function SubscriptionContent({ defaultTab = 'my-plan' }) {
  const { user, account, fetchUserData } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [invoicePage, setInvoicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [billingForm, setBillingForm] = useState({
    legalName: '',
    billingEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
  });
  const accountId = user?.accountId ?? account?.id;

  useEffect(() => {
    const load = async () => {
      try {
        await fetchUserData();
        const [plansData, billingData] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getBillingInformation().catch(() => null),
        ]);
        setPlans(plansData.filter((p) => !p.isTrial));
        setBilling(billingData);
        if (billingData) {
          setBillingForm({
            legalName: billingData.legalName ?? '',
            billingEmail: billingData.billingEmail ?? '',
            addressLine1: billingData.addressLine1 ?? '',
            addressLine2: billingData.addressLine2 ?? '',
            city: billingData.city ?? '',
            stateProvince: billingData.stateProvince ?? '',
            postalCode: billingData.postalCode ?? '',
            country: billingData.country ?? '',
          });
        }
      } catch (err) {
        Toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setHistoryLoading(true);
        const requestsData = await subscriptionService.getSubscriptionRequests({
          dateFrom: historyDateFrom || undefined,
          dateTo: historyDateTo || undefined,
        });
        setRequests(requestsData);
      } catch (err) {
        Toast.error(err.message);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadRequests();
  }, [historyDateFrom, historyDateTo]);

  const pendingRequest = requests.find((r) => r.status === 'pending');
  const sortedPaymentRows = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const isTrialExpired = account?.subscriptionStatus === 'trial_expired';
  const isActive = account?.subscriptionStatus === 'active';
  const isTrial = account?.subscriptionStatus === 'trial';
  const isLocked = account?.subscriptionStatus === 'locked';
  const showUpgradeForm = isTrialExpired || isTrial || !!pendingRequest;

  const formatMoney = (value) => {
    const amount = Number(value || 0);
    if (Number.isNaN(amount)) return '0.00';
    return amount.toFixed(2);
  };

  const formatStatusLabel = (value) => {
    if (!value) return 'Unknown';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  };

  const getRequestStatusBadgeClass = (status) => {
    if (status === 'approved') return 'bg-success-500 text-white';
    if (status === 'rejected') return 'bg-danger-500 text-white';
    return 'bg-warning-500 text-white';
    };

  useEffect(() => {
    setInvoicePage(1);
    setPaymentPage(1);
  }, [historySearch, historyDateFrom, historyDateTo]);

  const matchesHistorySearch = (row) => {
    if (!historySearch.trim()) return true;
    const keyword = historySearch.trim().toLowerCase();
    const searchable = [
      row.invoiceNumber,
      row.billingPeriod,
      row.status,
      row.receiptFileName,
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '',
      formatMoney(row.invoiceDetails?.amount),
    ].join(' ').toLowerCase();
    return searchable.includes(keyword);
  };

  const filteredHistoryRows = sortedPaymentRows.filter((row) => matchesHistorySearch(row));
  const totalInvoicePages = Math.max(1, Math.ceil(filteredHistoryRows.length / PAGE_SIZE));
  const totalPaymentPages = Math.max(1, Math.ceil(filteredHistoryRows.length / PAGE_SIZE));
  const safeInvoicePage = Math.min(invoicePage, totalInvoicePages);
  const safePaymentPage = Math.min(paymentPage, totalPaymentPages);
  const invoiceRows = filteredHistoryRows.slice((safeInvoicePage - 1) * PAGE_SIZE, safeInvoicePage * PAGE_SIZE);
  const paymentRows = filteredHistoryRows.slice((safePaymentPage - 1) * PAGE_SIZE, safePaymentPage * PAGE_SIZE);

  const openReceipt = async (receiptUrl) => {
    if (!receiptUrl) return;
    try {
      const fileUrl = await getFileUrl(receiptUrl);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      Toast.error(err.message || 'Failed to open receipt');
    }
  };

  const subscriptionInvoiceColumns = [
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row) => row.invoiceNumber || '-',
    },
    {
      key: 'billingPeriod',
      label: 'Billing Period',
      render: (row) => row.billingPeriod || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `P${formatMoney(row.invoiceDetails?.amount)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestStatusBadgeClass(row.status)}`}>
          {formatStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (row) => (
        row.receiptUrl ? (
          <button
            type="button"
            onClick={() => openReceipt(row.receiptUrl)}
            className="text-primary-500 hover:text-primary-400 underline"
          >
            {row.receiptFileName || 'View Receipt'}
          </button>
        ) : (
          <span className="text-dark-400">-</span>
        )
      ),
    },
  ];

  const subscriptionPaymentColumns = [
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row) => row.invoiceNumber || '-',
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `P${formatMoney(row.invoiceDetails?.amount)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestStatusBadgeClass(row.status)}`}>
          {formatStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (row) => (
        row.receiptUrl ? (
          <button
            type="button"
            onClick={() => openReceipt(row.receiptUrl)}
            className="text-primary-500 hover:text-primary-400 underline"
          >
            {row.receiptFileName || 'View Receipt'}
          </button>
        ) : (
          <span className="text-dark-400">-</span>
        )
      ),
    },
  ];

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedPlanId || !receiptFile) {
      Toast.error('Please select a plan and upload a receipt');
      return;
    }
    setSubmitting(true);
    try {
      const { receiptUrl, receiptFileName } = await uploadReceipt(receiptFile, accountId);
      await subscriptionService.createSubscriptionRequest({
        subscriptionPlanId: selectedPlanId,
        receiptUrl,
        receiptFileName,
      });
      Toast.success('Subscription request submitted. Pending admin approval.');
      setReceiptFile(null);
      setSelectedPlanId(null);
      const reqs = await subscriptionService.getSubscriptionRequests({
        dateFrom: historyDateFrom || undefined,
        dateTo: historyDateTo || undefined,
      });
      setRequests(reqs);
      fetchUserData();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBillingChange = (field, value) => {
    setBillingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      const data = await subscriptionService.updateBillingInformation(billingForm);
      setBilling(data);
      Toast.success('Billing information saved.');
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSavingBilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-dark-200 pb-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
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
        {activeTab === 'billing' && (
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              Billing Information
            </h3>
            <p className="text-sm text-dark-400 mb-4">Used for invoices. Optional.</p>
            <form onSubmit={handleSaveBilling} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Legal name</label>
                <input
                  type="text"
                  value={billingForm.legalName}
                  onChange={(e) => handleBillingChange('legalName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="Full legal name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Billing email</label>
                <input
                  type="email"
                  value={billingForm.billingEmail}
                  onChange={(e) => handleBillingChange('billingEmail', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="billing@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Address line 1</label>
                <input
                  type="text"
                  value={billingForm.addressLine1}
                  onChange={(e) => handleBillingChange('addressLine1', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="Street, building"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Address line 2</label>
                <input
                  type="text"
                  value={billingForm.addressLine2}
                  onChange={(e) => handleBillingChange('addressLine2', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="Unit, suite (optional)"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">City</label>
                  <input
                    type="text"
                    value={billingForm.city}
                    onChange={(e) => handleBillingChange('city', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={billingForm.stateProvince}
                    onChange={(e) => handleBillingChange('stateProvince', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                    placeholder="State or province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Postal code</label>
                  <input
                    type="text"
                    value={billingForm.postalCode}
                    onChange={(e) => handleBillingChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                    placeholder="ZIP / Postal code"
                  />
                </div>
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-dark-300 mb-1">Country (code)</label>
                <input
                  type="text"
                  value={billingForm.country}
                  onChange={(e) => handleBillingChange('country', e.target.value.toUpperCase().slice(0, 2))}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="e.g. PH"
                  maxLength={2}
                />
              </div>
              <button
                type="submit"
                disabled={savingBilling}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingBilling ? 'Saving...' : 'Save billing information'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="space-y-6">
            {showUpgradeForm && (
              <div>
                <h3 className="text-lg font-semibold text-dark-50 mb-4">
                  {pendingRequest ? 'Pending Request' : isTrialExpired ? 'Request Subscription' : 'Upgrade plan'}
                </h3>
                {pendingRequest ? (
                  <p className="text-dark-300">
                    Your subscription request is pending approval. We will notify you once it is approved.
                  </p>
                ) : (
                  <form onSubmit={handleSubmitRequest} className="space-y-4 max-w-md mb-6">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Select Plan</label>
                      <select
                        value={selectedPlanId || ''}
                        onChange={(e) => setSelectedPlanId(Number(e.target.value) || null)}
                        className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                      >
                        <option value="">-- Choose plan --</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - ₱{p.price}/{p.interval || 'month'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Upload Receipt</label>
                      <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg cursor-pointer hover:bg-dark-600 w-fit">
                        <Upload className="w-4 h-4" />
                        <span>{receiptFile ? receiptFile.name : 'Choose file (PDF, image)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !selectedPlanId || !receiptFile}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                )}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-dark-50 mb-4">Available Plans</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-dark-600 rounded-lg p-4 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-primary-500" />
                      <span className="font-semibold text-dark-100">{plan.name}</span>
                    </div>
                    <p className="text-2xl font-bold text-primary-400 mb-2">
                      ₱{plan.price}
                      <span className="text-sm font-normal text-dark-400">/{plan.interval || 'month'}</span>
                    </p>
                    <ul className="text-sm text-dark-300 space-y-1 flex-1">
                      {plan.maxCustomers > 0 && <li>Up to {plan.maxCustomers} members</li>}
                      {plan.maxCustomers === 0 && <li>Unlimited members</li>}
                      {plan.maxClassSchedules > 0 && <li>{plan.maxClassSchedules} class schedules</li>}
                      {plan.maxUsers > 0 && <li>{plan.maxUsers} users</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-plan' && (
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-4">My Plan</h3>
            <div className="flex items-center gap-3">
              {isActive ? (
                <CheckCircle className="w-8 h-8 text-success-500 flex-shrink-0" />
              ) : isLocked ? (
                <AlertCircle className="w-8 h-8 text-danger-500 flex-shrink-0" />
              ) : isTrialExpired ? (
                <AlertCircle className="w-8 h-8 text-warning-500 flex-shrink-0" />
              ) : (
                <Clock className="w-8 h-8 text-primary-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-dark-100 capitalize">
                  {account?.subscriptionStatus?.replace('_', ' ') || 'Unknown'}
                </p>
                {isLocked && (
                  <p className="text-sm text-danger-600 mt-1">Account locked due to unpaid invoice. Pay by the 10th to avoid lock.</p>
                )}
                {isActive && account?.subscriptionPlan?.name && (
                  <p className="text-primary-600 font-semibold mt-1">Plan: {account.subscriptionPlan.name}</p>
                )}
                <p className="text-sm text-dark-400 mt-1">
                  {account?.trialEndsAt && !isActive
                    ? `Trial ends: ${new Date(account.trialEndsAt).toLocaleDateString()}`
                    : account?.currentPeriodEndsAt
                      ? `Current period ends: ${new Date(account.currentPeriodEndsAt).toLocaleDateString()}`
                      : '7-day free trial'}
                </p>
              </div>
            </div>

            <div className="mt-6 border border-dark-200 rounded-lg p-4">
              <h4 className="text-base font-semibold text-dark-100 mb-3">Invoices</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search invoice, status, receipt"
                  className="md:col-span-2 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                />
                <input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                />
                <input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                  className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                />
              </div>
              <DataTable
                columns={subscriptionInvoiceColumns}
                data={invoiceRows}
                loading={loading || historyLoading}
                emptyMessage="No invoices yet."
              />
              {filteredHistoryRows.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-dark-400">
                    Showing {(safeInvoicePage - 1) * PAGE_SIZE + 1}
                    -
                    {Math.min(safeInvoicePage * PAGE_SIZE, filteredHistoryRows.length)} of {filteredHistoryRows.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoicePage((prev) => Math.max(1, prev - 1))}
                      disabled={safeInvoicePage <= 1}
                      className="px-3 py-1.5 rounded border border-dark-300 text-sm text-dark-500 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-dark-500">
                      Page {safeInvoicePage} / {totalInvoicePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInvoicePage((prev) => Math.min(totalInvoicePages, prev + 1))}
                      disabled={safeInvoicePage >= totalInvoicePages}
                      className="px-3 py-1.5 rounded border border-dark-300 text-sm text-dark-500 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Payment History</h3>
            <p className="text-sm text-dark-400 mb-4">Payment and invoice history from your subscription requests.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search invoice, status, receipt"
                className="md:col-span-2 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              />
              <input
                type="date"
                value={historyDateFrom}
                onChange={(e) => setHistoryDateFrom(e.target.value)}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              />
              <input
                type="date"
                value={historyDateTo}
                onChange={(e) => setHistoryDateTo(e.target.value)}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
              />
            </div>
            <DataTable
              columns={subscriptionPaymentColumns}
              data={paymentRows}
              loading={loading || historyLoading}
              emptyMessage="No payment history yet."
            />
            {filteredHistoryRows.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-dark-400">
                  Showing {(safePaymentPage - 1) * PAGE_SIZE + 1}
                  -
                  {Math.min(safePaymentPage * PAGE_SIZE, filteredHistoryRows.length)} of {filteredHistoryRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePaymentPage <= 1}
                    className="px-3 py-1.5 rounded border border-dark-300 text-sm text-dark-500 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-dark-500">
                    Page {safePaymentPage} / {totalPaymentPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaymentPage((prev) => Math.min(totalPaymentPages, prev + 1))}
                    disabled={safePaymentPage >= totalPaymentPages}
                    className="px-3 py-1.5 rounded border border-dark-300 text-sm text-dark-500 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
