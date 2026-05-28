import { Avatar, Badge } from '../../components/common';
import { createActionColumn } from '../../components/DataTable';
import { Clock, UserX, Ban } from 'lucide-react';
import { formatTimeFromDate } from '../../shared/utils/formatters';
import { WALKIN_CUSTOMER_STATUS, WALKIN_CUSTOMER_STATUS_LABELS } from '../../shared/constants/walkinConstant';

export const getWalkinCustomerActionMenuItems = ({
  wc,
  onCheckOut,
  onCancel,
  isCheckingOut = false,
  isCancelling = false,
}) => {
  if (wc.status !== WALKIN_CUSTOMER_STATUS.INSIDE) {
    return [];
  }

  const items = [];

  if (onCheckOut) {
    items.push({
      key: 'checkout',
      label: isCheckingOut ? 'Checking Out...' : 'Check Out',
      icon: UserX,
      variant: 'danger',
      disabled: isCheckingOut,
      onClick: () => onCheckOut?.(wc.id),
    });
  }

  if (onCancel) {
    items.push({
      key: 'cancel',
      label: isCancelling ? 'Cancelling...' : 'Cancel',
      icon: Ban,
      variant: 'warning',
      disabled: isCancelling,
      onClick: () => onCancel?.(wc.id),
    });
  }

  return items;
};

export const walkinCustomerTableColumns = ({ onCheckOut, onCancel, isCheckingOut = false, isCancelling = false }) => [
  createActionColumn((wc) =>
    getWalkinCustomerActionMenuItems({
      wc,
      onCheckOut,
      onCancel,
      isCheckingOut,
      isCancelling,
    })
  ),
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
];
