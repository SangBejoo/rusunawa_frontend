import React from 'react';
import { Badge, Tooltip } from '@chakra-ui/react';

/**
 * Shows a badge with appropriate color for each payment/invoice status
 */
const PaymentStatusBadge = ({ status }) => {
  // Map status values to colors and display text
  const getStatusInfo = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'yellow', text: 'Pending Payment' };
        
      case 'paid':
        return { color: 'green', text: 'Paid' };
        
      case 'waiting_approval':
        return { color: 'orange', text: 'Waiting Approval' };
        
      case 'failed':
        return { color: 'red', text: 'Failed' };
        
      case 'refunded':
        return { color: 'purple', text: 'Refunded' };
        
      case 'cancelled':
        return { color: 'red', text: 'Cancelled' };
        
      case 'expired':
        return { color: 'gray', text: 'Expired' };
        
      default:
        return { color: 'gray', text: status || 'Unknown' };
    }
  };

  const { color, text } = getStatusInfo();
  
  return (
    <Tooltip label={text} hasArrow placement="top">
      <Badge colorScheme={color} variant="subtle" px={2} py={1} borderRadius="full">
        {text}
      </Badge>
    </Tooltip>
  );
};

export default PaymentStatusBadge;
