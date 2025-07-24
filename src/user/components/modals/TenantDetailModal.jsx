import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Grid,
  GridItem,
  Divider,
  Button,
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
  Progress,
  Skeleton,
  Alert,
  AlertIcon,
  Icon,
  Box,
  Flex,
  Image,
  useDisclosure
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHome,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiEye,
  FiBook,
  FiAward
} from 'react-icons/fi';
import tenantService from '../../services/tenantService';
import documentService from '../../services/documentService';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';

// Utility functions
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'green';
    case 'pending': return 'yellow';
    case 'inactive': return 'gray';
    case 'suspended': return 'red';
    case 'verified': return 'blue';
    case 'approved': return 'green';
    case 'rejected': return 'red';
    case 'paid': return 'green';
    case 'unpaid': return 'red';
    default: return 'gray';
  }
};

const statusLabelID = (status) => {
  switch (status) {
    case 'active': return 'Aktif';
    case 'pending': return 'Menunggu';
    case 'inactive': return 'Tidak Aktif';
    case 'suspended': return 'Ditangguhkan';
    case 'verified': return 'Terverifikasi';
    case 'approved': return 'Disetujui';
    case 'rejected': return 'Ditolak';
    case 'paid': return 'Lunas';
    case 'unpaid': return 'Belum Lunas';
    default: return status;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Document Preview Modal Component
const DocumentPreviewModal = ({ isOpen, onClose, document }) => {
  const isImage = document?.isImage || document?.fileType?.startsWith('image/');

  const getImageSrc = () => {
    if (document?.content) {
      return `data:${document.fileType};base64,${document.content}`;
    }
    return document?.fileUrl || document?.thumbnailUrl;
  };

  const documentType = document?.documentType?.name || document?.documentTypeName || "Unknown";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FiFileText} />
            <Text>{documentType}</Text>
            <Badge colorScheme="blue">{document?.fileType || 'Unknown'}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {isImage && document?.content && (
              <Box textAlign="center">
                <Image
                  src={getImageSrc()}
                  alt={document?.fileName}
                  maxW="100%"
                  maxH="70vh"
                  objectFit="contain"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                />
              </Box>
            )}
            
            {!isImage && (
              <Box textAlign="center" py={8} bg="gray.50" borderRadius="md" p={6}>
                <Icon as={FiFileText} boxSize={16} color="gray.400" mb={4} />
                <Heading size="md" mb={2} color="gray.700">
                  Pratinjau tidak tersedia untuk tipe file ini
                </Heading>
                <Text color="gray.600" mb={4}>
                  Dokumen "{document?.fileName || documentType}" tidak dapat dipratinjau di browser.
                </Text>
                <VStack spacing={1} align="center">
                  <Text fontSize="sm" color="gray.500">
                    <strong>Tipe File:</strong> {document?.fileType || 'Unknown'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    <strong>Ukuran:</strong> {document?.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}
                  </Text>
                </VStack>

                <Button 
                  mt={4}
                  leftIcon={<FiDownload />}
                  colorScheme="blue" 
                  size="sm"
                  onClick={() => {
                    if (document?.content) {
                      const link = document.createElement('a');
                      link.href = `data:${document.fileType};base64,${document.content}`;
                      link.download = document.fileName;
                      link.click();
                    }
                  }}
                >
                  Unduh Dokumen
                </Button>
              </Box>
            )}
            
            <Divider />
            
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Heading size="sm">Detail Dokumen</Heading>
                <Badge colorScheme={getStatusColor(document?.status)} px={3} py={1} borderRadius="full">
                  {document?.status || 'Unknown'}
                </Badge>
              </HStack>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Nama File:</Text>
                  <Text fontSize="sm">{document?.fileName || 'Unknown'}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Tipe Dokumen:</Text>
                  <Text fontSize="sm">{documentType}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Diunggah:</Text>
                  <Text fontSize="sm">{formatDate(document?.uploadedAt) || 'Unknown'}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600" fontWeight="medium">Status:</Text>
                  <Text fontSize="sm">{document?.status || 'Unknown'}</Text>
                </Box>
                {document?.notes && (
                  <Box gridColumn="span 2">
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Catatan:</Text>
                    <Text fontSize="sm" whiteSpace="pre-wrap">{document.notes}</Text>
                  </Box>
                )}
                {document?.approverName && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Disetujui Oleh:</Text>
                    <Text fontSize="sm">{document.approverName}</Text>
                  </Box>
                )}
                {document?.approvedAt && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Disetujui Pada:</Text>
                    <Text fontSize="sm">{formatDate(document.approvedAt)}</Text>
                  </Box>
                )}
              </Grid>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const TenantDetailModal = ({ isOpen, onClose, tenant, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [tenantData, setTenantData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();  useEffect(() => {
    if (tenant && isOpen) {
      console.log('TenantDetailModal - Received tenant data:', tenant);
      console.log('TenantDetailModal - Tenant has invoices:', tenant.invoices?.length || 0);
      console.log('TenantDetailModal - Tenant has payments:', tenant.payments?.length || 0);
      console.log('TenantDetailModal - Tenant has bookings:', tenant.bookings?.length || 0);
      console.log('TenantDetailModal - Tenant has documents:', tenant.documents?.length || 0);
      
      // Always fetch fresh data to ensure we have invoices
      fetchTenantDetails();
    }
  }, [tenant, isOpen]);
  // Debug: log invoices state whenever it changes
  useEffect(() => {
    console.log('[DEBUG] Invoices state in TenantDetailModal:', invoices);
  }, [invoices]);
  const fetchTenantDetails = async () => {
    const tenantId = tenant?.tenant_id || tenant?.tenantId || tenant?.id;
    console.log('fetchTenantDetails - tenant object:', tenant);
    console.log('fetchTenantDetails - extracted tenantId:', tenantId);
    
    if (!tenantId) {
      console.error('No tenant ID found in tenant object:', tenant);
      return;
    }

    try {
      setLoading(true);

      // Fetch all data including invoices
      const [tenantDetails, tenantBookings, tenantPayments, tenantInvoices, tenantDocuments] = await Promise.all([
        tenantService.getTenantById(tenantId),
        tenantService.getTenantBookings(tenantId),
        tenantService.getTenantPaymentHistory(tenantId),
        tenantService.getTenantInvoices(tenantId),
        tenantService.getTenantDocuments(tenantId)
      ]);

      console.log('[DEBUG] tenantInvoices API response:', tenantInvoices);
      setTenantData(tenantDetails);
      setBookings(tenantBookings.bookings || []);
      setPayments(tenantPayments.payments || []);
      setInvoices(tenantInvoices.invoices || []);
      setDocuments(tenantDocuments.documents || []);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistanceColor = (distance) => {
    if (!distance) return 'gray';
    const dist = parseFloat(distance);
    if (dist <= 5) return 'green';
    if (dist <= 10) return 'yellow';
    if (dist <= 20) return 'orange';
    return 'red';
  };

  const formatDistance = (distance) => {
    if (!distance) return 'N/A';
    const dist = parseFloat(distance);
    return `${dist.toFixed(1)} km`;
  };

  const getDistanceCategory = (distance) => {
    if (!distance) return 'Unknown';
    const dist = parseFloat(distance);
    if (dist <= 5) return 'Sangat Dekat';
    if (dist <= 10) return 'Dekat';
    if (dist <= 20) return 'Jarak Sedang';
    return 'Jauh';
  };  // Calculate statistics from invoice data
  const stats = useMemo(() => {
    console.log('=== CALCULATING INVOICE-BASED STATISTICS ===');
    console.log('calculateStatistics - invoices array length:', invoices?.length || 0);
    console.log('calculateStatistics - invoices:', invoices);
    console.log('calculateStatistics - documents array length:', documents?.length || 0);
    
    // Calculate from invoice data directly
    let totalPaid = 0;
    let outstandingBalance = 0;
    let totalBookings = 0;

    if (invoices && invoices.length > 0) {
      invoices.forEach(invoice => {
        const amount = parseFloat(invoice.amount || invoice.totalAmount) || 0;
        if (invoice.status === 'paid') {
          totalPaid += amount;
        } else if (invoice.status === 'unpaid' || invoice.status === 'pending') {
          outstandingBalance += amount;
        }
      });
      // Each invoice represents one booking
      totalBookings = invoices.length;
    }

    const calculatedStats = {
      totalBookings,
      totalPayments: totalPaid,
      outstandingBalance,
      documentsSubmitted: documents?.length || 0
    };

    console.log('=== FINAL INVOICE-BASED STATISTICS ===');
    console.log('Total Bookings (from invoices):', totalBookings);
    console.log('Total Payments (from paid invoices):', totalPaid);
    console.log('Outstanding Balance (from unpaid invoices):', outstandingBalance);
    console.log('Documents Submitted:', documents?.length || 0);
    console.log('Calculated statistics object:', calculatedStats);
    console.log('=== END STATISTICS ===');
    return calculatedStats;
  }, [invoices, documents]);
  const handlePreviewDocument = (documentData) => {
    setSelectedDocument(documentData);
    onPreviewOpen();
  };
  const handleDownloadDocument = (documentData) => {
    if (documentData?.content) {
      const link = document.createElement('a');
      link.href = `data:${documentData.fileType};base64,${documentData.content}`;
      link.download = documentData.fileName;
      link.click();
    } else if (documentData?.fileUrl) {
      window.open(documentData.fileUrl, '_blank');
    }
  };

  if (!tenant) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={4}>
              <Avatar size="md" name={tenant.name || tenant.user?.fullName} src={tenant.profile_picture} />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">
                  {tenant.name || tenant.user?.fullName}
                </Text>                <HStack spacing={2}>
                  <Badge colorScheme={getStatusColor(tenant.computed_status || tenant.status)}>
                    {tenant.computed_status || tenant.status}
                  </Badge>
                  <Badge variant="outline">
                    ID: {tenant.tenant_id || tenant.tenantId}
                  </Badge>
                  {tenant.nim && (
                    <Badge colorScheme="blue" variant="outline">
                      NIM: {tenant.nim}
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Tenant Statistics Overview */}
              <Card>
                <CardHeader>
                  <Heading size="md">Ikhtisar Penyewa</Heading>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <VStack spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {stats.totalBookings}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Total Booking</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {formatCurrency(stats.totalPayments || 0)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Total Pembayaran</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        {formatCurrency(stats.outstandingBalance || 0)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Saldo Terutang</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                        {stats.documentsSubmitted}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Dokumen Dikirim</Text>
                    </VStack>
                  </Grid>
                </CardBody>
              </Card>

              {/* Detailed Information Tabs */}              <Tabs variant="enclosed" colorScheme="brand">
                <TabList>
                  <Tab>Info Pribadi</Tab>
                  <Tab>Booking ({bookings.length})</Tab>
                  <Tab>Pembayaran ({invoices.length})</Tab>
                  <Tab>Dokumen ({documents.length})</Tab>
                </TabList>

                <TabPanels>
                  {/* Personal Information */}
                  <TabPanel px={0}>
                    {loading ? (
                      <VStack spacing={4}>
                        <Skeleton height="100px" />
                        <Skeleton height="100px" />
                      </VStack>
                    ) : (
                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                        <Card>
                          <CardHeader>
                            <Heading size="sm">Informasi Dasar</Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack>
                                <Icon as={FiUser} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Nama:</Text>
                                <Text fontWeight="medium">{tenantData?.user?.fullName || tenant?.user?.fullName || tenantData?.name || tenant.name || '-'}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiMail} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Email:</Text>
                                <Text>{tenantData?.user?.email || tenant?.user?.email || tenantData?.email || tenant.email || '-'}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiPhone} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Telepon:</Text>
                                <Text>{tenantData?.phone || tenant?.phone || 'Tidak diberikan'}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiCalendar} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Bergabung:</Text>
                                <Text>{formatDate(tenantData?.createdAt || tenant.createdAt)}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiUser} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Jenis Kelamin:</Text>
                                <Text>{(tenantData?.gender || tenant?.gender) === 'P' ? 'Perempuan' : (tenantData?.gender || tenant?.gender) === 'L' ? 'Laki-laki' : (tenantData?.gender || tenant?.gender) || 'Tidak ditentukan'}</Text>
                              </HStack>
                              <HStack>
                                <Icon as={FiUser} color="gray.500" />
                                <Text fontSize="sm" color="gray.600" minW="80px">Tipe:</Text>
                                <Badge colorScheme={(tenantData?.tenantType?.name || tenant?.tenantType?.name) === 'mahasiswa' ? 'blue' : 'purple'}>
                                  {(tenantData?.tenantType?.name || tenant?.tenantType?.name) === 'mahasiswa' ? 'Mahasiswa' : 'Non-Mahasiswa'}
                                </Badge>
                              </HStack>
                              {/* Always show NIM if available */}
                              {(tenantData?.nim || tenant?.nim) && (
                                <HStack>
                                  <Icon as={FiFileText} color="gray.500" />
                                  <Text fontSize="sm" color="gray.600" minW="80px">NIM:</Text>
                                  <Text fontWeight="medium" color="blue.600">{tenantData?.nim || tenant?.nim}</Text>
                                </HStack>
                              )}
                              {/* Always show jurusan if available */}
                              {(tenantData?.jurusan || tenant?.jurusan) && (
                                <HStack>
                                  <Icon as={FiBook} color="gray.500" />
                                  <Text fontSize="sm" color="gray.600" minW="80px">Jurusan:</Text>
                                  <Text fontWeight="medium" color="blue.600">{tenantData?.jurusan || tenant?.jurusan}</Text>
                                </HStack>
                              )}
                              {/* Always show status afirmasi if available */}
                              {(tenantData?.isAfirmasi !== undefined || tenant?.isAfirmasi !== undefined) && (
                                <HStack>
                                  <Icon as={FiAward} color="gray.500" />
                                  <Text fontSize="sm" color="gray.600" minW="80px">Status:</Text>
                                  <Badge 
                                    colorScheme={(tenantData?.isAfirmasi || tenant?.isAfirmasi) ? "orange" : "gray"}
                                    variant="solid"
                                  >
                                    {(tenantData?.isAfirmasi || tenant?.isAfirmasi) ? "🎯 Mahasiswa Afirmasi" : "Reguler"}
                                  </Badge>
                                </HStack>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardHeader>
                            <Heading size="sm">
                              <HStack spacing={2}>
                                <Icon as={FiMapPin} color="blue.500" />
                                <Text>Lokasi & Jarak</Text>
                              </HStack>
                            </Heading>
                          </CardHeader>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              {/* Distance to Campus - Prominent Display */}
                              {(tenantData?.distanceToCampus || tenant?.distanceToCampus) && (
                                <Box>
                                  <Text fontSize="sm" color="gray.600" mb={2}>Jarak ke Kampus:</Text>
                                  <HStack spacing={3}>
                                    <Badge 
                                      colorScheme={getDistanceColor(tenantData?.distanceToCampus || tenant?.distanceToCampus)}
                                      variant="solid"
                                      fontSize="md"
                                      px={3}
                                      py={1}
                                    >
                                      {formatDistance(tenantData?.distanceToCampus || tenant?.distanceToCampus)}
                                    </Badge>
                                    <Text fontSize="sm" color="gray.500">
                                      {getDistanceCategory(tenantData?.distanceToCampus || tenant?.distanceToCampus)}
                                    </Text>
                                  </HStack>
                                </Box>
                              )}
                              
                              <Divider />
                              
                              {/* Address */}
                              <HStack align="flex-start">
                                <Icon as={FiMapPin} color="gray.500" mt={1} />
                                <VStack align="flex-start" spacing={1}>
                                  <Text fontSize="sm" color="gray.600">Alamat Rumah:</Text>
                                  <Text fontSize="sm">
                                    {tenantData?.address || tenant?.address || 'Tidak diberikan'}
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Current Room */}
                              {(tenantData?.currentRoomAssignment || tenant?.current_room) && (
                                <HStack>
                                  <Icon as={FiHome} color="gray.500" />
                                  <Text fontSize="sm" color="gray.600" minW="80px">Kamar Saat Ini:</Text>
                                  <VStack align="flex-start" spacing={0}>
                                    <Text fontWeight="medium">
                                      Kamar {tenantData?.currentRoomAssignment?.roomNumber || tenant?.current_room?.number}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {tenantData?.currentRoomAssignment?.roomType || tenant?.current_room?.type}
                                    </Text>
                                  </VStack>
                                </HStack>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      </Grid>
                    )}
                  </TabPanel>

                  {/* Bookings */}
                  <TabPanel px={0}>
                    {loading ? (
                      <VStack spacing={3}>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </VStack>
                    ) : bookings.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        Tidak ada booking untuk penghuni ini
                      </Alert>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Kamar</Th>
                            <Th>Periode</Th>
                            <Th>Tipe</Th>
                            <Th>Jumlah</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {bookings.map((booking) => (
                            <Tr key={booking.bookingId || booking.booking_id}>
                              <Td>
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontWeight="medium">
                                    Room {booking.room?.name || booking.roomName || booking.room_number || booking.roomId || 'N/A'}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {booking.room?.classification?.name || booking.roomType || booking.room_type || 'N/A'}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontSize="sm">
                                    {formatDate(booking.checkInDate || booking.check_in_date)} -
                                  </Text>
                                  <Text fontSize="sm">
                                    {formatDate(booking.checkOutDate || booking.check_out_date)}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge variant="outline">
                                  {booking.room?.rentalType?.name || booking.rentalType || booking.rental_type || 'Standard'}
                                </Badge>
                              </Td>
                              <Td>{formatCurrency(booking.totalAmount || booking.total_amount || 0)}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(booking.status || booking.bookingStatus)}>
                                  {statusLabelID(booking.status || booking.bookingStatus)}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>                    )}                  </TabPanel>

                  {/* Payments */}
                  <TabPanel px={0}>
                    {loading ? (
                      <VStack spacing={3}>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </VStack>
                    ) : invoices.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        Tidak ada tagihan untuk penghuni ini
                      </Alert>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Tagihan</Th>
                            <Th>Jumlah</Th>
                            <Th>Metode</Th>
                            <Th>Jatuh Tempo</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {invoices.map((invoice) => (
                            <Tr key={invoice.invoiceId || invoice.invoice_id}>
                              <Td>
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontWeight="medium">
                                    #{invoice.invoiceNo || invoice.invoice_no || invoice.invoiceId || 'N/A'}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {invoice.notes || 'Invoice'}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>{formatCurrency(invoice.amount || invoice.totalAmount || 0)}</Td>
                              <Td>
                                <Badge variant="outline">
                                  {invoice.paymentMethod || invoice.payment_method || invoice.midtransPaymentId ? 'Online' : 'Manual'}
                                </Badge>
                              </Td>
                              <Td>{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(invoice.status)}>
                                  {statusLabelID(invoice.status)}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </TabPanel>

                  {/* Documents */}
                  <TabPanel px={0}>
                    {loading ? (
                      <VStack spacing={3}>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </VStack>
                    ) : documents.length === 0 ? (
                      <Alert status="warning">
                        <AlertIcon />
                        Tidak ada dokumen yang diunggah oleh penghuni ini
                      </Alert>
                    ) : (                      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                        {documents.map((doc) => (
                          <Card key={doc.docId || doc.doc_id} size="sm">
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <VStack align="flex-start" spacing={0}>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {doc.documentTypeName || doc.doc_type_name}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {doc.fileName || doc.file_name}
                                    </Text>
                                  </VStack>
                                  <Badge colorScheme={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                </HStack>
                                
                                {doc.isImage && doc.content && (
                                  <Box 
                                    cursor="pointer" 
                                    onClick={() => handlePreviewDocument(doc)}
                                    _hover={{ opacity: 0.8 }}
                                  >
                                    <Image
                                      src={`data:${doc.fileType};base64,${doc.content}`}
                                      alt={doc.fileName || doc.file_name}
                                      borderRadius="md"
                                      maxH="100px"
                                      objectFit="cover"
                                      w="100%"
                                    />
                                  </Box>
                                )}
                                
                                <HStack justify="space-between" fontSize="xs" color="gray.500">
                                  <Text>Diunggah: {formatDate(doc.uploadedAt || doc.uploaded_at)}</Text>
                                  <HStack spacing={1}>
                                    <Button 
                                      size="xs" 
                                      leftIcon={<FiEye />} 
                                      variant="outline"
                                      onClick={() => handlePreviewDocument(doc)}
                                    >
                                      Pratinjau
                                    </Button>
                                    <Button 
                                      size="xs" 
                                      leftIcon={<FiDownload />} 
                                      variant="outline"
                                      onClick={() => handleDownloadDocument(doc)}
                                    >
                                      Unduh
                                    </Button>
                                  </HStack>
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </Grid>
                    )}
                  </TabPanel>

                  {/* Invoices */}
                  <TabPanel px={0}>
                    {loading ? (
                      <VStack spacing={3}>
                        <Skeleton height="60px" />
                        <Skeleton height="60px" />
                      </VStack>
                    ) : invoices.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        Tidak ada tagihan untuk penghuni ini
                      </Alert>
                    ) : (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Tagihan</Th>
                            <Th>Jumlah</Th>
                            <Th>Metode</Th>
                            <Th>Jatuh Tempo</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {invoices.map((invoice) => (
                            <Tr key={invoice.invoiceId || invoice.invoice_id}>
                              <Td>
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontWeight="medium">
                                    #{invoice.invoiceNo || invoice.invoice_no || invoice.invoiceId || 'N/A'}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {invoice.notes || 'Invoice'}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>{formatCurrency(invoice.amount || invoice.totalAmount || 0)}</Td>
                              <Td>
                                <Badge variant="outline">
                                  {invoice.paymentMethod || invoice.payment_method || 'N/A'}
                                </Badge>
                              </Td>
                              <Td>{invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(invoice.status)}>
                                  {statusLabelID(invoice.status)}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

    {/* Document Preview Modal */}
    <DocumentPreviewModal
      isOpen={isPreviewOpen}
      onClose={onPreviewClose}
      document={selectedDocument}
    />
    </>
  );
};

export default TenantDetailModal;
