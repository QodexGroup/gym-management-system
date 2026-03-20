import { Modal } from '../../../components/common';
import PaymentTypeInfo from '../../../components/common/PaymentTypeInfo';
import { formatCurrency } from '../../../utils/formatters';

const TrialUpgradeModal = ({
  isOpen,
  onClose,
  onSubmit,
  onFileChange,
  receiptFile,
  uploading,
  isSubmitting,
  paymentName,
  paymentAmount,
  paymentType,
  onPaymentTypeChange,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trial Upgrade – Upload Receipt"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-dark-300">
          Upload your payment receipt for the trial upgrade. An admin will review and approve it before your paid plan starts.
        </p>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 text-sm text-dark-100 space-y-1">
          <div className="flex justify-between">
            <span className="text-dark-400">Payment</span>
            <span className="font-semibold">{paymentName || 'Trial Upgrade'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Amount</span>
            <span className="font-semibold">
              {formatCurrency(paymentAmount || 0)}
            </span>
          </div>
        </div>

        <PaymentTypeInfo selectedType={paymentType} onChange={onPaymentTypeChange} />

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Upload payment receipt
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={onFileChange}
            disabled={uploading || isSubmitting}
            className="block w-full text-sm text-dark-100 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading || isSubmitting}
            className="w-1/2 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || isSubmitting || !receiptFile}
            className="w-1/2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading || isSubmitting ? 'Submitting...' : 'Submit Upgrade Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TrialUpgradeModal;

