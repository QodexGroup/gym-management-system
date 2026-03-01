import { useAuth } from '../context/AuthContext';

/**
 * Check if account can create the given resource based on usage limits.
 * @param {string} resource - One of: customers, class_schedules, membership_plans, users, pt_packages
 * @returns {{ canCreate: boolean, current: number, limit: number, message: string|null }}
 *
 * TODO (production): Re-enable limit enforcement below when account subscription limits are enforced.
 * Original logic: canCreate = limit === 0 || current < limit; message = limit reached string when !canCreate.
 */
export function useAccountLimit(resource) {
  const { account, usage } = useAuth();

  const data = usage?.[resource];
  const current = data?.current ?? 0;
  const limit = data?.limit ?? 0;

  // Limitation disabled for now — always allow create. See TODO above for re-enable.
  const canCreate = true;
  const message = null;

  return { canCreate, current, limit, message };
}
