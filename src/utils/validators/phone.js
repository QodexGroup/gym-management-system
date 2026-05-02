// Philippine phone number utilities.
// Handles +63 / 63 country-code prefixes and enforces PH-specific rules.

export const PH_PHONE_MAX_DIGITS = 11;

/**
 * Strip all non-digit characters from a phone number.
 */
export function normalizePhone(value) {
  if (value === null || value === undefined) return '';
  return value.toString().replace(/\D/g, '');
}

/**
 * Normalize a PH phone number to its local 09XXXXXXXXX form.
 * +639XXXXXXXXX → 09XXXXXXXXX
 *  639XXXXXXXXX → 09XXXXXXXXX
 *   9XXXXXXXXX  → 09XXXXXXXXX (prepend leading 0)
 * Already-local 09XXXXXXXXX passes through unchanged.
 */
export function toLocalPhFormat(value) {
  const raw = (value ?? '').toString().trim();

  // Remove the + if present, then work with digits only
  const digits = raw.replace(/^\+/, '').replace(/\D/g, '');

  if (digits.startsWith('63')) {
    return '0' + digits.slice(2);
  }

  if (digits.startsWith('9') && !digits.startsWith('09')) {
    return '0' + digits;
  }

  return digits;
}

// Max raw input length: +63XXXXXXXXX = 14 chars, give one extra for tolerance
export const PH_PHONE_INPUT_MAX = 15;

/**
 * Sanitize raw input as the user types.
 * Allows digits and a leading + (for +63 prefix); strips everything else.
 * Does NOT normalize to local format yet — that happens on submit/blur
 * so the user can freely type +63XXXXXXXXX without the input jumping.
 */
export function sanitizePhoneInput(value) {
  if (!value) return '';
  // Keep digits and a leading + only
  const sanitized = value.toString().replace(/[^\d+]/g, '').replace(/(.)\+/g, '$1');
  return sanitized.slice(0, PH_PHONE_INPUT_MAX);
}

/**
 * Validate a PH phone number strictly.
 * Accepted formats:
 *   09XXXXXXXXX   — exactly 11 digits, leading 0 required
 *   +639XXXXXXXXX — PH country code prefix, must total 13 characters
 * Returns an error message string, or '' if valid.
 * Empty input returns '' — caller decides if required.
 */
export function validatePhPhone(value) {
  if (!value) return '';

  const stripped = value.toString().trim();

  // Reject non-PH country codes
  if (stripped.startsWith('+') && !stripped.startsWith('+63')) {
    return 'Only Philippine phone numbers (+63) are supported.';
  }

  // +63 path: +639XXXXXXXXX — strip +63, remainder must be 09XXXXXXXXX equivalent
  if (stripped.startsWith('+63')) {
    const afterCode = stripped.slice(3); // digits after +63
    const digits = afterCode.replace(/\D/g, '');
    if (digits.length < 10) return 'Mobile number must be 11 digits (e.g. 09171234567 or +639171234567).';
    if (digits.length > 10) return 'Mobile number must be 11 digits (e.g. 09171234567 or +639171234567).';
    return '';
  }

  // Local path: must start with 09
  if (!stripped.startsWith('09')) {
    return 'Phone number must start with 09 (e.g. 09171234567) or +63.';
  }

  const digits = stripped.replace(/\D/g, '');
  if (digits.length < 11) return 'Mobile number must be 11 digits (e.g. 09171234567).';
  if (digits.length > 11) return 'Mobile number must be 11 digits (e.g. 09171234567).';

  return '';
}

export function isValidPhPhone(value) {
  return validatePhPhone(value) === '';
}
