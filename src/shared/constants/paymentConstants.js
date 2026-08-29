/**
 * Payment Constants
 * Centralized constants for payment-related values
 */

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  GCASH: 'gcash',
  BANK_TRANSFER: 'transfer',
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD.CASH]: 'Cash',
  [PAYMENT_METHOD.CARD]: 'Card',
  [PAYMENT_METHOD.GCASH]: 'GCash',
  [PAYMENT_METHOD.BANK_TRANSFER]: 'Bank Transfer',
};

/**
 * Normalize a raw stored paymentMethod string into one of the PAYMENT_METHOD
 * keys, for filtering and grouping in reports.
 *
 * GCash must be matched before Cash, otherwise 'gcash'.includes('cash')
 * mislabels it as a cash payment.
 *
 * @param {string|null|undefined} rawMethod
 * @returns {string} A PAYMENT_METHOD value, or 'other' when unrecognized.
 */
export const normalizePaymentMethod = (rawMethod) => {
  const key = String(rawMethod || '').toLowerCase();
  if (key.includes('gcash') || key.includes('g-cash')) return PAYMENT_METHOD.GCASH;
  if (key.includes('cash')) return PAYMENT_METHOD.CASH;
  if (key.includes('card')) return PAYMENT_METHOD.CARD;
  if (key.includes('transfer')) return PAYMENT_METHOD.BANK_TRANSFER;
  return 'other';
};

/**
 * Display label for a stored paymentMethod value. Normalizes first, so legacy
 * values such as 'bank_transfer' or 'credit_card' resolve to the same label as
 * the values the payment form writes today. Unrecognized methods fall back to
 * the raw stored string rather than being flattened to 'Other'.
 *
 * @param {string|null|undefined} rawMethod
 * @returns {string}
 */
export const formatPaymentMethod = (rawMethod) =>
  PAYMENT_METHOD_LABELS[normalizePaymentMethod(rawMethod)] || rawMethod || 'N/A';

/**
 * Option list for the payment-method filter used by the collection reports.
 * Single source of truth so a newly supported method only has to be added once.
 */
export const PAYMENT_METHOD_FILTER_OPTIONS = [
  { value: 'all', label: 'All Payment Methods' },
  { value: PAYMENT_METHOD.CARD, label: 'Credit Card' },
  { value: PAYMENT_METHOD.CASH, label: 'Cash' },
  { value: PAYMENT_METHOD.GCASH, label: 'GCash' },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: 'Bank Transfer' },
];
