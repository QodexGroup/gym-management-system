import { useState, useEffect } from 'react';
import { Avatar, Badge, Modal } from '../../components/common';
import {
  USER_ROLE_OPTIONS,
  USER_ROLE_LABELS,
  USER_ROLE_VARIANTS,
  isPermissionBasedRole,
} from '../../shared/constants/userRoles';
import { USER_PERMISSION_CATEGORIES } from '../../shared/constants/userPermissionsConstants';
import { useCreateUser, useUpdateUser } from '../../shared/hooks/useUsers';
import {
  getInitialUserFormData,
  mapUserToFormData,
  prepareUserSubmitData,
} from '../../shared/models/userModel';
import { isValidEmail, normalizeEmail } from '../../shared/utils/validators/email';
import { sanitizePhoneInput, validatePhPhone, PH_PHONE_INPUT_MAX } from '../../shared/utils/validators/phone';
import { Toast } from '../../shared/utils/alert';

const UserForm = ({
  selectedUser,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState(getInitialUserFormData());

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (selectedUser && isOpen) {
      setFormData(mapUserToFormData(selectedUser));
    } else if (!selectedUser && isOpen) {
      setFormData(getInitialUserFormData());
    }
  }, [selectedUser, isOpen]);

  const handlePermissionToggle = (permissionKey, checked) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionKey]
        : (prev.permissions || []).filter((key) => key !== permissionKey),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!selectedUser;

    try {
      if (!isEdit) {
        const email = normalizeEmail(formData.email);
        if (!email) {
          throw new Error('Email is required.');
        }
        if (!isValidEmail(email)) {
          throw new Error('Please enter a valid email address.');
        }
      }

      const normalizedUserData = prepareUserSubmitData(formData, { isEdit });

      if (!isEdit && normalizedUserData.email) {
        normalizedUserData.email = normalizeEmail(normalizedUserData.email);
      }

      if (isEdit) {
        await updateUserMutation.mutateAsync({ id: selectedUser.id, data: normalizedUserData });
      } else {
        await createUserMutation.mutateAsync(normalizedUserData);
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting user:', error);
      if (error?.message) {
        Toast.error(error.message);
      }
    }
  };

  const phoneError = validatePhPhone(formData.phone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedUser ? 'Edit User' : 'Add New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
      {selectedUser && (
        <div className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl border border-dark-600">
          <Avatar src={selectedUser.avatar} name={selectedUser.name} size="xl" />
          <div>
            <h3 className="font-semibold text-dark-50">{selectedUser.name}</h3>
            <p className="text-sm text-dark-300">{selectedUser.email}</p>
            <Badge variant={USER_ROLE_VARIANTS[selectedUser.role] || 'default'}>
              {USER_ROLE_LABELS[selectedUser.role] || selectedUser.role}
            </Badge>
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
            onChange={(e) => setFormData((prev) => ({ ...prev, firstname: e.target.value }))}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, lastname: e.target.value }))}
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
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          disabled={!!selectedUser}
          required={!selectedUser}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Phone</label>
        <input
          type="tel"
          maxLength={PH_PHONE_INPUT_MAX}
          className={`w-full px-4 py-2.5 bg-dark-700 border text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors ${
            phoneError ? 'border-danger-500' : 'border-dark-600'
          }`}
          placeholder="09171234567"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))}
        />
        {phoneError && (
          <p className="text-danger-500 text-xs mt-1">{phoneError}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Role <span className="text-danger-500">*</span>
        </label>
        <select
          className="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
          value={formData.role}
          onChange={(e) => {
            const nextRole = e.target.value;
            setFormData((prev) => ({
              ...prev,
              role: nextRole,
              permissions: isPermissionBasedRole(nextRole) ? (prev.permissions || []) : [],
            }));
          }}
          required
        >
          {USER_ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value} className="bg-dark-700 text-dark-50">
              {role.label}
            </option>
          ))}
        </select>
      </div>
      {isPermissionBasedRole(formData.role) && (
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">Permissions</label>
          <p className="text-xs text-dark-400 mb-2">Assign access permissions for coach and staff users</p>
          <div className="space-y-4 p-4 bg-dark-700 rounded-lg border border-dark-600">
            {Object.values(USER_PERMISSION_CATEGORIES).map((category) => (
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
                        checked={(formData.permissions || []).includes(perm.key)}
                        onChange={(e) => handlePermissionToggle(perm.key, e.target.checked)}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
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
          disabled={updateUserMutation.isPending || createUserMutation.isPending || !!phoneError}
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
