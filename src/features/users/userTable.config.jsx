import { Avatar, Badge } from '../../components/common';
import { Mail, Phone, Edit, Key, Trash, CheckCircle, XCircle } from 'lucide-react';
import {
  isAdminRole,
  isPermissionBasedRole,
  USER_ROLE_LABELS,
  USER_ROLE_VARIANTS,
  USER_STATUS,
  USER_STATUS_VARIANTS,
} from '../../shared/constants/userRoles';

export const userTableColumns = ({
  onEdit,
  onResetPassword,
  onDeactivate,
  onActivate,
  onDelete,
}) => [
  {
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (user) => {
      if (user.isAccountOwner) {
        return null;
      }

      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit?.(user)}
            className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onResetPassword?.(user)}
            className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Reset password"
          >
            <Key className="w-4 h-4" />
          </button>
          {!isAdminRole(user.role) && (
            user.status === USER_STATUS.ACTIVE ? (
              <button
                onClick={() => onDeactivate?.(user)}
                className="p-2 text-dark-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                title="Deactivate user"
              >
                <XCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onActivate?.(user)}
                className="p-2 text-dark-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                title="Activate user"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )
          )}
          {!isAdminRole(user.role) && (
            <button
              onClick={() => onDelete?.(user)}
              className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="Delete user"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    },
  },
  {
    key: 'user',
    label: 'User',
    render: (user) => {
      const fullName = user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim();

      return (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={fullName} size="md" />
          <div>
            <p className="font-medium text-dark-50">{fullName || 'N/A'}</p>
            <p className="text-xs text-dark-400">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    key: 'contact',
    label: 'Contact',
    render: (user) => (
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1 text-sm">
          <Mail className="w-3.5 h-3.5 text-dark-400" />
          {user.email}
        </span>
        {user.phone && (
          <span className="flex items-center gap-1 text-sm">
            <Phone className="w-3.5 h-3.5 text-dark-400" />
            {user.phone}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'role',
    label: 'Role',
    render: (user) => (
      <Badge variant={USER_ROLE_VARIANTS[user.role] || 'default'}>
        {USER_ROLE_LABELS[user.role] || user.role}
      </Badge>
    ),
  },
  {
    key: 'permissions',
    label: 'Permissions',
    render: (user) => {
      if (isAdminRole(user.role)) {
        return <span className="text-sm text-dark-400">Full access</span>;
      }

      if (isPermissionBasedRole(user.role)) {
        const count = user.permissions?.length ?? 0;
        return (
          <span className="text-sm text-dark-200">
            {count > 0 ? `${count} permissions` : 'None'}
          </span>
        );
      }

      return <span className="text-sm text-dark-400">—</span>;
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (user) => (
      <Badge variant={USER_STATUS_VARIANTS[user.status] || 'default'}>
        {user.status}
      </Badge>
    ),
  },
];
