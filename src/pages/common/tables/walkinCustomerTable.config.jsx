import { Avatar, Badge } from '../../../components/common';
import { Clock, UserX, Ban } from 'lucide-react';
import { formatTimeFromDate } from '../../../utils/formatters';
import { WALKIN_CUSTOMER_STATUS, WALKIN_CUSTOMER_STATUS_LABELS } from '../../../constants/walkinConstant';

export const walkinCustomerTableColumns = ({ onCheckOut, onCancel }) => [
  {
    key: 'customer',
    label: 'Member',
    render: (wc) => {
      const customer = wc.customer || {};
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

      return (
        <div className="flex items-center gap-3">
          <Avatar src={customer.photo} name={fullName} size="md" />
          <div>
            <p className="font-semibold text-dark-50">{fullName || 'N/A'}</p>
            {customer.email && (
              <p className="text-xs text-dark-400">{customer.email}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: 'check_in_time',
    label: 'Check-In Time',
    render: (wc) => {
      // Handle both camelCase (from API) and snake_case formats
      const checkInTime = wc.checkInTime;
      return (
        <div className="flex items-center gap-2 text-sm text-dark-300">
          <Clock className="w-4 h-4" />
          {checkInTime ? formatTimeFromDate(checkInTime) : 'N/A'}
        </div>
      );
    },
  },
  {
    key: 'check_out_time',
    label: 'Check-Out Time',
    render: (wc) => {
      // Handle both camelCase (from API) and snake_case formats
      const checkOutTime = wc.checkOutTime;
      return (
        <div className="flex items-center gap-2 text-sm text-dark-300">
          {checkOutTime ? (
            <>
              <Clock className="w-4 h-4" />
              {formatTimeFromDate(checkOutTime)}
            </>
          ) : (
            <span className="text-dark-400">-</span>
          )}
        </div>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (wc) => {
      const statusVariants = {
        [WALKIN_CUSTOMER_STATUS.INSIDE]: { variant: 'success', label: WALKIN_CUSTOMER_STATUS_LABELS[WALKIN_CUSTOMER_STATUS.INSIDE] },
        [WALKIN_CUSTOMER_STATUS.OUTSIDE]: { variant: 'default', label: WALKIN_CUSTOMER_STATUS_LABELS[WALKIN_CUSTOMER_STATUS.OUTSIDE] },
        [WALKIN_CUSTOMER_STATUS.CANCELLED]: { variant: 'danger', label: WALKIN_CUSTOMER_STATUS_LABELS[WALKIN_CUSTOMER_STATUS.CANCELLED] },
      };
      const status = statusVariants[wc.status] || statusVariants[WALKIN_CUSTOMER_STATUS.INSIDE];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (wc) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {wc.status === WALKIN_CUSTOMER_STATUS.INSIDE && onCheckOut && (
          <button
            onClick={() => onCheckOut(wc.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            title="Check Out"
          >
            <UserX className="w-4 h-4" />
            Check Out
          </button>
        )}
        {wc.status === WALKIN_CUSTOMER_STATUS.INSIDE && onCancel && (
          <button
            onClick={() => onCancel(wc.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <Ban className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>
    ),
  },
];
