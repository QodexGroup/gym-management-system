import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Loader2 } from 'lucide-react';
import {
  BLOOD_TYPE_OPTIONS,
  EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS,
  GENDER_OPTIONS,
  MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR,
  MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS,
  getTodayDateString,
} from '../../../shared/constants/membershipRegistration';
import { formatCurrency, formatPlanIntervalLabel } from '../../../shared/utils/formatters';

/** Touch-friendly input sizing. The kiosk is used standing up, on a tablet. */
const INPUT_CLASS = 'input w-full text-base sm:text-lg py-3';
const LABEL_CLASS = 'label text-sm sm:text-base';

/**
 * Build the class string for an input, adding the error border when needed.
 *
 * @param {boolean} hasError
 * @returns {string}
 */
const inputClassName = (hasError) =>
  `${INPUT_CLASS} ${hasError ? 'border-danger-500 focus:border-danger-500' : ''}`;

/**
 * Inline field-level error message.
 *
 * @param {{ message?: string }} props
 * @returns {JSX.Element|null}
 */
const FieldError = ({ message }) => {
  if (!message) return null;
  return <p className="text-danger-600 text-sm mt-1.5">{message}</p>;
};

/**
 * Section wrapper giving each group of fields a heading and a divider.
 *
 * @param {{ title: string, description?: string, children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
const FormSection = ({ title, description, children }) => (
  <div className="border-b border-dark-800 pb-6">
    <h2 className="text-lg sm:text-xl font-semibold text-dark-50">{title}</h2>
    {description && <p className="text-sm text-dark-400 mt-1">{description}</p>}
    <div className="mt-4">{children}</div>
  </div>
);

/**
 * Required-field marker.
 *
 * @param {{ show: boolean }} props
 * @returns {JSX.Element|null}
 */
const RequiredMark = ({ show }) => (show ? <span className="text-danger-600"> *</span> : null);

/**
 * Member self-registration form — presentational and transport-agnostic.
 *
 * It owns no submission logic and knows nothing about authentication, so the
 * same component serves the staff kiosk (posts with the staff session) and the
 * public `/join/:publicCode` page in Phase 2 (posts anonymously). The parent
 * supplies values, errors, and the submit handler.
 *
 * @param {{
 *   values: Object,
 *   onChange: (field: string, value: *) => void,
 *   errors?: Object<string, string>,
 *   requiredFields?: string[],
 *   isSubmitting?: boolean,
 *   submitLabel?: string,
 *   onSubmit: (event: React.FormEvent) => void,
 *   onCancel?: () => void,
 *   cancelLabel?: string,
 *   showHealthSection?: boolean,
 *   membershipPlans?: Array<{id: number, planName: string, price: number|string, planPeriod: number, planInterval: string}>
 * }} props
 * @returns {JSX.Element}
 */
