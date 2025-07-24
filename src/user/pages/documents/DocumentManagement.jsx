import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  IconButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider,
  Avatar,
  SimpleGrid,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
  Container
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiCheck,
  FiX,
  FiDownload,
  FiUser,
  FiCalendar,
  FiFileText,
  FiUsers,
  FiMoreVertical,
  FiClock,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiRefreshCw
} from 'react-icons/fi';
import documentService from '../../services/documentService';
import DocumentDetailModal from '../../components/modals/DocumentDetailModal';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/authContext';
import { canUserReviewDocuments, getPermissionDeniedMessage, isRegularAdmin } from '../../utils/roleUtils';
import { Pagination } from '../../components/common/Pagination';

const DocumentManagement = () => {
  // ===================================================================
  // AUTH CONTEXT & ROLE-BASED ACCESS
  // ===================================================================
  const { user } = useAuth();
  const canReview = canUserReviewDocuments(user);
  const isAdmin = isRegularAdmin(user);

  // ===================================================================
  // STATE MANAGEMENT
  // ===================================================================
  const [documents, setDocuments] = useState([]);
  const [groupedDocuments, setGroupedDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);
  const [documentWithContent, setDocumentWithContent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    documentType: '',
    sortBy: 'uploaded_at',
    sortOrder: 'desc'
  });

  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const toast = useToast();

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await documentService.getAllDocuments(params);
      
      if (response.status.status === 'success') {
        setDocuments(response.documents);
        const totalCount = response.totalCount || response.documents.length;
        
        // Update pagination info
        setPagination(prev => ({
          ...prev,
          total: totalCount,
          totalPages: Math.ceil(totalCount / prev.limit)
        }));
        
        setTotalCount(totalCount); // Keep for backward compatibility
        
        // Group documents by tenant
        const grouped = response.documents.reduce((acc, doc) => {
          const tenantId = doc.tenantId;
          if (!acc[tenantId]) {
            acc[tenantId] = {
              tenant: doc.tenant,
              documents: []
            };
          }
          acc[tenantId].documents.push(doc);
          return acc;
        }, {});
        
        setGroupedDocuments(grouped);
      } else {
        throw new Error(response.status.message);
      }
    } catch (error) {
      console.error('Document fetch error:', error);
      
      // Handle specific NIM NULL error
      if (error.message?.includes('converting NULL to string is unsupported') && 
          error.message?.includes('nim')) {
        toast({
          title: 'Database Configuration Issue',
          description: 'Unable to load documents due to NIM field handling for non-mahasiswa tenants. Please contact system administrator.',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
        setError('NIM field database issue: Non-mahasiswa tenants have NULL NIM values that need proper backend handling.');
      } else {
        toast({
          title: 'Error fetching documents',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [pagination.page, pagination.limit, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    setCurrentPage(1); // Keep for backward compatibility
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    setCurrentPage(newPage); // Keep for backward compatibility
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(newLimit)
    }));
    setCurrentPage(1); // Keep for backward compatibility
  };
  // Handle modal close and reset state
  const handleDetailClose = () => {
    setSelectedDocument(null);
    setSelectedTenantDetails(null);
    setDocumentWithContent(null);
    setDetailLoading(false);
    setReviewNotes('');
    onDetailClose();
  };

  // Open document detail modal with comprehensive information
  const openDocumentDetail = async (document) => {
    setSelectedDocument(document);
    setReviewNotes(document.notes || '');
    setDetailLoading(true);
    onDetailOpen();

    try {
      // Fetch tenant details
      const tenantResponse = await documentService.getTenantDetails(document.tenantId);
      setSelectedTenantDetails(tenantResponse.tenant);

      // Fetch tenant documents with content (base64 images)
      const documentsResponse = await documentService.getTenantDocuments(document.tenantId);
      const documentWithContent = documentsResponse.documents.find(doc => doc.docId === document.docId);
      setDocumentWithContent(documentWithContent);
    } catch (error) {
      toast({
        title: 'Error loading document details',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setDetailLoading(false);
    }
  };  // Review document (approve/reject)
  const handleReviewDocument = async (approved) => {
    if (!selectedDocument) return;

    // Check if user has permission to review
    if (!canReview) {
      toast({
        title: 'Access Denied',
        description: getPermissionDeniedMessage('review documents'),
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    try {
      setReviewLoading(true);
      
      const reviewData = {
        reviewerId: 1, // TODO: Get from auth context
        approved,
        notes: reviewNotes
      };

      console.log('🔍 Document Debug: Submitting review:', reviewData);

      const response = await documentService.reviewDocument(selectedDocument.docId, reviewData);
      
      console.log('🔍 Document Debug: Backend response:', response);
      
      // Check if the backend returned an error status
      if (response && response.status === 'error') {
        const errorMessage = response.message || 'Unknown error occurred';
        
        // Check if it's a permission-denied error
        if (errorMessage.toLowerCase().includes('permission denied') || 
            errorMessage.toLowerCase().includes('insufficient privileges') ||
            errorMessage.toLowerCase().includes('only wakil_direktorat can')) {
          
          toast({
            title: 'Access Denied',
            description: 'Only Wakil Direktorat can review documents. Please contact an authorized user.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top',
          });
        } else {
          // Other types of errors
          toast({
            title: 'Review Failed',
            description: errorMessage,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        return;
      }
      
      // Check if backend silently rejected instead of approving (permission issue)
      if (response && response.document && approved) {
        const documentStatus = response.document.status;
        
        if (documentStatus === 'rejected') {
          console.log('🔍 Document Debug: Backend silently rejected document instead of approving - permission issue detected');
          
          // Check if the message mentions wakil_direktorat (indicating permission issue)
          const statusMessage = response.status?.message || '';
          if (statusMessage.toLowerCase().includes('wakil_direktorat')) {
            toast({
              title: 'Access Denied',
              description: 'Only Wakil Direktorat can review documents. Your request was automatically rejected.',
              status: 'warning',
              duration: 6000,
              isClosable: true,
              position: 'top',
            });
            handleDetailClose();
            fetchDocuments(); // Refresh the list
            return;
          }
        }
      }
      
      toast({
        title: `Document ${approved ? 'Approved' : 'Rejected'}`,
        description: `Document has been ${approved ? 'approved' : 'rejected'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      handleDetailClose();
      fetchDocuments(); // Refresh the list
    } catch (error) {
      // Network or other critical errors
      toast({
        title: 'Error reviewing document',
        description: error.message || 'Failed to review document - please try again',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setReviewLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading documents...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="full" p={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>Manajemen Dokumen</Heading>
            <Text color="gray.600">Kelola dan review dokumen penyewa</Text>
          </Box>

          {/* Error Display for Database Issues */}
          {error && error.includes('NIM field database issue') && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Database Configuration Issue</Text>
                <Text fontSize="sm">
                  The documents cannot be loaded because non-mahasiswa tenants have NULL NIM values. 
                  This requires backend code changes to handle nullable NIM fields properly.
                </Text>
                <Text fontSize="xs" color="gray.600" mt={2}>
                  <strong>Technical Details:</strong> Backend needs to use sql.NullString or COALESCE for NIM field scanning.
                </Text>
              </Box>
            </Alert>
          )}

          {/* General Error Display */}
          {error && !error.includes('NIM field database issue') && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Error Loading Documents</Text>
                <Text fontSize="sm">{error}</Text>
              </Box>
            </Alert>
          )}

          {/* Filters */}
          <Card>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Cari dokumen..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="Semua Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="pending">Menunggu</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </Select>

                <Select
                  placeholder="Semua Jenis Dokumen"
                  value={filters.documentType}
                  onChange={(e) => handleFilterChange('documentType', e.target.value)}
                >
                  <option value="ktp">KTP</option>
                  <option value="transkrip">Transkrip Nilai</option>
                  <option value="kk">Kartu Keluarga</option>
                </Select>

                <Select
                  value={`${filters.sortBy}_${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('_');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  <option value="uploaded_at_desc">Terbaru</option>
                  <option value="uploaded_at_asc">Terlama</option>
                  <option value="status_asc">Status A-Z</option>
                  <option value="status_desc">Status Z-A</option>
                </Select>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Documents List - Grouped by Tenant */}
          <VStack spacing={4} align="stretch">
            {Object.keys(groupedDocuments).length === 0 ? (
              <Card>
                <CardBody>
                  <Center py={8}>
                    <VStack>
                      <FiFileText size={48} color="gray.400" />
                      <Text color="gray.500">Tidak ada dokumen ditemukan</Text>
                    </VStack>
                  </Center>
                </CardBody>
              </Card>
            ) : (
              Object.entries(groupedDocuments).map(([tenantId, group]) => (
                <Card key={tenantId}>
                  <CardHeader>
                    <HStack>
                      <Avatar size="md" name={group.tenant?.nim || 'Tidak diketahui'} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">
                          NIM: {group.tenant?.nim || 'N/A'}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          ID Penyewa: {tenantId} • {group.documents.length} dokumen
                        </Text>
                      </VStack>
                      <Badge colorScheme="blue" ml="auto">
                        {group.documents.filter(doc => doc.status === 'pending').length} Menunggu
                      </Badge>
                    </HStack>
                  </CardHeader>

                  <CardBody pt={0}>
                    <VStack spacing={3} align="stretch">
                      {group.documents.map((document) => (
                        <Box
                          key={document.docId}
                          p={4}
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          bg="gray.50"
                        >
                          <HStack justify="space-between">
                            <HStack spacing={4}>
                              <Box>
                                <Text fontWeight="medium" fontSize="sm">
                                  {document.documentType?.name || 'Jenis Tidak Diketahui'}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {document.fileName}
                                </Text>
                              </Box>
                              
                              <Badge colorScheme={getStatusColor(document.status)}>
                                {document.status === 'approved' && 'Disetujui'}
                                {document.status === 'pending' && 'Menunggu'}
                                {document.status === 'rejected' && 'Ditolak'}
                                {!['approved','pending','rejected'].includes(document.status) && document.status}
                              </Badge>
                              
                              <Text fontSize="xs" color="gray.500">
                                <FiCalendar style={{ display: 'inline', marginRight: '4px' }} />
                                {formatDate(document.uploadedAt)}
                              </Text>
                            </HStack>

                            <HStack>
                              <IconButton
                                size="sm"
                                icon={<FiEye />}
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openDocumentDetail(document)}
                                title="Lihat Detail"
                              />
                              {document.status === 'pending' && canReview && (
                                <>
                                  <IconButton
                                    size="sm"
                                    icon={<FiCheck />}
                                    variant="ghost"
                                    colorScheme="green"
                                    onClick={() => {
                                      setSelectedDocument(document);
                                      setReviewNotes('');
                                      handleReviewDocument(true);
                                    }}
                                    title="Setujui Cepat"
                                  />
                                  <IconButton
                                    size="sm"
                                    icon={<FiX />}
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => {
                                      setSelectedDocument(document);
                                      setReviewNotes('Dokumen ditolak');
                                      handleReviewDocument(false);
                                    }}
                                    title="Tolak Cepat"
                                  />
                                </>
                              )}
                            </HStack>
                          </HStack>

                          {document.notes && (
                            <Text fontSize="xs" color="gray.600" mt={2} fontStyle="italic">
                              Catatan: {document.notes}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>        {/* Document Detail Modal */}
        <Modal isOpen={isDetailOpen} onClose={handleDetailClose} size="4xl">
          <ModalOverlay />
          <ModalContent maxH="90vh" overflow="hidden">
            <ModalHeader>Detail Dokumen</ModalHeader>
            <ModalCloseButton />
            
            {selectedDocument && (
              <ModalBody overflow="auto">
                {detailLoading ? (
                  <Center py={8}>
                    <VStack>
                      <Spinner size="lg" color="blue.500" />
                      <Text>Memuat detail...</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={6} align="stretch">
                    {/* Image Preview */}
                    {documentWithContent && documentWithContent.isImage && documentWithContent.content && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Pratinjau Dokumen</Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <Center>
                            <Image
                              src={`data:${documentWithContent.fileType};base64,${documentWithContent.content}`}
                              alt={documentWithContent.fileName}
                              maxW="100%"
                              maxH="400px"
                              objectFit="contain"
                              border="1px"
                              borderColor="gray.200"
                              borderRadius="md"
                            />
                          </Center>
                        </CardBody>
                      </Card>
                    )}

                    {/* Tenant Information - Main Feature */}
                    {selectedTenantDetails && (
                      <Card bg="blue.50" borderColor="blue.200">
                        <CardHeader>
                          <HStack>
                            <FiUser />
                            <Heading size="sm">Informasi Penyewa</Heading>
                            <Badge colorScheme="blue" ml="auto">
                              Distance: {selectedTenantDetails.distanceToCampus?.toFixed(2)} km to campus
                            </Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <SimpleGrid columns={2} spacing={4}>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Nama Lengkap</Text>
                              <Text fontWeight="medium">{selectedTenantDetails.user?.fullName || 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">NIM</Text>
                              <Text fontWeight="medium">{selectedTenantDetails.nim || 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Email</Text>
                              <Text fontSize="sm">{selectedTenantDetails.user?.email || 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Telepon</Text>
                              <Text fontSize="sm">{selectedTenantDetails.phone || 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Jenis Kelamin</Text>
                              <Text>{selectedTenantDetails.gender === 'L' ? 'Laki-laki' : selectedTenantDetails.gender === 'P' ? 'Perempuan' : 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Tipe</Text>
                              <Text>{selectedTenantDetails.tenantType?.name || 'N/A'}</Text>
                            </Box>
                            <Box gridColumn="span 2">
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Alamat</Text>
                              <Text fontSize="sm">{selectedTenantDetails.address || 'N/A'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Tanggal Registrasi</Text>
                              <Text fontSize="sm">{formatDate(selectedTenantDetails.createdAt)}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Hari sebagai Penyewa</Text>
                              <Text fontSize="sm">{selectedTenantDetails.statistics?.daysAsTenant || 0} hari</Text>
                            </Box>
                          </SimpleGrid>

                          {/* Statistics Summary */}
                          <Divider my={4} />
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600" mb={2}>Statistik Dokumen</Text>
                            <HStack spacing={4}>
                              <Badge colorScheme="green">
                                Disetujui: {selectedTenantDetails.statistics?.approvedDocuments || 0}
                              </Badge>
                              <Badge colorScheme="yellow">
                                Menunggu: {selectedTenantDetails.statistics?.pendingDocuments || 0}
                              </Badge>
                              <Badge colorScheme="red">
                                Ditolak: {selectedTenantDetails.statistics?.rejectedDocuments || 0}
                              </Badge>
                            </HStack>
                          </Box>
                        </CardBody>
                      </Card>
                    )}

                    {/* Document Info */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Informasi Dokumen</Heading>
                      </CardHeader>
                      <CardBody pt={0}>
                        <SimpleGrid columns={2} spacing={4}>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Jenis Dokumen</Text>
                            <Text>{selectedDocument.documentType?.name || 'Unknown'}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Status</Text>
                            <Badge colorScheme={getStatusColor(selectedDocument.status)}>
                              {selectedDocument.status.toUpperCase()}
                            </Badge>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Nama Berkas</Text>
                            <Text fontSize="sm">{selectedDocument.fileName}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Tipe Berkas</Text>
                            <Text fontSize="sm">{selectedDocument.fileType}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Dibuat Pada</Text>
                            <Text fontSize="sm">{formatDate(selectedDocument.uploadedAt)}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.600">Diperbarui Pada</Text>
                            <Text fontSize="sm">{formatDate(selectedDocument.updatedAt)}</Text>
                          </Box>
                        </SimpleGrid>
                      </CardBody>
                    </Card>

                    {/* Review Section */}
                    {selectedDocument.status === 'pending' && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Review Dokumen</Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack spacing={4} align="stretch">
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>Catatan Review</Text>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Tambahkan catatan review (opsional)"
                                rows={3}
                              />
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}

                    {/* Current Notes */}
                    {selectedDocument.notes && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Catatan Saat Ini</Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <Text fontSize="sm" color="gray.600">
                            {selectedDocument.notes}
                          </Text>
                        </CardBody>
                      </Card>
                    )}

                    {/* Approval Info */}
                    {selectedDocument.approver && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Informasi Persetujuan</Heading>
                        </CardHeader>
                        <CardBody pt={0}>
                          <SimpleGrid columns={2} spacing={4}>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Diperiksa Oleh</Text>
                              <Text>{selectedDocument.approver.fullName || 'Unknown'}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" color="gray.600">Diperiksa Pada</Text>
                              <Text>{formatDate(selectedDocument.approvedAt)}</Text>
                            </Box>
                          </SimpleGrid>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                )}
              </ModalBody>
            )}

            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={handleDetailClose}>
                  Tutup
                </Button>
                
                {selectedDocument?.status === 'pending' && canReview && (
                  <>
                    <Button
                      colorScheme="red"
                      onClick={() => handleReviewDocument(false)}
                      isLoading={reviewLoading}
                      leftIcon={<FiX />}
                    >
                      Tolak
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={() => handleReviewDocument(true)}
                      isLoading={reviewLoading}
                      leftIcon={<FiCheck />}
                    >
                      Setujui
                    </Button>
                  </>
                )}
                {selectedDocument?.status === 'pending' && isAdmin && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Akses Terbatas</Text>
                      <Text fontSize="sm">
                        Anda dapat melihat detail dokumen tetapi tidak dapat menyetujui atau menolak dokumen. Hanya pengguna Wakil Direktorat dan Super Admin yang dapat mereview dokumen.
                      </Text>
                    </Box>
                  </Alert>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

          {/* Summary */}
          <Card>
            <CardBody>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">
                  Menampilkan {documents.length} dari {totalCount} dokumen
                </Text>
                <HStack>
                  <Badge colorScheme="yellow">
                    {documents.filter(doc => doc.status === 'pending').length} Menunggu
                  </Badge>
                  <Badge colorScheme="green">
                    {documents.filter(doc => doc.status === 'approved').length} Disetujui
                  </Badge>
                  <Badge colorScheme="red">
                    {documents.filter(doc => doc.status === 'rejected').length} Ditolak
                  </Badge>
                </HStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Pagination */}
          {!loading && documents.length > 0 && (
            <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} hingga {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} dokumen
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">Item per halaman:</Text>
                  <Select
                    width="80px"
                    size="sm"
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                  </Select>
                </HStack>
              </HStack>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </Box>
          )}
        </VStack>
      </Container>
    </AdminLayout>
  );
};

export default DocumentManagement;
