import React from 'react';
import { Badge, Tooltip } from '@chakra-ui/react';

/**
 * Shows a badge with appropriate color for each booking status
 */
const BookingStatusBadge = ({ status }) => {
  // Map status values to colors and display text
  const getStatusInfo = () => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'yellow', text: 'Pending Approval' };
        
      case 'approved':
        return { color: 'green', text: 'Approved' };
        
      case 'checked_in':
        return { color: 'blue', text: 'Checked In' };
        
      case 'checked_out':
        return { color: 'purple', text: 'Checked Out' };
        
      case 'completed':
        return { color: 'green', text: 'Completed' };
        
      case 'cancelled':
        return { color: 'red', text: 'Cancelled' };
        
      case 'rejected':
        return { color: 'red', text: 'Rejected' };
        
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

export default BookingStatusBadge;
