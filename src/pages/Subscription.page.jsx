import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../services/subscriptionService';
import { uploadReceipt } from '../services/fileUploadService';
import { Toast } from '../utils/alert';
import { CreditCard, Upload, CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react';

const USAGE_LABELS = {
  customers: 'Members',
  class_schedules: 'Class schedules',
  membership_plans: 'Membership plans',
  users: 'Users',
  pt_packages: 'PT packages',
};

const Subscription = () => {
  const { user, account, usage, fetchUserData } = useAuth();
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [billingForm, setBillingForm] = useState({
    legalName: '',
    businessName: '',
    billingEmail: '',
    taxId: '',
    vatNumber: '',
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
        const [plansData, requestsData, billingData] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.getSubscriptionRequests(),
          subscriptionService.getBillingInformation().catch(() => null),
        ]);
        setPlans(plansData.filter((p) => !p.isTrial));
        setRequests(requestsData);
        setBilling(billingData);
        if (billingData) {
          setBillingForm({
            legalName: billingData.legalName ?? '',
            businessName: billingData.businessName ?? '',
            billingEmail: billingData.billingEmail ?? '',
            taxId: billingData.taxId ?? '',
            vatNumber: billingData.vatNumber ?? '',
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

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      Toast.error('Please select a plan');
      return;
    }
    if (!receiptFile) {
      Toast.error('Please upload a receipt');
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
      const reqs = await subscriptionService.getSubscriptionRequests();
      setRequests(reqs);
      fetchUserData();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequest = requests.find((r) => r.status === 'pending');
  const isTrialExpired = account?.subscriptionStatus === 'trial_expired';
  const isActive = account?.subscriptionStatus === 'active';
  const isTrial = account?.subscriptionStatus === 'trial';
  const showUpgradeForm = isTrialExpired || isTrial || !!pendingRequest;

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
      <Layout title="Subscription">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscription" subtitle="Manage your plan and billing">
      <div className="space-y-6">
        {/* Status card */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-50 mb-4">Account Status</h3>
          <div className="flex items-center gap-3">
            {isActive ? (
              <CheckCircle className="w-8 h-8 text-success-500" />
            ) : isTrialExpired ? (
              <AlertCircle className="w-8 h-8 text-warning-500" />
            ) : (
              <Clock className="w-8 h-8 text-primary-500" />
            )}
            <div>
              <p className="font-medium text-dark-100 capitalize">{account?.subscriptionStatus?.replace('_', ' ') || 'Unknown'}</p>
              <p className="text-sm text-dark-400">
                {account?.trialEndsAt && !isActive
                  ? `Trial ends: ${new Date(account.trialEndsAt).toLocaleDateString()}`
                  : account?.currentPeriodEndsAt
                    ? `Current period ends: ${new Date(account.currentPeriodEndsAt).toLocaleDateString()}`
                    : '7-day free trial'}
              </p>
            </div>
          </div>
        </div>

        {/* Billing information (account owner) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-50 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-500" />
            Billing Information
          </h3>
          <p className="text-sm text-dark-400 mb-4">
            Used for invoices and compliance. Optional.
          </p>
          <form onSubmit={handleSaveBilling} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-dark-300 mb-1">Business name</label>
                <input
                  type="text"
                  value={billingForm.businessName}
                  onChange={(e) => handleBillingChange('businessName', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="Company or gym name"
                />
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={billingForm.taxId}
                  onChange={(e) => handleBillingChange('taxId', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="e.g. TIN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">VAT number</label>
                <input
                  type="text"
                  value={billingForm.vatNumber}
                  onChange={(e) => handleBillingChange('vatNumber', e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-dark-100"
                  placeholder="Optional"
                />
              </div>
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

        {/* TODO (production): Usage block — uncomment when re-enabling insert limits in useAccountLimit. Shows current/limit per resource (members, class schedules, etc.). */}
        {/* {usage && (
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">Usage</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.entries(usage).map(([key, { current, limit }]) => (
                <div key={key} className="bg-dark-700 rounded-lg p-3">
                  <p className="text-xs text-dark-400 uppercase">{USAGE_LABELS[key] || key}</p>
                  <p className="text-lg font-semibold text-dark-100">
                    {current} {limit > 0 ? `/ ${limit}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Request form - when trial expired, on trial (upgrade), or pending request */}
        {showUpgradeForm && (
          <div className="card">
            <h3 className="text-lg font-semibold text-dark-50 mb-4">
              {pendingRequest ? 'Pending Request' : isTrialExpired ? 'Request Subscription' : 'Upgrade plan'}
            </h3>
            {pendingRequest ? (
              <p className="text-dark-300">
                Your subscription request is pending approval. We will notify you once it is approved.
              </p>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4 max-w-md">
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
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg cursor-pointer hover:bg-dark-600">
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

        {/* Plans list */}
        <div className="card">
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
    </Layout>
  );
};

export default Subscription;
