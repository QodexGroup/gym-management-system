import { Copy } from 'lucide-react';
import { SUBSCRIPTION_PAYMENT_TYPE } from '../../constants/subscriptionConstants';
import { Toast } from '../../utils/alert';

const PAYMENT_OWNER_NAME = 'JOMILEN DELA TORRE';
const PAYMENT_NUMBER = '09058024974';

const PAYMENT_TYPES = [
  {
    id: SUBSCRIPTION_PAYMENT_TYPE.GCASH,
    label: 'GCash',
    logoSrc: '/img/gcash-logo.png',
  },
  {
    id: SUBSCRIPTION_PAYMENT_TYPE.MAYA,
    label: 'Maya',
    logoSrc: '/img/maya-logo.png',
  },
];

const PaymentTypeInfo = ({ selectedType = SUBSCRIPTION_PAYMENT_TYPE.GCASH, onChange }) => {
  const handleCopyPaymentDetails = async (paymentType) => {
    const payload = `${paymentType}\nName: ${PAYMENT_OWNER_NAME}\nNumber: ${PAYMENT_NUMBER}`;

    try {
      await navigator.clipboard.writeText(payload);
      Toast.success(`${paymentType} details copied.`);
    } catch {
      Toast.error('Failed to copy payment details.');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-dark-300 font-medium">Payment Details</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PAYMENT_TYPES.map((type) => (
          <div
            key={type.id}
            role="button"
            tabIndex={0}
            onClick={() => onChange?.(type.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange?.(type.id);
              }
            }}
            className={`text-left rounded-lg border p-3 transition-all hover:border-primary-400/70 ${
              selectedType === type.id
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-700 bg-dark-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="h-8 w-20 rounded-md">
                <img
                  src={type.logoSrc}
                  alt={`${type.label} logo`}
                  className="h-full object-contain"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1 text-dark-300 hover:text-primary-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPaymentDetails(type.label);
                }}
                aria-label={`Copy ${type.label} payment details`}
              >
                <Copy size={14} />
              </button>
            </div>

            <p className="mt-2 text-sm font-semibold text-dark-50">{type.label}</p>
            <p className="text-xs text-dark-300 truncate">{PAYMENT_OWNER_NAME}</p>
            <p className="text-xs font-medium text-dark-100">{PAYMENT_NUMBER}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentTypeInfo;

