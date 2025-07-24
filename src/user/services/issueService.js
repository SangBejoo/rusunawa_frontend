import api from '../utils/apiClient';

const issueService = {
  /**
   * Get all issues with pagination and filters
   */
  getIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issues');
    }
  },  /**
   * Get issue by ID with attachment data (using both legacy and new attachment APIs)
   */
  getIssueById: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}`);
      
      const issueData = response.data.issue || response.data;
      
      // Fetch attachments from new system (issue_attachments table)
      const attachmentsData = [];
      try {
        const attachmentsResponse = await api.get(`/issues/${issueId}/attachments`);
        if (attachmentsResponse.data && attachmentsResponse.data.attachments) {
          attachmentsData.push(...attachmentsResponse.data.attachments);
        }
      } catch (attachmentError) {
        console.log('No new attachments found:', attachmentError);
      }

      // Try to fetch legacy image (issue_images table) if issue has image attachment
      let legacyImage = null;
      if (issueData.hasImageAttachment || issueData.has_image_attachment) {
        try {
          const legacyImageResponse = await api.get(`/issues/${issueId}/image`);
          if (legacyImageResponse.data && legacyImageResponse.data.content) {
            legacyImage = {
              attachmentId: `legacy_${issueId}`,
              issueId: issueId,
              uploadedBy: issueData.reportedBy || issueData.reported_by,
              fileName: `issue_${issueId}_report_image`,
              fileType: legacyImageResponse.data.fileType || issueData.imageFileType || 'image/jpeg',
              fileSizeBytes: 0,
              mimeType: legacyImageResponse.data.fileType || issueData.imageFileType || 'image/jpeg',
              attachmentType: 'report',
              isPrimary: true,
              uploadedAt: issueData.reportedAt || issueData.reported_at,
              content: legacyImageResponse.data.content,
              contextDescription: 'Initial report evidence (legacy)',
              id: `legacy_${issueId}`,
              file_name: `issue_${issueId}_report_image`,
              file_type: legacyImageResponse.data.fileType || issueData.imageFileType || 'image/jpeg',
              uploaded_at: issueData.reportedAt || issueData.reported_at,
              attachment_type: 'report',
              is_primary: true
            };
          }
        } catch (legacyError) {
          console.log('No legacy image found or error fetching:', legacyError);
        }
      }

      // Combine all attachments (legacy + new)
      const allAttachments = [];
      if (legacyImage) {
        allAttachments.push(legacyImage);
      }
      allAttachments.push(...attachmentsData);

      issueData.attachments = allAttachments;
      
      // For backward compatibility, set primary attachment as main image
      const primaryAttachment = legacyImage || 
                              allAttachments.find(att => att.isPrimary) || 
                              allAttachments[0];
      
      if (primaryAttachment) {
        issueData.imageData = {
          hasImage: true,
          attachmentId: primaryAttachment.attachmentId,
          fileName: primaryAttachment.fileName,
          fileType: primaryAttachment.fileType,
          contextDescription: primaryAttachment.contextDescription,
          uploadedAt: primaryAttachment.uploadedAt,
          uploadedBy: primaryAttachment.uploadedBy,
          imageUrl: primaryAttachment.content ? 
            `data:${primaryAttachment.fileType};base64,${primaryAttachment.content}` :
            `/api/v1/issue-attachments/${primaryAttachment.attachmentId}`
        };
      } else {
        issueData.imageData = { hasImage: false };
      }
      
      return issueData;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue details');
    }
  },/**
   * Create new issue (ReportIssue)
   */
  createIssue: async (issueData) => {
    try {      // Transform the frontend data to match the backend ReportIssueRequest format (snake_case)
      const payload = {
        tenant_id: issueData.tenantId,
        booking_id: issueData.bookingId || 0, // Set to 0 for general issues (not booking-specific)
        reported_by_user_id: issueData.reportedByUserId,
        description: issueData.description,
        priority: issueData.priority || "medium", // Use provided priority or default
        category: issueData.category || "general", // Use provided category or default
        estimated_resolution_hours: issueData.estimatedResolutionHours || 24, // Default estimation
        initial_attachments: []
      };
        // If there's a file, add it to initial_attachments
      if (issueData.fileName && issueData.content) {
        payload.initial_attachments.push({
          file_name: issueData.fileName,
          file_type: issueData.fileType || 'image/png',
          content: issueData.content, // Base64 string
          attachment_type: "evidence", // Default to evidence type for initial reports
          context_description: "Initial issue report attachment",
          is_primary: true
        });
      }
      
      const response = await api.post('/issues', payload);
      return response.data;
    } catch (error) {
      console.error('Create issue error:', error);
      throw new Error(error.message || 'Failed to create issue');
    }
  },

  /**
   * Update issue
   */
  updateIssue: async (issueId, issueData) => {
    try {
      const response = await api.put(`/issues/${issueId}`, issueData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update issue');
    }
  },  /**
   * Update issue status with single image support (using unified status + attachment API)
   */  
  updateIssueStatus: async (issueId, statusData) => {
    try {
      // Debug: Log the incoming statusData
      console.log('Incoming statusData:', statusData);
      
      // Validate and convert updatedBy to integer
      const updatedBy = parseInt(statusData.updatedBy);
      if (isNaN(updatedBy)) {
        throw new Error(`Invalid updatedBy value: ${statusData.updatedBy}. Expected a number.`);
      }
      
      // Transform for API compatibility - use status update with progressAttachments
      const payload = {
        status: statusData.status,
        notes: statusData.notes || '',
        updatedBy: updatedBy,
        progressPercentage: parseInt(statusData.progressPercentage) || 0
      };
      
      // Add resolved_at if provided
      if (statusData.resolvedAt) {
        payload.resolvedAt = statusData.resolvedAt;
      }
        // Add image as progressAttachment if provided
      if (statusData.image && statusData.image.content) {
        const attachmentType = statusData.status === 'resolved' ? 'completion' : 
                              statusData.status === 'in_progress' ? 'progress' : 
                              statusData.status === 'closed' ? 'feedback' : 'report';
        
        payload.progressAttachments = [{
          fileName: statusData.image.fileName,
          fileType: statusData.image.fileType,
          content: statusData.image.content, // Base64 content
          attachmentType: attachmentType,
          contextDescription: `Status update to ${statusData.status}: ${statusData.notes}`,
          isPrimary: true
        }];
      }
      
      console.log('Transformed status update payload:', {
        ...payload,
        progressAttachments: payload.progressAttachments ? 
          payload.progressAttachments.map(att => ({
            ...att,
            content: `[BASE64 DATA - ${att.content.length} chars]`
          })) : undefined
      });
      
      const response = await api.put(`/issues/${issueId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Update issue status error:', error);
      throw new Error(error.message || 'Failed to update issue status');
    }
  },/**
   * Assign issue to user
   */
  assignIssue: async (issueId, assignmentData) => {
    try {
      const response = await api.put(`/issues/${issueId}/assign`, assignmentData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to assign issue');
    }
  },

  /**
   * Update issue priority
   */
  updateIssuePriority: async (issueId, priorityData) => {
    try {
      const response = await api.put(`/issues/${issueId}/priority`, priorityData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update issue priority');
    }
  },  /**
   * Add comment to issue
   */
  addIssueComment: async (issueId, commentData) => {
    try {
      // Format the request body to match the API specification
      const requestBody = {
        content: commentData.content || commentData.comment,
        comment_type: commentData.commentType || commentData.comment_type || 'general',
        is_public: commentData.isPublic !== undefined ? commentData.isPublic : true,
        author_id: commentData.authorId || commentData.author_id,
        issue_id: parseInt(issueId)
      };

      // Add parent comment if it's a reply
      if (commentData.parentCommentId) {
        requestBody.parent_comment_id = commentData.parentCommentId;
      }

      console.log('Adding comment with payload:', requestBody);

      const response = await api.post(`/issues/${issueId}/comments`, requestBody);
      return response.data;
    } catch (error) {
      console.error('Error adding issue comment:', error);
      throw new Error(error.message || 'Failed to add comment');
    }
  },

  /**
   * Get issue comments with filters
   * @param {number} issueId - The issue ID
   * @param {object} params - Query parameters {includePrivate, commentType, page, limit}
   * @returns {Promise<Object>} The issue comments response
   */
  getIssueComments: async (issueId, params = {}) => {
    try {
      const response = await api.get(`/issues/${issueId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to get issue comments:', error);
      // Return empty response if API not implemented or error occurs
      return { comments: [], totalCount: 0 };
    }
  },

  /**
   * Get issue status history
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The issue status history
   */
  getIssueStatusHistory: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}/status-history`);
      return response.data;
    } catch (error) {
      console.error('Failed to get issue status history:', error);
      // Return empty history if endpoint doesn't exist yet
      return { history: [] };
    }
  },
  /**
   * Get tenant issues
   * @param {number} tenantId - Tenant ID
   * @returns {Promise} - List of tenant's issues
   */
  getTenantIssues: async (tenantId, params = {}) => {
    try {
      const response = await api.get(`/tenants/${tenantId}/issues`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tenant issues');
    }
  },

  /**
   * Get open issues
   */
  getOpenIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues/open', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch open issues');
    }
  },

  /**
   * Get issue categories
   */
  getIssueCategories: async () => {
    try {
      const response = await api.get('/issues/categories');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue categories');
    }
  },

  /**
   * Get issue statistics
   */
  getIssueStatistics: async (period = '30d') => {
    try {
      const response = await api.get(`/issues/statistics?period=${period}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue statistics');
    }
  },

  /**
   * Close issue
   */
  closeIssue: async (issueId, closureData) => {
    try {
      const response = await api.post(`/issues/${issueId}/close`, closureData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to close issue');
    }
  },

  /**
   * Reopen issue
   */
  reopenIssue: async (issueId, reopenData) => {
    try {
      const response = await api.post(`/issues/${issueId}/reopen`, reopenData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to reopen issue');
    }
  },

  /**
   * Export issues
   */
  exportIssues: async (params = {}) => {
    try {
      const response = await api.get('/issues/export', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to export issues');
    }
  },  /**
   * Get issue attachments (using multi-image attachment API)
   * @param {number} issueId - The issue ID
   * @param {string} attachmentType - Optional filter by attachment type
   * @returns {Promise<Object>} The issue attachments data
   */
  getIssueAttachments: async (issueId, attachmentType = '') => {
    try {
      const url = attachmentType ? 
        `/issues/${issueId}/attachments/${attachmentType}` : 
        `/issues/${issueId}/attachments`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { attachments: [] };
      }
      console.error('Error fetching issue attachments:', error);
      throw new Error(error.message || 'Failed to fetch issue attachments');
    }
  },

  /**
   * Get issue attachment URL (for displaying images)
   * @param {number} attachmentId - The attachment ID
   * @returns {string} The issue attachment URL
   */
  getIssueAttachmentUrl: (attachmentId) => {
    return `/api/v1/issue-attachments/${attachmentId}`;
  },

  /**
   * Upload issue attachment (using multi-image attachment API)
   * @param {number} issueId - The issue ID
   * @param {Object} imageData - Image data {fileName, fileType, content}
   * @param {string} attachmentType - Type of attachment (evidence, progress, resolution, etc.)
   * @param {number} uploadedBy - User ID of uploader
   * @returns {Promise<Object>} Upload response
   */
  uploadIssueAttachment: async (issueId, imageData, attachmentType = 'evidence', uploadedBy = 1) => {
    try {
      const response = await api.post(`/issues/${issueId}/attachments`, {
        fileName: imageData.fileName,
        fileType: imageData.fileType,
        content: imageData.content, // Base64 content
        attachmentType: attachmentType,
        contextDescription: imageData.contextDescription || `${attachmentType} attachment`,
        isPrimary: imageData.isPrimary || false,
        uploadedBy: uploadedBy
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading issue attachment:', error);
      throw new Error(error.message || 'Failed to upload issue attachment');
    }
  },
  /**
   * Get issue details (alias for getIssueById for consistency)
   */
  getIssueDetails: async (issueId) => {
    return issueService.getIssueById(issueId);
  },  /**
   * Get issue attachments - Multi-image flow implementation
   */
  getIssueAttachments: async (issueId, attachmentType = '') => {
    try {
      const url = attachmentType 
        ? `/issues/${issueId}/attachments?type=${attachmentType}`
        : `/issues/${issueId}/attachments`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return { attachments: [] };
      }
      console.error('Error fetching issue attachments:', error);
      throw new Error(error.message || 'Failed to fetch issue attachments');
    }
  },  /**
   * Upload issue attachment - Multi-image flow implementation
   */  
  uploadIssueAttachment: async (issueId, file, attachmentType, uploadedBy) => {
    try {
      console.log('uploadIssueAttachment called with:', {
        issueId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        attachmentType,
        uploadedBy
      });

      // Convert file to base64
      const base64Content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:image/... prefix
          console.log('Base64 conversion successful, length:', base64.length);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const payload = {
        issue_id: issueId,
        file_name: file.name,
        file_type: file.type.split('/')[1], // e.g., 'png' from 'image/png'
        content: base64Content,
        attachment_type: attachmentType,
        uploaded_by: uploadedBy
      };

      console.log('Sending attachment payload:', {
        ...payload,
        content: `[BASE64 DATA - ${payload.content.length} chars]` // Don't log full base64
      });

      const response = await api.post(`/issues/${issueId}/attachments`, payload);
      console.log('Attachment upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },
  /**
   * Delete issue attachment
   */
  deleteIssueAttachment: async (issueId, attachmentId) => {
    try {
      const response = await api.delete(`/issues/${issueId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  /**
   * Get issue activity log
   */
  getIssueActivity: async (issueId) => {
    // Return empty array for now since this endpoint is not yet implemented
    return { data: [] };
  },

  /**
   * Get available assignees
   */
  getAvailableAssignees: async () => {
    // Return empty array for now since this endpoint is not yet implemented
    return { data: [] };
  },

  /**
   * Resolve issue (using status update endpoint)
   */
  resolveIssue: async (issueId, resolutionData) => {
    try {
      const response = await api.put(`/issues/${issueId}/status`, {
        status: 'resolved',
        ...resolutionData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to resolve issue');
    }
  },

  /**
   * Get individual attachment with content by attachment ID
   */
  getIssueAttachment: async (issueId, attachmentId) => {
    try {
      const response = await api.get(`/issue-attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching individual attachment:', error);
      throw error;
    }
  },

  /**
   * Upload multiple attachments to an issue (for status updates)
   */
  uploadIssueAttachments: async (issueId, attachments, uploadedBy) => {
    try {
      const uploadPromises = attachments.map(attachment => 
        api.post(`/issues/${issueId}/attachments`, {
          fileName: attachment.fileName,
          fileType: attachment.fileType,
          content: attachment.content, // Base64 string
          attachmentType: attachment.attachmentType || 'progress',
          contextDescription: attachment.contextDescription || '',
          uploadedBy: uploadedBy,
          isPrimary: attachment.isPrimary || false
        })
      );

      const responses = await Promise.all(uploadPromises);
      return {
        success: true,
        attachments: responses.map(r => r.data.attachment)
      };
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw new Error(error.message || 'Failed to upload attachments');
    }
  },

  /**
   * Update issue status with progress images
   */
  updateIssueStatusWithImages: async (issueId, statusData, progressImages = []) => {
    try {
      // First update the status
      const statusResponse = await issueService.updateIssueStatus(issueId, statusData);
      
      // Then upload progress images if any
      if (progressImages.length > 0) {
        const attachmentType = statusData.status === 'in_progress' ? 'progress' : 
                              statusData.status === 'resolved' ? 'completion' : 'feedback';
        
        const attachments = progressImages.map((image, index) => ({
          fileName: image.fileName,
          fileType: image.fileType,
          content: image.base64,
          attachmentType: attachmentType,
          contextDescription: image.contextDescription || `${attachmentType} image ${index + 1}`,
          isPrimary: image.isPrimary || index === 0
        }));

        await issueService.uploadIssueAttachments(issueId, attachments, statusData.updatedBy);
      }

      return statusResponse;
    } catch (error) {
      console.error('Error updating issue status with images:', error);
      throw new Error(error.message || 'Failed to update issue status with images');
    }
  },

  /**
   * Get issue image data (returns JSON with base64 content) - legacy system
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The issue image data with base64 content
   */
  getIssueImage: async (issueId) => {
    try {
      const response = await api.get(`/issues/${issueId}/image`);
      return response.data;
    } catch (error) {
      console.error('Error fetching issue image:', error);
      throw new Error(error.message || 'Failed to fetch issue image');
    }
  },
  
  /**
   * Get attachment content by attachment ID
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<Object>} The attachment content with base64 data
   */
  getAttachmentContent: async (attachmentId) => {
    try {
      const response = await api.get(`/issue-attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attachment content:', error);
      throw new Error(error.message || 'Failed to fetch attachment content');
    }
  },
  /**
   * Update issue status with tracking
   * @param {number} issueId - The issue ID
   * @param {object} statusData - Status update data
   * @returns {Promise<Object>} The updated issue
   */
  updateIssueStatus: async (issueId, statusData) => {
    try {
      // Debug: Log the incoming statusData
      console.log('Incoming statusData:', statusData);
      
      // Validate and convert updatedBy to integer
      const updatedBy = parseInt(statusData.updatedBy);
      if (isNaN(updatedBy)) {
        throw new Error(`Invalid updatedBy value: ${statusData.updatedBy}. Expected a number.`);
      }
      
      // Transform for API compatibility - use status update with progressAttachments
      const payload = {
        status: statusData.status,
        notes: statusData.notes || '',
        updatedBy: updatedBy,
        progressPercentage: parseInt(statusData.progressPercentage) || 0
      };
      
      // Add resolved_at if provided
      if (statusData.resolvedAt) {
        payload.resolvedAt = statusData.resolvedAt;
      }
        // Add image as progressAttachment if provided
      if (statusData.image && statusData.image.content) {
        const attachmentType = statusData.status === 'resolved' ? 'completion' : 
                              statusData.status === 'in_progress' ? 'progress' : 
                              statusData.status === 'closed' ? 'feedback' : 'report';
        
        payload.progressAttachments = [{
          fileName: statusData.image.fileName,
          fileType: statusData.image.fileType,
          content: statusData.image.content, // Base64 content
          attachmentType: attachmentType,
          contextDescription: `Status update to ${statusData.status}: ${statusData.notes}`,
          isPrimary: true
        }];
      }
      
      console.log('Transformed status update payload:', {
        ...payload,
        progressAttachments: payload.progressAttachments ? 
          payload.progressAttachments.map(att => ({
            ...att,
            content: `[BASE64 DATA - ${att.content.length} chars]`
          })) : undefined
      });
      
      const response = await api.put(`/issues/${issueId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Update issue status error:', error);
      throw new Error(error.message || 'Failed to update issue status');
    }
  },
};

export default issueService;
