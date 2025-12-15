import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Avatar } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';

const PaymentForm = ({ bill, member, onSubmit, onCancel }) => {
  const remainingAmount = useMemo(() => {
    const net = parseFloat(bill.netAmount) || 0;
    const paid = parseFloat(bill.paidAmount) || 0;
    const remaining = net - paid;
    return remaining > 0 ? remaining : 0;
  }, [bill]);

  const [amount, setAmount] = useState(remainingAmount);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [method, setMethod] = useState('cash');

  const isAmountInvalid = amount <= 0 || amount > remainingAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAmountInvalid) return;

    const payload = {
      amount: parseFloat(amount),
      paymentDate: paymentDate.toISOString().split('T')[0],
      referenceNumber: referenceNumber || null,
      remarks: remarks || null,
      paymentMethod: method,
    };

    onSubmit(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="p-4 bg-dark-50 rounded-xl flex items-center gap-4">
        <Avatar src={member.avatar} name={member.name} size="md" />
        <div className="space-y-1">
          <p className="font-semibold text-dark-800">{member.name}</p>
          <p className="text-sm text-dark-500">
            Bill Date: {formatDate(bill.billDate)} • Net: {formatCurrency(bill.netAmount)} • Paid:{' '}
            {formatCurrency(bill.paidAmount)}
          </p>
          <p className="text-sm text-success-600 font-medium">
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
            className="input pl-8"
            placeholder="0.00"
            value={amount}
            min={0}
            max={remainingAmount}
            step="0.01"
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              if (value > remainingAmount) {
                setAmount(remainingAmount);
              } else {
                setAmount(value);
              }
            }}
            required
          />
        </div>
        {isAmountInvalid && (
          <p className="text-xs text-danger-600 mt-1">
            Amount must be greater than 0 and not more than {formatCurrency(remainingAmount)}.
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

      {/* Payment Method */}
      <div>
        <label className="label">Payment Method</label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
              method === 'cash'
                ? 'border-primary-500 bg-primary-50'
                : 'border-dark-200 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
              method === 'card'
                ? 'border-primary-500 bg-primary-50'
                : 'border-dark-200 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Card</span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('gcash')}
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
              method === 'gcash'
                ? 'border-primary-500 bg-primary-50'
                : 'border-dark-200 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>GCash</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn-secondary">
          Cancel
        </button>
        <button type="submit" className="flex-1 btn-success" disabled={isAmountInvalid}>
          Record Payment
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;


