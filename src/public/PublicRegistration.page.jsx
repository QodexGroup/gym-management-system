import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Dumbbell, Loader2 } from 'lucide-react';
// Import the component FILE, never the feature barrel. The barrel also exports
// KioskRegistration.page, which imports AuthContext and would drag the whole
// Firebase SDK into this public bundle.
import MembershipRegistrationForm from '../features/kiosk/registration/MembershipRegistrationForm';
import {
  MEMBERSHIP_REGISTRATION_INITIAL_VALUES,
  MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS,
} from '../shared/constants/membershipRegistration';
import { validateMembershipRegistration } from '../shared/utils/validators/membershipRegistration';
import { normalizeDate, normalizePhoneNumber } from '../shared/utils/formatters';
import { normalizeEmail } from '../shared/utils/validators/email';
import { publicRegistrationService } from './services/publicRegistrationService';

/** Hidden field name; must match PublicRegistrationConstant::HONEYPOT_FIELD. */
const HONEYPOT_FIELD = 'website';

/**
 * Read the gym's public code out of the /join/:publicCode path.
 *
 * Parsed by hand rather than with react-router: this entry renders exactly one
 * page, and a router would add weight to a bundle whose whole purpose is to
 * stay small.
 *
 * @returns {string}
 */
const readPublicCodeFromPath = () => {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const joinIndex = segments.indexOf('join');
  return joinIndex !== -1 ? (segments[joinIndex + 1] ?? '') : '';
};

/**
 * Trim a string value, returning null when empty.
 *
 * @param {*} value
 * @returns {string|null}
 */
const trimmedOrNull = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Centred full-page message, used for the loading and unavailable states.
 *
 * @param {{ icon: React.ReactNode, title: string, description?: string }} props
 * @returns {JSX.Element}
 */
const PageMessage = ({ icon, title, description }) => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6">
    <div className="text-center max-w-md">
      {icon}
      <h1 className="mt-5 text-2xl font-bold text-dark-50">{title}</h1>
      {description && <p className="mt-2 text-dark-400">{description}</p>}
    </div>
  </div>
);

/**
 * Public member self-registration page, served at /join/:publicCode.
 *
 * Unauthenticated: the gym is identified solely by the permanent ULID in the
 * URL. Shares its form component and validator with the staff kiosk so both
 * surfaces collect and reject exactly the same things; only the transport and
 * the surrounding chrome differ.
 *
 * @returns {JSX.Element}
 */
