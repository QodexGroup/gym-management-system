import { Avatar, Badge } from '../../../components/common';
import { Mail, Phone, Edit, Key, Trash, CheckCircle, XCircle } from 'lucide-react';
import { isAdminRole } from '../../../constants/userRoles';

export const userTableColumns = ({ getRoleBadge }) => [
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
    render: (user) => getRoleBadge(user.role),
  },
  {
    key: 'status',
    label: 'Status',
    render: (user) => (
      <Badge variant={user.status === 'active' ? 'success' : 'default'}>
        {user.status}
      </Badge>
    ),
  },
  ];


export const getUserActionMenuItems = ({
  user,
  onEdit,
  onResetPassword,
  onDeactivate,
  onActivate,
  onDelete,
}) => {
  const items = [
    {
      key: 'edit',
      label: 'Edit User',
      icon: Edit,
      onClick: () => onEdit?.(user),
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      icon: Key,
      onClick: () => onResetPassword?.(user),
    },
  ];

  if (!isAdminRole(user.role)) {
    items.push({ divider: true });
    
    if (user.status === 'active') {
      items.push({
        key: 'deactivate',
        label: 'Deactivate',
        icon: XCircle,
        variant: 'warning',
        onClick: () => onDeactivate?.(user),
      });
    } else {
      items.push({
        key: 'activate',
        label: 'Activate',
        icon: CheckCircle,
        variant: 'success',
        onClick: () => onActivate?.(user),
      });
    }
    
    items.push({
      key: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger',
      onClick: () => onDelete?.(user),
    });
  }

  return items;
};
