/**
 * Authentication utility functions
 */

/**
 * Determine if the current user is in the tenant section of the application
 * @returns {boolean} true if in tenant section, false otherwise
 */
export const isTenantContext = () => {
  // Check if the current URL path contains 'tenant'
  return window.location.pathname.includes('/tenant/');
};

/**
 * Perform logout based on current context (tenant or admin)
 */
export const performLogout = () => {
  // Clear tenant token if present
  if (localStorage.getItem('tenantToken')) {
    localStorage.removeItem('tenantToken');
  }
  
  // Clear admin token if present
  if (localStorage.getItem('adminToken')) {
    localStorage.removeItem('adminToken');
  }
  
  // Redirect to the landing page for tenant logout
  const isTenant = isTenantContext();
  if (isTenant) {
    // For tenant - redirect to landing page
    window.location.href = '/';
  } else {
    // For admin - redirect to admin login
    window.location.href = '/admin/login';
  }
};

/**
 * Get the authorization header for authenticated API requests
 * @returns {Object} Authorization header object
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('tenantToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
