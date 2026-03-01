import { Avatar, Badge } from '../../../components/common';
import { Phone, Mail, Calendar, Edit, Trash, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../utils/formatters';

export const customerTableColumns = ({ canEdit, canDelete, onEdit, onDelete }) => [
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (c) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onEdit?.(c, { view: true })} title="View">
          <ChevronRight className="w-4 h-4" />
        </button>

        {canEdit && (
          <button onClick={() => onEdit(c)} title="Edit">
            <Edit className="w-4 h-4" />
          </button>
        )}

        {canDelete && (
          <button onClick={() => onDelete(c.id)} title="Delete">
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
    ),
  },
  {
    key: 'member',
    label: 'Member',
    render: (c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim();

      return (
        <div className="flex items-center gap-3">
          <Avatar src={c.photo} name={fullName} size="md" />
          <div>
            <p className="font-semibold text-dark-50">{fullName || 'N/A'}</p>
            {c.email && (
              <p className="text-xs text-dark-400">{c.email}</p>
            )}
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
          <Badge variant={c.currentMembership.status === 'active' ? 'success' : 'default'}>
            {c.currentMembership.status}
          </Badge>
        </div>
      ) : (
        '-'
      ),
  },
  {
    key: 'trainer',
    label: 'Trainer',
    render: (c) =>
      c.currentTrainer
        ? c.currentTrainer.fullname ||
          `${c.currentTrainer.firstname || ''} ${c.currentTrainer.lastname || ''}`
        : '-',
  },
  {
    key: 'balance',
    label: 'Balance',
    render: (c) => formatCurrency(c.balance),
  },
];