import React, { useState, useEffect } from 'react';
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
  Divider,
  Grid,
  GridItem,
  Box,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Image,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Input,
  Select,
  Flex
} from '@chakra-ui/react';
import {
  FiUser,
  FiFile,
  FiCalendar,
  FiClock,
  FiPhone,
  FiMail,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiCheck,
  FiX,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
  FiSend,
  FiMessageSquare,
  FiUpload,
  FiZoomIn,
  FiRotateCw,
  FiPrinter
} from 'react-icons/fi';
import documentService from '../../services/documentService';

const DocumentDetailModal = ({ isOpen, onClose, document, onDocumentUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && document) {
      fetchDocumentDetails();
    }
  }, [isOpen, document]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const [detailsRes, historyRes, commentsRes] = await Promise.all([
        documentService.getDocumentDetails(document.id),
        documentService.getDocumentVerificationHistory(document.id),
        documentService.getDocumentComments(document.id)
      ]);

      setDocumentDetails(detailsRes.data);
      setVerificationHistory(historyRes.data || []);
      setComments(commentsRes.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch document details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyDocument = async () => {
    try {
      const response = await documentService.verifyDocument(document.id, {
        notes: verificationNotes
      });
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        toast({
          title: 'Access Denied',
          description: response.message || 'You do not have permission to verify documents',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Success case
      toast({
        title: 'Success',
        description: 'Document verified successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDocumentUpdated();
      fetchDocumentDetails();
      setVerificationNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await documentService.rejectDocument(document.id, { 
        reason: rejectionReason,
        notes: verificationNotes
      });
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        toast({
          title: 'Access Denied',
          description: response.message || 'You do not have permission to reject documents',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Success case
      toast({
        title: 'Success',
        description: 'Document rejected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDocumentUpdated();
      fetchDocumentDetails();
      setRejectionReason('');
      setVerificationNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await documentService.addDocumentComment(document.id, {
        comment: newComment,
        type: 'admin_note'
      });
      toast({
        title: 'Success',
        description: 'Comment added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewComment('');
      fetchDocumentDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'verified': return 'green';
      case 'rejected': return 'red';
      case 'expired': return 'red';
      case 'under_review': return 'blue';
      default: return 'gray';
    }
  };

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'id_card': return 'blue';
      case 'student_id': return 'purple';
      case 'transcript': return 'green';
      case 'financial_statement': return 'orange';
      case 'guarantee_letter': return 'red';
      case 'health_certificate': return 'pink';
      default: return 'gray';
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = filename?.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension);
  };

  const isPdfFile = (filename) => {
    return filename?.toLowerCase().endsWith('.pdf');
  };

  const handleImageZoom = (direction) => {
    setImageZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  const handleImageRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  if (!document) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack>
            <FiFileText />
            <Text>Detail Dokumen - {document.filename}</Text>
            <Badge colorScheme={getStatusColor(document.status)} ml={2}>
              {document.status === 'pending' && 'Menunggu'}
              {document.status === 'verified' && 'Terverifikasi'}
              {document.status === 'rejected' && 'Ditolak'}
              {document.status === 'expired' && 'Kedaluwarsa'}
              {document.status === 'under_review' && 'Dalam Review'}
              {!['pending','verified','rejected','expired','under_review'].includes(document.status) && document.status}
            </Badge>
            {isExpired(document.expiry_date) && (
              <Badge colorScheme="red" ml={1}>
                KEDALUWARSA
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Document Overview */}
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Informasi Dokumen</StatLabel>
                      <StatNumber fontSize="lg">{document.filename}</StatNumber>
                      <StatHelpText>
                        <Badge colorScheme={getDocumentTypeColor(document.document_type)}>
                          {document.document_type?.replace('_', ' ').replace('id card', 'KTP').replace('student id', 'Kartu Mahasiswa').replace('transcript', 'Transkrip').replace('financial statement', 'Surat Keterangan Penghasilan').replace('guarantee letter', 'Surat Jaminan').replace('health certificate', 'Surat Kesehatan')}
                        </Badge>
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Detail File</StatLabel>
                      <StatNumber fontSize="lg">
                        {(document.file_size / 1024 / 1024).toFixed(2)} MB
                      </StatNumber>
                      <StatHelpText>
                        Format: {document.filename?.split('.').pop()?.toUpperCase()}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Tanggal Upload</StatLabel>
                      <StatNumber fontSize="lg">
                        {new Date(document.uploaded_at).toLocaleDateString('id-ID')}
                      </StatNumber>
                      <StatHelpText>
                        {new Date(document.uploaded_at).toLocaleTimeString('id-ID')}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Tanggal Kedaluwarsa</StatLabel>
                      <StatNumber 
                        fontSize="lg"
                        color={isExpired(document.expiry_date) ? 'red.500' : 'inherit'}
                      >
                        {document.expiry_date 
                          ? new Date(document.expiry_date).toLocaleDateString('id-ID')
                          : 'Tidak ada kedaluwarsa'
                        }
                      </StatNumber>
                      <StatHelpText>
                        {document.expiry_date && (
                          <Text color={isExpired(document.expiry_date) ? 'red.500' : 'green.500'}>
                            {isExpired(document.expiry_date) ? 'Kedaluwarsa' : 'Berlaku'}
                          </Text>
                        )}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </Grid>

              {/* Verification Actions */}
              {document.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <Heading size="md">Verifikasi Dokumen</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Catatan Verifikasi</FormLabel>
                        <Textarea
                          placeholder="Tambahkan catatan verifikasi (opsional)..."
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          rows={3}
                        />
                      </FormControl>

                      <HStack spacing={4}>
                        <Button
                          leftIcon={<FiCheck />}
                          colorScheme="green"
                          onClick={handleVerifyDocument}
                        >
                          Setujui Dokumen
                        </Button>
                        <Button
                          leftIcon={<FiX />}
                          colorScheme="red"
                          variant="outline"
                        >
                          Tolak Dokumen
                        </Button>
                      </HStack>

                      <FormControl>
                        <FormLabel>Alasan Penolakan (jika menolak)</FormLabel>
                        <Textarea
                          placeholder="Masukkan alasan penolakan..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                        <Button
                          size="sm"
                          colorScheme="red"
                          mt={2}
                          onClick={handleRejectDocument}
                          isDisabled={!rejectionReason.trim()}
                        >
                          Konfirmasi Penolakan
                        </Button>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {/* Detailed Information Tabs */}
              <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>Pratinjau Dokumen</Tab>
                  <Tab>Informasi Penyewa</Tab>
                  <Tab>Riwayat Verifikasi</Tab>
                  <Tab>Komentar & Catatan</Tab>
                </TabList>

                <TabPanels>
                  {/* Document Preview */}
                  <TabPanel px={0}>
                    <Card>
                      <CardHeader>
                        <Flex justify="space-between" align="center">
                          <Heading size="md">Pratinjau Dokumen</Heading>
                          <HStack>
                            {isImageFile(document.filename) && (
                              <>
                                <IconButton
                                  icon={<FiZoomIn />}
                                  size="sm"
                                  onClick={() => handleImageZoom('in')}
                                  title="Perbesar"
                                />
                                <IconButton
                                  icon={<FiZoomIn style={{ transform: 'scaleX(-1)' }} />}
                                  size="sm"
                                  onClick={() => handleImageZoom('out')}
                                  title="Perkecil"
                                />
                                <IconButton
                                  icon={<FiRotateCw />}
                                  size="sm"
                                  onClick={handleImageRotate}
                                  title="Putar"
                                />
                              </>
                            )}
                            <IconButton
                              icon={<FiDownload />}
                              size="sm"
                              onClick={() => window.open(document.file_url, '_blank')}
                              title="Unduh"
                            />
                            <IconButton
                              icon={<FiPrinter />}
                              size="sm"
                              onClick={() => window.print()}
                              title="Cetak"
                            />
                          </HStack>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Center>
                          {isImageFile(document.filename) ? (
                            <Box
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                              overflow="hidden"
                              maxH="500px"
                              maxW="100%"
                            >
                              <Image
                                src={document.file_url}
                                alt={document.filename}
                                style={{
                                  transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                                  transition: 'transform 0.3s ease'
                                }}
                                maxH="500px"
                                objectFit="contain"
                              />
                            </Box>
                          ) : isPdfFile(document.filename) ? (
                            <Box
                              w="100%"
                              h="500px"
                              border="1px solid"
                              borderColor="gray.200"
                              borderRadius="md"
                            >
                              <iframe
                                src={`${document.file_url}#toolbar=1`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title={document.filename}
                              />
                            </Box>
                          ) : (
                            <VStack spacing={4} py={8}>
                              <FiFile size={64} color="gray.400" />
                              <Text color="gray.500">
                                Pratinjau tidak tersedia untuk tipe file ini
                              </Text>
                              <Button
                                leftIcon={<FiDownload />}
                                onClick={() => window.open(document.file_url, '_blank')}
                              >
                                Unduh untuk Melihat
                              </Button>
                            </VStack>
                          )}
                        </Center>
                      </CardBody>
                    </Card>
                  </TabPanel>

                  {/* Tenant Information */}
                  <TabPanel px={0}>
                    <Card>
                      <CardBody>
                        <VStack spacing={6} align="stretch">
                          <HStack spacing={4}>
                            <Avatar 
                              size="xl" 
                              name={document.tenant_name}
                              src={documentDetails?.tenant_photo}
                            />
                            <VStack align="start" spacing={2}>
                              <Text fontSize="xl" fontWeight="bold">
                                {document.tenant_name}
                              </Text>
                              <HStack spacing={4}>
                                <Badge colorScheme="blue">
                                  {documentDetails?.tenant_type}
                                </Badge>
                                <Text color="gray.600">
                                  ID: {documentDetails?.tenant_id}
                                </Text>
                              </HStack>
                            </VStack>
                          </HStack>

                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <VStack align="start" spacing={3}>
                              <Text fontWeight="bold">Informasi Kontak</Text>
                              <HStack>
                                <FiMail />
                                <Text>{document.tenant_email}</Text>
                              </HStack>
                              <HStack>
                                <FiPhone />
                                <Text>{documentDetails?.tenant_phone}</Text>
                              </HStack>
                            </VStack>

                            <VStack align="start" spacing={3}>
                              <Text fontWeight="bold">Status Saat Ini</Text>
                              <Text>Kamar: {documentDetails?.current_room || 'Belum ditempatkan'}</Text>
                              <Text>
                                Status Registrasi: {documentDetails?.registration_status}
                              </Text>
                            </VStack>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  </TabPanel>

                  {/* Verification History */}
                  <TabPanel px={0}>
                    {verificationHistory.length === 0 ? (
                      <Center py={8}>
                        <VStack>
                          <FiClock size={48} color="gray.300" />
                          <Text color="gray.500">Belum ada riwayat verifikasi</Text>
                        </VStack>
                      </Center>
                    ) : (
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Tanggal</Th>
                            <Th>Aksi</Th>
                            <Th>Reviewer</Th>
                            <Th>Status</Th>
                            <Th>Catatan</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {verificationHistory.map((record) => (
                            <Tr key={record.id}>
                              <Td>{new Date(record.date).toLocaleString()}</Td>
                              <Td>{record.action}</Td>
                              <Td>{record.reviewer_name}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(record.status)}>
                                  {record.status}
                                </Badge>
                              </Td>
                              <Td>{record.notes || '-'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </TabPanel>

                  {/* Comments & Notes */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <Card>
                        <CardHeader>
                          <Heading size="md">Tambah Komentar</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <Textarea
                              placeholder="Tambahkan komentar atau catatan tentang dokumen ini..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={3}
                            />
                            <HStack justify="flex-end">
                              <Button
                                leftIcon={<FiSend />}
                                colorScheme="blue"
                                size="sm"
                                onClick={handleAddComment}
                                isDisabled={!newComment.trim()}
                              >
                                Tambah Komentar
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>

                      {comments.length === 0 ? (
                        <Center py={8}>
                          <VStack>
                            <FiMessageSquare size={48} color="gray.300" />
                            <Text color="gray.500">Belum ada komentar</Text>
                          </VStack>
                        </Center>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {comments.map((comment) => (
                            <Card key={comment.id}>
                              <CardBody>
                                <VStack align="start" spacing={2}>
                                  <HStack justify="space-between" w="100%">
                                    <HStack>
                                      <Avatar size="sm" name={comment.author_name} />
                                      <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">
                                          {comment.author_name}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          {new Date(comment.created_at).toLocaleString()}
                                        </Text>
                                      </VStack>
                                    </HStack>
                                    <Badge colorScheme={comment.type === 'admin_note' ? 'blue' : 'gray'}>
                                      {comment.type}
                                    </Badge>
                                  </HStack>
                                  <Text>{comment.comment}</Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Tutup
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={() => window.open(document.file_url, '_blank')}
          >
            Buka di Tab Baru
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DocumentDetailModal;
