import React from 'react';
import {
  Badge,
  HStack,
  Icon,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaQuestionCircle
} from 'react-icons/fa';

const PaymentStatusIndicator = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showText = true,
  variant = 'subtle'
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return {
          color: 'green',
          icon: FaCheckCircle,
          text: 'Paid',
          description: 'Payment completed successfully'
        };
      case 'payment_pending':
        return {
          color: 'yellow',
          icon: FaClock,
          text: 'Pending',
          description: 'Payment is being processed'
        };
      case 'payment_required':
        return {
          color: 'orange',
          icon: FaExclamationTriangle,
          text: 'Payment Required',
          description: 'Payment is required to proceed'
        };
      case 'payment_failed':
        return {
          color: 'red',
          icon: FaTimesCircle,
          text: 'Failed',
          description: 'Payment failed or was rejected'
        };
      case 'partial':
        return {
          color: 'blue',
          icon: FaClock,
          text: 'Partial',
          description: 'Partial payment received'
        };
      case 'refunded':
        return {
          color: 'purple',
          icon: FaCheckCircle,
          text: 'Refunded',
          description: 'Payment has been refunded'
        };
      case 'no_payment':
        return {
          color: 'gray',
          icon: FaQuestionCircle,
          text: 'No Payment',
          description: 'No payment required or recorded'
        };
      default:
        return {
          color: 'gray',
          icon: FaQuestionCircle,
          text: 'Unknown',
          description: 'Payment status unknown'
        };
    }
  };
  
  const config = getStatusConfig(status);
  
  const content = (
    <Badge
      colorScheme={config.color}
      variant={variant}
      size={size}
      display="flex"
      alignItems="center"
      gap={showIcon && showText ? 1 : 0}
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      px={2}
      py={1}
      borderRadius="md"
    >
      {showIcon && <Icon as={config.icon} boxSize={size === 'sm' ? '2.5' : '3'} />}
      {showText && config.text}
    </Badge>
  );
  
  if (config.description) {
    return (
      <Tooltip label={config.description} placement="top">
        {content}
      </Tooltip>
    );
  }
  
  return content;
};

export default PaymentStatusIndicator;
