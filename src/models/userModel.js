/**
 * User Model
 * Defines the structure and initial state for user form data and data transformations
 */


/**
 * Get initial user form data
 * @returns {Object} Initial form state
 */
export const getInitialUserFormData = () => ({
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  role: '',
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
    role: user.role || '',
    password: '', // Never include password in form data
    permissions: user.permissions || [],
  };
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
    permissions: user.permissions?.map((p) => p.permission) || [],
  }));
};
