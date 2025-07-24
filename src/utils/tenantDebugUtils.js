/**
 * Debug utility functions for tenant data
 */

/**
 * Extract tenant type in a standard way from tenant object
 * @param {Object} tenant - Tenant object from API
 * @returns {String} Standardized tenant type
 */
export const extractTenantType = (tenant) => {
  if (!tenant) return 'unknown';
  
  // Case 1: tenantType object with name
  if (tenant.tenantType && tenant.tenantType.name) {
    return tenant.tenantType.name;
  }
  
  // Case 2: Direct typeId
  if (tenant.typeId) {
    return tenant.typeId === 1 ? 'mahasiswa' : 'non_mahasiswa';
  }
  
  // Case 3: type_id (snake case version)
  if (tenant.type_id) {
    return tenant.type_id === 1 ? 'mahasiswa' : 'non_mahasiswa';
  }
  
  // Case 4: tenant_type string
  if (tenant.tenant_type) {
    return tenant.tenant_type;
  }
  
  // Unable to determine
  console.warn('Unable to determine tenant type from object:', tenant);
  return 'unknown';
};

/**
 * Simple function to inspect tenant data object and log structure
 * @param {Object} tenant - Tenant object from API
 */
export const inspectTenant = (tenant) => {
  if (!tenant) {
    console.warn("NULL or undefined tenant object");
    return;
  }
  
  console.group('Tenant Inspection');
  console.log('ID:', tenant.tenantId || tenant.id);
  console.log('Name:', tenant.name || tenant.user?.fullName);
  console.log('Email:', tenant.email || tenant.user?.email);
  console.log('NIM:', tenant.nim === null ? '(NULL)' : tenant.nim === '' ? '(EMPTY)' : tenant.nim);
  
  // Type information
  console.group('Tenant Type Info:');
  console.log('tenant.tenantType:', tenant.tenantType); 
  console.log('tenant.tenantType?.name:', tenant.tenantType?.name);
  console.log('tenant.typeId:', tenant.typeId);
  console.log('tenant.type_id:', tenant.type_id);
  console.log('tenant.tenant_type:', tenant.tenant_type);
  console.log('Extracted type:', extractTenantType(tenant));
  console.groupEnd();
  
  console.groupEnd();
};
