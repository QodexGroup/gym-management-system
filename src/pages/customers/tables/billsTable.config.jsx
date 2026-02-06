import { Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { Badge } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { BILL_TYPE } from '../../../constants/billConstants';
import { BILL_STATUS, BILL_STATUS_LABELS, BILL_STATUS_VARIANTS } from '../../../constants/billConstants';

export const billsTableColumns = ({ canEdit, canDelete, canAddPayment, onEdit, onDelete, onAddPayment }) => [
  {
    key: 'billDate',
    label: 'Bill Date',
    render: (row) => <span>{formatDate(row.billDate)}</span>,
  },
  {
    key: 'billType',
    label: 'Bill Type',
    render: (row) => {
      const billTypeDisplay = row.billType === BILL_TYPE.CUSTOM_AMOUNT && row.customService
        ? `${row.billType} - ${row.customService}`
        : row.billType;
      return <span>{billTypeDisplay}</span>;
    },
  },
  {
    key: 'netAmount',
    label: 'Net Amount',
    render: (row) => <span className="font-semibold">{formatCurrency(row.netAmount)}</span>,
  },
  {
    key: 'paidAmount',
    label: 'Paid Amount',
    render: (row) => <span className="font-semibold">{formatCurrency(row.paidAmount)}</span>,
  },
  {
    key: 'billStatus',
    label: 'Status',
    render: (row) => (
      <Badge variant={BILL_STATUS_VARIANTS[row.billStatus] || 'warning'}>
        {BILL_STATUS_LABELS[row.billStatus] || row.billStatus}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => {
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {canAddPayment && row.billStatus !== BILL_STATUS.PAID && row.billStatus !== BILL_STATUS.VOIDED && (
            <button
              onClick={() => onAddPayment?.(row)}
              className="p-2 rounded-lg text-dark-400 hover:text-success-600 hover:bg-success-50 transition-colors"
              title="Add Payment"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          {canEdit && row.billStatus !== BILL_STATUS.VOIDED && (
            <button
              onClick={() => onEdit?.(row)}
              className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
              title="Edit Bill"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && row.billStatus !== BILL_STATUS.PAID && (
            <button
              onClick={() => onDelete?.(row.id)}
              className="p-2 rounded-lg text-dark-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Delete Bill"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    },
  },
];