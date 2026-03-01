import { Banknote, CreditCard, Smartphone, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { PAYMENT_METHOD } from '../../../constants/paymentConstants';

export const paymentHistoryTableColumns = (handleDeletePayment) => [
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <div onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeletePayment(row);
          }}
          className="p-2 text-danger-600 hover:bg-danger-50 rounded"
          title="Delete Payment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  },
  {
    key: 'paymentDate',
    label: 'Date',
    render: (row) => formatDate(row.paymentDate),
  },
  {
    key: 'amount',
    label: 'Paid Amount',
    render: (row) => formatCurrency(row.amount),
  },
  {
    key: 'paymentMethod',
    label: 'Method & Ref #',
    render: (row) => (
      <div className="flex items-center gap-2">
        {row.paymentMethod === PAYMENT_METHOD.CASH && <Banknote className="w-4 h-4" />}
        {row.paymentMethod === PAYMENT_METHOD.CARD && <CreditCard className="w-4 h-4" />}
        {row.paymentMethod === PAYMENT_METHOD.GCASH && <Smartphone className="w-4 h-4" />}
        <span className="capitalize">{row.paymentMethod}</span>
        {row.referenceNumber && <span className="text-xs text-dark-400">({row.referenceNumber})</span>}
      </div>
    ),
  },
];
