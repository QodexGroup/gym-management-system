/**
 * Bill Constants
 * Centralized constants for bill-related values
 */

export const BILL_TYPE = {
  MEMBERSHIP_SUBSCRIPTION: 'Membership Subscription',
  CUSTOM_AMOUNT: 'Custom Amount',
  REACTIVATION_FEE: 'Reactivation Fee',
  PT_PACKAGE_SUBSCRIPTION: 'PT Package Subscription',
};

export const BILL_TYPE_OPTIONS = [
  { value: BILL_TYPE.MEMBERSHIP_SUBSCRIPTION, label: BILL_TYPE.MEMBERSHIP_SUBSCRIPTION },
  { value: BILL_TYPE.CUSTOM_AMOUNT, label: BILL_TYPE.CUSTOM_AMOUNT },
  { value: BILL_TYPE.REACTIVATION_FEE, label: BILL_TYPE.REACTIVATION_FEE },
  { value: BILL_TYPE.PT_PACKAGE_SUBSCRIPTION, label: BILL_TYPE.PT_PACKAGE_SUBSCRIPTION },
];

export const BILL_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  ACTIVE: 'active',
  VOIDED: 'voided',
};

export const BILL_STATUS_LABELS = {
  [BILL_STATUS.PAID]: 'Paid',
  [BILL_STATUS.PARTIAL]: 'Partial',
  [BILL_STATUS.ACTIVE]: 'Active',
  [BILL_STATUS.VOIDED]: 'Voided',
};

export const BILL_STATUS_VARIANTS = {
  [BILL_STATUS.PAID]: 'success',
  [BILL_STATUS.PARTIAL]: 'warning',
  [BILL_STATUS.ACTIVE]: 'primary',
  [BILL_STATUS.VOIDED]: 'danger',
};

