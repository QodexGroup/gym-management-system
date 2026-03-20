import {
  SUBSCRIPTION_PAYMENT_DETAIL_TYPE,
  SUBSCRIPTION_PAYMENT_STATUS,
  SUBSCRIPTION_PAYMENT_TRANSACTION,
  SUBSCRIPTION_PAYMENT_TYPE,
} from '../../../constants/subscriptionConstants';

export const subscriptionPaymentColumns = ({ formatMoney, formatDate, formatStatusLabel, getStatusBadgeClass, onOpenReceipt }) => [
  {
    key: 'paymentDate',
    label: 'Payment Date',
    render: (row) => {
      const paymentDate = row.approvedAt || row.createdAt;
      return paymentDate ? formatDate(paymentDate) : '-';
    },
  },
  {
    key: 'paymentFor',
    label: 'Payment For',
    render: (row) => {
      if (row.paymentTransaction === SUBSCRIPTION_PAYMENT_TRANSACTION.REACTIVATION_FEE) return 'Reactivation Fee';
      if (row.paymentDetails?.type === SUBSCRIPTION_PAYMENT_DETAIL_TYPE.UPGRADE_PLAN) return 'Upgrade Plan';
      if (row.paymentTransaction?.includes(SUBSCRIPTION_PAYMENT_TRANSACTION.ACCOUNT_INVOICE_CLASS_KEYWORD)) return 'Invoice';
      return row.paymentDetails?.type || 'Payment';
    },
  },
  {
    key: 'paymentType',
    label: 'Payment Type',
    render: (row) => {
      if (row.paymentType === SUBSCRIPTION_PAYMENT_TYPE.GCASH) return 'GCash';
      if (row.paymentType === SUBSCRIPTION_PAYMENT_TYPE.MAYA) return 'Maya';
      return '-';
    },
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => `${formatMoney(row.amount)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <div className="space-y-1">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(row.status)}`}>
          {formatStatusLabel(row.status)}
          {row.status === SUBSCRIPTION_PAYMENT_STATUS.REJECTED && row.rejectionReason ? ` (${row.rejectionReason})` : ''}
        </span>
      </div>
    ),
  },
  {
    key: 'receipt',
    label: 'Receipt',
    render: (row) =>
      row.receiptUrl ? (
        <button
          type="button"
          onClick={() => onOpenReceipt?.(row.receiptUrl)}
          className="text-primary-500 hover:text-primary-400 underline"
        >
          {row.receiptFileName || 'View Receipt'}
        </button>
      ) : (
        <span className="text-dark-400">-</span>
      ),
  },
];

