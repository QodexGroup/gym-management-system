import { useAuth } from '../context/AuthContext';

/**
 * Check if account can create the given resource based on usage limits.
 * @param {string} resource - One of: customers, class_schedules, membership_plans, users, pt_packages
 * @returns {{ canCreate: boolean, current: number, limit: number, message: string|null }}
 */
export function useAccountLimit(resource) {
  const { account, usage } = useAuth();

  const data = usage?.[resource];
  const current = data?.current ?? 0;
  const limit = data?.limit ?? 0;

  // Unlimited (limit 0)
  const canCreate = limit === 0 || current < limit;
  const message = canCreate
    ? null
    : `Limit reached (${current}/${limit}). Upgrade your plan to add more.`;

  return { canCreate, current, limit, message };
}
