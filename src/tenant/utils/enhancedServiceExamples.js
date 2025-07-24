// Enhanced Service Usage Examples
// This file demonstrates how to use the enhanced document and issue services

import documentService from '../services/documentService';
import issueService from '../services/issueService';

/**
 * Example: Enhanced Document Upload with Progress Tracking
 */
export const uploadDocumentWithProgress = async (tenantId, file, documentType, description) => {
  try {
    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('description', description);

    // Upload with progress tracking
    const result = await documentService.uploadDocument(formData, (progress) => {
      console.log(`Upload progress: ${progress}%`);
      // You can update your UI progress bar here
    });

    return result;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

/**
 * Example: Advanced Document Search with Filters
 */
export const searchDocumentsAdvanced = async (searchQuery, filters = {}) => {
  try {
    const searchOptions = {
      query: searchQuery,
      type: filters.type || '',
      status: filters.status || '',
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
      tags: filters.tags || '',
      page: filters.page || 1,
      limit: filters.limit || 20,
      sortBy: filters.sortBy || 'relevance',
      sortOrder: filters.sortOrder || 'desc'
    };

    const results = await documentService.searchDocuments(searchOptions);
    
    return {
      documents: results.documents,
      pagination: results.pagination,
      facets: results.facets,
      suggestions: results.suggestions
    };
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

/**
 * Example: Document Analytics Dashboard Data
 */
export const getDocumentDashboardData = async (tenantId, period = '30d') => {
  try {
    const analytics = await documentService.getDocumentAnalytics(tenantId, {
      period,
      metrics: 'all',
      groupBy: 'type'
    });

    return {
      totalDocuments: analytics.summary.total || 0,
      verifiedDocuments: analytics.summary.verified || 0,
      pendingDocuments: analytics.summary.pending || 0,
      documentsByType: analytics.byType,
      documentsByStatus: analytics.byStatus,
      uploadTrends: analytics.timeline,
      insights: analytics.trends
    };
  } catch (error) {
    console.error('Failed to fetch document analytics:', error);
    return null;
  }
};

/**
 * Example: Enhanced Issue Reporting with Validation
 */
export const reportIssueEnhanced = async (issueData, attachments = []) => {
  try {
    // Validate issue data
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

    // Add location if available
    if (issueData.location) {
      formData.append('location', issueData.location);
    }

    // Add attachments
    attachments.forEach((file, index) => {
      if (file.size > 0) {
        formData.append('images', file);
      }
    });

    // Report with progress tracking
    const result = await issueService.reportIssue(formData, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });

    return result;
  } catch (error) {
    console.error('Issue reporting failed:', error);
    throw error;
  }
};

/**
 * Example: Advanced Issue Search and Filtering
 */
export const searchIssuesAdvanced = async (searchParams = {}) => {
  try {
    const searchOptions = {
      query: searchParams.query || '',
      category: searchParams.category || '',
      priority: searchParams.priority || '',
      status: searchParams.status || '',
      dateFrom: searchParams.dateFrom || '',
      dateTo: searchParams.dateTo || '',
      tags: searchParams.tags || '',
      tenantId: searchParams.tenantId || '',
      page: searchParams.page || 1,
      limit: searchParams.limit || 20,
      sortBy: searchParams.sortBy || 'relevance',
      sortOrder: searchParams.sortOrder || 'desc'
    };

    const results = await issueService.searchIssues(searchOptions);
    
    return {
      issues: results.issues,
      pagination: results.pagination,
      facets: results.facets,
      suggestions: results.suggestions,
      highlighted: results.highlightedResults
    };
  } catch (error) {
    console.error('Issue search failed:', error);
    throw error;
  }
};

/**
 * Example: Issue Analytics and Insights
 */
export const getIssueInsights = async (tenantId, period = '30d') => {
  try {
    const analytics = await issueService.getIssueAnalytics(tenantId, {
      period,
      metrics: 'all',
      groupBy: 'category'
    });

    return {
      totalIssues: analytics.summary.total || 0,
      openIssues: analytics.summary.open || 0,
      resolvedIssues: analytics.summary.resolved || 0,
      averageResolutionTime: analytics.resolutionTime.average || 0,
      issuesByCategory: analytics.byCategory,
      issuesByPriority: analytics.byPriority,
      issuesByStatus: analytics.byStatus,
      trends: analytics.trends,
      timeline: analytics.timeline
    };
  } catch (error) {
    console.error('Failed to fetch issue analytics:', error);
    return null;
  }
};

/**
 * Example: Real-time Issue Updates
 */
export const setupRealTimeIssueUpdates = (tenantId, onUpdate) => {
  try {
    // Subscribe to real-time updates
    const cleanup = issueService.subscribeToRealTimeUpdates(tenantId, (issues) => {
      console.log('Received real-time issue updates:', issues.length);
      if (onUpdate) {
        onUpdate(issues);
      }
    });

    // Return cleanup function
    return cleanup;
  } catch (error) {
    console.error('Failed to setup real-time updates:', error);
    return () => {}; // Return empty cleanup function
  }
};

/**
 * Example: Document Download with Progress
 */
export const downloadDocumentWithProgress = async (documentId, filename) => {
  try {
    const result = await documentService.downloadDocument(documentId, (progress) => {
      console.log(`Download progress: ${progress}%`);
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

    return true;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Example: Issue Comment with Attachments
 */
export const addIssueCommentWithAttachments = async (issueId, comment, files = []) => {
  try {
    if (!comment || comment.trim().length < 1) {
      throw new Error('Comment cannot be empty');
    }

    // Validate attachments
    const maxFiles = 3;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    if (files.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`);
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        throw new Error(`File ${file.name} is too large. Maximum size is 5MB`);
      }
    }

    const result = await issueService.addComment(issueId, comment.trim(), files);
    return result;
  } catch (error) {
    console.error('Failed to add comment:', error);
    throw error;
  }
};

/**
 * Example: Export Issues to Different Formats
 */
export const exportIssuesData = async (tenantId, format = 'csv', filters = {}) => {
  try {
    const exportOptions = {
      format, // csv, excel, pdf
      tenantId,
      status: filters.status || '',
      priority: filters.priority || '',
      category: filters.category || '',
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
      includeComments: filters.includeComments || false,
      includeAttachments: filters.includeAttachments || false
    };

    const result = await issueService.exportIssues(exportOptions);

    // Create download link
    const url = window.URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename || `issues_export.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Example: Policy Management with Enhanced Features
 */
export const managePolicies = {
  // Get all policies with categories
  async getAllPolicies(options = {}) {
    try {
      const result = await documentService.getPolicies({
        active: true,
        category: options.category || '',
        version: 'latest'
      });

      return {
        policies: result.policies,
        categories: result.categories,
        unsigned: result.unsigned,
        expired: result.expired
      };
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      throw error;
    }
  },

  // Sign policy with metadata
  async signPolicy(tenantId, policyId, metadata = {}) {
    try {
      const signMetadata = {
        ipAddress: metadata.ipAddress || '',
        userAgent: metadata.userAgent || navigator.userAgent,
        additional: {
          timestamp: new Date().toISOString(),
          source: 'tenant_portal',
          ...metadata.additional
        }
      };

      const result = await documentService.signPolicy(tenantId, policyId, true, signMetadata);
      return result;
    } catch (error) {
      console.error('Failed to sign policy:', error);
      throw error;
    }
  },

  // Get signature history
  async getSignatureHistory(tenantId, policyId = null) {
    try {
      const result = await documentService.getPolicySignatureHistory(tenantId, policyId);
      return result;
    } catch (error) {
      console.error('Failed to fetch signature history:', error);
      throw error;
    }
  }
};

/**
 * Example: Service Cache Management
 */
export const cacheManager = {
  // Clear all caches
  clearAllCaches() {
    documentService.clearCache();
    issueService.clearCache();
    console.log('All service caches cleared');
  },

  // Clear specific cache patterns
  clearDocumentCache() {
    documentService.clearCache('document_');
    console.log('Document cache cleared');
  },

  clearIssueCache() {
    issueService.clearCache('issue_');
    console.log('Issue cache cleared');
  },

  // Get cache statistics
  getCacheStats() {
    return {
      documents: documentService.getCacheStats(),
      issues: issueService.getCacheStats()
    };
  }
};

/**
 * Example: Notification Management for Issues
 */
export const notificationManager = {
  // Setup notifications for a tenant
  async setupNotifications(tenantId, settings = {}) {
    try {
      const defaultSettings = {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        categories: ['maintenance', 'security', 'urgent'],
        priorities: ['high', 'urgent'],
        frequency: 'immediate'
      };

      const mergedSettings = { ...defaultSettings, ...settings };
      
      const result = await issueService.updateNotificationSettings(tenantId, mergedSettings);
      return result;
    } catch (error) {
      console.error('Failed to setup notifications:', error);
      throw error;
    }
  },

  // Get current notification settings
  async getNotificationSettings(tenantId) {
    try {
      const result = await issueService.getNotificationSettings(tenantId);
      return result;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  },

  // Subscribe to specific issue updates
  async subscribeToIssue(issueId, types = ['status_change', 'comments']) {
    try {
      const result = await issueService.subscribeToIssue(issueId, types);
      return result;
    } catch (error) {
      console.error('Failed to subscribe to issue:', error);
      throw error;
    }
  },

  // Unsubscribe from issue updates
  async unsubscribeFromIssue(issueId) {
    try {
      const result = await issueService.unsubscribeFromIssue(issueId);
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from issue:', error);
      throw error;
    }
  }
};

// Export all utilities
export default {
  uploadDocumentWithProgress,
  searchDocumentsAdvanced,
  getDocumentDashboardData,
  reportIssueEnhanced,
  searchIssuesAdvanced,
  getIssueInsights,
  setupRealTimeIssueUpdates,
  downloadDocumentWithProgress,
  addIssueCommentWithAttachments,
  exportIssuesData,
  managePolicies,
  cacheManager,
  notificationManager
};
