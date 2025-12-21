import { Avatar, Badge } from '../common';
import permissionsData from '../../data/permissions.json';
import { USER_ROLES } from '../../constants/userRoles';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';

const UserForm = ({
  selectedUser,
  selectedRole,
  selectedPermissions,
  roles,
  onRoleChange,
  onPermissionsChange,
  onSuccess,
  onCancel,
  getRoleBadge,
}) => {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const role = formData.get('role');
    const isEdit = !!selectedUser;

    try {
      if (isEdit) {
        // Update user - get permissions from checked checkboxes
        const permissions = role === USER_ROLES.ADMIN
          ? []
          : Array.from(
              e.target.querySelectorAll('input[type="checkbox"]:checked')
            ).map((cb) => cb.value);

        const userData = {
          firstname: formData.get('firstname'),
          lastname: formData.get('lastname'),
          phone: formData.get('phone'),
          role: role,
          permissions: permissions,
        };

        await updateUserMutation.mutateAsync({ id: selectedUser.id, data: userData });
      } else {
        // Create user - use selectedPermissions state
        const permissions = role === USER_ROLES.ADMIN ? [] : selectedPermissions;

        const userData = {
          firstname: formData.get('firstname'),
          lastname: formData.get('lastname'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          role: role,
          password: formData.get('password'),
          permissions: permissions,
        };

        await createUserMutation.mutateAsync(userData);
      }

      // Call onSuccess callback to close modal and reset state
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done by the mutation
      console.error('Error submitting user:', error);
    }
  };

  return (
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
            name="firstname"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="John"
            defaultValue={selectedUser?.firstname || ''}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Last Name <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            name="lastname"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="Doe"
            defaultValue={selectedUser?.lastname || ''}
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
          name="email"
          className={`w-full px-4 py-2.5 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors ${
            selectedUser
              ? 'bg-dark-800 text-dark-400 cursor-not-allowed opacity-60'
              : 'bg-dark-700'
          }`}
          placeholder="john@gym.com"
          defaultValue={selectedUser?.email || ''}
          disabled={!!selectedUser}
          required={!selectedUser}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Phone</label>
        <input
          type="tel"
          name="phone"
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
          placeholder="+1 234 567 8900"
          defaultValue={selectedUser?.phone || ''}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Role <span className="text-danger-500">*</span>
        </label>
        <select 
          name="role" 
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors" 
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          required
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value} className="bg-dark-700 text-dark-50">
              {role.label}
            </option>
          ))}
        </select>
      </div>
      {(selectedRole === USER_ROLES.COACH || selectedRole === USER_ROLES.STAFF || (selectedUser && (selectedUser.role === USER_ROLES.COACH || selectedUser.role === USER_ROLES.STAFF))) && (
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
                        value={perm.key}
                        checked={
                          selectedUser
                            ? undefined
                            : selectedPermissions.includes(perm.key)
                        }
                        defaultChecked={
                          selectedUser
                            ? selectedUser.permissions?.includes(perm.key)
                            : undefined
                        }
                        onChange={
                          selectedUser
                            ? undefined
                            : (e) => {
                                if (e.target.checked) {
                                  onPermissionsChange([...selectedPermissions, perm.key]);
                                } else {
                                  onPermissionsChange(selectedPermissions.filter(p => p !== perm.key));
                                }
                              }
                        }
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
            name="password"
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
            placeholder="••••••••"
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
          onClick={onCancel}
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
  );
};

export default UserForm;

