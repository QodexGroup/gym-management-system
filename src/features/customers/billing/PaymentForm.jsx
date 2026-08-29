import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar } from '../../../components/common';
import { formatCurrency, formatDate, normalizeDate } from '../../../shared/utils/formatters';
import { Banknote, CreditCard, Smartphone, Landmark } from 'lucide-react';
import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from '../../../shared/constants/paymentConstants';
import { useAccountSystemSettings } from '../../../shared/hooks/useAccountSystemSettings';
import { ACCOUNT_SYSTEM_SETTING_DEFAULTS } from '../../../shared/constants/accountSystemSettings';
import { useAuth } from '../../../shared/context/AuthContext';
import { uploadFile, getFileUrl } from '../../../shared/services/storageService';
import { useInvalidateStorageUsage } from '../../../shared/hooks/useStorage';
import { Toast } from '../../../shared/utils/alert';

const PaymentForm = ({ bill, member, onSubmit, onCancel, isSubmitting = false }) => {
  const { data: settings } = useAccountSystemSettings();
  const { account, user } = useAuth();
  const accountId = account?.id ?? user?.accountId;
  const invalidateStorageUsage = useInvalidateStorageUsage();
  const allowPartialPayments = settings?.allowPartialPayments ?? ACCOUNT_SYSTEM_SETTING_DEFAULTS.allowPartialPayments;

  const remainingAmount = useMemo(() => {
    const net = parseFloat(bill.netAmount) || 0;
    const paid = parseFloat(bill.paidAmount) || 0;
    const remaining = net - paid;
    return remaining > 0 ? remaining : 0;
  }, [bill]);

  const [amount, setAmount] = useState(String(remainingAmount));
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHOD.CASH);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const parsedAmount = parseFloat(amount);
  const isAmountInvalid = !amount || isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > remainingAmount;
  // When partial payments are disabled, the payment must settle the full remaining balance.
  const requiresFullPayment = !allowPartialPayments && (remainingAmount - (parsedAmount || 0)) > 0.001;

  /**
   * Validate, upload an attached receipt to R2 (quota-checked at presign), then
   * hand the payment payload — including the receipt path — to the parent.
   *
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAmountInvalid || requiresFullPayment) return;

    let receiptUrl = null;
    let receiptSizeKb = 0;

    if (receiptFile) {
      if (!accountId) {
        Toast.error('Account not loaded — cannot upload receipt.');
        return;
      }
      setUploadingReceipt(true);
      try {
        const res = await uploadFile(receiptFile, accountId, member.id);
        receiptUrl = res.fileUrl;
        receiptSizeKb = res.fileSize;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Receipt upload failed:', err);
        Toast.error(err.message || 'Failed to upload receipt');
        return;
      } finally {
        setUploadingReceipt(false);
      }
    }

    const payload = {
      amount: parseFloat(amount),
      paymentDate: normalizeDate(paymentDate),
      referenceNumber: referenceNumber || null,
      remarks: remarks || null,
      paymentMethod: method,
      receiptUrl,
      receiptSizeKb,
    };

    invalidateStorageUsage();
    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="p-4 bg-dark-700 border border-dark-600 rounded-xl flex items-center gap-4">
        <Avatar src={getFileUrl(member.avatar)} name={member.name} size="md" />
        <div className="space-y-1">
          <p className="font-semibold text-dark-50">{member.name}</p>
          <p className="text-sm text-dark-400">
            Bill Date: {formatDate(bill.billDate)} • Net: {formatCurrency(bill.netAmount)} • Paid:{' '}
            {formatCurrency(bill.paidAmount)}
          </p>
          <p className="text-sm text-success-400 font-medium">
            Remaining: {formatCurrency(remainingAmount)}
          </p>
        </div>
      </div>

      {/* Payment Date */}
      <div>
        <label className="label">Payment Date</label>
        <DatePicker
          selected={paymentDate}
          onChange={(date) => setPaymentDate(date || new Date())}
          dateFormat="yyyy-MM-dd"
          className="input w-full"
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          onKeyDown={(e) => {
            if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
              e.preventDefault();
            }
          }}
        />
      </div>

      {/* Amount */}
      <div>
        <label className="label">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">₱</span>
          <input
            type="number"
            className={`input pl-8 ${!allowPartialPayments ? 'bg-dark-700 cursor-not-allowed' : ''}`}
            placeholder="0.00"
            value={amount}
            min={0}
            max={remainingAmount}
            step="0.01"
            readOnly={!allowPartialPayments}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') { setAmount(''); return; }
              const value = parseFloat(raw);
              if (isNaN(value)) return;
              setAmount(value > remainingAmount ? String(remainingAmount) : raw);
            }}
            required
          />
        </div>
        {isAmountInvalid && (
          <p className="text-xs text-danger-600 mt-1">
            Amount must be greater than 0 and not more than {formatCurrency(remainingAmount)}.
          </p>
        )}
        {!isAmountInvalid && requiresFullPayment && (
          <p className="text-xs text-danger-600 mt-1">
            Partial payments are disabled — pay the full remaining balance of {formatCurrency(remainingAmount)}.
          </p>
        )}
        {!allowPartialPayments && !requiresFullPayment && (
          <p className="text-xs text-dark-400 mt-1">
            Partial payments are disabled; the full remaining balance is required.
          </p>
        )}
      </div>

      {/* Reference Number */}
      <div>
        <label className="label">Reference #</label>
        <input
          type="text"
          className="input"
          placeholder="Enter reference number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />
      </div>

      {/* Remarks */}
      <div>
        <label className="label">Remarks</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Add any remarks about this payment"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      {/* Receipt (optional) */}
      <div>
        <label className="label">Receipt (optional)</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="input"
          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          disabled={uploadingReceipt || isSubmitting}
        />
        {receiptFile && <p className="text-xs text-dark-400 mt-1">{receiptFile.name}</p>}
      </div>

      {/* Payment Method */}
      <div>
        <label className="label">Payment Method</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: PAYMENT_METHOD.CASH, icon: Banknote },
            { value: PAYMENT_METHOD.CARD, icon: CreditCard },
            { value: PAYMENT_METHOD.GCASH, icon: Smartphone },
            { value: PAYMENT_METHOD.BANK_TRANSFER, icon: Landmark },
          ].map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMethod(value)}
              className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                method === value
                  ? 'border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-primary-500 hover:bg-dark-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${method === value ? 'text-white' : 'text-dark-400'}`} />
              <span className="font-medium">{PAYMENT_METHOD_LABELS[value]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary" disabled={isSubmitting || uploadingReceipt}>
          Cancel
        </button>
        <button type="submit" className="flex-1 btn-success" disabled={isSubmitting || uploadingReceipt || isAmountInvalid || requiresFullPayment}>
          {uploadingReceipt ? 'Uploading receipt...' : isSubmitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
