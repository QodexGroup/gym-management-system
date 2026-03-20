import { SUBSCRIPTION_PAYMENT_STATUS } from '../../../constants/subscriptionConstants';

export const subscriptionInvoiceColumns = ({ formatMoney, formatDate, formatStatusLabel, getStatusBadgeClass, onOpenReceipt, onPayInvoice }) => [
  {
    key: 'invoiceNo',
    label: 'Invoice No',
    render: (row) => row.paymentDetails?.invoice_number || '-',
  },
  {
    key: 'billingPeriod',
    label: 'Billing Period',
    render: (row) => row.paymentDetails?.billing_period || '-',
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    render: (row) => {
      const date = row.paymentDetails?.invoice_date || row.createdAt;
      return date ? formatDate(date) : '-';
    },
  },
  {
    key: 'invoiceDetails',
    label: 'Invoice Details',
    render: (row) => row.paymentDetails?.invoiceType || 'Subscription Invoice',
  },
  {
    key: 'totalAmount',
    label: 'Total Amount',
    render: (row) => `${formatMoney(row.amount)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(row.status)}`}>
        {formatStatusLabel(row.status)}
      </span>
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
  {
    key: 'actions',
    label: 'Actions',
    render: (row) => {
      // Allow payment on first-time pending and resubmission after rejection.
      const canPay =
        row.status === SUBSCRIPTION_PAYMENT_STATUS.PENDING ||
        row.status === SUBSCRIPTION_PAYMENT_STATUS.REJECTED;

      if (canPay) {
        return (
          <button
            type="button"
            onClick={() => onPayInvoice?.(row)}
            className="btn-primary btn-sm"
          >
            Pay Invoice
          </button>
        );
      }
      return <span className="text-dark-400">-</span>;
    },
  },
];

