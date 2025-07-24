import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  useColorModeValue,
  useToast,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Spinner,
  Box,
  Flex,
  Badge,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Center,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input
} from '@chakra-ui/react';
import {
  FaHistory,
  FaComment,
  FaPlus,
  FaReply,
  FaEye,
  FaEyeSlash,
  FaClock,
  FaUser,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTools,
  FaQuestionCircle
} from 'react-icons/fa';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import issueService from '../../services/issueService';
import userService from '../../services/userService';

const IssueHistoryAndComments = ({ issue, currentUser, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userMap, setUserMap] = useState({}); // Cache for user data
  
  // New comment form state
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [parentCommentId, setParentCommentId] = useState(null);
  const [replyToComment, setReplyToComment] = useState(null);
  
  // Filter state
  const [commentFilter, setCommentFilter] = useState('all'); // all, public, internal
  const [showInternalComments, setShowInternalComments] = useState(true);
  
  const { isOpen: isReplyOpen, onOpen: onReplyOpen, onClose: onReplyClose } = useDisclosure();
  
  const toast = useToast();
    // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const publicCommentBg = useColorModeValue('blue.50', 'blue.900');
  const internalCommentBg = useColorModeValue('orange.50', 'orange.900');
  const replyCardBg = useColorModeValue('gray.50', 'gray.600');
  useEffect(() => {
    if (issue) {
      loadIssueComments();
      loadIssueStatusHistory();
    }
  }, [issue]);

  // Load issue comments with user names
  const loadIssueComments = async () => {
    const issueId = issue?.issueId || issue?.id || issue?.issue_id;
    if (!issueId) return;

    setLoadingComments(true);
    try {
      const response = await issueService.getIssueComments(issueId);
      const commentsData = response.comments || [];
      
      // Extract unique user IDs from comments
      const userIds = [...new Set(commentsData.map(comment => comment.commentedBy).filter(id => id))];
      
      // Fetch user details for all commenters
      let fetchedUserMap = {};
      if (userIds.length > 0) {
        try {
          fetchedUserMap = await userService.getUsersByIds(userIds);
          setUserMap(prev => ({ ...prev, ...fetchedUserMap }));
        } catch (error) {
          console.warn('Failed to fetch user details:', error);
        }
      }
      
      // Enhance comments with user names
      const enhancedComments = commentsData.map(comment => ({
        ...comment,
        authorName: fetchedUserMap[comment.commentedBy]?.fullName || 
                   fetchedUserMap[comment.commentedBy]?.full_name || 
                   userMap[comment.commentedBy]?.fullName || 
                   userMap[comment.commentedBy]?.full_name || 
                   'Unknown User',
        authorRole: fetchedUserMap[comment.commentedBy]?.role?.name || 
                   userMap[comment.commentedBy]?.role?.name || 
                   'user'
      }));
        setComments(enhancedComments);
      console.log('Enhanced comments with user names:', enhancedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({
        title: 'Kesalahan',
        description: 'Gagal memuat komentar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingComments(false);
    }
  };

  // Load issue status history
  const loadIssueStatusHistory = async () => {
    const issueId = issue?.issueId || issue?.id || issue?.issue_id;
    if (!issueId) return;

    setLoadingHistory(true);
    try {
      console.log('Loading status history for issue:', issueId);
      const response = await issueService.getIssueStatusHistory(issueId);
      setStatusHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load status history:', error);
      // Create fallback history from issue data
      const fallbackHistory = [];
      
      if (issue.reportedAt) {
        fallbackHistory.push({
          status: 'open',
          updatedByName: issue.reporterName || 'Penyewa',
          updatedAt: issue.reportedAt,
          notes: 'Laporan masalah diterima'
        });
      }
      
      if (issue.assignedAt) {
        fallbackHistory.push({
          status: 'assigned',
          updatedByName: issue.assigneeName || 'Admin',
          updatedAt: issue.assignedAt,
          notes: `Ditugaskan kepada ${issue.assigneeName}`
        });
      }
      
      if (issue.status === 'in_progress') {
        fallbackHistory.push({
          status: 'in_progress',
          updatedByName: issue.lastUpdatedBy || 'Teknisi',
          updatedAt: issue.lastUpdatedAt || issue.updated_at || new Date().toISOString(),
          notes: 'Perbaikan dimulai'
        });
      }
      
      if (issue.status === 'resolved' || issue.status === 'closed') {
        fallbackHistory.push({
          status: 'resolved',
          updatedByName: issue.lastUpdatedBy || 'Admin',
          updatedAt: issue.resolvedAt || issue.resolved_at || new Date().toISOString(),
          notes: issue.lastUpdateNotes || 'Masalah telah diselesaikan'
        });
      }
      
      if (issue.status === 'closed') {
        fallbackHistory.push({
          status: 'closed',
          updatedByName: issue.completionVerifiedBy || 'Admin',
          updatedAt: issue.completionVerifiedAt || issue.completion_verified_at || new Date().toISOString(),
          notes: 'Masalah ditutup dan diverifikasi'
        });
      }
      
      setStatusHistory(fallbackHistory);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'Kesalahan',
        description: 'Komentar tidak boleh kosong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const issueId = issue?.issueId || issue?.id || issue?.issue_id;
    if (!issueId) return;    setSubmittingComment(true);
    try {
      const commentData = {
        author_id: currentUser?.userId || currentUser?.user_id || 1,
        content: newComment.trim(),
        comment_type: commentType,
        is_public: !isInternalComment,
        issue_id: parseInt(issueId)
      };

      // Add parent comment if it's a reply
      if (parentCommentId) {
        commentData.parent_comment_id = parentCommentId;
      }

      console.log('Adding comment:', commentData);
      const response = await issueService.addIssueComment(issueId, commentData);
      
      toast({
        title: 'Berhasil',
        description: 'Komentar berhasil ditambahkan',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setNewComment('');
      setCommentType('general');
      setIsInternalComment(false);
      setParentCommentId(null);
      setReplyToComment(null);
      onReplyClose();

      // Reload comments
      await loadIssueComments();
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Kesalahan',
        description: error.message || 'Gagal menambahkan komentar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmittingComment(false);
    }
  };
  // Handle reply to comment
  const handleReplyToComment = (comment) => {
    setReplyToComment(comment);
    setParentCommentId(comment.commentId);
    setNewComment(`@${comment.authorName || 'User'} `);
    onReplyOpen();
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyToComment(null);
    setParentCommentId(null);
    setNewComment('');
    onReplyClose();
  };

  // Get comment type icon and color
  const getCommentTypeStyle = (type) => {
    switch (type) {
      case 'status_update':
        return { icon: FaInfoCircle, color: 'blue.500', label: 'Pembaruan Status' };
      case 'question':
        return { icon: FaQuestionCircle, color: 'purple.500', label: 'Pertanyaan' };
      case 'solution':
        return { icon: FaCheckCircle, color: 'green.500', label: 'Solusi' };
      case 'progress_note':
        return { icon: FaTools, color: 'orange.500', label: 'Catatan Progres' };
      case 'quality_check':
        return { icon: FaExclamationTriangle, color: 'red.500', label: 'Pengecekan Kualitas' };
      case 'tenant_feedback':
        return { icon: FaComment, color: 'teal.500', label: 'Umpan Balik Penyewa' };
      default:
        return { icon: FaComment, color: 'gray.500', label: 'Komentar Umum' };
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };  // Filter comments based on selected filter
  const filteredComments = comments.filter(comment => {
    if (commentFilter === 'public') return comment.isInternal !== true;
    if (commentFilter === 'internal') return comment.isInternal === true;
    return true; // 'all'
  });

  // Group comments by thread (parent-child relationship) with proper nesting
  const buildCommentTree = (comments) => {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create comment map
    comments.forEach(comment => {
      commentMap.set(comment.commentId, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments.forEach(comment => {
      if (!comment.parentCommentId || comment.parentCommentId === 0) {
        // This is a root comment
        rootComments.push(commentMap.get(comment.commentId));
      } else {
        // This is a reply, add it to its parent's replies
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.commentId));
        } else {
          // Parent not found, treat as root comment
          rootComments.push(commentMap.get(comment.commentId));
        }
      }
    });

    // Sort replies within each thread by date (oldest first for natural conversation flow)
    const sortReplies = (comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.commentedAt) - new Date(b.commentedAt));
        comment.replies.forEach(sortReplies); // Recursively sort nested replies
      }
    };

    rootComments.forEach(sortReplies);

    // Sort root comments by date (newest first)
    rootComments.sort((a, b) => new Date(b.commentedAt) - new Date(a.commentedAt));

    return rootComments;
  };

  const groupedComments = buildCommentTree(filteredComments);

  return (
    <VStack spacing={6} align="stretch">
      {/* Tab Navigation */}
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FaComment} />
              <Text>Komentar ({comments.length})</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FaHistory} />
              <Text>Riwayat Status</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Comments Tab */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              {/* Comment Filters */}
              <HStack justify="space-between" wrap="wrap">
                <HStack spacing={4}>
                  <Select 
                    value={commentFilter} 
                    onChange={(e) => setCommentFilter(e.target.value)}
                    size="sm"
                    w="auto"
                  >
                    <option value="all">Semua Komentar</option>
                    <option value="public">Publik Saja</option>
                    <option value="internal">Internal Saja</option>
                  </Select>
                  
                  <Tooltip label={showInternalComments ? "Sembunyikan komentar internal" : "Tampilkan komentar internal"}>
                    <IconButton
                      icon={showInternalComments ? <FaEye /> : <FaEyeSlash />}
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInternalComments(!showInternalComments)}
                      colorScheme={showInternalComments ? "blue" : "gray"}
                    />
                  </Tooltip>
                </HStack>

                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  size="sm"
                  onClick={() => {
                    setReplyToComment(null);
                    setParentCommentId(null);
                    onReplyOpen();
                  }}
                >
                  Tambah Komentar
                </Button>
              </HStack>

              {/* Comments List */}
              {loadingComments ? (
                <Center py={10}>
                  <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Text>Memuat komentar...</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack spacing={4} align="stretch">
                  {groupedComments.length === 0 ? (
                    <Center py={10}>
                      <VStack spacing={4}>
                        <Icon as={FaComment} boxSize="3em" color="gray.300" />
                        <Text color="gray.500">Belum ada komentar</Text>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                          Jadilah yang pertama menambahkan komentar atau pembaruan tentang masalah ini
                        </Text>
                      </VStack>
                    </Center>
                  ) : (
                    groupedComments.map((comment, index) => (
                      <CommentThread
                        key={comment.commentId || index}
                        comment={comment}
                        onReply={handleReplyToComment}
                        showInternalComments={showInternalComments}
                        getCommentTypeStyle={getCommentTypeStyle}
                        cardBg={cardBg}
                        borderColor={borderColor}
                        textColor={textColor}
                        publicCommentBg={publicCommentBg}
                        internalCommentBg={internalCommentBg}
                      />
                    ))
                  )}
                </VStack>
              )}
            </VStack>
          </TabPanel>

          {/* Status History Tab */}
          <TabPanel px={0}>
            <VStack spacing={4} align="stretch">
              {loadingHistory ? (
                <Center py={10}>
                  <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Text>Memuat riwayat...</Text>
                  </VStack>
                </Center>
              ) : (
                <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                  <CardHeader>
                    <HStack spacing={2}>
                      <Icon as={FaHistory} />
                      <Text fontWeight="semibold">Kronologi Masalah</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {statusHistory.length === 0 ? (
                        <Center py={10}>
                          <VStack spacing={4}>
                            <Icon as={FaClock} boxSize="3em" color="gray.300" />
                            <Text color="gray.500">Tidak ada riwayat status tersedia</Text>
                          </VStack>
                        </Center>
                      ) : (                        statusHistory.map((historyItem, index) => (
                          <Box 
                            key={index} 
                            borderLeft="3px solid" 
                            borderColor={getStatusColor(historyItem.newStatus || historyItem.status) + '.300'} 
                            pl={4}
                          >
                            <HStack justify="space-between" mb={2}>
                              <HStack spacing={3}>
                                <Badge colorScheme={getStatusColor(historyItem.newStatus || historyItem.status)} variant="solid">
                                  {(historyItem.newStatus || historyItem.status)?.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Text fontWeight="medium">
                                  {historyItem.changedByUser?.name || historyItem.updatedByName || 'System'}
                                </Text>
                                {historyItem.oldStatus && (
                                  <Text fontSize="sm" color={textColor}>
                                    dari {historyItem.oldStatus.replace('_', ' ')}
                                  </Text>
                                )}
                              </HStack>
                              <Text fontSize="sm" color={textColor}>
                                {historyItem.changedAt || historyItem.updatedAt ? formatDateTime(historyItem.changedAt || historyItem.updatedAt) : ''}
                              </Text>
                            </HStack>
                            {(historyItem.changeReason || historyItem.notes) && (
                              <Text color={textColor} fontSize="sm">
                                {historyItem.changeReason || historyItem.notes}
                              </Text>
                            )}
                          </Box>
                        ))
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add/Reply Comment Modal */}
      <Modal isOpen={isReplyOpen} onClose={handleCancelReply} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {replyToComment ? 'Balas Komentar' : 'Tambah Komentar'}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">              {replyToComment && (
                <Card bg={replyCardBg} size="sm">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="medium">Membalas kepada:</Text>
                        <Text fontSize="sm" color="blue.500">
                          {replyToComment.authorName || 'User'}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor} noOfLines={3}>
                        {replyToComment.content}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              <FormControl>
                <FormLabel>Jenis Komentar</FormLabel>
                <Select value={commentType} onChange={(e) => setCommentType(e.target.value)}>
                  <option value="general">Komentar Umum</option>
                  <option value="status_update">Pembaruan Status</option>
                  <option value="question">Pertanyaan</option>
                  <option value="solution">Solusi</option>
                  <option value="progress_note">Catatan Progres</option>
                  <option value="quality_check">Pengecekan Kualitas</option>
                  <option value="tenant_feedback">Umpan Balik Penyewa</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Komentar</FormLabel>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ketik komentar Anda di sini..."
                  rows={4}
                  resize="vertical"
                />
              </FormControl>

              <FormControl>
                <HStack spacing={4}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <Text fontSize="sm">Komentar internal (khusus admin)</Text>
                  </label>
                </HStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancelReply}>
              Batal
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleAddComment}
              isLoading={submittingComment}
              loadingText="Menambahkan..."
              disabled={!newComment.trim()}
            >
              {replyToComment ? 'Balas' : 'Tambah Komentar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

// Enhanced Comment Thread Component with proper nesting
const CommentThread = ({ 
  comment, 
  onReply, 
  showInternalComments, 
  getCommentTypeStyle,
  cardBg,
  borderColor,
  textColor,
  publicCommentBg,
  internalCommentBg,
  depth = 0 // Add depth prop for nesting level
}) => {
  // Don't render internal comments if showInternalComments is false
  if (comment.isInternal && !showInternalComments) {
    return null;
  }

  const typeStyle = getCommentTypeStyle(comment.commentType);
  const isInternal = comment.isInternal === true;
  const isReply = depth > 0;

  return (
    <Box>
      <Card 
        bg={isInternal ? internalCommentBg : publicCommentBg} 
        borderWidth="1px" 
        borderColor={borderColor}
        borderLeft={isInternal ? "4px solid orange" : "4px solid blue"}
        ml={depth * 4} // Indent based on depth
        size={isReply ? "sm" : "md"}
      >
        <CardBody p={isReply ? 3 : 4}>
          <VStack align="stretch" spacing={3}>
            {/* Comment Header */}
            <HStack justify="space-between" wrap="wrap">
              <HStack spacing={3}>
                <Avatar 
                  size={isReply ? "xs" : "sm"} 
                  name={comment.authorName || 'User'} 
                  bg={isInternal ? 'orange.500' : 'blue.500'}
                />
                <VStack align="start" spacing={0}>
                  <HStack spacing={2}>
                    <Text fontWeight="medium" fontSize={isReply ? "xs" : "sm"}>
                      {comment.authorName || 'User'}
                    </Text>
                    {comment.authorRole && (
                      <Badge colorScheme="gray" size="xs" variant="outline">
                        {comment.authorRole === 'admin' ? 'Admin' : comment.authorRole === 'penyewa' ? 'Penyewa' : comment.authorRole === 'wakil_direktorat' ? 'Wakil Direktorat' : comment.authorRole}
                      </Badge>
                    )}
                    {isInternal && (
                      <Badge colorScheme="orange" size="xs" variant="solid">
                        Internal
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={2}>
                    <Icon as={typeStyle.icon} color={typeStyle.color} boxSize={2.5} />
                    <Text fontSize="xs" color={textColor}>
                      {typeStyle.label}
                    </Text>
                    <Text fontSize="xs" color={textColor}>
                      •
                    </Text>
                    <Text fontSize="xs" color={textColor}>
                      {formatDateTime(comment.commentedAt)}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              <Button
                size="xs"
                variant="ghost"
                leftIcon={<FaReply />}
                onClick={() => onReply(comment)}
                fontSize="xs"
              >
                Balas
              </Button>
            </HStack>

            {/* Comment Content */}
            <Text fontSize={isReply ? "xs" : "sm"} lineHeight="1.5">
              {comment.commentText || comment.content}
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Nested Replies - Recursively render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <VStack align="stretch" spacing={2} mt={2}>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.commentId}
              comment={reply}
              onReply={onReply}
              showInternalComments={showInternalComments}
              getCommentTypeStyle={getCommentTypeStyle}
              cardBg={cardBg}
              borderColor={borderColor}
              textColor={textColor}
              publicCommentBg={publicCommentBg}
              internalCommentBg={internalCommentBg}
              depth={depth + 1} // Increase depth for nesting
            />
          ))}
        </VStack>      )}
    </Box>
  );
};

export default IssueHistoryAndComments;
