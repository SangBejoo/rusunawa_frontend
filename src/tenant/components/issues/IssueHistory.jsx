import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Icon,
  Avatar,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import {
  FaPlay,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaTools,
  FaExclamationTriangle,
  FaUser
} from 'react-icons/fa';
import { formatDate, getTimeAgo } from '../../../utils/dateUtils';

const IssueHistory = ({ history, comments, compact = false }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const notesBg = useColorModeValue('gray.50', 'gray.600');

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return { icon: FaExclamationTriangle, color: 'red.500' };
      case 'in_progress': return { icon: FaTools, color: 'yellow.500' };
      case 'resolved': return { icon: FaCheckCircle, color: 'green.500' };
      case 'closed': return { icon: FaCheckCircle, color: 'blue.500' };
      default: return { icon: FaClock, color: 'gray.500' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };
  // Combine and sort history and comments by date
  const combinedHistory = [];
    // Add status history entries
  if (history && history.length > 0) {
    history.forEach(entry => {
      const statusInfo = getStatusIcon(entry.newStatus || entry.status);
      combinedHistory.push({
        type: 'status',
        timestamp: entry.changedAt || entry.createdAt || entry.created_at,
        status: entry.newStatus || entry.status,
        previousStatus: entry.oldStatus || entry.previousStatus || entry.previous_status,
        notes: entry.changeReason || entry.notes || entry.statusNotes || entry.status_notes,
        updatedBy: entry.changedBy || entry.updatedBy || entry.updated_by || entry.authorId || entry.author_id,
        updatedByName: entry.changedByUser?.name || entry.changedByUser?.username || entry.updatedByName || entry.updated_by_name || entry.authorName || entry.author_name || `User ${entry.changedBy || entry.updatedBy || 'System'}`,
        progressPercentage: entry.progressPercentage || entry.progress_percentage,
        icon: statusInfo.icon,
        iconColor: statusInfo.color,
        ...entry
      });
    });
  }

  // Add comment entries
  if (comments && comments.length > 0) {
    comments.forEach(comment => {
      combinedHistory.push({
        type: 'comment',        timestamp: comment.commentedAt || comment.createdAt || comment.created_at,
        comment: comment.commentText || comment.comment || comment.content,
        commentType: comment.commentType || comment.comment_type || 'general',
        isPublic: !comment.isInternal,
        authorId: comment.commentedBy || comment.authorId || comment.author_id,
        authorName: comment.authorName || comment.author_name || `User ${comment.commentedBy || comment.authorId}` || 'Anonymous',
        icon: FaUser,
        iconColor: !comment.isInternal ? 'blue.500' : 'orange.500',
        ...comment
      });
    });
  }

  // Sort by timestamp (most recent first)
  combinedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!combinedHistory.length) {
    return (
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <Text color={mutedTextColor} textAlign="center" py={4}>
            No history or comments available
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {combinedHistory.map((entry, index) => (
            <Box key={index}>
              <HStack spacing={4} align="start">
                {/* Timeline dot */}
                <Box position="relative" top="1">
                  <Box
                    bg={entry.iconColor}
                    borderRadius="full"
                    p={2}
                    color="white"
                  >
                    <Icon as={entry.icon} boxSize={3} />
                  </Box>
                  {index < combinedHistory.length - 1 && (
                    <Box
                      position="absolute"
                      left="50%"
                      top="100%"
                      width="2px"
                      height="24px"
                      bg={borderColor}
                      transform="translateX(-50%)"
                      mt={2}
                    />
                  )}
                </Box>

                {/* Content */}
                <VStack align="start" spacing={2} flex={1}>
                  <HStack justify="space-between" w="100%">
                    <HStack spacing={2}>
                      {entry.type === 'status' ? (
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium" fontSize="sm">
                              Status changed to
                            </Text>
                            <Badge 
                              colorScheme={entry.status === 'open' ? 'red' : 
                                         entry.status === 'in_progress' ? 'yellow' :
                                         entry.status === 'resolved' ? 'green' : 'blue'}
                              variant="solid"
                              fontSize="xs"
                            >
                              {entry.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </HStack>
                          {entry.previousStatus && (
                            <Text fontSize="xs" color={mutedTextColor}>
                              from {entry.previousStatus.replace('_', ' ')}
                            </Text>
                          )}
                        </VStack>
                      ) : (
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="medium" fontSize="sm">
                              Comment added
                            </Text>
                            {entry.commentType && entry.commentType !== 'general' && (
                              <Badge variant="outline" fontSize="xs">
                                {entry.commentType}
                              </Badge>
                            )}
                            {entry.isPublic === false && (
                              <Badge colorScheme="orange" variant="outline" fontSize="xs">
                                Internal
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      )}
                    </HStack>
                    
                    <Text fontSize="xs" color={mutedTextColor}>
                      {getTimeAgo(entry.timestamp)}
                    </Text>
                  </HStack>

                  {/* Author info */}
                  <HStack spacing={2}>
                    <Avatar size="xs" name={entry.updatedByName || entry.authorName} />
                    <Text fontSize="xs" color={textColor}>
                      by {entry.updatedByName || entry.authorName}
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      {formatDate(entry.timestamp)}
                    </Text>
                  </HStack>                  {/* Notes or comment content */}
                  {(entry.notes || entry.comment) && (
                    <Box
                      bg={notesBg}
                      p={3}
                      borderRadius="md"
                      w="100%"
                    >
                      <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                        {entry.notes || entry.comment}
                      </Text>
                    </Box>
                  )}

                  {/* Progress percentage for status changes */}
                  {entry.type === 'status' && entry.progressPercentage !== undefined && (
                    <HStack spacing={2}>
                      <Text fontSize="xs" color={mutedTextColor}>
                        Progress:
                      </Text>
                      <Badge variant="outline" fontSize="xs">
                        {entry.progressPercentage}%
                      </Badge>
                    </HStack>
                  )}
                </VStack>
              </HStack>
              
              {index < combinedHistory.length - 1 && !compact && (
                <Box mt={4}>
                  <Divider />
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default IssueHistory;
