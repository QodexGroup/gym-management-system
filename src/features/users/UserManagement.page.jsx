import { useState, useMemo, useCallback } from 'react';
import Layout from '../../layout/Layout';
import { Modal, SearchAndFilter } from '../../components/common';
import StatsCards from '../../components/common/StatsCards';
import DataTable from '../../components/DataTable';
import {
  Plus,
  Shield,
  UserCog,
  Users,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import {
  useUsers,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
} from '../../shared/hooks/useUsers';
import { useAccountLimit } from '../../shared/hooks/useAccountLimit';
import { useAuth } from '../../shared/context/AuthContext';
import UserForm from './UserForm';
import ResetPasswordForm from './ResetPasswordForm';
import { USER_ROLES, USER_ROLE_OPTIONS, USER_STATUS } from '../../shared/constants/userRoles';
import { userTableColumns } from './userTable.config';
import { mapUsersData } from '../../shared/models/userModel';
import { useConfirmAction } from '../../shared/hooks/useConfirmAction';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { fetchUserData } = useAuth();
  const { data: usersData = [], isLoading, error } = useUsers();
  const { canCreate: canAddUser } = useAccountLimit('users');
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();

  const users = useMemo(() => mapUsersData(usersData), [usersData]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const handleEditUser = useCallback((user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setShowUserModal(true);
  }, []);

  const handleDeleteUser = useConfirmAction(
    (user) => deleteUserMutation.mutateAsync(user.id),
    { title: 'Delete User?', text: 'Are you sure you want to delete this user? This action cannot be undone.', icon: 'warning' }
  );

  const handleDeactivateUser = useCallback(async (user) => {
    await deactivateUserMutation.mutateAsync(user.id);
  }, [deactivateUserMutation]);

  const handleActivateUser = useCallback(async (user) => {
    await activateUserMutation.mutateAsync(user.id);
  }, [activateUserMutation]);

  const handleResetPassword = useCallback((user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  }, []);

  const handleResetPasswordSuccess = () => {
    setShowResetPasswordModal(false);
    setSelectedUser(null);
  };

  const handleResetPasswordCancel = () => {
    setShowResetPasswordModal(false);
    setSelectedUser(null);
  };

  const handleUserFormSuccess = async () => {
    setShowUserModal(false);
    setSelectedUser(null);
    await fetchUserData();
  };

  const handleUserFormClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const stats = useMemo(() => {
    return [
      {
        title: 'Total Users',
        value: users.length,
        color: 'primary',
        icon: Users,
      },
      {
        title: 'Active',
        value: users.filter((u) => u.status === USER_STATUS.ACTIVE).length,
        color: 'success',
        icon: CheckCircle,
      },
      {
        title: 'Coaches',
        value: users.filter((u) => u.role === USER_ROLES.COACH).length,
        color: 'warning',
        icon: UserCog,
      },
      {
        title: 'Staff',
        value: users.filter((u) => u.role === USER_ROLES.STAFF).length,
        color: 'success',
        icon: Briefcase,
      },
      {
        title: 'Admins',
        value: users.filter((u) => u.role === USER_ROLES.ADMIN).length,
        color: 'danger',
        icon: Shield,
      },
    ];
  }, [users]);

  const columns = useMemo(
    () => userTableColumns({
      onEdit: handleEditUser,
      onResetPassword: handleResetPassword,
      onDeactivate: handleDeactivateUser,
      onActivate: handleActivateUser,
      onDelete: handleDeleteUser,
    }),
    [handleEditUser, handleResetPassword, handleDeactivateUser, handleActivateUser, handleDeleteUser]
  );

  return (
    <Layout title="User Management" subtitle="Manage users, roles, and access permissions for non-admin users">
      <StatsCards stats={stats} columns={5} dark={true} />

      <div className="card">
        <div className="mb-6">
          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search users..."
            filterValue={filterRole}
            onFilterChange={setFilterRole}
            filterOptions={USER_ROLE_OPTIONS}
            filterLabel="All Roles"
            onAddClick={handleAddUser}
            addButtonLabel="Add User"
            addButtonIcon={Plus}
            addButtonDisabled={!canAddUser}
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={isLoading}
          emptyMessage={error ? `Error loading users: ${error.message}` : 'No users found'}
        />
      </div>

      <UserForm
        selectedUser={selectedUser}
        isOpen={showUserModal}
        onClose={handleUserFormClose}
        onSuccess={handleUserFormSuccess}
      />

      <Modal
        isOpen={showResetPasswordModal}
        onClose={handleResetPasswordCancel}
        title="Reset Password"
        size="md"
      >
        <ResetPasswordForm
          user={selectedUser}
          onSuccess={handleResetPasswordSuccess}
          onCancel={handleResetPasswordCancel}
        />
      </Modal>
    </Layout>
  );
};

export default UserManagement;
