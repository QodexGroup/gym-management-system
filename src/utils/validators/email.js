export function normalizeEmail(value) {
  return (value ?? '').toString().trim();
}

/**
 * Pragmatic email validation.
 * - Does not try to fully implement RFC 5322.
 * - Caller decides if empty is allowed; this returns false for empty.
 */
export function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return false;
  if (/\s/.test(email)) return false;

  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return false; // must have something before @
  if (email.indexOf('@', atIndex + 1) !== -1) return false; // only one @

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (!local || !domain) return false;

  // Require a dot in the domain and not at start/end (basic x@y.z)
  const dotIndex = domain.indexOf('.');
  if (dotIndex <= 0) return false;
  if (dotIndex === domain.length - 1) return false;

  return true;
}

