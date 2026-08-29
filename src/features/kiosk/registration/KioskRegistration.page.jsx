import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Unlock, X } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useCreateKioskRegistration } from '../../../shared/hooks/useCustomers';
import { useMembershipPlans } from '../../../shared/hooks/useMembershipPlans';
import { useIdleTimer } from '../../../shared/hooks/useIdleTimer';
import { KIOSK_REGISTRATION_PATH } from '../../../shared/constants/kiosk';
import { useKioskLock } from '../../../shared/hooks/useKioskLock';
import {
  KIOSK_IDLE_RESET_MS,
  KIOSK_SUCCESS_AUTO_RESET_MS,
  MEMBERSHIP_REGISTRATION_INITIAL_VALUES,
  MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS,
} from '../../../shared/constants/membershipRegistration';
import { validateMembershipRegistration } from '../../../shared/utils/validators/membershipRegistration';
import { normalizeDate, normalizePhoneNumber } from '../../../shared/utils/formatters';
import { normalizeEmail } from '../../../shared/utils/validators/email';
import UnlockKioskForm from '../UnlockKioskForm';
import MembershipRegistrationForm from './MembershipRegistrationForm';
import RegistrationSuccess from './RegistrationSuccess';

/**
 * Trim a string value, returning null when it is empty.
 *
 * The API treats every optional customer column as nullable, so an untouched
 * field must be sent as null rather than an empty string.
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
 * Build the API payload from the form values.
 *
 * Only the fields the member fills in are sent. Staff-only concerns —
 * membership plan, trainer, balance, photo — are deliberately absent: assigning
 * a plan on create would also generate a bill, which is the front desk's
 * decision, not the registering member's.
 *
 * @param {Object} values Current form values.
 * @returns {Object} Payload for `POST /customers`.
 */
const buildRegistrationPayload = (values) => ({
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
  // Only when a plan was actually chosen: CustomerService::create() reacts to a
  // plan id by creating a membership AND an unpaid bill, so an empty selection
  // must send nothing rather than a null.
  ...(values.membershipPlanId
    ? {
        membershipPlanId: Number(values.membershipPlanId),
        membershipStartDate: values.membershipStartDate || null,
      }
    : {}),
});

/**
 * Full-screen kiosk page where a walk-in creates their own member profile.
 *
 * Runs on a tablet at the front desk under the signed-in staff session, so it
 * posts to the ordinary authenticated `POST /customers` endpoint — no public
 * route and no anonymous surface is involved. The form component and its
 * validation are shared with the public `/join/:publicCode` page planned for
 * Phase 2; only the transport differs.
 *
 * @returns {JSX.Element}
 */
