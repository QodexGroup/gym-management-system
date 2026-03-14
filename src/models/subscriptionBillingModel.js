/**
 * Subscription Billing Model
 * Defines the structure and transformation for subscription billing data
 */

/**
 * Create an empty billing object for initial form state
 * @returns {Object}
 */
export const createEmptySubscriptionBilling = () => ({
  legalName: '',
  billingEmail: '',
  addressLine1: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
});

/**
 * Safely read a field that may exist in camelCase or snake_case
 * @param {Object} source
 * @param {string} camelKey
 * @param {string} snakeKey
 * @returns {string}
 */
const readField = (source, camelKey, snakeKey) => {
  if (!source) return '';
  if (source[camelKey] != null) return source[camelKey];
  if (source[snakeKey] != null) return source[snakeKey];
  return '';
};

/**
 * Map billing data from API to component/form format
 * @param {Object|null} billing
 * @returns {Object}
 */
export const mapSubscriptionBillingToForm = (billing) => {
  if (!billing) return createEmptySubscriptionBilling();

  return {
    // AccountResource exposes billing* fields (camelCase) mapped from DB columns
    legalName: readField(billing, 'billingName', 'billing_name'),
    billingEmail: readField(billing, 'billingEmail', 'billing_email'),
    addressLine1: readField(billing, 'billingAddress', 'billing_address'),
    city: readField(billing, 'billingCity', 'billing_city'),
    stateProvince: readField(billing, 'billingProvince', 'billing_province'),
    postalCode: readField(billing, 'billingZip', 'billing_zip'),
    country: readField(billing, 'billingCountry', 'billing_country'),
  };
};

/**
 * Map form data back to API payload format
 * Currently matches the API's expected camelCase fields,
 * but this centralizes the shape in case it changes.
 * @param {Object} form
 * @param {Object|null} originalAccount - Original account data, used for required fields
 * @returns {Object}
 */
export const mapSubscriptionBillingFormToPayload = (form, originalAccount = null) => {
  const safe = form || {};

  return {
    // Required account fields from existing account
    accountName: originalAccount?.accountName ?? '',
    accountEmail: originalAccount?.accountEmail ?? '',
    accountPhone: originalAccount?.accountPhone ?? '',
    // Billing fields taken from form (fall back to existing values if needed)
    billingName: safe.legalName?.trim() || originalAccount?.billingName || '',
    billingEmail: safe.billingEmail?.trim() || originalAccount?.billingEmail || '',
    billingPhone: originalAccount?.billingPhone || '',
    billingAddress: safe.addressLine1?.trim() || originalAccount?.billingAddress || '',
    billingCity: safe.city?.trim() || originalAccount?.billingCity || '',
    billingProvince: safe.stateProvince?.trim() || originalAccount?.billingProvince || '',
    billingZip: safe.postalCode?.trim() || originalAccount?.billingZip || '',
    billingCountry:
      safe.country?.trim().toUpperCase().slice(0, 2) || originalAccount?.billingCountry || '',
  };
};

