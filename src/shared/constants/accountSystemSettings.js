/**
 * Account System Settings constants.
 * Mirrors the backend MembershipSettingConstant values. Use these instead of
 * string literals anywhere settings values are compared or rendered.
 */

export const GRANT_MEMBERSHIP_ON = {
  FULL_PAYMENT: 'full_payment',
  FIRST_PAYMENT: 'first_payment',
};

export const PROMO_UNIT = {
  DAYS: 'days',
  MONTHS: 'months',
};

export const PLAN_CHANGE_MODE = {
  NEXT_RENEWAL: 'next_renewal',
  IMMEDIATE_PRORATION: 'immediate_proration',
};

export const DOWNGRADE_CREDIT_MODE = {
  FORFEIT: 'forfeit',
  EXTEND_DAYS: 'extend_days',
};

export const BILLING_ANCHOR = {
  ANNIVERSARY: 'anniversary',
  FIXED_DAY: 'fixed_day',
};

export const GRANT_MEMBERSHIP_ON_OPTIONS = [
  { value: GRANT_MEMBERSHIP_ON.FULL_PAYMENT, label: 'Full payment' },
  { value: GRANT_MEMBERSHIP_ON.FIRST_PAYMENT, label: 'First payment (deposit)' },
];

export const PROMO_UNIT_OPTIONS = [
  { value: PROMO_UNIT.DAYS, label: 'Days' },
  { value: PROMO_UNIT.MONTHS, label: 'Months' },
];

export const PLAN_CHANGE_MODE_OPTIONS = [
  { value: PLAN_CHANGE_MODE.NEXT_RENEWAL, label: 'Apply at next renewal' },
  { value: PLAN_CHANGE_MODE.IMMEDIATE_PRORATION, label: 'Change now (prorated)' },
];

export const DOWNGRADE_CREDIT_MODE_OPTIONS = [
  { value: DOWNGRADE_CREDIT_MODE.EXTEND_DAYS, label: 'Add extra days on new plan' },
  { value: DOWNGRADE_CREDIT_MODE.FORFEIT, label: 'Forfeit it' },
];

export const BILLING_ANCHOR_OPTIONS = [
  { value: BILLING_ANCHOR.ANNIVERSARY, label: 'Anniversary (join date)' },
  { value: BILLING_ANCHOR.FIXED_DAY, label: 'Fixed day of month' },
];

/**
 * Default values for every account system setting. Kept in sync with the backend
 * defaults in MembershipSettingConstant::definitions().
 */
export const ACCOUNT_SYSTEM_SETTING_DEFAULTS = {
  grantMembershipOn: GRANT_MEMBERSHIP_ON.FIRST_PAYMENT,
  allowPartialPayments: true,
  gracePeriodDays: 7,
  requireMembershipForClassBooking: true,
  allowClassBookingDuringGrace: false,
  requireReactivationFee: true,
  reactivationFeeAmount: 0,
  grantReactivationPromo: true,
  reactivationPromoLength: 1,
  reactivationPromoUnit: PROMO_UNIT.MONTHS,
  planChangeMode: PLAN_CHANGE_MODE.NEXT_RENEWAL,
  downgradeCreditMode: DOWNGRADE_CREDIT_MODE.EXTEND_DAYS,
  allowManualMembershipBills: true,
  allowPayPreviousCycleBills: true,
  allowEditPreviousCycleBills: false,
  billingAnchor: BILLING_ANCHOR.ANNIVERSARY,
  fixedBillingDay: 1,
};
