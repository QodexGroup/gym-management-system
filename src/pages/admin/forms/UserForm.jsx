import { useState, useEffect } from 'react';
import { Avatar, Badge, Modal } from '../../../components/common';
import permissionsData from '../../../data/permissions.json';
import { USER_ROLES } from '../../../constants/userRoles';
import { useCreateUser, useUpdateUser } from '../../../hooks/useUsers';
import { 
  getInitialUserFormData, 
  mapUserToFormData,
} from '../../../models/userModel';

const UserForm = ({
  selectedUser,
  isOpen,
  onClose,
  onSuccess,
  roles,
  getRoleBadge,
}) => {
  const [formData, setFormData] = useState(getInitialUserFormData());
  const [permissions, setPermissions] = useState([]);
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Load form data when selectedUser changes
  useEffect(() => {
    if (selectedUser && isOpen) {
      const mappedData = mapUserToFormData(selectedUser);
      setFormData(mappedData);
      setPermissions(selectedUser.permissions || []);
    } else if (!selectedUser && isOpen) {
      setFormData(getInitialUserFormData());
      setPermissions([]);
    }
  }, [selectedUser, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedUser;

    try {
      // Normalize all fields
      let normalizedUserData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => {
          if (key === 'password') return [key, value || null];
          if (key === 'permissions') return [key, value];
          if (typeof value === 'string') return [key, value.trim() || null];
          return [key, value ?? null];
        })
      );

      // Exclude email and password for updates
      if (isEdit) {
        const { email, password, ...updateData } = normalizedUserData;
        normalizedUserData = updateData;
      }

      // Set permissions based on role
      normalizedUserData.permissions = formData.role === USER_ROLES.ADMIN ? [] : permissions;

      if (isEdit) {
        await updateUserMutation.mutateAsync({ id: selectedUser.id, data: normalizedUserData });
      } else {
        await createUserMutation.mutateAsync(normalizedUserData);
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      // Error handling is done by the mutation
      console.error('Error submitting user:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedUser ? 'Edit User' : 'Add New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
      {/* User Info Section - Only show when editing */}
      {selectedUser && (
        <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl border border-dark-600">
          <Avatar src={selectedUser.avatar} name={selectedUser.name} size="xl" />
          <div>
            <h3 className="font-semibold text-dark-50">{selectedUser.name}</h3>
            <p className="text-sm text-dark-300">{selectedUser.email}</p>
            {getRoleBadge(selectedUser.role)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            First Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="John"
            value={formData.firstname}
            onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Last Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="Doe"
            value={formData.lastname}
            onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Email {!selectedUser && <span className="text-danger-500">*</span>}
        </label>
        <input
          type="email"
          className={`w-full px-4 py-2.5 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors ${
            selectedUser
              ? 'bg-dark-800 text-dark-400 cursor-not-allowed opacity-60'
              : 'bg-dark-700'
          }`}
          placeholder="john@gym.com"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={!!selectedUser}
          required={!selectedUser}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Phone</label>
        <input
          type="tel"
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
          placeholder="+1 234 567 8900"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Role <span className="text-danger-500">*</span>
        </label>
        <select 
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors" 
          value={formData.role}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, role: e.target.value }));
            // Reset permissions when role changes to ADMIN
            if (e.target.value === USER_ROLES.ADMIN) {
              setPermissions([]);
            }
          }}
          required
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value} className="bg-dark-700 text-dark-50">
              {role.label}
            </option>
          ))}
        </select>
      </div>
      {(formData.role === USER_ROLES.COACH || formData.role === USER_ROLES.STAFF) && (
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">Permissions</label>
          <div className="space-y-4 p-4 bg-dark-700 rounded-lg border border-dark-600">
            {Object.values(permissionsData).map((category) => (
              <div key={category.label} className="space-y-2">
                <h4 className="text-sm font-semibold text-dark-100 mb-2">{category.label}</h4>
                <div className="grid grid-cols-3 gap-2 pl-4">
                  {category.permissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions(prev => [...prev, perm.key]);
                          } else {
                            setPermissions(prev => prev.filter(p => p !== perm.key));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 bg-dark-600 border-dark-500 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-dark-100">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selectedUser && (
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Temporary Password <span className="text-danger-500">*</span>
          </label>
          <input
            type="password"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <p className="text-xs text-dark-400 mt-1">
            User will be required to change password on first login
          </p>
        </div>
      )}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 btn-primary"
          disabled={updateUserMutation.isPending || createUserMutation.isPending}
        >
          {selectedUser
            ? (updateUserMutation.isPending ? 'Saving...' : 'Save Changes')
            : (createUserMutation.isPending ? 'Creating...' : 'Create User')}
        </button>
      </div>
    </form>
    </Modal>
  );
};

export default UserForm;

