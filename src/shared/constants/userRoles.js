/**
 * User Role Constants
 * Defines all available user roles in the system
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  COACH: 'coach',
  TRAINER: 'coach', // Alias for coach
};

/**
 * User Role Labels
 * Human-readable labels for each role
 */
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.STAFF]: 'Staff',
  [USER_ROLES.COACH]: 'Coach',
  [USER_ROLES.TRAINER]: 'Trainer',
};

export const USER_ROLE_VARIANTS = {
  [USER_ROLES.ADMIN]: 'danger',
  [USER_ROLES.COACH]: 'primary',
  [USER_ROLES.STAFF]: 'success',
};

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: USER_ROLE_LABELS[USER_ROLES.ADMIN], color: 'danger' },
  { value: USER_ROLES.COACH, label: USER_ROLE_LABELS[USER_ROLES.COACH], color: 'primary' },
  { value: USER_ROLES.STAFF, label: USER_ROLE_LABELS[USER_ROLES.STAFF], color: 'success' },
];

export const USER_STATUS = {
  ACTIVE: 'active',
  DEACTIVATED: 'deactivated',
};

export const USER_STATUS_VARIANTS = {
  [USER_STATUS.ACTIVE]: 'success',
  [USER_STATUS.DEACTIVATED]: 'default',
};

/**
 * Check if a role is admin
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isAdminRole = (role) => {
  return role === USER_ROLES.ADMIN;
};

/**
 * Check if a role is staff
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isStaffRole = (role) => {
  return role === USER_ROLES.STAFF;
};

/**
 * Check if a role is coach/trainer
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isCoachRole = (role) => {
  return role === USER_ROLES.COACH || role === USER_ROLES.TRAINER;
};

/**
 * Check if a role uses permission-based access
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isPermissionBasedRole = (role) => isStaffRole(role) || isCoachRole(role);

/**
 * Get role label
 * @param {string} role - User role
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  return USER_ROLE_LABELS[role] || role;
};

