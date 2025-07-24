import { useState, useEffect, useCallback } from 'react';
import { useTenantAuth } from '../context/tenantAuthContext';
import documentService from '../services/documentService';

/**
 * Custom hook to check tenant document approval status
 * @returns {Object} Object containing approval status and related functions
 */
export const useDocumentApproval = () => {
  const { tenant, isAuthenticated } = useTenantAuth();
  const [documentStatus, setDocumentStatus] = useState({
    isLoading: true,
    hasDocuments: false,
    hasApprovedDocuments: false,
    hasPendingDocuments: false,
    hasRejectedDocuments: false,
    documents: [],
    error: null
  });

  // Function to check document approval status
  const checkDocumentApproval = useCallback(async () => {
    if (!isAuthenticated || !tenant) {
      setDocumentStatus(prev => ({
        ...prev,
        isLoading: false,
        hasDocuments: false,
        hasApprovedDocuments: false,
        hasPendingDocuments: false,
        hasRejectedDocuments: false,
        documents: [],
        error: null
      }));
      return;
    }

    setDocumentStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await documentService.getTenantDocuments();
      const documents = response.documents || [];

      // Analyze document statuses
      const hasDocuments = documents.length > 0;
      const approvedDocs = documents.filter(doc => doc.status === 'approved');
      const pendingDocs = documents.filter(doc => doc.status === 'pending');
      const rejectedDocs = documents.filter(doc => doc.status === 'rejected');

      const hasApprovedDocuments = approvedDocs.length > 0;
      const hasPendingDocuments = pendingDocs.length > 0;
      const hasRejectedDocuments = rejectedDocs.length > 0;

      setDocumentStatus({
        isLoading: false,
        hasDocuments,
        hasApprovedDocuments,
        hasPendingDocuments,
        hasRejectedDocuments,
        documents,
        approvedDocuments: approvedDocs,
        pendingDocuments: pendingDocs,
        rejectedDocuments: rejectedDocs,
        error: null
      });
    } catch (error) {
      console.error('Error checking document approval status:', error);
      
      // If 404 error, it means no documents exist yet
      if (error.message?.includes('404') || error.status === 404) {
        setDocumentStatus({
          isLoading: false,
          hasDocuments: false,
          hasApprovedDocuments: false,
          hasPendingDocuments: false,
          hasRejectedDocuments: false,
          documents: [],
          approvedDocuments: [],
          pendingDocuments: [],
          rejectedDocuments: [],
          error: null
        });
      } else {
        setDocumentStatus(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to check document status'
        }));
      }
    }
  }, [isAuthenticated, tenant]);

  // Check approval status when tenant authentication changes
  useEffect(() => {
    checkDocumentApproval();
  }, [checkDocumentApproval]);

  // Function to manually refresh document status
  const refreshDocumentStatus = useCallback(() => {
    checkDocumentApproval();
  }, [checkDocumentApproval]);

  // Derived status properties for easier use
  const canAccessBooking = documentStatus.hasApprovedDocuments;
  const needsDocumentUpload = !documentStatus.hasDocuments;
  const needsApproval = documentStatus.hasDocuments && !documentStatus.hasApprovedDocuments;
  const hasOnlyRejectedDocuments = documentStatus.hasRejectedDocuments && !documentStatus.hasApprovedDocuments && !documentStatus.hasPendingDocuments;

  return {
    ...documentStatus,
    canAccessBooking,
    needsDocumentUpload,
    needsApproval,
    hasOnlyRejectedDocuments,
    refreshDocumentStatus,
    checkDocumentApproval
  };
};

export default useDocumentApproval;
