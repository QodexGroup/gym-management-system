import { Lock } from 'lucide-react';
import { Modal } from '../../components/common';

/**
 * Dismissible locked-account notice for non-owner staff and coaches.
 *
 * When the account is locked for unpaid subscription, staff and coaches are
 * confined to the dashboard (see AccountStateGuard). They can close this notice
 * to view the dashboard, but it reappears whenever they try to navigate away.
 */
const LockedAccountNoticeModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Locked" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-warning-500/10 border border-warning-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-warning-500" />
          </div>
        </div>

        <p className="text-sm text-dark-300 text-center">
          This account is currently locked due to an unpaid subscription invoice.
          Access is limited to the dashboard until the account is reactivated.
        </p>

        <p className="text-sm text-dark-300 text-center">
          Please notify your gym administrator or account owner to settle the
          outstanding invoice and reactivate the account.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full btn-primary"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
};

export default LockedAccountNoticeModal;
