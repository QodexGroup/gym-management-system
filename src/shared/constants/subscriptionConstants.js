/**
 * Subscription / Account Subscription Constants
 */

export const SUBSCRIPTION_STATUS = {
  TRIAL_EXPIRED: 'trial_expired',
  ACTIVE: 'active',
  LOCKED: 'locked',
};

export const SUBSCRIPTION_PAYMENT_STATUS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

export const SUBSCRIPTION_PAYMENT_TRANSACTION = {
  REACTIVATION_FEE: 'Reactivation Fee',
  ACCOUNT_INVOICE_CLASS_KEYWORD: 'AccountInvoice',
};

export const SUBSCRIPTION_PAYMENT_DETAIL_TYPE = {
  UPGRADE_PLAN: 'subscription_upgrade',
};

export const SUBSCRIPTION_PAYMENT_TYPE = {
  GCASH: 'GCASH',
  MAYA: 'MAYA',
};

/**
 * Helpers for displaying subscription payment status
 */
export const getSubscriptionPaymentStatusLabel = (value) => {
  if (!value) return 'Unknown';
  const key = String(value).toLowerCase();

  switch (key) {
    case SUBSCRIPTION_PAYMENT_STATUS.APPROVED:
      return 'Approved';
    case SUBSCRIPTION_PAYMENT_STATUS.REJECTED:
      return 'Rejected';
    case SUBSCRIPTION_PAYMENT_STATUS.PENDING:
      return 'Pending';
    default:
      return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
};

export const getSubscriptionPaymentStatusBadgeClass = (status) => {
  if (!status) return 'bg-warning-500 text-white';
  const key = String(status).toLowerCase();

  switch (key) {
    case SUBSCRIPTION_PAYMENT_STATUS.APPROVED:
      return 'bg-success-500 text-white';
    case SUBSCRIPTION_PAYMENT_STATUS.REJECTED:
      return 'bg-danger-500 text-white';
    case SUBSCRIPTION_PAYMENT_STATUS.PENDING:
    default:
      return 'bg-warning-500 text-white';
  }
};

/**
 * Invoice status constants (for account/subscription invoices)
 */
export const SUBSCRIPTION_INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  VOID: 'void',
};

export const getSubscriptionInvoiceStatusLabel = (value) => {
  if (!value) return 'Unknown';
  const key = String(value).toLowerCase();

  switch (key) {
    case SUBSCRIPTION_INVOICE_STATUS.PAID:
      return 'Paid';
    case SUBSCRIPTION_INVOICE_STATUS.OVERDUE:
      return 'Overdue';
    case SUBSCRIPTION_INVOICE_STATUS.VOID:
      return 'Void';
    case SUBSCRIPTION_INVOICE_STATUS.PENDING:
      return 'Pending';
    default:
      return String(value)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
};

export const getSubscriptionInvoiceStatusBadgeClass = (status) => {
  if (!status) return 'bg-warning-500 text-white';
  const key = String(status).toLowerCase();

  switch (key) {
    case SUBSCRIPTION_INVOICE_STATUS.PAID:
      return 'bg-success-500 text-white';
    case SUBSCRIPTION_INVOICE_STATUS.OVERDUE:
      return 'bg-danger-500 text-white';
    case SUBSCRIPTION_INVOICE_STATUS.VOID:
      return 'bg-dark-400 text-white';
    case SUBSCRIPTION_INVOICE_STATUS.PENDING:
    default:
      return 'bg-warning-500 text-white';
  }
};
