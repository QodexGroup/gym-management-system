/**
 * Expense Constants
 * Centralized constants for expense-related values
 */

export const EXPENSE_STATUS = {
  POSTED: 'POSTED',
  UNPOSTED: 'UNPOSTED',
};

export const EXPENSE_STATUS_LABELS = {
  [EXPENSE_STATUS.POSTED]: 'Posted',
  [EXPENSE_STATUS.UNPOSTED]: 'Unposted',
};

export const EXPENSE_STATUS_VARIANTS = {
  [EXPENSE_STATUS.POSTED]: 'success',
  [EXPENSE_STATUS.UNPOSTED]: 'warning',
};