const KioskRegistration = () => {
  const navigate = useNavigate();
  const { account } = useAuth();
  const [values, setValues] = useState(MEMBERSHIP_REGISTRATION_INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [registeredFirstName, setRegisteredFirstName] = useState(null);

  const createMutation = useCreateKioskRegistration();
  const isSubmitting = createMutation.isPending;

  // MembershipPlanResource already returns { id, planName, price, planPeriod,
  // planInterval } — exactly what the shared form renders.
  const { data: membershipPlans = [] } = useMembershipPlans();

  const {
    isLocked,
    canLock,
    showUnlockModal,
    unlocking,
    firebaseAuth,
    lock,
    requestUnlock,
    cancelUnlock,
    completeUnlock,
  } = useKioskLock(KIOSK_REGISTRATION_PATH);

  const isDirty = useMemo(
    () => Object.values(values).some((value) => typeof value === 'string' && value.trim() !== ''),
    [values]
  );

  /**
   * Return the page to a blank form, ready for the next member.
   *
   * @returns {void}
   */
  const resetForm = useCallback(() => {
    setValues(MEMBERSHIP_REGISTRATION_INITIAL_VALUES);
    setErrors({});
    setRegisteredFirstName(null);
  }, []);

  // The tablet is shared: clear an abandoned half-filled form so the next
  // person who walks up never sees a stranger's details.
  useIdleTimer(resetForm, KIOSK_IDLE_RESET_MS, isDirty && !isSubmitting && !registeredFirstName);

  /**
   * Update one field and clear any error currently shown against it.
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
   * Validate, submit the registration, and switch to the confirmation screen.
   *
   * Errors are surfaced by `useCreateKioskRegistration`'s toast — including a
   * 422 when the phone number is already on file; the form keeps its
   * values so the member can correct and retry.
   *
   * @param {React.FormEvent} event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formErrors = validateMembershipRegistration(
      values,
      MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS
    );

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setTimeout(() => {
        const firstError = document.querySelector('.border-danger-500');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    try {
      const created = await createMutation.mutateAsync(buildRegistrationPayload(values));
      setRegisteredFirstName(created?.firstName ?? values.firstName.trim());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Kiosk registration failed:', error);
    }
  };

  /**
   * Leave the kiosk and return to the members list.
   *
   * @returns {void}
   */
  const handleExitKiosk = () => navigate('/members');

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 flex flex-col">
      {/* data-mode="dark" flips the surface scale for this subtree only. Without
          it bg-dark-900 resolves to the LIGHT background, because the admin app
          runs in light mode — the public /join header carries the same attribute. */}
      <header data-mode="dark" className="relative bg-dark-900 px-5 sm:px-8 py-10">
        <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
          <img
            src="/img/gymhubph.png"
            alt="GymHubPH"
            className="h-16 sm:h-20 w-auto object-contain"
          />
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-dark-50">
            {account?.accountName || 'New Member Registration'}
          </h1>
          <p className="mt-1 text-sm text-dark-300">Member Registration</p>
        </div>

        {/* Absolutely positioned so the title stays optically centred.
            Staff controls live up here, deliberately small and out of the way:
            a member filling in the form must never mistake them for part of it. */}
        <div className="absolute top-5 right-5 sm:right-8 flex items-center gap-2">
          {isLocked ? (
            <>
              <span className="flex items-center gap-2 px-3 py-2 rounded-full bg-dark-800 border border-dark-700 text-xs text-dark-200">
                <ShieldCheck className="w-4 h-4 text-primary-400" />
                <span className="hidden sm:inline">Kiosk Locked</span>
              </span>
              <button
                type="button"
                onClick={requestUnlock}
                className="p-2.5 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-dark-50 transition-colors"
                title="Unlock kiosk (staff only)"
                aria-label="Unlock kiosk"
              >
                <Unlock className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {canLock && (
                <button
                  type="button"
                  onClick={lock}
                  className="p-2.5 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-dark-50 transition-colors"
                  title="Lock kiosk"
                  aria-label="Lock kiosk"
                >
                  <Lock className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleExitKiosk}
                className="p-2.5 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-dark-50 transition-colors"
                title="Exit kiosk"
                aria-label="Exit kiosk"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      {registeredFirstName ? (
        <RegistrationSuccess
          firstName={registeredFirstName}
          onReset={resetForm}
          autoResetMs={KIOSK_SUCCESS_AUTO_RESET_MS}
        />
      ) : (
        <main className="flex-1 px-5 sm:px-8 py-6 sm:py-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-base text-dark-300 mb-6">
              Please fill in your details below. Fields marked
              <span className="text-danger-600"> *</span> are required.
            </p>

            <MembershipRegistrationForm
              values={values}
              onChange={handleChange}
              errors={errors}
              requiredFields={MEMBERSHIP_REGISTRATION_REQUIRED_FIELDS}
              isSubmitting={isSubmitting}
              submitLabel="Submit Registration"
              onSubmit={handleSubmit}
              onCancel={isDirty ? resetForm : null}
              cancelLabel="Clear Form"
              membershipPlans={membershipPlans}
            />
          </div>
        </main>
      )}

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-3 py-6 sm:px-4">
          <div className="my-auto w-full max-w-md rounded-2xl border border-dark-700 bg-dark-900 p-4 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-dark-50 sm:text-xl">Unlock Kiosk</h2>
                <p className="text-sm text-dark-400">Enter the password of the user who locked the kiosk.</p>
              </div>
              <button
                onClick={cancelUnlock}
                className="-mr-2 inline-flex min-h-11 flex-none items-center rounded-lg px-2 text-sm text-dark-400 hover:text-dark-200"
                type="button"
                disabled={unlocking}
              >
                Close
              </button>
            </div>

            <UnlockKioskForm
              firebaseAuth={firebaseAuth}
              onSuccess={completeUnlock}
              onCancel={cancelUnlock}
              isUnlocking={unlocking}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskRegistration;
