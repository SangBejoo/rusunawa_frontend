/**
 * Role-based access control utilities for the frontend
 */

/**
 * Defines the roles that can perform approval actions
 */
const APPROVAL_ROLES = ['wakil_direktorat', 'super_admin'];

/**
 * Check if a user has permission to approve entities (bookings, payments, documents)
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user can approve
 */
export const canUserApprove = (user) => {
  if (!user) return false;
  
  // Check user role from various possible properties
  const role = user.role || user.user_role || user.roleName;
  
  if (!role) {
    console.warn('User role not found in user object:', user);
    return false;
  }
  
  return APPROVAL_ROLES.includes(role.toLowerCase());
};

/**
 * Check if a user has permission to approve bookings specifically
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user can approve bookings
 */
export const canUserApproveBookings = (user) => {
  return canUserApprove(user);
};

/**
 * Check if a user has permission to verify payments
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user can verify payments
 */
export const canUserVerifyPayments = (user) => {
  return canUserApprove(user);
};

/**
 * Check if a user has permission to review documents
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user can review documents
 */
export const canUserReviewDocuments = (user) => {
  return canUserApprove(user);
};

/**
 * Get the user's role display name
 * @param {Object} user - User object from auth context
 * @returns {string} - Formatted role name for display
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return 'Unknown';
  
  const role = user.role || user.user_role || user.roleName;
  
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Administrator';
    case 'wakil_direktorat':
      return 'Wakil Direktorat';
    case 'super_admin':
      return 'Super Administrator';
    case 'penyewa':
      return 'Tenant';
    default:
      return role || 'Unknown';
  }
};

/**
 * Get appropriate message for when user lacks approval permissions
 * @param {string} action - The action being attempted (e.g., 'approve booking')
 * @returns {string} - User-friendly message explaining the restriction
 */
export const getPermissionDeniedMessage = (action = 'perform this action') => {
  return `Only Wakil Direktorat and Super Admin can ${action}. Please contact an authorized user if approval is needed.`;
};

/**
 * Check if user is an admin (but not wakil_direktorat or super_admin)
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user is regular admin
 */
export const isRegularAdmin = (user) => {
  if (!user) return false;
  
  const role = user.role || user.user_role || user.roleName;
  return role?.toLowerCase() === 'admin';
};

/**
 * Check if user has management permissions (can view but not approve)
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user can manage entities
 */
export const canUserManage = (user) => {
  if (!user) return false;
  
  const role = user.role || user.user_role || user.roleName;
  const manageRoles = ['admin', 'wakil_direktorat', 'super_admin'];
  
  return manageRoles.includes(role?.toLowerCase());
};
