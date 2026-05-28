import { createActionColumn } from '../../../components/DataTable';
import { Banknote, CreditCard, Smartphone, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { PAYMENT_METHOD } from '../../../shared/constants/paymentConstants';

export const getPaymentHistoryActionMenuItems = (row, handleDeletePayment) => [
  {
    key: 'delete',
    label: 'Delete Payment',
    icon: Trash2,
    variant: 'danger',
    onClick: () => handleDeletePayment?.(row),
  },
];

export const paymentHistoryTableColumns = (handleDeletePayment) => [
  createActionColumn((row) => getPaymentHistoryActionMenuItems(row, handleDeletePayment)),
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
