// Enhanced Service Hooks
// Custom React hooks for using the enhanced document and issue services

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import documentService from '../services/documentService';
import issueService from '../services/issueService';
import { useTenantAuth } from '../context/tenantAuthContext';

/**
 * Hook for managing document uploads with progress tracking
 */
export const useDocumentUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const toast = useToast();

  const uploadDocument = useCallback(async (tenantId, file, documentType, description) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('tenant_id', tenantId);
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('description', description);

      const result = await documentService.uploadDocument(formData, (progressValue) => {
        setProgress(progressValue);
      });

      toast({
        title: 'Upload Successful',
        description: 'Your document has been uploaded successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return result;
    } catch (error) {
      setError(error.message || 'Upload failed');
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  return {
    uploading,
    progress,
    error,
    uploadDocument
  };
};

/**
 * Hook for managing tenant documents with caching and pagination
 */
export const useTenantDocuments = (tenantId, options = {}) => {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = useCallback(async (fetchOptions = {}) => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const mergedOptions = { ...options, ...fetchOptions };
      const result = await documentService.getTenantDocuments(tenantId, mergedOptions);

      setDocuments(result.documents || []);
      setPagination(result.pagination || {});
      setSummary(result.summary || {});
    } catch (error) {
      setError(error.message || 'Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, options]);

  const refreshDocuments = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchDocuments();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    pagination,
    summary,
    loading,
    error,
    refreshing,
    fetchDocuments,
    refreshDocuments
  };
};

/**
 * Hook for document search with debouncing
 */
export const useDocumentSearch = (initialQuery = '', debounceMs = 300) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({});
  const [facets, setFacets] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const debounceRef = useRef(null);

  const searchDocuments = useCallback(async (searchQuery, filters = {}) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setPagination({});
      setFacets({});
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchOptions = {
        query: searchQuery,
        ...filters
      };

      const result = await documentService.searchDocuments(searchOptions);

      setResults(result.documents || []);
      setPagination(result.pagination || {});
      setFacets(result.facets || {});
      setSuggestions(result.suggestions || []);
    } catch (error) {
      setError(error.message || 'Search failed');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchDocuments(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchDocuments, debounceMs]);

  return {
    query,
    setQuery,
    results,
    pagination,
    facets,
    suggestions,
    loading,
    error,
    searchDocuments
  };
};

/**
 * Hook for issue reporting with validation
 */
export const useIssueReporting = () => {
  const [reporting, setReporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const toast = useToast();

  const reportIssue = useCallback(async (issueData, attachments = []) => {
    try {
      setReporting(true);
      setProgress(0);
      setError(null);

      // Validation
      if (!issueData.title || issueData.title.trim().length < 5) {
        throw new Error('Issue title must be at least 5 characters long');
      }

      if (!issueData.description || issueData.description.trim().length < 10) {
        throw new Error('Issue description must be at least 10 characters long');
      }

      const formData = new FormData();
      formData.append('title', issueData.title.trim());
      formData.append('description', issueData.description.trim());
      formData.append('category', issueData.category || 'general');
      formData.append('priority', issueData.priority || 'medium');
      formData.append('tenant_id', issueData.tenantId);

      if (issueData.location) {
        formData.append('location', issueData.location);
      }

      // Add attachments
      attachments.forEach((file) => {
        if (file.size > 0) {
          formData.append('images', file);
        }
      });

      const result = await issueService.reportIssue(formData, (progressValue) => {
        setProgress(progressValue);
      });

      toast({
        title: 'Issue Reported',
        description: `Your issue has been reported successfully. Ticket: ${result.ticketNumber}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return result;
    } catch (error) {
      setError(error.message || 'Failed to report issue');
      toast({
        title: 'Report Failed',
        description: error.message || 'Failed to report issue.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setReporting(false);
    }
  }, [toast]);

  return {
    reporting,
    progress,
    error,
    reportIssue
  };
};

/**
 * Hook for managing tenant issues with real-time updates
 */
export const useTenantIssues = (tenantId, options = {}) => {
  const [issues, setIssues] = useState([]);
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const cleanupRef = useRef(null);

  const fetchIssues = useCallback(async (fetchOptions = {}) => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const mergedOptions = { ...options, ...fetchOptions };
      const result = await issueService.getTenantIssues(tenantId, mergedOptions);

      setIssues(result.issues || []);
      setPagination(result.pagination || {});
      setSummary(result.summary || {});
      setStatistics(result.statistics || {});
    } catch (error) {
      setError(error.message || 'Failed to fetch issues');
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, options]);

  const refreshIssues = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchIssues();
    } finally {
      setRefreshing(false);
    }
  }, [fetchIssues]);

  // Setup real-time updates
  useEffect(() => {
    if (tenantId && options.realTime) {
      cleanupRef.current = issueService.subscribeToRealTimeUpdates(tenantId, (updatedIssues) => {
        console.log('Received real-time issue updates:', updatedIssues.length);
        setIssues(prev => {
          // Merge updated issues with existing ones
          const updatedMap = new Map(updatedIssues.map(issue => [issue.id, issue]));
          return prev.map(issue => updatedMap.get(issue.id) || issue);
        });
      });
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [tenantId, options.realTime]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    pagination,
    summary,
    statistics,
    loading,
    error,
    refreshing,
    fetchIssues,
    refreshIssues
  };
};

/**
 * Hook for issue analytics and insights
 */
export const useIssueAnalytics = (tenantId, period = '30d') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await issueService.getIssueAnalytics(tenantId, {
        period,
        metrics: 'all',
        groupBy: 'category'
      });

      setAnalytics(result);
    } catch (error) {
      setError(error.message || 'Failed to fetch analytics');
      console.error('Error fetching issue analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetchAnalytics: fetchAnalytics
  };
};

/**
 * Hook for document analytics
 */
export const useDocumentAnalytics = (tenantId, period = '30d') => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await documentService.getDocumentAnalytics(tenantId, {
        period,
        metrics: 'all',
        groupBy: 'type'
      });

      setAnalytics(result);
    } catch (error) {
      setError(error.message || 'Failed to fetch analytics');
      console.error('Error fetching document analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetchAnalytics: fetchAnalytics
  };
};

/**
 * Hook for managing policies
 */
export const usePolicies = (options = {}) => {
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unsigned, setUnsigned] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const toast = useToast();
  const { tenant } = useTenantAuth();

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await documentService.getPolicies(options);

      setPolicies(result.policies || []);
      setCategories(result.categories || []);
      setUnsigned(result.unsigned || []);
      setExpired(result.expired || []);
    } catch (error) {
      setError(error.message || 'Failed to fetch policies');
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const signPolicy = useCallback(async (policyId, metadata = {}) => {
    if (!tenant?.id) {
      throw new Error('Tenant not authenticated');
    }

    try {
      setSigning(true);

      const signMetadata = {
        ipAddress: metadata.ipAddress || '',
        userAgent: navigator.userAgent,
        additional: {
          timestamp: new Date().toISOString(),
          source: 'tenant_portal',
          ...metadata.additional
        }
      };

      const result = await documentService.signPolicy(tenant.id, policyId, true, signMetadata);

      toast({
        title: 'Policy Signed',
        description: 'You have successfully signed the policy agreement.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh policies after signing
      await fetchPolicies();

      return result;
    } catch (error) {
      toast({
        title: 'Signing Failed',
        description: error.message || 'Failed to sign policy.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setSigning(false);
    }
  }, [tenant, toast, fetchPolicies]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    categories,
    unsigned,
    expired,
    loading,
    error,
    signing,
    signPolicy,
    refetchPolicies: fetchPolicies
  };
};

/**
 * Hook for download management
 */
export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const toast = useToast();

  const downloadDocument = useCallback(async (documentId, filename) => {
    try {
      setDownloading(true);
      setProgress(0);
      setError(null);

      const result = await documentService.downloadDocument(documentId, (progressValue) => {
        setProgress(progressValue);
      });

      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || filename || `document_${documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Complete',
        description: 'Your document has been downloaded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      setError(error.message || 'Download failed');
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download document.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setDownloading(false);
    }
  }, [toast]);

  const downloadAttachment = useCallback(async (issueId, attachmentId, filename) => {
    try {
      setDownloading(true);
      setProgress(0);
      setError(null);

      const result = await issueService.downloadAttachment(issueId, attachmentId, (progressValue) => {
        setProgress(progressValue);
      });

      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || filename || `attachment_${attachmentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Complete',
        description: 'Your attachment has been downloaded successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      setError(error.message || 'Download failed');
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download attachment.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setDownloading(false);
    }
  }, [toast]);

  return {
    downloading,
    progress,
    error,
    downloadDocument,
    downloadAttachment
  };
};

// Export all hooks
export {
  useDocumentUpload,
  useTenantDocuments,
  useDocumentSearch,
  useIssueReporting,
  useTenantIssues,
  useIssueAnalytics,
  useDocumentAnalytics,
  usePolicies,
  useDownload
};
