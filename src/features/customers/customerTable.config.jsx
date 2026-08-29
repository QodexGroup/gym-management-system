import { Avatar, Badge } from '../../components/common';
import { createActionColumn } from '../../components/DataTable';
import { Phone, Mail, Calendar, Edit, Trash, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '../../shared/utils/formatters';
import {
  CUSTOMER_MEMBERSHIP_STATUS,
  getCustomerMembershipDisplayStatus,
} from '../../shared/constants/customerMembership';
import { getFileUrl } from '../../shared/services/storageService';

export const getCustomerActionMenuItems = ({
  customer,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onView,
}) => {
  const items = [
    {
      key: 'view',
      label: 'View',
      icon: ChevronRight,
      onClick: () => onView?.(customer.id),
    },
  ];

  if (canEdit) {
    items.push({
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: () => onEdit?.(customer),
    });
  }

  if (canDelete) {
    items.push({
      key: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger',
      onClick: () => onDelete?.(customer.id),
    });
  }

  return items;
};

export const customerTableColumns = ({ canEdit, canDelete, onEdit, onDelete, onView }) => [
  createActionColumn((customer) =>
    getCustomerActionMenuItems({
      customer,
      canEdit,
      canDelete,
      onEdit,
      onDelete,
      onView,
    })
  ),
  {
    key: 'client',
    label: 'Client',
    render: (c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
      return (
        <div className="flex items-center gap-3">
          <Avatar src={getFileUrl(c.photo)} name={fullName} size="md" />
          <div>
            <p className="font-semibold text-dark-50">{fullName || 'N/A'}</p>
            {c.email && <p className="text-xs text-dark-400">{c.email}</p>}
          </div>
        </div>
      );
    },
  },
  {
    key: 'contact',
    label: 'Contact',
    render: (c) => (
      <div className="space-y-1">
        {c.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Phone className="w-3.5 h-3.5" />
            {c.phoneNumber}
          </div>
        )}
        {c.email && (
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Mail className="w-3.5 h-3.5" />
            {c.email}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'address',
    label: 'Address',
    render: (c) => c.address || '-',
  },
  {
    key: 'membership',
    label: 'Membership',
    render: (c) =>
      c.currentMembership?.membershipPlan ? (
        <div className="space-y-1">
          <span className="text-sm font-medium text-dark-50">
            {c.currentMembership.membershipPlan.planName}
          </span>
          <p className="text-xs text-dark-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Expires: {formatDate(c.currentMembership.membershipEndDate)}
          </p>
          {(() => {
            const status = getCustomerMembershipDisplayStatus(c);
            const badge = {
              [CUSTOMER_MEMBERSHIP_STATUS.ACTIVE]: { variant: 'success', label: 'active' },
              [CUSTOMER_MEMBERSHIP_STATUS.EXPIRING]: { variant: 'warning', label: 'expiring soon' },
              [CUSTOMER_MEMBERSHIP_STATUS.EXPIRED]: { variant: 'danger', label: 'expired' },
            }[status] || { variant: 'default', label: status || c.currentMembership.status };

            return <Badge variant={badge.variant}>{badge.label}</Badge>;
          })()}
        </div>
      ) : (
        '-'
      ),
  },
  {
    key: 'balance',
    label: 'Balance',
    render: (c) => formatCurrency(c.balance),
  },
];
