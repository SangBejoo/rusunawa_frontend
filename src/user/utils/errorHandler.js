/**
 * Utility functions for handling API errors in the frontend
 */

/**
 * Checks if an error message indicates a permission denied error
 * @param {string} errorMessage - The error message to check
 * @returns {boolean} - True if it's a permission error
 */
export const isPermissionError = (errorMessage) => {
  if (!errorMessage || typeof errorMessage !== 'string') return false;
  
  const message = errorMessage.toLowerCase();
  return (
    message.includes('permission denied') || 
    message.includes('insufficient privileges') ||
    message.includes('only wakil_direktorat can') ||
    message.includes('access denied') ||
    message.includes('unauthorized')
  );
};

/**
 * Checks if a response indicates a silent permission rejection
 * (when backend rejects instead of approving due to permissions)
 * @param {Object} response - API response object
 * @param {boolean} expectedApproval - Whether we expected an approval
 * @returns {boolean} - True if it's a silent permission rejection
 */
export const isSilentPermissionRejection = (response, expectedApproval = true) => {
  if (!response || !expectedApproval) return false;
  
  const statusMessage = response.status?.message || '';
  const isWakilDirektoratMessage = statusMessage.toLowerCase().includes('wakil_direktorat');
  
  // Check for booking approval
  if (response.approval) {
    return response.approval.approved === false && isWakilDirektoratMessage;
  }
  
  // Check for payment verification
  if (response.payment) {
    const paymentStatus = response.payment.status;
    return (paymentStatus === 'failed' || paymentStatus === 'rejected') && isWakilDirektoratMessage;
  }
  
  // Check for document review
  if (response.document) {
    return response.document.status === 'rejected' && isWakilDirektoratMessage;
  }
  
  return false;
};

/**
 * Handles API response errors with consistent toast notifications
 * @param {Object} response - API response object
 * @param {Function} toast - Chakra UI toast function
 * @param {Object} options - Options for customizing the error handling
 * @param {string} options.action - The action being performed (e.g., 'approve booking', 'verify payment')
 * @param {string} options.successTitle - Title for success toast
 * @param {string} options.successMessage - Message for success toast
 * @param {boolean} options.expectedApproval - Whether we expected an approval (default: true)
 * @returns {boolean} - Returns true if error was handled, false if success
 */
export const handleApiResponse = (response, toast, options = {}) => {
  const {
    action = 'perform this action',
    successTitle = 'Success',
    successMessage = 'Operation completed successfully',
    expectedApproval = true,
  } = options;

  // Check if the backend returned an error status
  if (response && response.status === 'error') {
    const errorMessage = response.message || 'Unknown error occurred';
    
    // Check if it's a permission-denied error
    if (isPermissionError(errorMessage)) {
      toast({
        title: 'Access Denied',
        description: `Only Wakil Direktorat can ${action}. Please contact an authorized user.`,
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
    } else {
      // Other types of errors
      const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
      toast({
        title: `${capitalizedAction} Failed`,
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    return true; // Error was handled
  }
  
  // Check for silent permission rejection
  if (isSilentPermissionRejection(response, expectedApproval)) {
    toast({
      title: 'Access Denied',
      description: `Only Wakil Direktorat can ${action}. Your request was automatically rejected.`,
      status: 'warning',
      duration: 6000,
      isClosable: true,
      position: 'top',
    });
    return true; // Error was handled
  }
  
  // Success case
  if (successTitle && successMessage) {
    toast({
      title: successTitle,
      description: successMessage,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  }
  
  return false; // No error, operation was successful
};

/**
 * Handles network or critical errors with consistent toast notifications
 * @param {Error} error - The error object
 * @param {Function} toast - Chakra UI toast function
 * @param {string} action - The action being performed (e.g., 'approve booking')
 */
export const handleNetworkError = (error, toast, action = 'perform this action') => {
  toast({
    title: 'Error',
    description: error.message || `Failed to ${action} - please try again`,
    status: 'error',
    duration: 4000,
    isClosable: true,
  });
};

/**
 * Complete error handling wrapper for API calls
 * @param {Function} apiCall - The API function to call
 * @param {Function} toast - Chakra UI toast function
 * @param {Object} options - Options for error handling
 * @returns {Promise<boolean>} - Returns true if operation was successful
 */
export const handleApiCall = async (apiCall, toast, options = {}) => {
  try {
    const response = await apiCall();
    
    // Handle the response
    const hasError = handleApiResponse(response, toast, options);
    return !hasError; // Return true if successful (no error)
    
  } catch (error) {
    // Handle network or other critical errors
    handleNetworkError(error, toast, options.action);
    return false;
  }
};
