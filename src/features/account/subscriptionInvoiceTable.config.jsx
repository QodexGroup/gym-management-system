import { createActionColumn } from '../../components/DataTable';
import { CreditCard } from 'lucide-react';
import { SUBSCRIPTION_INVOICE_STATUS } from '../../shared/constants/subscriptionConstants';

/**
 * Row actions for the account's invoice list.
 *
 * "Pay Invoice" is offered only for an invoice that is genuinely payable: not
 * already paid or void, and with no receipt still awaiting review. Submitting a
 * second receipt while the first is pending is refused by the API anyway, so
 * offering it here would only produce an error the owner cannot act on.
 *
 * @param {object} row
 * @param {{onPayInvoice?: (row: object) => void}} handlers
 * @returns {object[]}
 */
export const getSubscriptionInvoiceActionMenuItems = (row, { onPayInvoice }) => {
  const isUnpaid =
    row.status === SUBSCRIPTION_INVOICE_STATUS.PENDING ||
    row.status === SUBSCRIPTION_INVOICE_STATUS.OVERDUE;

  if (!isUnpaid || row.hasPendingPaymentRequest) {
    return [];
  }

  return [
    {
      key: 'pay',
      label: 'Pay Invoice',
      icon: CreditCard,
      variant: 'success',
      onClick: () => onPayInvoice?.(row),
    },
  ];
};

/**
 * Columns for the account's invoice list.
 *
 * These render INVOICES. The receipt column reads the invoice's latest payment
 * request, which is absent until the owner submits one.
 *
 * @param {{
 *   formatMoney: (value: number) => string,
 *   formatDate: (value: string) => string,
 *   formatStatusLabel: (status: string) => string,
 *   getStatusBadgeClass: (status: string) => string,
 *   onOpenReceipt?: (url: string) => void,
 *   onPayInvoice?: (row: object) => void
 * }} handlers
 * @returns {object[]}
 */
export const subscriptionInvoiceColumns = ({ formatMoney, formatDate, formatStatusLabel, getStatusBadgeClass, onOpenReceipt, onPayInvoice }) => [
  createActionColumn((row) => getSubscriptionInvoiceActionMenuItems(row, { onPayInvoice })),
  {
    key: 'invoiceNo',
    label: 'Invoice No',
    render: (row) => row.invoiceNumber || '-',
  },
  {
    key: 'billingPeriod',
    label: 'Billing Period',
    render: (row) =>
      row.periodFrom && row.periodTo
        ? `${formatDate(row.periodFrom)} - ${formatDate(row.periodTo)}`
        : row.billingPeriod || '-',
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    render: (row) => (row.invoiceDate ? formatDate(row.invoiceDate) : '-'),
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    render: (row) => (row.dueDate ? formatDate(row.dueDate) : '-'),
  },
  {
    key: 'invoiceDetails',
    label: 'Invoice Details',
    render: (row) => row.invoiceType || 'Subscription Invoice',
  },
  {
    key: 'totalAmount',
    label: 'Total Amount',
    render: (row) => `${formatMoney(row.totalAmount)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <div className="flex flex-col gap-1">
        <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeClass(row.status)}`}>
          {formatStatusLabel(row.status)}
        </span>
        {row.hasPendingPaymentRequest ? (
          <span className="text-xs text-dark-400">Receipt awaiting review</span>
        ) : null}
      </div>
    ),
  },
  {
    key: 'receipt',
    label: 'Receipt',
    render: (row) =>
      row.latestPaymentRequest?.receiptUrl ? (
        <button
          type="button"
          onClick={() => onOpenReceipt?.(row.latestPaymentRequest.receiptUrl)}
          className="text-primary-500 hover:text-primary-400 underline"
        >
          {row.latestPaymentRequest.receiptFileName || 'View Receipt'}
        </button>
      ) : (
        <span className="text-dark-400">-</span>
      ),
  },
];
