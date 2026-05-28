import { createActionColumn } from '../../../components/DataTable';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Badge } from '../../../components/common';
import { formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { BILL_TYPE } from '../../../shared/constants/billConstants';
import { BILL_STATUS, BILL_STATUS_LABELS, BILL_STATUS_VARIANTS } from '../../../shared/constants/billConstants';

export const getBillActionMenuItems = ({
  row,
  canEdit,
  canDelete,
  canAddPayment,
  onEdit,
  onDelete,
  onAddPayment,
}) => {
  const items = [];

  if (canAddPayment && row.billStatus !== BILL_STATUS.PAID && row.billStatus !== BILL_STATUS.VOIDED) {
    items.push({
      key: 'add-payment',
      label: 'Add Payment',
      icon: Plus,
      variant: 'success',
      onClick: () => onAddPayment?.(row),
    });
  }

  if (canEdit && row.billStatus !== BILL_STATUS.VOIDED) {
    items.push({
      key: 'edit',
      label: 'Edit Bill',
      icon: Edit,
      onClick: () => onEdit?.(row),
    });
  }

  if (canDelete && row.billStatus !== BILL_STATUS.PAID && row.billStatus !== BILL_STATUS.VOIDED) {
    items.push({
      key: 'delete',
      label: 'Delete Bill',
      icon: Trash2,
      variant: 'danger',
      onClick: () => onDelete?.(row.id),
    });
  }

  return items;
};

export const billsTableColumns = ({ canEdit, canDelete, canAddPayment, onEdit, onDelete, onAddPayment }) => [
  createActionColumn((row) =>
    getBillActionMenuItems({
      row,
      canEdit,
      canDelete,
      canAddPayment,
      onEdit,
      onDelete,
      onAddPayment,
    })
  ),
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
];
