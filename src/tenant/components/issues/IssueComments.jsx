import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  FormControl,
  FormLabel,
  Avatar,
  Badge,
  useColorModeValue,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  Select,
  Icon,
  Spinner
} from '@chakra-ui/react';
import {
  FaComment,
  FaPlus,
  FaLock,
  FaGlobe,
  FaPaperPlane
} from 'react-icons/fa';
import { formatDate, getTimeAgo } from '../../../utils/dateUtils';
import { useTenantAuth } from '../../context/tenantAuthContext';
import issueService from '../../services/issueService';

const IssueComments = ({ 
  issueId, 
  comments, 
  onCommentsUpdate,
  allowAdd = true,
  compact = false 
}) => {
  const { tenant } = useTenantAuth();
  const toast = useToast();
  
  // Component state
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const commentFormBg = useColorModeValue('blue.50', 'blue.900');
  const commentItemBg = useColorModeValue('gray.50', 'gray.600');

  // Handle adding new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Comment Required',
        description: 'Please enter a comment before submitting',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const commentData = {
        comment: newComment.trim(),
        commentType: commentType,
        isPublic: true, // Tenant comments are always public
        authorId: tenant?.userId || tenant?.id
      };

      await issueService.addIssueComment(issueId, commentData);
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setNewComment('');
      setCommentType('general');
      setIsAddingComment(false);

      // Refresh comments
      if (onCommentsUpdate) {
        onCommentsUpdate();
      }

    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error Adding Comment',
        description: error.message || 'Failed to add comment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get comment type badge color
  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'feedback': return 'green';
      case 'question': return 'blue';
      case 'update': return 'orange';
      case 'general': return 'gray';
      default: return 'gray';
    }
  };  // Sort comments by date (newest first) - using API field names
  const sortedComments = comments ? [...comments].sort((a, b) => {
    const dateA = new Date(a.commentedAt || a.createdAt || a.created_at || 0);
    const dateB = new Date(b.commentedAt || b.createdAt || b.created_at || 0);
    return dateB - dateA;
  }) : [];

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaComment} color="blue.500" />
            <Text fontWeight="medium">Comments</Text>
            <Badge variant="outline">
              {sortedComments.length}
            </Badge>
          </HStack>
          
          {allowAdd && !isAddingComment && (
            <Button
              size="sm"
              leftIcon={<FaPlus />}
              onClick={() => setIsAddingComment(true)}
              colorScheme="blue"
              variant="outline"
            >
              Add Comment
            </Button>
          )}
        </HStack>
      </CardHeader>

      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">          {/* Add Comment Form */}
          {isAddingComment && allowAdd && (
            <Box>
              <Card bg={commentFormBg} borderWidth="1px">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Comment Type</FormLabel>
                      <Select
                        value={commentType}
                        onChange={(e) => setCommentType(e.target.value)}
                        size="sm"
                      >
                        <option value="general">General Comment</option>
                        <option value="question">Question</option>
                        <option value="feedback">Feedback</option>
                        <option value="update">Status Update</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Your Comment</FormLabel>
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your comment here..."
                        rows={3}
                        resize="vertical"
                      />
                    </FormControl>

                    <Alert status="info" size="sm">
                      <AlertIcon />
                      <Text fontSize="xs">
                        Your comment will be visible to administrators handling your issue
                      </Text>
                    </Alert>

                    <HStack spacing={2} justify="end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingComment(false);
                          setNewComment('');
                          setCommentType('general');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<FaPaperPlane />}
                        onClick={handleAddComment}
                        isLoading={isSubmitting}
                        loadingText="Adding..."
                      >
                        Add Comment
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              <Divider mt={4} />
            </Box>
          )}

          {/* Comments List */}
          {sortedComments.length === 0 ? (
            <Text color={mutedTextColor} textAlign="center" py={8}>
              No comments yet. Be the first to add a comment!
            </Text>
          ) : (            <VStack spacing={4} align="stretch">
              {sortedComments.map((comment, index) => (
                <Box key={comment.id || index}>
                  <Card bg={commentItemBg} borderWidth="1px">
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        {/* Comment Header */}
                        <HStack justify="space-between" align="start">                          <HStack spacing={3}>
                            <Avatar 
                              size="sm" 
                              name={`User ${comment.commentedBy || comment.authorId || 'Unknown'}`} 
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" fontSize="sm">
                                {comment.authorName || comment.author_name || `User ${comment.commentedBy || comment.authorId}` || 'Anonymous'}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color={mutedTextColor}>
                                  {getTimeAgo(comment.commentedAt || comment.createdAt || comment.created_at)}
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor}>
                                  •
                                </Text>
                                <Text fontSize="xs" color={mutedTextColor}>
                                  {formatDate(comment.commentedAt || comment.createdAt || comment.created_at)}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>

                          <HStack spacing={2}>
                            {/* Comment Type Badge */}
                            {(comment.commentType || comment.comment_type) && 
                             (comment.commentType || comment.comment_type) !== 'general' && (
                              <Badge 
                                colorScheme={getCommentTypeColor(comment.commentType || comment.comment_type)}
                                variant="subtle"
                                fontSize="xs"
                              >
                                {(comment.commentType || comment.comment_type).replace('_', ' ')}
                              </Badge>
                            )}

                            {/* Privacy Badge */}
                            <HStack spacing={1}>
                              <Icon 
                                as={!comment.isInternal ? FaGlobe : FaLock} 
                                color={!comment.isInternal ? 'green.500' : 'orange.500'} 
                                boxSize={3} 
                              />
                              <Text fontSize="xs" color={mutedTextColor}>
                                {!comment.isInternal ? 'Public' : 'Internal'}
                              </Text>
                            </HStack>
                          </HStack>
                        </HStack>                        {/* Comment Content */}
                        <Box pl={12}>
                          <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                            {comment.commentText || comment.comment || comment.content || 'No comment content'}
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  {index < sortedComments.length - 1 && !compact && (
                    <Box mt={2}>
                      <Divider />
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default IssueComments;
