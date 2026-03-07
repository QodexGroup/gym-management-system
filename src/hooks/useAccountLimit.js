import { useAuth } from '../context/AuthContext';

/**
 * Usage and create permission for a resource. Quota limits do not block creation; trial/account status is enforced by the API.
 * @param {string} resource - One of: customers, class_schedules, membership_plans, users, pt_packages
 * @returns {{ canCreate: boolean, current: number, limit: number, message: string|null }}
 */
export function useAccountLimit(resource) {
  const { usage } = useAuth();

  const data = usage?.[resource];
  const current = data?.current ?? 0;
  const limit = data?.limit ?? 0;

  const canCreate = true;
  const message = null;

  return { canCreate, current, limit, message };
}
