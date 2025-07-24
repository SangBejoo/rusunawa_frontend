import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  CloseButton,
  Collapse
} from '@chakra-ui/react';

const ErrorAlert = ({ 
  error, 
  title = "Error", 
  onClose, 
  isClosable = true,
  status = "error",
  variant = "solid",
  ...props 
}) => {
  if (!error) return null;

  return (
    <Collapse in={!!error} animateOpacity>
      <Alert status={status} variant={variant} borderRadius="md" {...props}>
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription display="block">
            {error}
          </AlertDescription>
        </Box>
        {isClosable && onClose && (
          <CloseButton
            alignSelf="flex-start"
            position="relative"
            right={-1}
            top={-1}
            onClick={onClose}
          />
        )}
      </Alert>
    </Collapse>
  );
};

export default ErrorAlert;
