export const CUSTOMER_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
  EXPIRED: 'expired',
};

export const isCustomerMembershipDeactivated = (customer) =>
  customer?.currentMembership?.status === CUSTOMER_MEMBERSHIP_STATUS.DEACTIVATED;
