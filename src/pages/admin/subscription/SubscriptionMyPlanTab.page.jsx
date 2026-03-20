import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Users } from 'lucide-react';
import { GridDesign } from '../../../components/Grid';
import { useAuth } from '../../../context/AuthContext';
import { useSubscriptionPlans } from '../../../hooks/useSubscriptionPlans';
import { formatCurrency } from '../../../utils/formatters';
import { SUBSCRIPTION_STATUS } from '../../../constants/subscriptionConstants';
import { useCreateSubscriptionRequest } from '../../../hooks/useSubscriptionRequests';
import { Alert } from '../../../utils/alert';
import { uploadReceipt } from '../../../services/fileUploadService';
import TrialUpgradeModal from '../forms/TrialUpgradeModal';

const SubscriptionMyPlanTab = () => {
  const { account } = useAuth();

  const { data: plansData = [], isLoading: plansLoading } = useSubscriptionPlans();
  const createRequest = useCreateSubscriptionRequest();

  const activePlan = account?.activeAccountSubscriptionPlan || null;
  const isInTrial = !!activePlan && !activePlan.subscriptionStartsAt;

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReceiptFile, setUpgradeReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);

  const isTrialExpired = account?.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL_EXPIRED;
  const isActive = account?.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE;
  const isLocked = account?.subscriptionStatus === SUBSCRIPTION_STATUS.LOCKED;

  const handleSelectPlan = async (plan) => {
    if (!plan) return;

    const currentPlan = account?.subscriptionPlan || null;
    const isTrialStatus = account?.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL_EXPIRED;
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

  return (
  <div>
      <TrialUpgradeModal
        isOpen={upgradeModalOpen}
        onSubmit={handleUpgradeSubmit}
        onFileChange={(e) => setUpgradeReceiptFile(e.target.files?.[0] || null)}
        receiptFile={upgradeReceiptFile}
        uploading={uploading}
        isSubmitting={createRequest.isPending}
      />

    {/* Available Plans section */}
    <h3 className="text-lg font-semibold text-dark-50 mb-4">Available Plans</h3>
    <div className="mb-8">
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
            highlightBadge: plan.isTrial ? 'Trial' : null,
            actions: {
              onPrimary: () => handleSelectPlan(plan),
              primaryLabel: `Get ${plan.name}`,
            },
          })}
        />
      )}
    </div>

    {/* My plan summary */}
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
          <p className="text-sm text-danger-600 mt-1">
            Account locked due to unpaid invoice. Pay by the 10th to avoid lock.
          </p>
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

  </div>
  );
};

export default SubscriptionMyPlanTab;

