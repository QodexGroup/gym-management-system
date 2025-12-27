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
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.STAFF]: 'Staff',
  [USER_ROLES.COACH]: 'Coach',
  [USER_ROLES.TRAINER]: 'Trainer',
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
 * Get role label
 * @param {string} role - User role
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  return USER_ROLE_LABELS[role] || role;
};

