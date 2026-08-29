/**
 * Shared configuration for the member self-registration form.
 *
 * Used by the in-app staff kiosk today, and by the public `/join/:publicCode`
 * entry in Phase 2 — both surfaces must collect and validate the same fields,
 * so every constant that describes the form lives here rather than in a page.
 */

/** Fields the API requires on every registration, regardless of surface. */
export const MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'phoneNumber',
];

/** Human labels used to build validation messages. */
export const MEMBERSHIP_REGISTRATION_FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  gender: 'Gender',
  dateOfBirth: 'Date of birth',
  phoneNumber: 'Phone number',
  email: 'Email',
  address: 'Address',
  emergencyContactName: 'Emergency contact name',
  emergencyContactRelationship: 'Relationship',
  emergencyContactPhone: 'Emergency contact phone',
  medicalNotes: 'Medical notes',
  allergies: 'Allergies',
  bloodType: 'Blood type',
  medicalConditions: 'Medical conditions',
  membershipPlanId: 'Membership plan',
  membershipStartDate: 'Start date',
};

/** Blank form state. Every controlled input reads from a key defined here. */
export const MEMBERSHIP_REGISTRATION_INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  medicalNotes: '',
  allergies: '',
  bloodType: '',
  medicalConditions: '',
  membershipPlanId: '',
  membershipStartDate: '',
};

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Other',
];

/**
 * Earliest date of birth accepted. Guards against a typo (or a bot) writing a
 * nonsense year straight into the members table — registrations are created
 * directly, with no approval step in between.
 */
export const MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR = 1900;

/**
 * Idle time before a half-filled kiosk form is cleared. The tablet is shared,
 * so an abandoned form must not leave one person's details on screen for the
 * next person who walks up.
 */
export const KIOSK_IDLE_RESET_MS = 3 * 60 * 1000;

/** How long the kiosk success screen stays up before resetting for the next member. */
export const KIOSK_SUCCESS_AUTO_RESET_MS = 15 * 1000;

/**
 * Today as a plain `YYYY-MM-DD` string.
 *
 * Built from local date parts rather than `toISOString()`, which converts to
 * UTC and in Asia/Manila would return yesterday for most of the evening.
 *
 * @returns {string}
 */
export const getTodayDateString = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};
