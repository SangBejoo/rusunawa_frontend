import React from 'react';
import {
  Box, Flex, Text, Badge, Icon, Button, Image,
  useColorModeValue, VStack, HStack, Tooltip
} from '@chakra-ui/react';
import { 
  FaCheckCircle, FaTimesCircle, FaClock, FaTools, 
  FaEye, FaImage, FaCalendarAlt, FaHome 
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import issueService from '../../services/issueService';
import IssueImagePreview from './IssueImagePreview';

const IssueCard = ({ issue }) => {
  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Get status badge properties
  const getStatusInfo = () => {
    switch(issue.status) {
      case 'resolved':
        return { 
          colorScheme: 'green', 
          icon: FaCheckCircle, 
          text: 'Resolved',
          borderColor: 'green.500' 
        };
      case 'in_progress':
        return { 
          colorScheme: 'blue', 
          icon: FaTools, 
          text: 'In Progress',
          borderColor: 'blue.500'  
        };
      case 'open':
      default:
        return { 
          colorScheme: 'yellow', 
          icon: FaClock, 
          text: 'Open',
          borderColor: 'yellow.500'  
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  const thumbnailUrl = issue.has_image_attachment ? issue.image_thumbnail_url : null;
  
  return (
    <Box 
      p={4}
      bg={boxBg}
      borderWidth="1px"
      borderRadius="md"
      borderColor={statusInfo.borderColor}
      shadow="sm"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Badge colorScheme={statusInfo.colorScheme} px={2} py={1} borderRadius="md">
          <Flex align="center">
            <Icon as={statusInfo.icon} mr={1} />
            {statusInfo.text}
          </Flex>
        </Badge>
        <Text fontSize="sm" color="gray.500">
          <Icon as={FaCalendarAlt} mr={1} />
          {formatDate(issue.reported_at)}
        </Text>
      </Flex>
      
      {issue.booking && (
        <Flex align="center" mb={3}>
          <Icon as={FaHome} mr={2} color="brand.500" />
          <Text fontWeight="medium">
            {issue.booking.room?.name || `Room #${issue.booking.room_id || issue.booking.roomId}`}
          </Text>
        </Flex>
      )}
        <Text noOfLines={2} mb={3}>
        {issue.description}
      </Text>
      
      {issue.has_image_attachment && (
        <Box mb={3}>
          <IssueImagePreview 
            issue={issue} 
            showThumbnail={true} 
            size="100px" 
          />
        </Box>
      )}
      
      <Button
        as={RouterLink}
        to={`/tenant/issues/${issue.issue_id}`}
        size="sm"
        leftIcon={<FaEye />}
        colorScheme="brand"
        variant="outline"
        width="full"
        mt={2}
      >
        View Details
      </Button>
    </Box>
  );
};

export default IssueCard;
