export const subscriptionInvoiceColumns = ({ formatMoney, formatStatusLabel, getStatusBadgeClass, onOpenReceipt }) => [
  {
    key: 'invoice',
    label: 'Invoice',
    render: (row) => row.invoiceNumber || '-',
  },
  {
    key: 'billingPeriod',
    label: 'Billing Period',
    render: (row) => row.billingPeriod || '-',
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => `P${formatMoney(row.invoiceDetails?.amount)}`,
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
];

