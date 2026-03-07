import { Badge } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../utils/formatters';

export const recentPaymentsTableColumns = [
  {
    key: 'date',
    label: 'Date',
    render: (row) => <span>{formatDate(row.date)}</span>,
  },
  {
    key: 'member',
    label: 'Member',
    render: (row) => <span className="font-medium">{row.member}</span>,
  },
  {
    key: 'type',
    label: 'Type',
    render: (row) => <Badge variant="primary">{row.type}</Badge>,
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (row) => (
      <span className="font-semibold text-success-600">
        {formatCurrency(row.amount)}
      </span>
    ),
  },
];
