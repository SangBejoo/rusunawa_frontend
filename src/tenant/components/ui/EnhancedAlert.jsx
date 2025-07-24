import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  CloseButton,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Fade,
  ScaleFade,
} from '@chakra-ui/react';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimesCircle,
  FaBell
} from 'react-icons/fa';

/**
 * Enhanced Alert Component with beautiful styling and animations
 */
const EnhancedAlert = ({ 
  status = 'info', 
  title, 
  description, 
  children, 
  onClose, 
  isClosable = false,
  variant = 'subtle',
  size = 'md',
  hasIcon = true,
  borderRadius = 'lg',
  boxShadow = 'md',
  ...props 
}) => {
  const bgColors = {
    success: useColorModeValue('green.50', 'green.900'),
    error: useColorModeValue('red.50', 'red.900'),
    warning: useColorModeValue('orange.50', 'orange.900'),
    info: useColorModeValue('blue.50', 'blue.900'),
  };

  const borderColors = {
    success: useColorModeValue('green.200', 'green.700'),
    error: useColorModeValue('red.200', 'red.700'),
    warning: useColorModeValue('orange.200', 'orange.700'),
    info: useColorModeValue('blue.200', 'blue.700'),
  };

  const textColors = {
    success: useColorModeValue('green.800', 'green.200'),
    error: useColorModeValue('red.800', 'red.200'),
    warning: useColorModeValue('orange.800', 'orange.200'),
    info: useColorModeValue('blue.800', 'blue.200'),
  };

  const iconColors = {
    success: 'green.500',
    error: 'red.500',
    warning: 'orange.500',
    info: 'blue.500',
  };

  const icons = {
    success: FaCheckCircle,
    error: FaTimesCircle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle,
  };

  const IconComponent = icons[status];

  const paddingMap = {
    sm: 3,
    md: 4,
    lg: 6,
  };

  return (
    <ScaleFade initialScale={0.9} in={true}>
      <Alert
        status={status}
        variant={variant}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        bg={bgColors[status]}
        borderWidth="1px"
        borderColor={borderColors[status]}
        p={paddingMap[size]}
        position="relative"
        {...props}
      >
        {hasIcon && (
          <Icon 
            as={IconComponent} 
            color={iconColors[status]} 
            boxSize={size === 'sm' ? '16px' : size === 'lg' ? '24px' : '20px'}
            mr={3}
          />
        )}
        
        <Box flex="1">
          {title && (
            <AlertTitle 
              fontSize={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              fontWeight="semibold"
              color={textColors[status]}
              mb={description || children ? 2 : 0}
            >
              {title}
            </AlertTitle>
          )}
          
          {description && (
            <AlertDescription 
              fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
              color={textColors[status]}
              opacity={0.9}
            >
              {description}
            </AlertDescription>
          )}
          
          {children && (
            <Box mt={description ? 2 : 0}>
              {children}
            </Box>
          )}
        </Box>

        {isClosable && onClose && (
          <CloseButton
            alignSelf="flex-start"
            position="absolute"
            right={2}
            top={2}
            onClick={onClose}
            color={textColors[status]}
            _hover={{
              bg: borderColors[status],
            }}
            size="sm"
          />
        )}
      </Alert>
    </ScaleFade>
  );
};

/**
 * Specialized alert variants for common use cases
 */
export const SuccessAlert = (props) => (
  <EnhancedAlert status="success" {...props} />
);

export const ErrorAlert = (props) => (
  <EnhancedAlert status="error" {...props} />
);

export const WarningAlert = (props) => (
  <EnhancedAlert status="warning" {...props} />
);

export const InfoAlert = (props) => (
  <EnhancedAlert status="info" {...props} />
);

/**
 * Document-specific alert variants
 */
export const DocumentUploadAlert = ({ isSuccess, fileName, ...props }) => (
  <EnhancedAlert
    status={isSuccess ? 'success' : 'error'}
    title={isSuccess ? 'Upload Successful' : 'Upload Failed'}
    description={isSuccess 
      ? `${fileName} has been uploaded successfully and is being processed.`
      : 'There was an error uploading your document. Please try again.'
    }
    {...props}
  />
);

export const DocumentDeleteAlert = ({ fileName, ...props }) => (
  <EnhancedAlert
    status="success"
    title="Document Deleted"
    description={`${fileName} has been permanently removed from your account.`}
    {...props}
  />
);

export const DocumentVerificationAlert = ({ status: verificationStatus, docType, ...props }) => {
  const statusMap = {
    approved: {
      status: 'success',
      title: 'Document Approved',
      description: `Your ${docType} has been verified and approved.`,
    },
    rejected: {
      status: 'error',
      title: 'Document Rejected',
      description: `Your ${docType} was rejected. Please review and resubmit.`,
    },
    pending: {
      status: 'info',
      title: 'Under Review',
      description: `Your ${docType} is being reviewed by our team.`,
    },
  };

  const alertProps = statusMap[verificationStatus] || statusMap.pending;

  return <EnhancedAlert {...alertProps} {...props} />;
};

export default EnhancedAlert;
