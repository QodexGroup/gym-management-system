import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { GridDesign } from '../../../components/Grid';
import { useAuth } from '../../../context/AuthContext';
import { useSubscriptionPlans } from '../../../hooks/useSubscriptionPlans';
import { formatCurrency } from '../../../utils/formatters';
import { formatDate } from '../../../utils/formatters';
import { ACCOUNT_STATE } from '../../../constants/accountState';
import { SUBSCRIPTION_PAYMENT_TYPE } from '../../../constants/subscriptionConstants';
import { useCreateSubscriptionRequest } from '../../../hooks/useSubscriptionRequests';
import { Alert } from '../../../utils/alert';
import { uploadReceipt } from '../../../services/fileUploadService';
import TrialUpgradeModal from '../forms/TrialUpgradeModal';

const SubscriptionMyPlanTab = () => {
  const { account } = useAuth();

  const { data: plansData = [], isLoading: plansLoading } = useSubscriptionPlans();
  const createRequest = useCreateSubscriptionRequest();

  const activePlan = account?.activeAccountSubscriptionPlan || null;
  const activePlanMeta = activePlan?.subscriptionPlan || null;
  const isInTrial = !!activePlan && !activePlan.subscriptionStartsAt;
  const trialEndsAt = activePlan?.trialEndsAt ? new Date(activePlan.trialEndsAt) : null;
  const isTrialExpired = isInTrial && !!trialEndsAt && trialEndsAt < new Date();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReceiptFile, setUpgradeReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);
  const [upgradePaymentType, setUpgradePaymentType] = useState(SUBSCRIPTION_PAYMENT_TYPE.GCASH);

  const isLocked =
    !!account?.isLocked ||
    !!activePlan?.lockedAt ||
    account?.status === ACCOUNT_STATE.DEACTIVATED;
  const isActive = !!activePlan?.subscriptionStartsAt && !isLocked;

  const paidMonthlyPlan = (plansData || []).find(
    (p) => !p?.isTrial && String(p?.interval || '').toLowerCase() === 'month'
  );
  const monthlyBasePrice = Number(paidMonthlyPlan?.price || 0);

  const getSavingsBadge = (plan) => {
    if (!plan) return null;
    if (plan.isTrial) return 'Trial';
    if (!monthlyBasePrice) return null;

    const interval = String(plan.interval || '').toLowerCase();
    const planPrice = Number(plan.price || 0);
    if (planPrice <= 0) return null;

    let intervalMonths = 1;
    if (interval === 'quarter') intervalMonths = 3;
    if (interval === 'year') intervalMonths = 12;

    const effectiveMonthly = planPrice / intervalMonths;
    const savedPct = Math.round(((monthlyBasePrice - effectiveMonthly) / monthlyBasePrice) * 100);

    return savedPct > 0 ? `Save ${savedPct}%` : null;
  };

  const handleSelectPlan = async (plan) => {
    if (!plan) return;

    const currentPlan = activePlanMeta || account?.subscriptionPlan || null;
    const isTrialStatus = isTrialExpired;
    const isUpgrade =
      currentPlan && Number(plan.price) > Number(currentPlan.price);
    const isDowngrade =
      currentPlan && Number(plan.price) < Number(currentPlan.price);

    let title = 'Change plan';
    let text = `Are you sure you want to switch to the "${plan.name}" plan?`;

    if (isTrialStatus) {
      title = 'Choose plan after trial';
      text = `Are you sure you want to start the "${plan.name}" plan after your trial ends?`;
    } else if (isUpgrade) {
      title = 'Upgrade plan';
      text = `Are you sure you want to upgrade from "${currentPlan.name}" to "${plan.name}"?`;
    } else if (isDowngrade) {
      title = 'Downgrade plan';
      text = `Are you sure you want to downgrade from "${currentPlan.name}" to "${plan.name}"?`;
    }

    const result = await Alert.confirm({
      title,
      text,
      icon: 'question',
      confirmButtonText: `Get ${plan.name}`,
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      if (isInTrial) {
        // During trial upgrade, we must upload a receipt for the standalone upgrade payment.
        setPendingUpgradePlan(plan);
        setUpgradeReceiptFile(null);
        setUpgradePaymentType(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
        setUpgradeModalOpen(true);
        return;
      }

      // Active subscription plan change: just update plan selection (next billing cycle).
      await createRequest.mutateAsync({ subscriptionPlanId: plan.id });
    } catch (error) {
      // Error toast is already handled inside the mutation
      // Just log for debugging
      console.error('Failed to create subscription request:', error);
    }
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!pendingUpgradePlan) return;
    if (!upgradeReceiptFile) {
      Alert.error('Please upload a payment receipt file.');
      return;
    }

    try {
      setUploading(true);
      const { receiptUrl, receiptFileName } = await uploadReceipt(upgradeReceiptFile, account.id);

      await createRequest.mutateAsync({
        subscriptionPlanId: pendingUpgradePlan.id,
        receiptUrl,
        receiptFileName,
        paymentType: upgradePaymentType,
      });

      setUpgradeModalOpen(false);
      setPendingUpgradePlan(null);
    } catch (err) {
      // Error toast is already handled inside the mutation
      console.error('Failed to submit trial upgrade request:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseUpgradeModal = () => {
    if (uploading || createRequest.isPending) return;
    setUpgradeModalOpen(false);
    setUpgradeReceiptFile(null);
    setPendingUpgradePlan(null);
    setUpgradePaymentType(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
  };

  const statusLabel = isActive
    ? 'Active'
    : isLocked
      ? 'Locked'
      : isTrialExpired
        ? 'Trial expired'
        : isInTrial
          ? 'Trial'
          : 'Unknown';

  const statusBadgeClass = isActive
    ? 'bg-success-500/15 text-success-400 border-success-500/30'
    : isLocked
      ? 'bg-danger-500/15 text-danger-400 border-danger-500/30'
      : isTrialExpired
        ? 'bg-warning-500/15 text-warning-400 border-warning-500/30'
        : 'bg-primary-500/15 text-primary-400 border-primary-500/30';

  return (
  <div className="space-y-8">
      <TrialUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={handleCloseUpgradeModal}
        onSubmit={handleUpgradeSubmit}
        onFileChange={(e) => setUpgradeReceiptFile(e.target.files?.[0] || null)}
        receiptFile={upgradeReceiptFile}
        uploading={uploading}
        isSubmitting={createRequest.isPending}
        paymentName={pendingUpgradePlan?.name ? `Trial Upgrade - ${pendingUpgradePlan.name}` : 'Trial Upgrade'}
        paymentAmount={pendingUpgradePlan?.price ?? 0}
        paymentType={upgradePaymentType}
        onPaymentTypeChange={setUpgradePaymentType}
      />

      <section className="rounded-xl border border-dark-700 bg-dark-800/70 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-50">Available Plans</h3>
          <span className="text-xs text-dark-400">Choose a plan that fits your gym</span>
        </div>
        {plansLoading ? (
          <p className="text-sm text-dark-400">Loading plans...</p>
        ) : (
          <GridDesign
            items={plansData || []}
            columns={3}
            renderCard={(plan) => ({
              title: plan.name,
              subtitle: `${formatCurrency(plan.price)} / ${plan.interval || 'month'}`,
              // No features / list / footer for subscription plans (not implemented yet)
              list: [],
              highlightBadge: getSavingsBadge(plan),
              actions: {
                onPrimary: () => handleSelectPlan(plan),
                primaryLabel: `Get ${plan.name}`,
              },
            })}
          />
        )}
      </section>

      <section className="rounded-xl border border-dark-700 bg-dark-800/70 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-50 mb-4">My Plan</h3>

        <div className="flex items-start gap-4">
          <div className="mt-0.5">
            {isActive ? (
              <CheckCircle className="w-8 h-8 text-success-500 flex-shrink-0" />
            ) : isLocked ? (
              <AlertCircle className="w-8 h-8 text-danger-500 flex-shrink-0" />
            ) : isTrialExpired ? (
              <AlertCircle className="w-8 h-8 text-warning-500 flex-shrink-0" />
            ) : (
              <Clock className="w-8 h-8 text-primary-500 flex-shrink-0" />
            )}
          </div>

          <div className="space-y-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass}`}>
              {statusLabel}
            </span>

            {activePlan?.planName && (
              <p className="text-primary-400 font-semibold">Plan: {activePlan.planName}</p>
            )}

            <p className="text-sm text-dark-300">
              {activePlan?.trialEndsAt && !activePlan?.subscriptionStartsAt
                ? `Trial ends: ${formatDate(activePlan.trialEndsAt)}`
                : activePlan?.subscriptionEndsAt
                  ? `Current period ends: ${formatDate(activePlan.subscriptionEndsAt)}`
                  : '7-day free trial'}
            </p>

            {isLocked && (
              <p className="text-sm text-danger-400">
                Account locked due to unpaid invoice. Pay by the 10th to avoid lock.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionMyPlanTab;

