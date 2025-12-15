/**
 * Bill Constants
 * Centralized constants for bill-related values
 */

export const BILL_TYPE = {
  MEMBERSHIP_SUBSCRIPTION: 'Membership Subscription',
  CUSTOM_AMOUNT: 'Custom Amount',
};

export const BILL_TYPE_OPTIONS = [
  { value: BILL_TYPE.MEMBERSHIP_SUBSCRIPTION, label: BILL_TYPE.MEMBERSHIP_SUBSCRIPTION },
  { value: BILL_TYPE.CUSTOM_AMOUNT, label: BILL_TYPE.CUSTOM_AMOUNT },
];

export const BILL_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  ACTIVE: 'active',
};

export const BILL_STATUS_LABELS = {
  [BILL_STATUS.PAID]: 'Paid',
  [BILL_STATUS.PARTIAL]: 'Partial',
  [BILL_STATUS.ACTIVE]: 'Active',
};

export const BILL_STATUS_VARIANTS = {
  [BILL_STATUS.PAID]: 'success',
  [BILL_STATUS.PARTIAL]: 'warning',
  [BILL_STATUS.ACTIVE]: 'primary',
};

