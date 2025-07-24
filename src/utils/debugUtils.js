/**
 * Debug utilities for inspecting data structures
 */

/**
 * Helper to inspect a tenant object and log key properties in a structured way
 * @param {Object} tenant - The tenant object from API
 */
export const inspectTenant = (tenant) => {
  if (!tenant) {
    console.warn("inspectTenant: Received null/undefined tenant");
    return;
  }
  
  console.group('Tenant Data Inspection');
  console.log('ID:', tenant.tenantId || tenant.id);
  console.log('UserID:', tenant.userId || tenant.user?.userId);
  console.log('Name:', tenant.name || tenant.user?.fullName);
  console.log('Email:', tenant.email || tenant.user?.email);
  console.log('NIM:', tenant.nim === null ? '(null)' : tenant.nim === '' ? '(empty string)' : tenant.nim);
  
  // Detailed tenant type inspection
  console.group('Tenant Type');
  console.log('tenantType:', tenant.tenantType);
  console.log('tenant.tenantType?.name:', tenant.tenantType?.name);
  console.log('tenant.tenantType?.typeId:', tenant.tenantType?.typeId);
  console.log('tenant.type_id:', tenant.type_id);
  console.groupEnd();
  
  // User details
  console.group('User');
  console.log('user:', tenant.user);
  console.log('Role ID:', tenant.user?.role?.roleId);
  console.log('Role Name:', tenant.user?.role?.name);
  console.groupEnd();
  
  console.groupEnd();
};

/**
 * Utility to check if a value is empty (null, undefined, or empty string)
 * @param {any} value - The value to check
 * @returns {boolean} true if the value is empty
 */
export const isEmpty = (value) => {
  return value === null || value === undefined || value === '';
};
