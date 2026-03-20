import { useState } from 'react';
import { Modal } from '../../../components/common';
import PaymentTypeInfo from '../../../components/common/PaymentTypeInfo';
import { useAuth } from '../../../context/AuthContext';
import { uploadReceipt } from '../../../services/fileUploadService';
import { useCreateInvoicePaymentRequest } from '../../../hooks/useInvoicePaymentRequest';
import { SUBSCRIPTION_PAYMENT_TYPE } from '../../../constants/subscriptionConstants';
import { Toast } from '../../../utils/alert';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Modal for submitting payment for an invoice.
 * Allows user to upload receipt and submit payment request.
 */
const InvoicePaymentModal = ({ invoice, isOpen, onClose }) => {
  const { account } = useAuth();
  const [file, setFile] = useState(null);
  const [paymentType, setPaymentType] = useState(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
  const [uploading, setUploading] = useState(false);

  const createPaymentRequest = useCreateInvoicePaymentRequest();

  const handleClose = () => {
    if (uploading || createPaymentRequest.isPending) return;
    setFile(null);
    setPaymentType(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
    onClose();
  };

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

      // Upload receipt using the dedicated function
      const { receiptUrl, receiptFileName } = await uploadReceipt(file, account.id);

      // Use paymentTransactionId if available (invoice ID), otherwise use id
      const invoiceId = invoice.paymentTransactionId || invoice.id;
      
      await createPaymentRequest.mutateAsync({
        invoiceId: invoiceId,
        receiptUrl: receiptUrl,
        receiptFileName: receiptFileName,
        paymentType,
      });

      // Close modal and reset form on success
      setFile(null);
      setPaymentType(SUBSCRIPTION_PAYMENT_TYPE.GCASH);
      onClose();
    } catch (err) {
      console.error('Failed to submit payment request:', err);
      // Error toast is already handled in the hook
    } finally {
      setUploading(false);
    }
  };

  // Get invoice amount from paymentDetails or invoiceDetails or amount field
  const invoiceAmount = invoice?.paymentDetails?.total_amount || invoice?.invoiceDetails?.amount || invoice?.amount || invoice?.totalAmount || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Pay Invoice"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-dark-300">
            Please upload your payment receipt for this invoice. Our team will review and approve your payment.
          </p>
          
          {invoice?.invoiceNumber && (
            <p className="text-sm text-dark-400">
              Invoice: <span className="font-medium text-dark-200">{invoice.invoiceNumber}</span>
            </p>
          )}
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 text-sm text-dark-100 space-y-1">
          <div className="flex justify-between">
            <span className="text-dark-400">Amount Due</span>
            <span className="font-semibold">
              {formatCurrency(invoiceAmount)}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading || createPaymentRequest.isPending}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || createPaymentRequest.isPending || !file}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading || createPaymentRequest.isPending ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>

        <p className="text-xs text-dark-400">
          If you need help, please contact GymHubPH Tech Support and include your gym name and invoice number.
        </p>
      </form>
    </Modal>
  );
};

export default InvoicePaymentModal;
