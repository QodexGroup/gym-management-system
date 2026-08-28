/**
 * How a member profile was created.
 * Mirrors the backend CustomerRegistrationSourceConstant — use these instead of
 * string literals anywhere registration_source is filtered or compared.
 */
export const CUSTOMER_REGISTRATION_SOURCE = {
  STAFF: 'staff',
  KIOSK: 'kiosk',
  PUBLIC: 'public',
};

export const CUSTOMER_REGISTRATION_SOURCE_LABELS = {
  [CUSTOMER_REGISTRATION_SOURCE.STAFF]: 'Added by staff',
  [CUSTOMER_REGISTRATION_SOURCE.KIOSK]: 'On-site kiosk',
  [CUSTOMER_REGISTRATION_SOURCE.PUBLIC]: 'Public link',
};
