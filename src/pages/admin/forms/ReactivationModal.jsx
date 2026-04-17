import { useState } from 'react';
import { Modal } from '../../../components/common';
import PaymentTypeInfo from '../../../components/common/PaymentTypeInfo';
import { useAuth } from '../../../context/AuthContext';
import { uploadReceipt } from '../../../services/fileUploadService';
import { useCreateReactivationPaymentRequest } from '../../../hooks/useReactivationPaymentRequest';
import { SUBSCRIPTION_PAYMENT_TYPE } from '../../../constants/subscriptionConstants';
import { Toast } from '../../../utils/alert';
import { formatCurrency } from '../../../utils/formatters';

const REACTIVATION_FEE_PHP = 1200;

/**
 * Global reactivation modal shown when the account is locked.
 * - Shows reactivation fee upload and submit flow.
 */
const ReactivationModal = () => {
  const { account } = useAuth();
  const [file, setFile] = useState(null);
  const [paymentType, setPaymentType] = useState(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
  const [uploading, setUploading] = useState(false);

  const createPaymentRequest = useCreateReactivationPaymentRequest();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      Toast.error('Please upload a payment receipt image or PDF.');
      return;
    }

    try {
      setUploading(true);

      const { receiptUrl, receiptFileName } = await uploadReceipt(file, account.id);

      await createPaymentRequest.mutateAsync({
        receiptUrl: receiptUrl,
        receiptFileName: receiptFileName,
        paymentType,
      });

      Toast.success('Reactivation payment submitted. Please wait for admin approval.');
    } catch (err) {
      console.error('Failed to submit reactivation payment:', err);
      Toast.error(err.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => {}}
      closable={false}
      title="Account Locked – Reactivation Required"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-dark-300">
          Your account is locked due to unpaid subscription. To continue using the app, please pay the
          reactivation fee and upload your payment receipt. Our team will review and reactivate your
          account once approved.
        </p>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 text-sm text-dark-100 space-y-1">
          <div className="flex justify-between">
            <span className="text-dark-400">Payment</span>
            <span className="font-semibold">Reactivation Fee</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Amount</span>
            <span className="font-semibold">
              {formatCurrency(REACTIVATION_FEE_PHP)}
            </span>
          </div>
        </div>

        <PaymentTypeInfo selectedType={paymentType} onChange={setPaymentType} />

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Upload payment receipt
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={uploading || createPaymentRequest.isPending}
            className="block w-full text-sm text-dark-100 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || createPaymentRequest.isPending || !file}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading || createPaymentRequest.isPending ? 'Submitting...' : 'Submit Reactivation Payment'}
        </button>

        <p className="text-xs text-dark-400">
          If you need help, please contact GymHubPH Tech Support and include your gym name and invoice
          number.
        </p>
      </form>
    </Modal>
  );
};

export default ReactivationModal;

