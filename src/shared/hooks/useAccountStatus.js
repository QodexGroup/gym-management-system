import { useMemo } from 'react';
import { isAdminRole, isStaffRole, isCoachRole } from '../constants/userRoles';
import { SUBSCRIPTION_STATUS } from '../constants/subscriptionConstants';
import { ACCOUNT_STATE } from '../constants/accountState';

/**
 * Derives all boolean role/account flags from raw user + account data.
 * Keeps AuthContext free of derived-state logic.
 */
export const useAccountStatus = (user, account, token) => {
  return useMemo(() => {
    const isAdmin = isAdminRole(user?.role);
    const isTrainer = isCoachRole(user?.role);
    const isStaff = isStaffRole(user?.role);
    const isAccountOwner = !!user?.isAccountOwner;
    const isPlatformAdmin = user?.role === 'platform_admin';
    const isAuthenticated = !!user && !!token;

    const activePlan = account?.activeAccountSubscriptionPlan ?? null;
    const trialEndsAt = activePlan?.trialEndsAt ? new Date(activePlan.trialEndsAt) : null;
    const subscriptionStartsAt = activePlan?.subscriptionStartsAt
      ? new Date(activePlan.subscriptionStartsAt)
      : null;

    const isTrialExpired =
      !!trialEndsAt && trialEndsAt < new Date() && !subscriptionStartsAt;

    const isLocked =
      !!account?.isLocked ||
      !!activePlan?.lockedAt ||
      account?.subscriptionStatus === SUBSCRIPTION_STATUS.LOCKED ||
      account?.status === ACCOUNT_STATE.DEACTIVATED;

    return {
      isAdmin,
      isTrainer,
      isStaff,
      isAccountOwner,
      isPlatformAdmin,
      isAuthenticated,
      isTrialExpired,
      isLocked,
    };
  }, [user, account, token]);
};
