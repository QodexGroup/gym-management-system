import { useEffect, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';

/**
 * Confirmation screen shown after a member finishes registering at the kiosk.
 *
 * Deliberately shows only the member's first name — no member ID and no
 * check-in QR code. Handing over a working check-in credential is the front
 * desk's job, after a person has verified who this is.
 *
 * The screen resets itself so the tablet is ready for the next member without
 * anyone having to touch it.
 *
 * @param {{
 *   firstName: string,
 *   onReset: () => void,
 *   autoResetMs?: number
 * }} props
 * @returns {JSX.Element}
 */
const RegistrationSuccess = ({ firstName, onReset, autoResetMs = 0 }) => {
  const [secondsLeft, setSecondsLeft] = useState(
    autoResetMs > 0 ? Math.ceil(autoResetMs / 1000) : 0
  );

  useEffect(() => {
    if (autoResetMs <= 0) return undefined;

    const intervalId = setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);
    const timeoutId = setTimeout(onReset, autoResetMs);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [autoResetMs, onReset]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10 border border-success-500/40">
          <CheckCircle2 className="h-11 w-11 text-success-500" />
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-dark-50">
          Welcome{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-3 text-base sm:text-lg text-dark-300">
          Your profile has been created.
        </p>
        <p className="mt-1 text-base sm:text-lg text-dark-400">
          Please head to the front desk to finish setting up your membership.
        </p>

        <button
          type="button"
          onClick={onReset}
          className="mt-10 w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Register Another Member
        </button>

        {autoResetMs > 0 && (
          <p className="mt-4 text-sm text-dark-500">
            Returning to a blank form in {secondsLeft}s
          </p>
        )}
      </div>
    </div>
  );
};

export default RegistrationSuccess;
