import { createActionColumn } from '../../../components/DataTable';
import { Banknote, CreditCard, Smartphone, Landmark, Trash2 } from 'lucide-react';
import { FilePreview } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import {
  PAYMENT_METHOD,
  formatPaymentMethod,
  normalizePaymentMethod,
} from '../../../shared/constants/paymentConstants';

/**
 * Build the action-menu items for a payment history row.
 *
 * @param {Object} row
 * @param {(row: Object) => void} handleDeletePayment
 * @returns {Array<Object>}
 */
export const getPaymentHistoryActionMenuItems = (row, handleDeletePayment) => [
  {
    key: 'delete',
    label: 'Delete Payment',
    icon: Trash2,
    variant: 'danger',
    onClick: () => handleDeletePayment?.(row),
  },
];

/**
 * Column config for the payment history table shown in the bill modal.
 * Includes a Receipt column (image → lightbox, PDF → new tab) via FilePreview.
 *
 * @param {(row: Object) => void} handleDeletePayment
 * @param {{ readOnly?: boolean }} [options] When readOnly, the delete action
 *   column is omitted (used by the View Bill modal).
 * @returns {Array<Object>}
 */
export const paymentHistoryTableColumns = (handleDeletePayment, { readOnly = false } = {}) => [
  ...(readOnly
    ? []
    : [createActionColumn((row) => getPaymentHistoryActionMenuItems(row, handleDeletePayment))]),
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
    render: (row) => {
      // Normalize first so legacy stored values ('bank_transfer', 'credit_card')
      // still get the right icon and label, not a bare capitalized raw string.
      const method = normalizePaymentMethod(row.paymentMethod);
      return (
        <div className="flex items-center gap-2">
          {method === PAYMENT_METHOD.CASH && <Banknote className="w-4 h-4" />}
          {method === PAYMENT_METHOD.CARD && <CreditCard className="w-4 h-4" />}
          {method === PAYMENT_METHOD.GCASH && <Smartphone className="w-4 h-4" />}
          {method === PAYMENT_METHOD.BANK_TRANSFER && <Landmark className="w-4 h-4" />}
          <span className="capitalize">{formatPaymentMethod(row.paymentMethod)}</span>
          {row.referenceNumber && (
            <span className="text-xs text-dark-400">({row.referenceNumber})</span>
          )}
        </div>
      );
    },
  },
  {
    key: 'receipt',
    label: 'Receipt',
    render: (row) => <FilePreview path={row.receiptUrl} alt="Payment receipt" />,
  },
];
