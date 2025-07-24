import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useToast,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Image,
  AspectRatio,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  Progress,
  Divider,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { 
  FiPlay, 
  FiCheck, 
  FiCheckCircle, 
  FiUpload, 
  FiX 
} from 'react-icons/fi';
import { useAuth } from '../../context/authContext';
import issueService from '../../services/issueService';

const STATUS_LABELS_ID = {
  open: 'Terbuka',
  in_progress: 'Sedang Dikerjakan', 
  resolved: 'Terselesaikan',
  closed: 'Ditutup'
};

const SimpleIssueStatusModal = ({ isOpen, onClose, issue, onIssueUpdated }) => {
  const { user } = useAuth();
  const [statusNotes, setStatusNotes] = useState(''); // Changed from progressNotes to statusNotes
  const [statusImage, setStatusImage] = useState(null);
  const [statusImagePreview, setStatusImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  // Get current status from issue prop (don't use state for this)
  const currentStatus = issue?.status || 'open';
  
  console.log('SimpleIssueStatusModal - Current Status:', currentStatus);
  console.log('SimpleIssueStatusModal - Issue:', issue);  // Status flow: open → in_progress → resolved → closed
  const getNextStatus = (current) => {
    console.log('getNextStatus called with:', current);
    let nextStatus;
    switch (current) {
      case 'open': 
        nextStatus = 'in_progress';
        break;
      case 'in_progress': 
        nextStatus = 'resolved';
        break;
      case 'resolved': 
        nextStatus = 'closed';
        break;
      case 'closed':
        nextStatus = null; // Already final status
        break;
      default: 
        nextStatus = null;
    }
    console.log('getNextStatus returning:', nextStatus);
    return nextStatus;
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'open': return { label: 'Terbuka', color: 'orange', icon: FiPlay };
      case 'in_progress': return { label: 'Sedang Dikerjakan', color: 'blue', icon: FiPlay };
      case 'resolved': return { label: 'Terselesaikan', color: 'green', icon: FiCheck };
      case 'closed': return { label: 'Ditutup', color: 'gray', icon: FiCheckCircle };
      default: return { label: 'Tidak Diketahui', color: 'gray', icon: FiPlay };
    }
  };

  const getActionText = (currentStatus) => {
    switch (currentStatus) {
      case 'open': return 'Mulai Kerjakan';
      case 'in_progress': return 'Tandai Terselesaikan';
      case 'resolved': return 'Tutup Isu';
      default: return 'Perbarui Status';
    }
  };
  const isImageRequired = () => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus === 'resolved'; // Only require image when marking as resolved
  };

  const getImageLabel = () => {
    const nextStatus = getNextStatus(currentStatus);
    switch (nextStatus) {
      case 'in_progress': return 'Gambar Progres (Opsional)';
      case 'resolved': return 'Gambar Penyelesaian (Wajib)';
      case 'closed': return 'Gambar Feedback (Opsional)';
      default: return 'Gambar Status';
    }
  };

  const getImageDescription = () => {
    const nextStatus = getNextStatus(currentStatus);
    switch (nextStatus) {
      case 'in_progress': return 'Unggah gambar yang menunjukkan pekerjaan sedang berlangsung (opsional)';
      case 'resolved': return 'Unggah gambar yang menunjukkan pekerjaan telah selesai (wajib)';
      case 'closed': return 'Unggah gambar untuk verifikasi final (opsional)';
      default: return 'Unggah gambar untuk pembaruan status ini';
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Kesalahan',
          description: 'Silakan pilih file gambar',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Kesalahan',
          description: 'Ukuran gambar harus kurang dari 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setStatusImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setStatusImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const removeStatusImage = () => {
    setStatusImage(null);
    setStatusImagePreview(null);
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    // Validation
    if (nextStatus === 'in_progress' && !statusNotes.trim()) {
      toast({
        title: 'Catatan Progres Diperlukan',
        description: 'Silakan tambahkan catatan tentang apa yang akan dikerjakan',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (nextStatus === 'resolved' && !statusImage) {
      toast({
        title: 'Gambar Penyelesaian Diperlukan',
        description: 'Silakan unggah gambar yang menunjukkan pekerjaan telah selesai',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Debug: Log user object and user ID
      console.log('User object:', user);
      console.log('User ID for update:', user?.id || user?.userId || 1);
      
      // Get user ID with proper fallback
      const userId = user?.id || user?.userId || user?.user_id || 1;
      
      // Ensure we have a valid numeric user ID
      if (!userId || isNaN(parseInt(userId))) {
        toast({
          title: 'Kesalahan Otentikasi',
          description: 'Tidak dapat mengidentifikasi pengguna saat ini. Silakan login kembali.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Prepare update data
      const updateData = {
        status: nextStatus,
        notes: statusNotes || `Status diperbarui menjadi ${STATUS_LABELS_ID[nextStatus]}`,
        updatedBy: parseInt(userId), // Ensure it's an integer
      };

      // Update issue status FIRST
      await issueService.updateIssueStatus(issue.issueId || issue.issue_id, updateData);

      // Upload status image if provided
      if (statusImage) {
        console.log('Starting image upload for status:', nextStatus);
        console.log('Image file:', statusImage);
        console.log('Issue ID:', issue.issueId || issue.issue_id);
        console.log('User ID:', parseInt(userId));
        
        try {
          // Determine attachment type based on next status
          const getAttachmentTypeForStatus = (status) => {
            switch (status) {
              case 'in_progress': return 'progress';
              case 'resolved': return 'completion';
              case 'closed': return 'feedback';
              default: return 'report';
            }
          };

          const attachmentType = getAttachmentTypeForStatus(nextStatus);
          
          // Upload attachment using the correct API signature
          const uploadResult = await issueService.uploadIssueAttachment(
            issue.issueId || issue.issue_id,
            statusImage, // Pass the file directly - service handles base64 conversion
            attachmentType, // This will organize it in the correct status section
            parseInt(userId)
          );
          console.log('Image upload successful:', uploadResult);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast({
            title: 'Gagal Mengunggah Gambar',
            description: 'Status berhasil diperbarui, tetapi gagal mengunggah gambar status. Anda dapat mencoba mengunggahnya lagi.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          // Don't throw error here, status update was successful
        }
      }

      toast({
        title: 'Berhasil',
        description: `Status isu berhasil diperbarui menjadi ${getStatusDisplay(nextStatus).label}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onIssueUpdated) onIssueUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating issue status:', error);
      toast({
        title: 'Kesalahan',
        description: 'Gagal memperbarui status isu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!issue) return null;

  const currentStatusInfo = getStatusDisplay(currentStatus);
  const nextStatus = getNextStatus(currentStatus);
  const nextStatusInfo = nextStatus ? getStatusDisplay(nextStatus) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <currentStatusInfo.icon />
            <Text>Perbarui Status Isu</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Issue Info */}
            <Card>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Heading size="sm">Isu #{issue.issueId || issue.issue_id}</Heading>
                  <Text fontSize="sm" color="gray.600">
                    {issue.description}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Dilaporkan oleh: {issue.reporterName || 'Tidak diketahui'}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Status Flow Progress */}
            <Box>
              <Text fontWeight="medium" mb={3}>Alur Status</Text>
              <HStack spacing={4}>
                {['open', 'in_progress', 'resolved', 'closed'].map((status, index) => {
                  const statusInfo = getStatusDisplay(status);
                  const isCurrent = status === currentStatus;
                  const isPast = ['open', 'in_progress', 'resolved', 'closed'].indexOf(status) < 
                                ['open', 'in_progress', 'resolved', 'closed'].indexOf(currentStatus);
                  const isNext = status === nextStatus;

                  return (
                    <React.Fragment key={status}>
                      <VStack spacing={1}>
                        <Box
                          p={2}
                          borderRadius="full"
                          bg={isPast ? 'green.500' : isCurrent ? `${statusInfo.color}.500` : isNext ? `${statusInfo.color}.100` : 'gray.100'}
                          color={isPast || isCurrent ? 'white' : isNext ? `${statusInfo.color}.600` : 'gray.400'}
                        >
                          <statusInfo.icon size={16} />
                        </Box>
                        <Text fontSize="xs" textAlign="center" color={isCurrent ? `${statusInfo.color}.600` : 'gray.500'}>
                          {statusInfo.label}
                        </Text>
                      </VStack>
                      {index < 3 && (
                        <Box
                          h="2px"
                          w="20px"
                          bg={isPast ? 'green.500' : 'gray.200'}
                          borderRadius="full"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </HStack>
            </Box>

            <Divider />

            {/* Action Form */}
            {nextStatus && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="medium">
                  Mengubah dari {currentStatusInfo.label} ke {nextStatusInfo.label}
                </Text>
                
                {/* Status Notes */}
                <FormControl isRequired={nextStatus === 'in_progress'}>
                  <FormLabel>
                    {nextStatus === 'in_progress' ? 'Rencana Kerja' : 
                     nextStatus === 'resolved' ? 'Catatan Penyelesaian' : 
                     'Catatan Pembaruan'}
                  </FormLabel>
                  <Textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder={
                      nextStatus === 'in_progress' ? 'Jelaskan pekerjaan yang akan dilakukan...' :
                      nextStatus === 'resolved' ? 'Jelaskan pekerjaan yang telah diselesaikan...' :
                      'Tambahkan catatan final...'
                    }
                    rows={3}
                  />
                </FormControl>

                {/* Status Image Upload - for all status transitions */}
                {nextStatus && (
                  <FormControl isRequired={isImageRequired()}>
                    <FormLabel>{getImageLabel()}</FormLabel>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      {getImageDescription()}
                    </Text>
                    
                    {!statusImagePreview ? (
                      <Box>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          display="none"
                          id="status-image-upload"
                        />
                        <Button
                          as="label"
                          htmlFor="status-image-upload"
                          leftIcon={<FiUpload />}
                          colorScheme={isImageRequired() ? "red" : "blue"}
                          variant="outline"
                          cursor="pointer"
                          w="full"
                        >
                          {isImageRequired() ? 'Unggah Gambar Wajib' : 'Unggah Gambar Opsional'}
                        </Button>
                      </Box>
                    ) : (
                      <Box position="relative">
                        <AspectRatio ratio={16/9} maxW="300px">
                          <Image
                            src={statusImagePreview}
                            alt={`Gambar ${nextStatus}`}
                            objectFit="cover"
                            borderRadius="md"
                            border="2px solid"
                            borderColor={isImageRequired() ? "red.200" : "blue.200"}
                          />
                        </AspectRatio>
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          position="absolute"
                          top={2}
                          right={2}
                          onClick={removeStatusImage}
                        />
                      </Box>
                    )}
                  </FormControl>
                )}
              </VStack>
            )}

            {!nextStatus && (
              <Alert status="info">
                <AlertIcon />
                {currentStatus === 'closed' ? 
                  'Isu ini sudah ditutup.' : 
                  `Isu ini dalam status "${STATUS_LABELS_ID[currentStatus]}". Tidak ada pembaruan status lebih lanjut yang tersedia.`
                }
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            {nextStatus && (
              <Button
                colorScheme={nextStatusInfo.color}
                onClick={handleStatusUpdate}
                isLoading={loading}
                leftIcon={<nextStatusInfo.icon />}
              >
                {getActionText(currentStatus)}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SimpleIssueStatusModal;
