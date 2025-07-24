import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Tooltip,
  useColorModeValue,
  IconButton
} from '@chakra-ui/react';
import { FaLock, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useDocumentVerification } from '../../hooks/useDocumentVerification';

/**
 * Document Verification Button Component
 * Wraps booking buttons with document verification logic
 * Shows appropriate state based on document verification status
 */
const DocumentVerificationButton = ({ 
  children, 
  onClick, 
  isLoading, 
  isDisabled, 
  variant = "solid",
  colorScheme = "brand",
  size = "md",
  width,
  leftIcon,
  rightIcon,
  loadingText,
  ...buttonProps 
}) => {
  const navigate = useNavigate();
  const { verificationStatus, loading: verificationLoading } = useDocumentVerification();
  
  // Button colors for different states
  const disabledBg = useColorModeValue('gray.100', 'gray.700');
  const disabledColor = useColorModeValue('gray.500', 'gray.400');

  // If still loading verification status, show loading button
  if (verificationLoading) {
    return (
      <Button
        isLoading={true}
        loadingText="Checking..."
        variant={variant}
        colorScheme="gray"
        size={size}
        width={width}
        isDisabled={true}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  }

  // If user can book, render normal button
  if (verificationStatus.canBook) {
    return (
      <Button
        onClick={onClick}
        isLoading={isLoading}
        loadingText={loadingText}
        isDisabled={isDisabled}
        variant={variant}
        colorScheme={colorScheme}
        size={size}
        width={width}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  }

  // Otherwise, show appropriate disabled state with tooltip
  const getButtonState = () => {
    if (!verificationStatus.hasDocuments) {
      return {
        icon: <FaExclamationTriangle />,
        tooltip: 'Upload documents first to start booking',
        color: 'orange',
        action: () => navigate('/tenant/documents/upload')
      };
    }
    
    if (verificationStatus.hasRejected) {
      return {
        icon: <FaExclamationTriangle />,
        tooltip: `${verificationStatus.rejectedCount} document(s) rejected. Re-upload to continue`,
        color: 'red',
        action: () => navigate('/tenant/documents')
      };
    }
    
    if (verificationStatus.hasPending) {
      return {
        icon: <FaClock />,
        tooltip: `${verificationStatus.pendingCount} document(s) pending approval. Wait for approval to book`,
        color: 'yellow',
        action: () => navigate('/tenant/documents')
      };
    }
    
    return {
      icon: <FaLock />,
      tooltip: 'Document verification incomplete',
      color: 'gray',
      action: () => navigate('/tenant/documents')
    };
  };

  const buttonState = getButtonState();

  return (
    <Tooltip 
      label={buttonState.tooltip} 
      placement="top"
      hasArrow
      bg={`${buttonState.color}.500`}
      color="white"
    >
      <Button
        onClick={buttonState.action}
        variant="outline"
        colorScheme={buttonState.color}
        size={size}
        width={width}
        leftIcon={buttonState.icon}
        bg={disabledBg}
        color={disabledColor}
        _hover={{
          bg: `${buttonState.color}.50`,
          borderColor: `${buttonState.color}.300`
        }}
        {...buttonProps}
      >
        {!verificationStatus.hasDocuments ? 'Upload Documents' : 
         verificationStatus.hasRejected ? 'Fix Documents' :
         verificationStatus.hasPending ? 'Pending Approval' : 
         'Verify Documents'}
      </Button>
    </Tooltip>
  );
};

export default DocumentVerificationButton;
