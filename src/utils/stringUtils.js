/**
 * String utility functions
 */

/**
 * Capitalize first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert a string to a slug format (lowercase, dash-separated)
 * @param {string} str - The string to slugify
 * @returns {string} Slugified string
 */
export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Truncate text to a specific length and add ellipsis
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
};

/**
 * Get string value with fallback
 * @param {string} value - Value to check
 * @param {string} fallback - Fallback value if original is empty
 * @returns {string} Original value or fallback
 */
export const getStringValue = (value, fallback = 'N/A') => {
  if (!value || value.trim() === '') {
    return fallback;
  }
  return value;
};

/**
 * Get classification string
 * @param {string} classification - Classification code
 * @returns {string} Human-readable classification
 */
export const getClassificationString = (classification) => {
  const classificationMap = {
    'perempuan': 'Female Students',
    'laki_laki': 'Male Students',
    'VIP': 'VIP Room',
    'ruang_rapat': 'Meeting Room'
  };
  
  return classificationMap[classification] || capitalize(classification) || 'Standard';
};

/**
 * Get rental type string
 * @param {string} rentalType - Rental type code
 * @returns {string} Human-readable rental type
 */
export const getRentalTypeString = (rentalType) => {
  const rentalTypeMap = {
    'harian': 'Daily',
    'bulanan': 'Monthly'
  };
  
  return rentalTypeMap[rentalType] || capitalize(rentalType) || 'Standard';
};

/**
 * Get tenant type string
 * @param {string} tenantType - Tenant type code
 * @returns {string} Human-readable tenant type
 */
export const getTenantTypeString = (tenantType) => {
  const tenantTypeMap = {
    'mahasiswa': 'Student',
    'non_mahasiswa': 'Non-Student'
  };
  
  return tenantTypeMap[tenantType] || capitalize(tenantType) || 'Guest';
};

/**
 * Get role string
 * @param {string} role - Role code
 * @returns {string} Human-readable role
 */
export const getRoleString = (role) => {
  const roleMap = {
    'admin': 'Administrator',
    'user': 'User',
    'super_admin': 'Super Administrator',
    'wakil_direktorat': 'Vice Director',
    'penyewa': 'Tenant'
  };
  
  return roleMap[role] || capitalize(role) || 'User';
};

/**
 * Get tenant name
 * @param {Object} tenant - Tenant object
 * @returns {string} Tenant name
 */
export const getTenantName = (tenant) => {
  if (!tenant) return 'N/A';
  
  return tenant.name || 
    (tenant.user && tenant.user.full_name) || 
    'Unknown Tenant';
};

/**
 * Get tenant email
 * @param {Object} tenant - Tenant object
 * @returns {string} Tenant email
 */
export const getTenantEmail = (tenant) => {
  if (!tenant) return 'N/A';
  
  return tenant.email || 
    (tenant.user && tenant.user.email) || 
    'No email';
};

/**
 * Check if invoice ID is valid
 * @param {string} invoiceId - Invoice ID to check
 * @returns {boolean} True if valid
 */
export const isValidInvoiceId = (invoiceId) => {
  if (!invoiceId) return false;
  
  // Simple validation - check if it's a non-empty string or number
  return (typeof invoiceId === 'string' && invoiceId.trim() !== '') || 
         (typeof invoiceId === 'number' && !isNaN(invoiceId));
};

/**
 * Get invoice ID from various formats
 * @param {Object|string|number} invoice - Invoice object or ID
 * @returns {string|null} Invoice ID or null if invalid
 */
export const getInvoiceId = (invoice) => {
  if (!invoice) return null;
  
  if (typeof invoice === 'object') {
    // Extract ID from invoice object
    return invoice.invoice_id || invoice.id || null;
  }
  
  if (typeof invoice === 'string' || typeof invoice === 'number') {
    // Return the ID directly
    return invoice.toString();
  }
  
  return null;
};

export default {
  capitalize,
  slugify,
  truncateText,
  getStringValue,
  getClassificationString,
  getRentalTypeString,
  getTenantTypeString,
  getRoleString,
  getTenantName,
  getTenantEmail,
  isValidInvoiceId,
  getInvoiceId
};
