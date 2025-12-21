import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import { Avatar, Badge, Modal } from '../components/common';
import {
  Search,
  Plus,
  Edit,
  Trash,
  Shield,
  Key,
  Mail,
  Phone,
  MoreVertical,
  UserCog,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useUsers,
  useDeleteUser,
  useDeactivateUser,
  useActivateUser,
  useResetPassword,
} from '../hooks/useUsers';
import permissionsData from '../data/permissions.json';
import UserForm from '../components/forms/UserForm';
import { USER_ROLES, isAdminRole } from '../constants/userRoles';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRefs = useRef({});
  const buttonRefs = useRef({});

  // Hooks
  const { data: usersData = [], isLoading, error } = useUsers();
  const deleteUserMutation = useDeleteUser();
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();
  const resetPasswordMutation = useResetPassword();

  // Transform API data to match component expectations
  const users = usersData.map((user) => ({
    id: user.id,
    name: user.fullname || `${user.firstname} ${user.lastname || ''}`.trim(),
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.firstname)}&background=random`,
    role: user.role,
    status: user.status,
    permissions: user.permissions?.map((p) => p.permission) || [],
  }));

  const roles = [
    { value: USER_ROLES.ADMIN, label: 'Administrator', color: 'danger' },
    { value: USER_ROLES.COACH, label: 'Coach', color: 'primary' },
    { value: USER_ROLES.STAFF, label: 'Staff', color: 'success' },
  ];

  const [selectedRole, setSelectedRole] = useState(USER_ROLES.ADMIN);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleInfo = roles.find((r) => r.value === role);
    return (
      <Badge variant={roleInfo?.color || 'default'}>
        {roleInfo?.label || role}
      </Badge>
    );
  };

  // Get default permissions for a role (only for creating users)
  const getDefaultPermissionsForRole = (role) => {
    if (role === USER_ROLES.COACH) {
      // All progress tracking permissions
      return permissionsData.progress_tracking.permissions.map(p => p.key);
    } else if (role === USER_ROLES.STAFF) {
      // Bill and payment permissions
      return [
        'bill_create',
        'bill_update',
        'bill_delete',
        'payment_create'
      ];
    }
    return [];
  };

  // Update selected permissions when role changes (only for Create User modal)
  useEffect(() => {
    if (showUserModal && !selectedUser) {
      const defaults = getDefaultPermissionsForRole(selectedRole);
      setSelectedPermissions(defaults);
    }
  }, [selectedRole, showUserModal, selectedUser]);

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setSelectedPermissions(user.permissions || []);
    setShowUserModal(true);
    setShowActionMenu(null);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setSelectedRole(USER_ROLES.ADMIN);
    setSelectedPermissions([]);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    const { Alert } = await import('../utils/alert');
    const result = await Alert.confirmDelete({
      title: 'Delete User?',
      text: 'Are you sure you want to delete this user? This action cannot be undone.',
    });

    if (result.isConfirmed) {
      await deleteUserMutation.mutateAsync(userId);
      setShowActionMenu(null);
    }
  };

  const handleDeactivateUser = async (userId) => {
    await deactivateUserMutation.mutateAsync(userId);
    setShowActionMenu(null);
  };

  const handleActivateUser = async (userId) => {
    await activateUserMutation.mutateAsync(userId);
    setShowActionMenu(null);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
    setShowActionMenu(null);
  };

  const handleSubmitResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.target);
    const password = formData.get('password');

    await resetPasswordMutation.mutateAsync({
      id: selectedUser.id,
      password: password,
    });

    setShowResetPasswordModal(false);
    setSelectedUser(null);
    e.target.reset();
  };

  const handleUserFormSuccess = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setSelectedRole(USER_ROLES.ADMIN);
    setSelectedPermissions([]);
  };

  const handleCancel = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setSelectedRole(USER_ROLES.ADMIN);
    setSelectedPermissions([]);
  };

  // Remove duplicate menus (React Strict Mode fix)
  useEffect(() => {
    if (showActionMenu) {
      const menuSelector = `[data-menu="action-menu-${showActionMenu}"]`;
      const menus = document.querySelectorAll(menuSelector);
      
      // If more than one menu exists, remove duplicates
      if (menus.length > 1) {
        // Keep the first one, remove the rest
        for (let i = 1; i < menus.length; i++) {
          menus[i].remove();
        }
      }
    }
  }, [showActionMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionMenu) {
        const menuElement = menuRefs.current[showActionMenu];
        // Check if click is outside the menu and not on a menu button
        const isClickInsideMenu = menuElement?.contains(event.target);
        const isClickOnMenuButton = event.target.closest('[data-menu-button]');
        
        if (!isClickInsideMenu && !isClickOnMenuButton) {
          setShowActionMenu(null);
        }
      }
    };

    if (showActionMenu) {
      // Use a small delay to avoid immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionMenu]);

  return (
    <Layout title="User Management" subtitle="Manage users and their access permissions">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-1">{users.length}</p>
            </div>
            <Users className="w-10 h-10 text-primary-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm">Active</p>
              <p className="text-3xl font-bold mt-1">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-success-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100 text-sm">Coaches</p>
              <p className="text-3xl font-bold mt-1">
                {users.filter((u) => u.role === USER_ROLES.COACH).length}
              </p>
            </div>
            <UserCog className="w-10 h-10 text-warning-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100 text-sm">Admins</p>
              <p className="text-3xl font-bold mt-1">
                {users.filter((u) => u.role === USER_ROLES.ADMIN).length}
              </p>
            </div>
            <Shield className="w-10 h-10 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value} className="bg-dark-700 text-dark-50">
                  {role.label}
                </option>
              ))}
            </select>
          </div>
            <button
              onClick={handleAddUser}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-dark-400">Loading users...</div>
          ) : error ? (
            <div className="text-center py-8 text-danger-600">
              Error loading users: {error.message}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-dark-400">No users found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-dark-50">
                  <th className="table-header">User</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-700">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="md" />
                      <div>
                        <p className="font-medium text-dark-50">{user.name}</p>
                        <p className="text-xs text-dark-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="w-3.5 h-3.5 text-dark-400" />
                        {user.email}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="w-3.5 h-3.5 text-dark-400" />
                        {user.phone}
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">{getRoleBadge(user.role)}</td>
                  <td className="table-cell">
                    <Badge
                      variant={user.status === 'active' ? 'success' : 'default'}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="table-cell">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        data-menu-button={`menu-btn-${user.id}`}
                        ref={(el) => {
                          if (el) {
                            buttonRefs.current[user.id] = el;
                          } else {
                            delete buttonRefs.current[user.id];
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const button = buttonRefs.current[user.id];
                          if (button) {
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              right: window.innerWidth - rect.right,
                            });
                          }
                          setShowActionMenu(
                            showActionMenu === user.id ? null : user.id
                          );
                        }}
                        className="p-2 text-dark-400 hover:bg-dark-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {showActionMenu === user.id && (
                        <div
                          key={`action-menu-${user.id}`}
                          data-menu={`action-menu-${user.id}`}
                          ref={(el) => {
                            if (el) {
                              menuRefs.current[user.id] = el;
                            } else {
                              delete menuRefs.current[user.id];
                            }
                          }}
                          className="fixed w-48 bg-dark-800 rounded-lg shadow-xl border border-dark-700 py-1 z-[100]"
                          style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit User
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetPassword(user);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-100 hover:bg-dark-700 transition-colors"
                          >
                            <Key className="w-4 h-4" />
                            Reset Password
                          </button>
                          {!isAdminRole(user.role) && (
                            <>
                              <hr className="my-1 border-dark-700" />
                              {user.status === 'active' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeactivateUser(user.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-warning-500 hover:bg-warning-500/10 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Deactivate
                                </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateUser(user.id);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-success-500 hover:bg-success-500/10 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Activate
                            </button>
                          )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-500/10 transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Unified User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={handleCancel}
        title={selectedUser ? 'Edit User' : 'Add New User'}
        size="lg"
      >
        <UserForm
          selectedUser={selectedUser}
          selectedRole={selectedRole}
          selectedPermissions={selectedPermissions}
          roles={roles}
          onRoleChange={setSelectedRole}
          onPermissionsChange={setSelectedPermissions}
          onSuccess={handleUserFormSuccess}
          onCancel={handleCancel}
          getRoleBadge={getRoleBadge}
        />
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        title="Reset Password"
        size="md"
      >
        {selectedUser && (
          <form onSubmit={handleSubmitResetPassword} className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-dark-300">
                Reset password for <span className="font-semibold text-dark-50">{selectedUser.name}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">New Password</label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <p className="text-xs text-dark-400 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
};

export default UserManagement;
