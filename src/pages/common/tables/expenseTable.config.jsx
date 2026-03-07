import { Badge } from '../../../components/common';
import { Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_VARIANTS } from '../../../constants/expenseConstants';
import { formatCurrency } from '../../../utils/formatters';

export const expenseTableColumns = ({
  isAdmin,
  hasUpdatePermission,
  hasDeletePermission,
  onEdit,
  onPost,
  onVoid,
  onDelete,
}) => [
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (expense) => {
      const isPosted = expense.status === EXPENSE_STATUS.POSTED;
      
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!isPosted && hasUpdatePermission && (
            <button
              onClick={() => onEdit?.(expense)}
              className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Edit expense"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {isPosted ? (
            isAdmin && (
              <button
                onClick={() => onVoid?.(expense.id)}
                className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                title="Void expense"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )
          ) : (
            <>
              {isAdmin && (
                <button
                  onClick={() => onPost?.(expense.id)}
                  className="p-2 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                  title="Post expense"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
              {hasDeletePermission && (
                <button
                  onClick={() => onDelete?.(expense.id)}
                  className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Delete expense"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      );
    },
  },
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

