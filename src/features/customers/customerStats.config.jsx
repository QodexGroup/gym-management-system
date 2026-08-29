import { Users, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

import {
  CUSTOMER_MEMBERSHIP_STATUS,
  CUSTOMER_STATUS_ALL,
} from '../../shared/constants/customerMembership';

/**
 * Resolve the number shown on a stat card, falling back to a dash while the
 * counts are still loading or the request failed.
 *
 * @param {number|undefined} count
 * @param {{ hasCounts: boolean, isLoading: boolean, isError: boolean }} state
 * @returns {number|string}
 */
const getStatValue = (count, { hasCounts, isLoading, isError }) => {
  if (hasCounts) return count ?? 0;
  return isLoading || isError ? '—' : 0;
};

/**
 * Build the client status cards for `<StatsCards>`. Each card doubles as a
 * status filter - clicking one applies it, clicking the active one clears it.
 *
 * @param {{
 *   statusCounts?: { total?: number, active?: number, expiringSoon?: number, expired?: number } | null,
 *   isLoadingStats?: boolean,
 *   isStatsError?: boolean,
 *   statusFilter: string,
 *   onSelectAll: () => void,
 *   onToggleStatus: (status: string) => void,
 * }} params
 * @returns {Array<Object>}
 */
export const customerStatsCards = ({
  statusCounts,
  isLoadingStats = false,
  isStatsError = false,
  statusFilter,
  onSelectAll,
  onToggleStatus,
}) => {
  const state = {
    hasCounts: statusCounts != null,
    isLoading: isLoadingStats,
    isError: isStatsError,
  };

  return [
    {
      title: 'Total Clients',
      value: getStatValue(statusCounts?.total, state),
      color: 'primary',
      icon: Users,
      onClick: () => onSelectAll?.(),
      active: statusFilter === CUSTOMER_STATUS_ALL,
    },
    {
      title: 'Active',
      value: getStatValue(statusCounts?.active, state),
      color: 'success',
      icon: CheckCircle,
      onClick: () => onToggleStatus?.(CUSTOMER_MEMBERSHIP_STATUS.ACTIVE),
      active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE,
    },
    {
      title: 'Expiring Soon',
      value: getStatValue(statusCounts?.expiringSoon, state),
      color: 'warning',
      icon: AlertTriangle,
      onClick: () => onToggleStatus?.(CUSTOMER_MEMBERSHIP_STATUS.EXPIRING),
      active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.EXPIRING,
    },
    {
      title: 'Expired',
      value: getStatValue(statusCounts?.expired, state),
      color: 'danger',
      icon: XCircle,
      onClick: () => onToggleStatus?.(CUSTOMER_MEMBERSHIP_STATUS.EXPIRED),
      active: statusFilter === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED,
    },
  ];
};