const MembershipRegistrationForm = ({
  values,
  onChange,
  errors = {},
  requiredFields = MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS,
  isSubmitting = false,
  submitLabel = 'Submit Registration',
  onSubmit,
  onCancel = null,
  cancelLabel = 'Cancel',
  showHealthSection = true,
  membershipPlans = [],
}) => {
  /**
   * Whether a field must be filled in on this surface.
   *
   * @param {string} field
   * @returns {boolean}
   */
  const isRequired = (field) => requiredFields.includes(field);

  /**
   * Update a field and clear any error currently shown against it.
   *
   * @param {string} field
   * @returns {(event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => void}
   */
  const handleFieldChange = (field) => (event) => onChange(field, event.target.value);

  /**
   * Store a picked date of birth as a plain `YYYY-MM-DD` string.
   *
   * Uses local date parts rather than `toISOString()`, which shifts to UTC and
   * can move a Manila-entered birthday back by a day.
   *
   * @param {Date|null} date
   * @returns {void}
   */
  const handleDateOfBirthChange = (date) => {
    if (!date) {
      onChange('dateOfBirth', '');
      return;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange('dateOfBirth', `${year}-${month}-${day}`);
  };

  /**
   * Select or clear a membership plan, keeping the start date in step.
   *
   * The start date only means anything alongside a plan, so choosing one seeds
   * it with today and clearing one wipes it. Without that, clearing the plan
   * would leave an orphaned date in the payload.
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} event
   * @returns {void}
   */
  const handlePlanChange = (event) => {
    const planId = event.target.value;
    onChange('membershipPlanId', planId);
    onChange('membershipStartDate', planId ? (values.membershipStartDate || getTodayDateString()) : '');
  };

  /**
   * Store a picked start date as a plain `YYYY-MM-DD` string, using local date
   * parts so an evening selection in Asia/Manila does not shift to yesterday.
   *
   * @param {Date|null} date
   * @returns {void}
   */
  const handleStartDateChange = (date) => {
    if (!date) {
      onChange('membershipStartDate', '');
      return;
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange('membershipStartDate', `${date.getFullYear()}-${month}-${day}`);
  };

  const minBirthDate = new Date(MEMBERSHIP_REGISTRATION_MIN_BIRTH_YEAR, 0, 1);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormSection title="Your Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={LABEL_CLASS} htmlFor="registration-first-name">
              First Name<RequiredMark show={isRequired('firstName')} />
            </label>
            <input
              id="registration-first-name"
              type="text"
              autoComplete="given-name"
              className={inputClassName(errors.firstName)}
              placeholder="Juan"
              value={values.firstName}
              onChange={handleFieldChange('firstName')}
            />
            <FieldError message={errors.firstName} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-last-name">
              Last Name<RequiredMark show={isRequired('lastName')} />
            </label>
            <input
              id="registration-last-name"
              type="text"
              autoComplete="family-name"
              className={inputClassName(errors.lastName)}
              placeholder="Dela Cruz"
              value={values.lastName}
              onChange={handleFieldChange('lastName')}
            />
            <FieldError message={errors.lastName} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-gender">
              Gender<RequiredMark show={isRequired('gender')} />
            </label>
            <select
              id="registration-gender"
              className={inputClassName(errors.gender)}
              value={values.gender}
              onChange={handleFieldChange('gender')}
            >
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <FieldError message={errors.gender} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-date-of-birth">
              Date of Birth<RequiredMark show={isRequired('dateOfBirth')} />
            </label>
            <DatePicker
              id="registration-date-of-birth"
              selected={values.dateOfBirth ? new Date(values.dateOfBirth) : null}
              onChange={handleDateOfBirthChange}
              dateFormat="yyyy-MM-dd"
              placeholderText="Tap to select your birthday"
              className={inputClassName(errors.dateOfBirth)}
              wrapperClassName="w-full"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              minDate={minBirthDate}
              maxDate={new Date()}
              isClearable
            />
            <FieldError message={errors.dateOfBirth} />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="How We Can Reach You"
        description="We use this to send membership reminders and receipts."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className={LABEL_CLASS} htmlFor="registration-phone">
              Mobile Number<RequiredMark show={isRequired('phoneNumber')} />
            </label>
            <input
              id="registration-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={inputClassName(errors.phoneNumber)}
              placeholder="09123456789"
              value={values.phoneNumber}
              onChange={handleFieldChange('phoneNumber')}
            />
            <FieldError message={errors.phoneNumber} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-email">
              Email<RequiredMark show={isRequired('email')} />
            </label>
            <input
              id="registration-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputClassName(errors.email)}
              placeholder="juan@email.com"
              value={values.email}
              onChange={handleFieldChange('email')}
            />
            <FieldError message={errors.email} />
          </div>

          <div className="sm:col-span-2">
            <label className={LABEL_CLASS} htmlFor="registration-address">
              Address<RequiredMark show={isRequired('address')} />
            </label>
            <input
              id="registration-address"
              type="text"
              autoComplete="street-address"
              className={inputClassName(errors.address)}
              placeholder="City, Province"
              value={values.address}
              onChange={handleFieldChange('address')}
            />
            <FieldError message={errors.address} />
          </div>
        </div>
      </FormSection>

      {membershipPlans.length > 0 && (
        <FormSection
          title="Membership Plan"
          description="Optional — you can also choose your plan at the front desk."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className={LABEL_CLASS} htmlFor="registration-plan">Plan</label>
              <select
                id="registration-plan"
                className={INPUT_CLASS}
                value={values.membershipPlanId}
                onChange={handlePlanChange}
              >
                <option value="">No plan for now</option>
                {membershipPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName} — {formatCurrency(plan.price)}
                    {formatPlanIntervalLabel(plan.planPeriod, plan.planInterval)
                      ? ` / ${formatPlanIntervalLabel(plan.planPeriod, plan.planInterval)}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Only meaningful once a plan is chosen, so it is absent otherwise. */}
            {values.membershipPlanId && (
              <div>
                <label className={LABEL_CLASS} htmlFor="registration-start-date">
                  Start Date<RequiredMark show />
                </label>
                <DatePicker
                  id="registration-start-date"
                  selected={values.membershipStartDate ? new Date(values.membershipStartDate) : null}
                  onChange={handleStartDateChange}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Tap to select a start date"
                  className={inputClassName(errors.membershipStartDate)}
                  wrapperClassName="w-full"
                  minDate={new Date()}
                />
                <FieldError message={errors.membershipStartDate} />
              </div>
            )}
          </div>
        </FormSection>
      )}

      <FormSection
        title="Emergency Contact"
        description="Who should we call if something happens while you are training?"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label className={LABEL_CLASS} htmlFor="registration-emergency-name">
              Contact Name<RequiredMark show={isRequired('emergencyContactName')} />
            </label>
            <input
              id="registration-emergency-name"
              type="text"
              className={inputClassName(errors.emergencyContactName)}
              placeholder="Maria Dela Cruz"
              value={values.emergencyContactName}
              onChange={handleFieldChange('emergencyContactName')}
            />
            <FieldError message={errors.emergencyContactName} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-emergency-relationship">
              Relationship<RequiredMark show={isRequired('emergencyContactRelationship')} />
            </label>
            <select
              id="registration-emergency-relationship"
              className={inputClassName(errors.emergencyContactRelationship)}
              value={values.emergencyContactRelationship}
              onChange={handleFieldChange('emergencyContactRelationship')}
            >
              <option value="">Select relationship</option>
              {EMERGENCY_CONTACT_RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <FieldError message={errors.emergencyContactRelationship} />
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="registration-emergency-phone">
              Contact Number<RequiredMark show={isRequired('emergencyContactPhone')} />
            </label>
            <input
              id="registration-emergency-phone"
              type="tel"
              inputMode="tel"
              className={inputClassName(errors.emergencyContactPhone)}
              placeholder="09123456789"
              value={values.emergencyContactPhone}
              onChange={handleFieldChange('emergencyContactPhone')}
            />
            <FieldError message={errors.emergencyContactPhone} />
          </div>
        </div>
      </FormSection>

      {showHealthSection && (
        <FormSection
          title="Health Notes"
          description="Optional, but it helps our coaches keep you safe."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className={LABEL_CLASS} htmlFor="registration-blood-type">Blood Type</label>
              <select
                id="registration-blood-type"
                className={INPUT_CLASS}
                value={values.bloodType}
                onChange={handleFieldChange('bloodType')}
              >
                <option value="">Not sure</option>
                {BLOOD_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="registration-conditions">
                Medical Conditions
              </label>
              <input
                id="registration-conditions"
                type="text"
                className={INPUT_CLASS}
                placeholder="e.g. Asthma, Hypertension"
                value={values.medicalConditions}
                onChange={handleFieldChange('medicalConditions')}
              />
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="registration-allergies">Allergies</label>
              <textarea
                id="registration-allergies"
                rows="3"
                className={INPUT_CLASS}
                placeholder="e.g. Peanuts, Penicillin"
                value={values.allergies}
                onChange={handleFieldChange('allergies')}
              />
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor="registration-medical-notes">
                Anything Else We Should Know
              </label>
              <textarea
                id="registration-medical-notes"
                rows="3"
                className={INPUT_CLASS}
                placeholder="e.g. Previous knee injury"
                value={values.medicalNotes}
                onChange={handleFieldChange('medicalNotes')}
              />
            </div>
          </div>
        </FormSection>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="sm:flex-1 btn-secondary py-4 text-base"
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          className="sm:flex-[2] btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default MembershipRegistrationForm;