const PublicRegistrationPage = () => {
  const publicCode = useMemo(readPublicCodeFromPath, []);

  const [gym, setGym] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [values, setValues] = useState(MEMBERSHIP_REGISTRATION_INITIAL_VALUES);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadGym = async () => {
      if (!publicCode) {
        setLoadError('missing');
        setIsLoading(false);
        return;
      }

      try {
        const info = await publicRegistrationService.getGymRegistrationInfo(publicCode);
        if (!cancelled) setGym(info);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to load gym info:', error);
        if (!cancelled) setLoadError('unavailable');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadGym();
    return () => { cancelled = true; };
  }, [publicCode]);

  /**
   * Field keys this gym requires, base set plus its own optional promotions.
   */
  const requiredFields = useMemo(() => {
    if (!gym) return MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS;

    const extra = [];
    if (gym.requireEmail) extra.push('email');
    if (gym.requireAddress) extra.push('address');
    if (gym.requireEmergencyContact) extra.push('emergencyContactName', 'emergencyContactPhone');

    return [...MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS, ...extra];
  }, [gym]);

  /**
   * Update one field and clear any error shown against it.
   *
   * @param {string} field
   * @param {*} value
   * @returns {void}
   */
  const handleChange = useCallback((field, value) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Map Laravel's field => messages map onto the form's error shape.
   *
   * @param {Object|null} apiErrors
   * @returns {Object<string, string>}
   */
  const mapApiErrors = (apiErrors) => {
    if (!apiErrors) return {};
    return Object.entries(apiErrors).reduce((accumulator, [field, messages]) => {
      accumulator[field] = Array.isArray(messages) ? messages[0] : String(messages);
      return accumulator;
    }, {});
  };

  /**
   * Validate and submit the registration.
   *
   * @param {React.FormEvent} event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const formErrors = validateMembershipRegistration(values, requiredFields);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setTimeout(() => {
        const firstError = document.querySelector('.border-danger-500');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: trimmedOrNull(values.firstName),
        lastName: trimmedOrNull(values.lastName),
        gender: trimmedOrNull(values.gender),
        dateOfBirth: normalizeDate(values.dateOfBirth),
        phoneNumber: normalizePhoneNumber(values.phoneNumber),
        email: values.email ? normalizeEmail(values.email) : null,
        address: trimmedOrNull(values.address),
        emergencyContactName: trimmedOrNull(values.emergencyContactName),
        emergencyContactRelationship: trimmedOrNull(values.emergencyContactRelationship),
        emergencyContactPhone: trimmedOrNull(values.emergencyContactPhone),
        bloodType: trimmedOrNull(values.bloodType),
        medicalConditions: trimmedOrNull(values.medicalConditions),
        allergies: trimmedOrNull(values.allergies),
        medicalNotes: trimmedOrNull(values.medicalNotes),
        [HONEYPOT_FIELD]: honeypot,
      };

      // Only sent when the member actually picked a plan. Selecting one creates
      // a membership and an unpaid bill, so an empty selection must send nothing
      // rather than a null the API would have to interpret.
      if (values.membershipPlanId) {
        payload.membershipPlanId = Number(values.membershipPlanId);
        payload.membershipStartDate = values.membershipStartDate || null;
      }

      const created = await publicRegistrationService.createRegistration(publicCode, payload);
      setResult(created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Registration failed:', error);

      if (error.status === 429) {
        setFormError('Too many registrations right now. Please try again in a few minutes, or see the front desk.');
      } else if (error.errors) {
        setErrors(mapApiErrors(error.errors));
        setFormError(error.message);
      } else {
        setFormError(error.message || 'Could not complete your registration. Please see the front desk.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageMessage
        icon={<Loader2 className="mx-auto h-10 w-10 text-primary-500 animate-spin" />}
        title="Loading..."
      />
    );
  }

  // One indistinguishable message for an unknown code, a disabled link, and an
  // inactive gym — matching the API, which 404s identically for all three so
  // the endpoint cannot be used to discover which codes are real.
  if (loadError || !gym) {
    return (
      <PageMessage
        icon={<Dumbbell className="mx-auto h-10 w-10 text-dark-500" />}
        title="This registration link isn't available"
        description="Please check with the gym's front desk for an up-to-date link."
      />
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 border border-success-500/40">
            <CheckCircle2 className="h-11 w-11 text-success-500" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-dark-50">
            Welcome{result.firstName ? `, ${result.firstName}` : ''}!
          </h1>
          <p className="mt-3 text-base text-dark-300">
            You&apos;re registered with {result.gymName}.
          </p>
          <p className="mt-2 text-base text-dark-400">
            {result.successText?.trim()
              ? result.successText
              : 'Please visit the front desk to finish setting up your membership.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      <header data-mode="dark" className="bg-dark-900 px-5 sm:px-8 py-10">
        <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
          <img
            src="/img/gymhubph.png"
            alt="GymHubPH"
            className="h-16 sm:h-20 w-auto object-contain"
          />
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-dark-50">{gym.gymName}</h1>
          <p className="mt-1 text-sm text-dark-300">Member Registration</p>
        </div>
      </header>

      <main className="px-5 sm:px-8 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-base text-dark-300 mb-6">
            {gym.welcomeText?.trim()
              ? gym.welcomeText
              : 'Fill in your details below, then show this to the front desk when you arrive.'}
          </p>

          {formError && (
            <div className="mb-6 rounded-xl border border-danger-500/50 bg-danger-500/10 px-4 py-3 text-sm text-danger-600">
              {formError}
            </div>
          )}

          {/* Honeypot: hidden from people, irresistible to naive bots. A filled
              value gets the ordinary success screen and writes nothing. */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="website-field">Website</label>
            <input
              id="website-field"
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />
          </div>

          <MembershipRegistrationForm
            values={values}
            onChange={handleChange}
            errors={errors}
            requiredFields={requiredFields}
            isSubmitting={isSubmitting}
            submitLabel="Submit Registration"
            onSubmit={handleSubmit}
            membershipPlans={gym.membershipPlans || []}
          />
        </div>
      </main>
    </div>
  );
};

export default PublicRegistrationPage;
