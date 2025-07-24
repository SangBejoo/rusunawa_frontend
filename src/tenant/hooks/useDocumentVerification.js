import { useState, useEffect } from 'react';
import documentService from '../services/documentService';
import tenantAuthService from '../services/tenantAuthService';

/**
 * Custom hook for document verification status
 * Returns document verification state and helper functions
 */
export const useDocumentVerification = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    canBook: false,
    hasDocuments: false,
    allApproved: false,
    hasPending: false,
    hasRejected: false,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalCount: 0,
    requiredCount: 0,
    message: '',
    statusType: 'loading', // loading, success, warning, error
    missingDocuments: []
  });

  // Fetch documents and calculate verification status
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current tenant info
      const currentTenant = tenantAuthService.getCurrentTenant();
      setTenant(currentTenant);
      
      const response = await documentService.getTenantDocuments();
      const docs = response.documents || [];
      setDocuments(docs);
      
      const status = calculateVerificationStatus(docs, currentTenant);
      setVerificationStatus(status);
      
    } catch (err) {
      console.error('Error fetching documents for verification:', err);
      setError(err.message || 'Failed to verify documents');
      setVerificationStatus({
        canBook: false,
        hasDocuments: false,
        allApproved: false,
        hasPending: false,
        hasRejected: false,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        totalCount: 0,
        requiredCount: 0,
        message: 'Unable to verify document status',
        statusType: 'error',
        missingDocuments: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate verification status based on documents and user type
  const calculateVerificationStatus = (docs, currentTenant) => {
    const approvedDocs = docs.filter(doc => doc.status === 'approved');
    const pendingDocs = docs.filter(doc => doc.status === 'pending');
    const rejectedDocs = docs.filter(doc => doc.status === 'rejected');
    
    const totalCount = docs.length;
    const approvedCount = approvedDocs.length;
    const pendingCount = pendingDocs.length;
    const rejectedCount = rejectedDocs.length;
    
    // Determine required documents based on user type
    const isStudent = currentTenant?.tenantType?.name === 'mahasiswa';
    
    // Define required document types and their IDs
    let requiredDocuments = [];
    if (isStudent) {
      // Students need: KTP (1), Surat Perjanjian (2), KK (3)
      requiredDocuments = [
        { id: 1, name: 'KTP', label: 'KTP (ID Card)' },
        { id: 2, name: 'Surat Perjanjian', label: 'Surat Perjanjian (Agreement Letter)' },
        { id: 3, name: 'KK', label: 'KK (Family Card)' }
      ];
    } else {
      // Non-students need: KTP (1) only
      requiredDocuments = [
        { id: 1, name: 'KTP', label: 'KTP (ID Card)' }
      ];
    }
    
    const requiredCount = requiredDocuments.length;
    
    // Check which required documents are missing or not approved
    const missingDocuments = [];
    const requiredApprovedDocs = [];
    
    requiredDocuments.forEach(reqDoc => {
      const userDoc = docs.find(doc => doc.docTypeId === reqDoc.id);
      if (!userDoc) {
        missingDocuments.push({ ...reqDoc, status: 'missing' });
      } else if (userDoc.status !== 'approved') {
        missingDocuments.push({ ...reqDoc, status: userDoc.status });
      } else {
        requiredApprovedDocs.push(userDoc);
      }
    });
    
    const hasAllRequiredApproved = requiredApprovedDocs.length === requiredCount;
    const hasDocuments = totalCount > 0;
    const allApproved = hasDocuments && approvedCount === totalCount;
    const hasPending = pendingCount > 0;
    const hasRejected = rejectedCount > 0;
    
    // Determine if user can book - must have all required documents approved
    let canBook = false;
    let message = '';
    let statusType = 'error';

    if (missingDocuments.length > 0) {
      const missingNames = missingDocuments
        .filter(doc => doc.status === 'missing')
        .map(doc => doc.label);
      const rejectedNames = missingDocuments
        .filter(doc => doc.status === 'rejected')
        .map(doc => doc.label);
      const pendingNames = missingDocuments
        .filter(doc => doc.status === 'pending')
        .map(doc => doc.label);
      
      if (missingNames.length > 0) {
        message = `Missing required documents: ${missingNames.join(', ')}. Please upload them to continue.`;
        statusType = 'warning';
      } else if (rejectedNames.length > 0) {
        message = `Required documents rejected: ${rejectedNames.join(', ')}. Please re-upload them.`;
        statusType = 'error';
      } else if (pendingNames.length > 0) {
        message = `Required documents pending approval: ${pendingNames.join(', ')}. Please wait for verification.`;
        statusType = 'warning';
      }
    } else if (hasAllRequiredApproved) {
      message = `All required documents verified! You can now book rooms.`;
      statusType = 'success';
      canBook = true;
    } else {
      message = 'Document verification incomplete';
      statusType = 'error';
    }

    return {
      canBook,
      hasDocuments,
      allApproved,
      hasPending,
      hasRejected,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalCount,
      requiredCount,
      message,
      statusType,
      missingDocuments,
      hasAllRequiredApproved
    };
  };

  // Refresh documents (useful after upload/update)
  const refreshDocuments = () => {
    fetchDocuments();
  };

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    verificationStatus,
    loading,
    error,
    refreshDocuments,
    tenant,
    isStudent: tenant?.tenantType?.name === 'mahasiswa'
  };
};

export default useDocumentVerification;
