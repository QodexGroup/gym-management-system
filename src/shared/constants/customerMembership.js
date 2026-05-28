export const CUSTOMER_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
  EXPIRED: 'expired',
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
