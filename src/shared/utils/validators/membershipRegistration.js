import { isValidEmail, normalizeEmail } from './email';
import {
  MEMBERSHIP_REGISTRATION_FIELD_LABELS,
  MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR,
  MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS,
} from '../../constants/membershipRegistration';

/**
 * Check whether a form value counts as supplied.
 *
 * @param {*} value
 * @returns {boolean}
 */
const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate a date of birth: parseable, not in the future, and not absurdly old.
 *
 * The year floor matters because a registration is written straight into the
 * members table with no human review step.
 *
 * @param {string} value ISO-ish date string.
 * @returns {string} Error message, or an empty string when valid.
 */
const validateDateOfBirth = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Please enter a valid date of birth';

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) return 'Date of birth cannot be in the future';

  if (parsed.getFullYear() < MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR) {
    return `Date of birth must be after ${MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR}`;
  }

  return '';
};

/**
 * Validate the member self-registration form.
 *
 * Shared by the staff kiosk and (in Phase 2) the public registration page so
 * both surfaces reject the same input for the same reasons. The caller passes
 * the required-field list because the public form can promote optional fields
 * to required based on the gym's settings.
 *
 * @param {Object} values Current form values.
 * @param {string[]} [requiredFields] Field keys that must be supplied.
 * @returns {Object<string, string>} Map of field key to error message; empty when valid.
 */
export const validateMembershipRegistration = (
  values,
  requiredFields = MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS
) => {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!hasValue(values[field])) {
      const label = MEMBERSHIP_REGISTRATION_FIELD_LABELS[field] ?? field;
      errors[field] = `${label} is required`;
    }
  });

  if (!errors.dateOfBirth && hasValue(values.dateOfBirth)) {
    const dobError = validateDateOfBirth(values.dateOfBirth);
    if (dobError) errors.dateOfBirth = dobError;
  }

  // The start date only exists when a plan is chosen, so validate it only then.
  if (values.membershipPlanId) {
    if (!hasValue(values.membershipStartDate)) {
      errors.membershipStartDate = 'Start date is required';
    } else {
      const start = new Date(values.membershipStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(start.getTime())) {
        errors.membershipStartDate = 'Please enter a valid start date';
      } else if (start < today) {
        errors.membershipStartDate = 'The start date cannot be in the past';
      }
    }
  }

  const email = normalizeEmail(values.email);
  if (email && !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
};
