import { Badge } from '../../components/common';
import { createActionColumn } from '../../components/DataTable';
import { Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_VARIANTS } from '../../shared/constants/expenseConstants';
import { formatCurrency } from '../../shared/utils/formatters';

export const getExpenseActionMenuItems = ({
  expense,
  isAdmin,
  hasUpdatePermission,
  hasDeletePermission,
  onEdit,
  onPost,
  onVoid,
  onDelete,
}) => {
  const isPosted = expense.status === EXPENSE_STATUS.POSTED;
  const items = [];

  if (!isPosted && hasUpdatePermission) {
    items.push({
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: () => onEdit?.(expense),
    });
  }

  if (isPosted) {
    if (isAdmin) {
      items.push({
        key: 'void',
        label: 'Void',
        icon: XCircle,
        variant: 'danger',
        onClick: () => onVoid?.(expense.id),
      });
    }
  } else {
    if (isAdmin) {
      items.push({
        key: 'post',
        label: 'Post',
        icon: CheckCircle,
        variant: 'success',
        onClick: () => onPost?.(expense.id),
      });
    }

    if (hasDeletePermission) {
      items.push({
        key: 'delete',
        label: 'Delete',
        icon: Trash,
        variant: 'danger',
        onClick: () => onDelete?.(expense.id),
      });
    }
  }

  return items;
};

export const expenseTableColumns = ({
  isAdmin,
  hasUpdatePermission,
  hasDeletePermission,
  onEdit,
  onPost,
  onVoid,
  onDelete,
}) => [
  createActionColumn((expense) =>
    getExpenseActionMenuItems({
      expense,
      isAdmin,
      hasUpdatePermission,
      hasDeletePermission,
      onEdit,
      onPost,
      onVoid,
      onDelete,
    })
  ),
  {
    key: 'date',
    label: 'Date',
    render: (expense) => expense.formattedDate,
  },
  {
    key: 'category',
    label: 'Category',
    render: (expense) => (
      <Badge variant="default">{expense.category}</Badge>
    ),
  },
  {
    key: 'description',
    label: 'Description',
    render: (expense) => (
      <span className="font-medium">{expense.description}</span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    render: (expense) => (
      <span className="font-semibold text-dark-50">
        {formatCurrency(expense.amount)}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (expense) => (
      <Badge
        variant={EXPENSE_STATUS_VARIANTS[expense.status] || 'default'}
      >
        {EXPENSE_STATUS_LABELS[expense.status] || expense.status}
      </Badge>
    ),
  },
];
