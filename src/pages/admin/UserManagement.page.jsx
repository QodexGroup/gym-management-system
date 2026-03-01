import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import { Modal, SearchAndFilter, Badge } from '../../components/common';
import StatsCards from '../../components/common/StatsCards';
import DataTable, { DataTableActions } from '../../components/DataTable';
import {
  Plus,
  Shield,
  UserCog,
  Users,
  CheckCircle,
} from 'lucide-react';
import {
  useUsers,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useResetPassword,
} from '../../hooks/useUsers';
import { useAccountLimit } from '../../hooks/useAccountLimit';
import { useAuth } from '../../context/AuthContext';
import UserForm from './forms/UserForm';
import ResetPasswordForm from './forms/ResetPasswordForm';
import { USER_ROLES } from '../../constants/userRoles';
import { userTableColumns, getUserActionMenuItems } from './tables/userTable.config';
import { mapUsersData } from '../../models/userModel';
import { Alert } from '../../utils/alert';

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

  // Transform API data to match component expectations
  const users = useMemo(() => mapUsersData(usersData), [usersData]);

  const roles = [
    { value: USER_ROLES.ADMIN, label: 'Administrator', color: 'danger' },
    { value: USER_ROLES.COACH, label: 'Coach', color: 'primary' },
    { value: USER_ROLES.STAFF, label: 'Staff', color: 'success' },
  ];

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const getRoleBadge = useCallback((role) => {
    const roleInfo = roles.find((r) => r.value === role);
    return (
      <Badge variant={roleInfo?.color || 'default'}>
        {roleInfo?.label || role}
      </Badge>
    );
  }, []);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (user) => {
    const result = await Alert.confirmDelete({
      title: 'Delete User?',
      text: 'Are you sure you want to delete this user? This action cannot be undone.',
    });

    if (result.isConfirmed) {
      await deleteUserMutation.mutateAsync(user.id);
    }
  };

  const handleDeactivateUser = async (user) => {
    await deactivateUserMutation.mutateAsync(user.id);
  };

  const handleActivateUser = async (user) => {
    await activateUserMutation.mutateAsync(user.id);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

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
    await fetchUserData(); // refresh usage so Subscription shows correct Users count (e.g. 2/2)
  };

  const handleUserFormClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Prepare stats
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
        value: users.filter((u) => u.status === 'active').length,
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
        title: 'Admins',
        value: users.filter((u) => u.role === USER_ROLES.ADMIN).length,
        color: 'danger',
        icon: Shield,
      },
    ];
  }, [users]);

  // Table columns
  const columns = useMemo(
    () => userTableColumns({ getRoleBadge }),
    [getRoleBadge]
  );

  // Get action menu items for a user
  const getActionMenuItems = useCallback((user) => {
    return getUserActionMenuItems({
      user,
      onEdit: handleEditUser,
      onResetPassword: handleResetPassword,
      onDeactivate: handleDeactivateUser,
      onActivate: handleActivateUser,
      onDelete: handleDeleteUser,
    });
  }, []);

  return (
    <Layout title="User Management" subtitle="Manage users and their access permissions">
      {/* Stats Cards */}
      <StatsCards stats={stats} columns={4} dark={true} />

      {/* Users Table */}
      <div className="card">
        <div className="mb-6">
          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search users..."
            filterValue={filterRole}
            onFilterChange={setFilterRole}
            filterOptions={roles}
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
          renderActions={(user) => (
            <DataTableActions
              items={getActionMenuItems(user)}
            />
          )}
        />
      </div>

      {/* Unified User Modal */}
      <UserForm
        selectedUser={selectedUser}
        isOpen={showUserModal}
        onClose={handleUserFormClose}
        onSuccess={handleUserFormSuccess}
        roles={roles}
        getRoleBadge={getRoleBadge}
      />

      {/* Reset Password Modal */}
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
