import { useNavigate } from 'react-router-dom';
import { QrCode, UserPlus } from 'lucide-react';
import { Modal } from '../../components/common';
import { KIOSK_QR_SCANNER_PATH, KIOSK_REGISTRATION_PATH } from '../../shared/constants/kiosk';

/** The kiosk modes a staff member can put this device into. */
const KIOSK_OPTIONS = [
  {
    path: KIOSK_QR_SCANNER_PATH,
    icon: QrCode,
    label: 'QR Check-In',
    description: 'Members scan their QR card to check in and out.',
  },
  {
    path: KIOSK_REGISTRATION_PATH,
    icon: UserPlus,
    label: 'Kiosk Membership',
    description: 'Walk-ins fill in their own details to create a profile.',
  },
];

/**
 * Asks which kiosk mode to open, then navigates there.
 *
 * The header used to jump straight to the QR scanner. With two kiosk screens
 * that shortcut had to become a choice, and putting it here keeps the header
 * from growing a second button.
 *
 * @param {{ isOpen: boolean, onClose: () => void }} props
 * @returns {JSX.Element}
 */
const KioskSelectModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  /**
   * Close the modal and switch the device to the chosen kiosk.
   *
   * @param {string} path
   * @returns {void}
   */
  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Open Kiosk">
      <p className="text-sm text-dark-400 mb-5">
        Choose what this device should be used for.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {KIOSK_OPTIONS.map((option) => {
          // Assigned in the body rather than destructured in the params:
          // eslint's jsx-uses-vars does not see a component identifier that is
          // destructured in a nested callback's parameter list.
          const Icon = option.icon;

          return (
            <button
              key={option.path}
              type="button"
              onClick={() => handleSelect(option.path)}
              className="text-left p-5 rounded-xl border border-dark-700 bg-dark-800 hover:border-primary-500 hover:bg-dark-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <p className="mt-3 font-semibold text-dark-50">{option.label}</p>
              <p className="mt-1 text-sm text-dark-400">{option.description}</p>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default KioskSelectModal;
