/**
 * User Model
 * Defines the structure and initial state for user form data and data transformations
 */

import { USER_ROLES, isPermissionBasedRole } from '../constants/userRoles';
import { toLocalPhFormat } from '../utils/validators/phone';

/**
 * Normalize permissions from API to string array
 * @param {Array|null|undefined} permissions - Permissions from API
 * @returns {string[]} Normalized permission keys
 */
export const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return permissions
    .map((p) => (typeof p === 'string' ? p : p?.permission))
    .filter(Boolean);
};

/**
 * Get initial user form data
 * @returns {Object} Initial form state
 */
export const getInitialUserFormData = () => ({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  role: USER_ROLES.ADMIN,
  password: '',
  permissions: [],
});

/**
 * Map user data from API to form data
 * @param {Object} user - User object from API
 * @returns {Object} Form data object
 */
export const mapUserToFormData = (user) => {
  if (!user) return getInitialUserFormData();
  
  return {
    firstname: user.firstname || '',
    lastname: user.lastname || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || USER_ROLES.ADMIN,
    password: '', // Never include password in form data
    permissions: normalizePermissions(user.permissions),
  };
};

/**
 * Prepare user form data for API submission
 * @param {Object} formData - Current form state
 * @param {Object} options
 * @param {boolean} options.isEdit - Whether this is an update
 * @returns {Object} Normalized payload for create/update
 */
export const prepareUserSubmitData = (formData, { isEdit = false } = {}) => {
  let normalizedUserData = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => {
      if (key === 'password') return [key, value || null];
      if (key === 'permissions') return [key, value];
      if (typeof value === 'string') return [key, value.trim() || null];
      return [key, value ?? null];
    })
  );

  if (isEdit) {
    const { email: _email, password: _password, ...updateData } = normalizedUserData;
    normalizedUserData = updateData;
  }

  normalizedUserData.phone = formData.phone ? toLocalPhFormat(formData.phone) : null;
  normalizedUserData.permissions = isPermissionBasedRole(formData.role)
    ? (formData.permissions || [])
    : [];

  return normalizedUserData;
};

/**
 * Map users data from API to UI format
 * @param {Array} usersData - Array of user objects from API
 * @returns {Array} Transformed array of user objects for UI
 */
export const mapUsersData = (usersData = []) => {
  return usersData.map((user) => ({
    id: user.id,
    name: user.fullname || `${user.firstname} ${user.lastname || ''}`.trim(),
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || user.firstname)}&background=random`,
    role: user.role,
    status: user.status,
    permissions: normalizePermissions(user.permissions),
    isAccountOwner: !!user.isAccountOwner,
  }));
};
