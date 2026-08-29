export const CUSTOMER_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
  EXPIRED: 'expired',
  // Not a stored status: a derived view of an active membership that is close
  // to its end date. Mirrors CustomerMembershipConstant::STATUS_EXPIRING.
  EXPIRING: 'expiring',
};

/**
 * Sentinel for "no status filter applied" on the client list. Not a stored
 * membership status - it just means every status is included.
 */
export const CUSTOMER_STATUS_ALL = 'all';

/**
 * How many days ahead a membership counts as "expiring soon".
 * Must match CustomerMembershipConstant::EXPIRING_SOON_DAYS on the API, which
 * is what the server-side filter and the stat cards are computed from.
 */
export const EXPIRING_SOON_DAYS = 7;

/**
 * Options for the client list status filter. `all` is rendered by
 * SearchAndFilter itself, so it is not listed here.
 */
export const CUSTOMER_STATUS_FILTER_OPTIONS = [
  { id: CUSTOMER_MEMBERSHIP_STATUS.ACTIVE, label: 'Active' },
  { id: CUSTOMER_MEMBERSHIP_STATUS.EXPIRING, label: 'Expiring Soon' },
  { id: CUSTOMER_MEMBERSHIP_STATUS.EXPIRED, label: 'Expired' },
];

export const CUSTOMER_STATUS_FILTER_VALUES = CUSTOMER_STATUS_FILTER_OPTIONS.map((option) => option.id);

/**
 * Derive the status shown on a client's membership badge.
 * Kept in step with CustomerRepository::membershipStatusCondition() so a row's
 * badge always agrees with the filter that returned it.
 *
 * @param {Object} customer
 * @returns {'active'|'expiring'|'expired'|'deactivated'|null}
 */
export const getCustomerMembershipDisplayStatus = (customer) => {
  const membership = customer?.currentMembership;
  if (!membership) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = membership.membershipEndDate ? new Date(membership.membershipEndDate) : null;
  if (endDate) endDate.setHours(0, 0, 0, 0);

  if (membership.status === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED || (endDate && endDate < today)) {
    return CUSTOMER_MEMBERSHIP_STATUS.EXPIRED;
  }

  if (membership.status !== CUSTOMER_MEMBERSHIP_STATUS.ACTIVE) {
    return membership.status ?? null;
  }

  if (endDate) {
    const expiringThrough = new Date(today);
    expiringThrough.setDate(expiringThrough.getDate() + EXPIRING_SOON_DAYS);
    if (endDate <= expiringThrough) return CUSTOMER_MEMBERSHIP_STATUS.EXPIRING;
  }

  return CUSTOMER_MEMBERSHIP_STATUS.ACTIVE;
};

export const isCustomerMembershipDeactivated = (customer) =>
  customer?.currentMembership?.status === CUSTOMER_MEMBERSHIP_STATUS.DEACTIVATED;

export const hasCustomerMembershipPlan = (customer) => {
  const membership = customer?.currentMembership;
  return Boolean(membership?.membershipPlan || membership?.membershipPlanId);
};

export const isCustomerEligibleForGroupClassBooking = (customer) => {
  const membership = customer?.currentMembership;
  if (!membership || !hasCustomerMembershipPlan(customer)) return false;
  return membership.status === CUSTOMER_MEMBERSHIP_STATUS.ACTIVE;
};

export const getCustomerGroupClassBookingBlockReason = (customer) => {
  if (isCustomerEligibleForGroupClassBooking(customer)) return null;

  const membership = customer?.currentMembership;
  if (!membership || !hasCustomerMembershipPlan(customer)) {
    return 'This client has no membership plan and cannot be booked.';
  }
  if (membership.status === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED) {
    return 'This client has an expired membership and cannot be booked.';
  }
  if (membership.status === CUSTOMER_MEMBERSHIP_STATUS.DEACTIVATED) {
    return 'This client has a deactivated membership and cannot be booked.';
  }
  return 'This client does not have an active membership and cannot be booked.';
};

export const getCustomerMembershipDisabledLabel = (customer) => {
  if (isCustomerEligibleForGroupClassBooking(customer)) return null;

  const membership = customer?.currentMembership;
  if (!membership || !hasCustomerMembershipPlan(customer)) {
    return 'No membership plan';
  }
  if (membership.status === CUSTOMER_MEMBERSHIP_STATUS.EXPIRED) {
    return 'Expired';
  }
  if (membership.status === CUSTOMER_MEMBERSHIP_STATUS.DEACTIVATED) {
    return 'Deactivated';
  }
  return 'Unavailable';
};
