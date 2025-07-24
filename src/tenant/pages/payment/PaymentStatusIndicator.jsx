import React from 'react';
import { Badge } from '@chakra-ui/react';

/**
 * Component to display payment status with appropriate styling
 * @param {Object} props - Component props
 * @param {string} props.status - Payment status
 * @param {string} props.size - Badge size
 * @returns {JSX.Element} PaymentStatusIndicator component
 */
const PaymentStatusIndicator = ({ status, size = 'md', ...props }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'success':
        return { colorScheme: 'green', text: 'Paid' };
      case 'pending':
      case 'processing':
        return { colorScheme: 'yellow', text: 'Pending' };
      case 'failed':
      case 'cancelled':
      case 'expired':
        return { colorScheme: 'red', text: 'Failed' };
      case 'refunded':
        return { colorScheme: 'blue', text: 'Refunded' };
      default:
        return { colorScheme: 'gray', text: status || 'Unknown' };
    }
  };

  const { colorScheme, text } = getStatusConfig(status);

  return (
    <Badge colorScheme={colorScheme} size={size} {...props}>
      {text}
    </Badge>
  );
};

export default PaymentStatusIndicator;
