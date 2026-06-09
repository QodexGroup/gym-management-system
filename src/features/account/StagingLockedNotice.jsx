import { ShieldAlert } from 'lucide-react';
import { Modal } from '../../components/common';

/**
 * Shown when the account is locked during close beta.
 * Payment reactivation is not available — directs the user to contact support.
 */
const StagingLockedNotice = () => (
  <Modal
    isOpen={true}
    onClose={() => {}}
    closable={false}
    title="Account Locked"
    size="md"
  >
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <ShieldAlert className="w-12 h-12 text-danger-400 flex-shrink-0" />
      <div className="space-y-2">
        <p className="text-sm text-dark-200 font-medium">
          Your account has been locked.
        </p>
        <p className="text-sm text-dark-400">
          We are currently in close beta and payment reactivation is not yet available.
          Please contact GymHubPH Tech Support to have your account manually reactivated.
        </p>
      </div>
      <p className="text-xs text-dark-500">
        Contact us at{' '}
        <span className="text-primary-400 font-medium">support.gymhubph@gmail.com</span>{' '}
        and include your gym name.
      </p>
    </div>
  </Modal>
);

export default StagingLockedNotice;
