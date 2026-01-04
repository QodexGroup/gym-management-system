import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../constants/userRoles';

/**
 * Custom hook for checking user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // Backend now returns permissions as an array of strings directly
  const permissions = useMemo(() => {
    if (!user?.permissions || !Array.isArray(user.permissions)) {
      return [];
    }

    // Backend returns permissions as array of strings: ["bill_create", "bill_update", ...]
    return user.permissions.filter((p) => typeof p === 'string');
  }, [user?.permissions]);

  /**
   * Check if user has a specific permission
   * @param {string} permissionKey} - Permission key to check (e.g., "members_list_view")
   * @returns {boolean}
   */
  const hasPermission = (permissionKey) => {
    // Admin users have all permissions
    if (isAdminRole(user?.role)) {
      return true;
    }

    if (!permissionKey) {
      return false;
    }

    return permissions.includes(permissionKey);
  };

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissionKeys - Array of permission keys to check
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionKeys) => {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.some((key) => hasPermission(key));
  };

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissionKeys - Array of permission keys to check
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionKeys) => {
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.every((key) => hasPermission(key));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

