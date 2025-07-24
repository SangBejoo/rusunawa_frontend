import axios from 'axios';
import { API_URL, getAuthHeader } from '../utils/apiConfig';

const issueService = {  /**
   * Report a new issue (using new /v1/issues with multiple attachments)
   * @param {Object} issueData - The issue data object
   * @param {File} imageFile - The legacy single image file (optional, for backward compatibility)
   * @returns {Promise<Object>} The report response
   */
  reportIssue: async (issueData, imageFile = null) => {
    try {
      // Prepare the request body according to the API specification
      const requestBody = {
        tenantId: issueData.tenantId,
        reportedByUserId: issueData.reportedByUserId,
        description: issueData.description,
        priority: issueData.priority || 'medium',
        category: issueData.category || '',
        estimatedResolutionHours: issueData.estimatedResolutionHours || 0
      };      // Add bookingId if provided
      console.log('🔍 Booking ID check:', {
        'issueData.bookingId': issueData.bookingId,
        'typeof': typeof issueData.bookingId,
        'truthy': !!issueData.bookingId,
        'condition result': !!issueData.bookingId
      });
      
      if (issueData.bookingId) {
        console.log('✅ Adding booking ID to request:', issueData.bookingId);
        requestBody.bookingId = issueData.bookingId;
      } else {
        console.log('❌ Booking ID not added - value was:', issueData.bookingId);
      }

      // Handle multiple attachments (new format)
      if (issueData.initialAttachments && issueData.initialAttachments.length > 0) {
        requestBody.initialAttachments = issueData.initialAttachments;
      }
      // Handle single image file (legacy support)
      else if (imageFile) {
        // Convert image file to base64
        const imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            // Remove the data:image/jpeg;base64, prefix and get just the base64 string
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });

        // Create single attachment for legacy support
        requestBody.initialAttachments = [{
          fileName: imageFile.name,
          fileType: imageFile.type,
          content: imageBase64,
          attachmentType: 'evidence',
          contextDescription: 'Initial report evidence',
          isPrimary: true
        }];
      }
      
      console.log('Sending issue report request:', requestBody);
      
      const response = await axios.post(
        `${API_URL}/issues`,
        requestBody,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error reporting issue:', error);
      throw error.response?.data || { message: 'Failed to report issue' };
    }
  },/**
   * Get issue details (using the new /v1/issues/{issueId} endpoint)
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The issue details
   */
  getIssue: async (issueId) => {
    try {      const response = await axios.get(
        `${API_URL}/issues/${issueId}?includeAttachments=true&includeHistory=true&includeComments=true`,
        { headers: getAuthHeader() }
      );
      
      // Transform the response to include attachments properly
      const issueData = response.data.issue || response.data;
      if (response.data.attachments) {
        issueData.attachments = response.data.attachments;
      }
      if (response.data.history) {
        issueData.statusHistory = response.data.history;
      }
      if (response.data.comments) {
        issueData.comments = response.data.comments;
      }
      
      return issueData;
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error.response?.data || { message: 'Failed to fetch issue' };
    }
  },

  /**
   * Get tenant issues
   * @param {number} tenantId - The tenant ID
   * @returns {Promise<Object>} The tenant issues
   */
  getTenantIssues: async (tenantId) => {
    try {
      const response = await axios.get(
        `${API_URL}/tenants/${tenantId}/issues`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching tenant issues:', error);
      throw error.response?.data || { message: 'Failed to fetch tenant issues' };
    }
  },
  /**
   * Get issues list (using the new /v1/issues endpoint)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} The issues list
   */
  getIssues: async (params = {}) => {
    try {      const response = await axios.get(
        `${API_URL}/issues`,
        { 
          headers: getAuthHeader(),
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error.response?.data || { message: 'Failed to fetch issues' };
    }
  },  /**
   * Update issue status with optional images
   * @param {number} issueId - The issue ID
   * @param {string} status - The new status
   * @param {Object} options - Additional options (notes, images, etc.)
   * @returns {Promise<Object>} The update response
   */
  updateIssueStatus: async (issueId, status, options = {}) => {
    try {
      const requestBody = {
        issueId: parseInt(issueId),
        status: status,
        notes: options.notes || '',
        updatedBy: options.updatedBy || 1, // Default to System User
        progressPercentage: options.progressPercentage || 0
      };

      // Add images if provided
      if (options.images && options.images.length > 0) {
        requestBody.progressAttachments = options.images.map((image, index) => ({
          fileName: image.fileName,
          fileType: image.fileType,
          content: image.base64,
          contextDescription: `${status} image ${index + 1}: ${image.contextDescription || 'Progress update'}`,
          attachmentType: status === 'in_progress' ? 'progress' : 
                         status === 'resolved' ? 'completion' : 'feedback'
        }));
      }

      const response = await axios.put(
        `${API_URL}/issues/${issueId}/status`,
        requestBody,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw error.response?.data || { message: 'Failed to update issue status' };
    }
  },

  /**
   * Submit verification feedback with images (for closed status)
   * @param {number} issueId - The issue ID
   * @param {Object} feedbackData - Feedback data with images
   * @returns {Promise<Object>} The response
   */
  submitVerificationFeedback: async (issueId, feedbackData) => {
    try {
      const requestBody = {
        feedbackText: feedbackData.feedbackText,
        rating: feedbackData.rating || 5,
        verificationImages: feedbackData.verificationImages || []
      };

      const response = await axios.post(
        `${API_URL}/issues/${issueId}/verify`,
        requestBody,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting verification feedback:', error);
      throw error.response?.data || { message: 'Failed to submit verification feedback' };
    }
  },

  /**
   * Get issue attachments organized by workflow phase
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The attachments organized by phase
   */
  getIssueAttachments: async (issueId) => {
    try {
      const response = await axios.get(
        `${API_URL}/issues/${issueId}/attachments`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching issue attachments:', error);
      throw error.response?.data || { message: 'Failed to fetch issue attachments' };
    }
  },

  /**
   * Get attachment content by attachment ID
   * @param {number} attachmentId - The attachment ID
   * @returns {Promise<Object>} The attachment content with base64 data
   */
  getAttachmentContent: async (attachmentId) => {
    try {
      const response = await axios.get(
        `${API_URL}/issue-attachments/${attachmentId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching attachment content:', error);
      throw error.response?.data || { message: 'Failed to fetch attachment content' };
    }
  },  /**
   * Get attachments organized by status/workflow phase
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The attachments organized by workflow phase (report, progress, completion, feedback)
   */
  getAttachmentsByStatus: async (issueId) => {
    try {
      const response = await axios.get(
        `${API_URL}/issues/${issueId}/attachments`,
        { headers: getAuthHeader() }
      );
      const attachments = response.data.attachments || [];
      
      // Organize attachments by type/status
      const organized = {
        report: attachments.filter(a => a.attachmentType === 'report'),
        progress: attachments.filter(a => a.attachmentType === 'progress'), 
        completion: attachments.filter(a => a.attachmentType === 'completion'),
        feedback: attachments.filter(a => a.attachmentType === 'feedback')
      };
      
      return organized;
    } catch (error) {
      console.error('Error organizing attachments by status:', error);
      throw error;
    }
  },
    /**
   * Get issue image URL (using the new /v1/issues/{issueId}/image endpoint)
   * @param {number} issueId - The issue ID
   * @returns {string} The issue image URL
   */  getIssueImageUrl: (issueId) => {
    return `${API_URL}/issues/${issueId}/image`;
  },
  /**
   * Get issue image data (returns JSON with base64 content)
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} The issue image data with base64 content
   */  getIssueImage: async (issueId) => {
    try {
      const response = await axios.get(
        `${API_URL}/issues/${issueId}/image`,
        { 
          headers: getAuthHeader()
          // Don't set responseType to 'blob' since API returns JSON
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching issue image:', error);
      throw error.response?.data || { message: 'Failed to fetch issue image' };
    }
  },

  /**
   * Upload multiple attachments to an issue
   * @param {number} issueId - The issue ID
   * @param {Array} attachments - Array of attachment objects with {fileName, fileType, content, attachmentType, contextDescription}
   * @param {number} uploadedBy - User ID of uploader
   * @returns {Promise<Object>} Upload response
   */
  uploadAttachments: async (issueId, attachments, uploadedBy) => {
    try {
      const uploadPromises = attachments.map(attachment => 
        axios.post(
          `${API_URL}/issues/${issueId}/attachments`,
          {
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            content: attachment.content, // Base64 string
            attachmentType: attachment.attachmentType || 'evidence',
            contextDescription: attachment.contextDescription || '',
            uploadedBy: uploadedBy,
            isPrimary: attachment.isPrimary || false
          },
          { headers: getAuthHeader() }
        )
      );

      const responses = await Promise.all(uploadPromises);
      return {
        success: true,
        attachments: responses.map(r => r.data.attachment)
      };
    } catch (error) {
      console.error('Error uploading attachments:', error);
      throw error.response?.data || { message: 'Failed to upload attachments' };
    }
  },

  /**
   * Get a specific attachment by ID
   * @param {number} attachmentId - The attachment ID
   * @param {string} format - Optional format (original, thumbnail)
   * @param {string} encoding - Optional encoding (binary, base64)
   * @returns {Promise<Object>} Attachment response
   */
  getAttachment: async (attachmentId, format = 'original', encoding = 'binary') => {
    try {
      const url = encoding !== 'binary' 
        ? `${API_URL}/issue-attachments/${attachmentId}/${format}/${encoding}`
        : `${API_URL}/issue-attachments/${attachmentId}`;
        
      const response = await axios.get(url, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error('Error fetching attachment:', error);
      throw error.response?.data || { message: 'Failed to fetch attachment' };
    }
  },

  /**
   * Get issue status history
   * @param {number} issueId - The issue ID
   * @returns {Promise<Object>} Status history response
   */
  getIssueStatusHistory: async (issueId) => {
    try {
      const response = await axios.get(
        `${API_URL}/issues/${issueId}/status-history`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching issue status history:', error);
      throw error.response?.data || { message: 'Failed to fetch issue status history' };
    }
  },

  /**
   * Get issue comments
   * @param {number} issueId - The issue ID
   * @param {Object} options - Query options (includePrivate, commentType)
   * @returns {Promise<Object>} Comments response
   */
  getIssueComments: async (issueId, options = {}) => {
    try {
      const params = {};
      if (options.includePrivate !== undefined) {
        params.includePrivate = options.includePrivate;
      }
      
      let url = `${API_URL}/issues/${issueId}/comments`;
      if (options.commentType) {
        url = `${API_URL}/issues/${issueId}/comments/${options.commentType}`;
      }
      
      const response = await axios.get(url, { 
        headers: getAuthHeader(),
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching issue comments:', error);
      throw error.response?.data || { message: 'Failed to fetch issue comments' };
    }
  },

  /**
   * Add a comment to an issue
   * @param {number} issueId - The issue ID
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Comment response
   */  addIssueComment: async (issueId, commentData) => {
    try {      const requestBody = {
        content: commentData.comment || commentData.content,
        comment_type: commentData.commentType || commentData.comment_type || 'general',
        is_public: commentData.isPublic !== undefined ? commentData.isPublic : true, // Keep as is_public for the request
        author_id: commentData.authorId || commentData.author_id,
        issue_id: parseInt(issueId)
      };

      console.log('Adding comment with payload:', requestBody);

      const response = await axios.post(
        `${API_URL}/issues/${issueId}/comments`,
        requestBody,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding issue comment:', error);
      throw error.response?.data || { message: 'Failed to add issue comment' };
    }
  }
};

export default issueService;
