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
  Progress,
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
  FiHome,
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiCheck,
  FiX,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiDownload,
  FiSend,
  FiMessageSquare
} from 'react-icons/fi';
import bookingService from '../../services/bookingService';
import tenantService from '../../services/tenantService';
import documentService from '../../services/documentService';

const BookingDetailModal = ({ isOpen, onClose, booking, onBookingUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocumentImage, setSelectedDocumentImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [fullBookingDetails, setFullBookingDetails] = useState(null);
  const toast = useToast();
  
  useEffect(() => {
    if (isOpen && booking) {
      fetchFullBookingDetails();
      fetchTenantDetails();
      fetchDocuments();
    }
  }, [isOpen, booking]);

  const fetchFullBookingDetails = async () => {
    if (!booking?.bookingId) return;
    
    try {
      setLoading(true);
      const response = await bookingService.getBookingById(booking.bookingId);
      console.log('Full booking details:', response);
      setFullBookingDetails(response.booking);
    } catch (error) {
      console.error('Error fetching full booking details:', error);
      // Fallback to original booking data if fetch fails
      setFullBookingDetails(booking);
    } finally {
      setLoading(false);
    }
  };
  const fetchTenantDetails = async () => {
    if (!booking?.tenantId) return;
    
    try {
      setLoading(true);
      const response = await tenantService.getTenantById(booking.tenantId);
      setTenantDetails(response.tenant);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tenant details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!booking?.tenantId) return;
    
    try {
      setLoadingDocuments(true);
      const response = await documentService.getTenantDocuments(booking.tenantId);
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch documents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const fetchDocumentImage = async (documentId) => {
    try {
      setImageLoading(true);
      const response = await documentService.getDocumentImage(documentId);
      
      // Create image URL from base64 content
      if (response.content && response.fileType) {
        const imageUrl = `data:${response.fileType};base64,${response.content}`;
        setSelectedDocumentImage({
          url: imageUrl,
          metadata: response.metadata,
          fileType: response.fileType
        });
      }
    } catch (error) {
      console.error('Error fetching document image:', error);
      toast({
        title: 'Error',
        description: 'Failed to load document image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });    } finally {
      setImageLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'active': return 'blue';
      case 'completed': return 'gray';
      default: return 'gray';
    }
  };

  // Utility function to get document status color
  const getDocumentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  if (!booking) return null;

  // Use full booking details if available, otherwise fallback to original booking
  const displayBooking = fullBookingDetails || booking;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack>
            <FiFileText />
            <Text>Detail Booking - BOOK-{displayBooking.bookingId}</Text>
            <Badge colorScheme={getStatusColor(displayBooking.status)} ml={2}>
              {displayBooking.status === 'pending' && 'Menunggu'}
              {displayBooking.status === 'approved' && 'Disetujui'}
              {displayBooking.status === 'rejected' && 'Ditolak'}
              {displayBooking.status === 'active' && 'Aktif'}
              {displayBooking.status === 'completed' && 'Selesai'}
              {displayBooking.status === 'cancelled' && 'Dibatalkan'}
              {!['pending','approved','rejected','active','completed','cancelled'].includes(displayBooking.status) && displayBooking.status}
            </Badge>
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
              {/* Booking Overview */}
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Informasi Penyewa</StatLabel>
                      <StatNumber fontSize="lg">{displayBooking.tenant?.user?.fullName}</StatNumber>
                      <StatHelpText>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={1}>
                            <FiMail size={12} />
                            <Text fontSize="xs">{displayBooking.tenant?.user?.email}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <FiPhone size={12} />
                            <Text fontSize="xs">{displayBooking.tenant?.phone}</Text>
                          </HStack>
                        </VStack>
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Detail Kamar</StatLabel>
                      <StatNumber>{displayBooking.room?.name}</StatNumber>
                      <StatHelpText>
                        {displayBooking.room?.classification?.name} • {displayBooking.room?.rentalType?.name}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Tanggal Pengajuan</StatLabel>
                      <StatNumber fontSize="lg">
                        {new Date(displayBooking.createdAt).toLocaleDateString()}
                      </StatNumber>
                      <StatHelpText>
                        {new Date(displayBooking.createdAt).toLocaleTimeString('id-ID')}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Total</StatLabel>
                      <StatNumber color="green.500">
                        Rp {displayBooking.totalAmount?.toLocaleString()}
                      </StatNumber>
                      <StatHelpText>
                        Tarif {displayBooking.room?.rentalType?.name}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </Grid>

              {/* Approval/Rejection Information */}
              {(displayBooking.status === 'approved' || displayBooking.status === 'rejected') && (
                <Card 
                  borderWidth={2} 
                  borderColor={displayBooking.status === 'approved' ? 'green.200' : 'red.200'} 
                  bg={displayBooking.status === 'approved' ? 'green.50' : 'red.50'} 
                  _dark={{ 
                    bg: displayBooking.status === 'approved' ? 'green.900' : 'red.900', 
                    borderColor: displayBooking.status === 'approved' ? 'green.600' : 'red.600' 
                  }}
                >
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={3}>
                        {displayBooking.status === 'approved' ? (
                          <FiCheckCircle color="green.600" size={24} />
                        ) : (
                          <FiX color="red.600" size={24} />
                        )}
                        <Heading 
                          size="md" 
                          color={displayBooking.status === 'approved' ? 'green.600' : 'red.600'} 
                          _dark={{ color: displayBooking.status === 'approved' ? 'green.300' : 'red.300' }}
                        >
                          {displayBooking.status === 'approved' ? 'Booking Disetujui' : 'Booking Ditolak'}
                        </Heading>
                      </HStack>
                      
                      {/* Show approval information if available */}
                      {displayBooking.approvals && displayBooking.approvals.length > 0 ? (
                        displayBooking.approvals.map((approval, index) => (
                          <Box key={index} p={4} bg="white" borderRadius="md" shadow="sm" _dark={{ bg: "gray.700" }}>
                            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                              <VStack align="start" spacing={2}>
                                <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                                  {approval.approved ? 'DISETUJUI OLEH' : 'DITOLAK OLEH'}
                                </Text>
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={approval.approver?.fullName} />
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="md" fontWeight="bold">
                                      {approval.approver?.fullName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                                      {approval.approver?.role?.name === 'wakil_direktorat' ? 'Wakil Direktorat' : 
                                       approval.approver?.role?.name === 'super_admin' ? 'Super Admin' : 
                                       approval.approver?.role?.name}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </VStack>
                              
                              <VStack align="start" spacing={2}>
                                <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                                  TANGGAL & WAKTU
                                </Text>
                                <VStack align="start" spacing={0}>
                                  <Text fontSize="md" fontWeight="bold">
                                    {new Date(approval.actedAt).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
                                    {new Date(approval.actedAt).toLocaleTimeString('id-ID')}
                                  </Text>
                                </VStack>
                              </VStack>
                              
                              {approval.comments && (
                                <VStack align="start" spacing={2} gridColumn="1 / -1">
                                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                                    {approval.approved ? 'CATATAN PERSETUJUAN' : 'ALASAN PENOLAKAN'}
                                  </Text>
                                  <Box 
                                    p={3} 
                                    bg={displayBooking.status === 'approved' ? 'green.100' : 'red.100'} 
                                    borderRadius="md" 
                                    borderLeft="4px solid" 
                                    borderLeftColor={displayBooking.status === 'approved' ? 'green.400' : 'red.400'}
                                    _dark={{ 
                                      bg: displayBooking.status === 'approved' ? 'green.800' : 'red.800',
                                      borderLeftColor: displayBooking.status === 'approved' ? 'green.300' : 'red.300'
                                    }}
                                    w="100%"
                                  >
                                    <Text fontSize="md" fontStyle="italic">
                                      "{approval.comments}"
                                    </Text>
                                  </Box>
                                </VStack>
                              )}
                            </Grid>
                          </Box>
                        ))
                      ) : (
                        // Fallback display when no approvals array is found
                        <Box p={4} bg="white" borderRadius="md" shadow="sm" _dark={{ bg: "gray.700" }}>
                          <VStack align="start" spacing={3}>
                            <Alert status={displayBooking.status === 'approved' ? 'success' : 'error'}>
                              <AlertIcon />
                              <Box>
                                <Text fontSize="md" fontWeight="bold">
                                  Status: {displayBooking.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                </Text>
                                <Text fontSize="sm">
                                  {displayBooking.status === 'approved' 
                                    ? 'Booking ini telah disetujui oleh admin' 
                                    : 'Booking ini telah ditolak oleh admin'
                                  }
                                </Text>
                              </Box>
                            </Alert>
                            
                            {/* Show basic status information */}
                            <VStack align="start" spacing={2} w="100%">
                              <Text fontSize="sm" fontWeight="semibold" color="gray.600" _dark={{ color: "gray.300" }}>
                                INFORMASI STATUS
                              </Text>
                              <HStack justify="space-between" w="100%">
                                <Text fontSize="sm">Terakhir diperbarui:</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {new Date(displayBooking.updatedAt).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })} - {new Date(displayBooking.updatedAt).toLocaleTimeString('id-ID')}
                                </Text>
                              </HStack>
                            </VStack>
                            
                            {/* Debug information - remove this in production */}
                            <Box p={2} bg="gray.100" borderRadius="md" fontSize="xs" color="gray.600" w="100%" _dark={{ bg: "gray.600", color: "gray.300" }}>
                              <Text fontWeight="bold">Debug Info:</Text>
                              <Text>Status: {displayBooking.status}</Text>
                              <Text>Has approvals: {displayBooking.approvals ? 'Yes' : 'No'}</Text>
                              <Text>Approvals length: {displayBooking.approvals ? displayBooking.approvals.length : 'N/A'}</Text>
                              <Text>Updated at: {displayBooking.updatedAt}</Text>
                              <Text>Full booking data: {JSON.stringify(displayBooking, null, 2)}</Text>
                            </Box>
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {/* Prominent Check-in/Check-out Dates */}
              <Card borderWidth={2} borderColor="blue.200" bg="blue.50" _dark={{ bg: "blue.900", borderColor: "blue.600" }}>
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="md" color="blue.600" _dark={{ color: "blue.300" }}>
                      Periode Booking
                    </Heading>
                    <HStack spacing={8} justify="center" wrap="wrap">
                      <VStack spacing={2} align="center" minW="200px">
                        <Text fontSize="sm" fontWeight="semibold" color="blue.500" _dark={{ color: "blue.300" }}>
                          TANGGAL MASUK
                        </Text>
                        <Text fontSize="3xl" fontWeight="bold" color="blue.700" _dark={{ color: "blue.200" }}>
                          {new Date(displayBooking.checkInDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                          {new Date(displayBooking.checkInDate).toLocaleDateString('id-ID', { weekday: 'long' })}
                        </Text>
                      </VStack>
                      
                      <Box alignSelf="center">
                        <Text fontSize="2xl" color="blue.400" _dark={{ color: "blue.500" }}>→</Text>
                      </Box>
                      
                      <VStack spacing={2} align="center" minW="200px">
                        <Text fontSize="sm" fontWeight="semibold" color="blue.500" _dark={{ color: "blue.300" }}>
                          TANGGAL KELUAR
                        </Text>
                        <Text fontSize="3xl" fontWeight="bold" color="blue.700" _dark={{ color: "blue.200" }}>
                          {new Date(displayBooking.checkOutDate).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                          {new Date(displayBooking.checkOutDate).toLocaleDateString('id-ID', { weekday: 'long' })}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {/* Duration Display */}
                    <Box textAlign="center" mt={4}>
                      <Text fontSize="lg" fontWeight="semibold" color="blue.600" _dark={{ color: "blue.300" }}>
                        Durasi: {Math.ceil((new Date(displayBooking.checkOutDate) - new Date(displayBooking.checkInDate)) / (1000 * 60 * 60 * 24))} hari
                      </Text>
                      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                        Tipe Sewa: {displayBooking.room?.rentalType?.name}
                      </Text>
                    </Box>                  </VStack>
                </CardBody>
              </Card>

              {/* Detailed Information Tabs */}
              <Tabs index={activeTab} onChange={setActiveTab}><TabList>
                  <Tab>Profil Penyewa</Tab>
                  <Tab>Dokumen ({documents.length})</Tab>
                </TabList>

                <TabPanels>
                  {/* Tenant Profile */}
                  <TabPanel px={0}>
                    <Card>
                      <CardBody>                        <VStack spacing={6} align="stretch">
                          <HStack spacing={4}>
                            <Avatar 
                              size="xl" 
                              name={tenantDetails?.user?.fullName || displayBooking.tenant?.user?.fullName}
                            />
                            <VStack align="start" spacing={2}>
                              <Text fontSize="xl" fontWeight="bold">
                                {tenantDetails?.user?.fullName || displayBooking.tenant?.user?.fullName}
                              </Text>
                              <HStack spacing={4}>
                                <Badge colorScheme="blue">
                                  {tenantDetails?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </Badge>
                                <Text color="gray.600">
                                  Tipe: {tenantDetails?.tenantType?.name}
                                </Text>
                                {tenantDetails?.isVerified && (
                                  <Badge colorScheme="green">
                                    Terverifikasi
                                  </Badge>
                                )}
                              </HStack>
                              <Text color="gray.600">
                                NIM: {tenantDetails?.nim || displayBooking.tenant?.nim}
                              </Text>
                            </VStack>
                          </HStack>

                          {/* PROMINENT DISTANCE TO CAMPUS SECTION */}
                          <Card bg="blue.50" borderWidth="2px" borderColor="blue.200" borderRadius="xl">
                            <CardBody py={6}>
                              <VStack spacing={3}>
                                <HStack spacing={3}>
                                  <Box p={3} bg="blue.500" borderRadius="full">
                                    <FiMapPin color="white" size="24px" />
                                  </Box>
                                  <VStack align="start" spacing={1}>
                                    <Text fontSize="lg" fontWeight="bold" color="blue.700">
                                      Jarak ke Kampus
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                      Klasifikasi jarak untuk kelayakan hunian
                                    </Text>
                                  </VStack>
                                </HStack>
                                
                                <Box textAlign="center" py={4}>
                                  <Text fontSize="4xl" fontWeight="extrabold" color="blue.600">
                                    {tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus || 'N/A'}
                                  </Text>
                                  <Text fontSize="xl" fontWeight="bold" color="blue.500" mt={-2}>
                                    KM
                                  </Text>
                                  
                                  {/* Distance Classification Badge */}
                                  {(tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus) && (
                                    <Badge 
                                      size="lg" 
                                      mt={2}
                                      colorScheme={
                                        (tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus) <= 5 ? 'green' :
                                        (tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus) <= 15 ? 'yellow' : 'red'
                                      }
                                      fontSize="md"
                                      px={4}
                                      py={1}
                                    >
                                      {(tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus) <= 5 ? 'Dekat' :
                                       (tenantDetails?.distanceToCampus || displayBooking.tenant?.distanceToCampus) <= 15 ? 'Sedang' : 'Jauh'}
                                    </Badge>
                                  )}
                                </Box>

                                {/* Location Coordinates (if available) */}
                                {(tenantDetails?.homeLatitude && tenantDetails?.homeLongitude) && (
                                  <Box textAlign="center" pt={2} borderTop="1px" borderColor="blue.200">
                                    <Text fontSize="xs" color="gray.500">
                                      Home Coordinates: {tenantDetails.homeLatitude.toFixed(6)}, {tenantDetails.homeLongitude.toFixed(6)}
                                    </Text>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>                          </Card>

                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}><VStack align="start" spacing={3}>
                              <Text fontWeight="bold">Informasi Kontak</Text>
                              <HStack>
                                <FiMail />
                                <Text>{tenantDetails?.user?.email || displayBooking.tenant?.user?.email}</Text>
                              </HStack>
                              <HStack>
                                <FiPhone />
                                <Text>{tenantDetails?.phone || displayBooking.tenant?.phone}</Text>
                              </HStack>
                              <HStack>
                                <FiMapPin />
                                <Text>{tenantDetails?.address || displayBooking.tenant?.address}</Text>
                              </HStack>
                              <HStack>
                                <Text fontWeight="bold">Jurusan:</Text>
                                <Text>{tenantDetails?.jurusan || displayBooking.tenant?.jurusan || '-'}</Text>
                              </HStack>
                              {((tenantDetails?.isAfirmasi !== undefined ? tenantDetails?.isAfirmasi : displayBooking.tenant?.isAfirmasi)) && (
                                <Badge colorScheme="purple" size="sm">Afirmasi</Badge>
                              )}
                            </VStack>                            <VStack align="start" spacing={3}>
                              <Text fontWeight="bold">Statistik Penyewa</Text>
                              {tenantDetails?.statistics ? (
                                <>
                                  <SimpleGrid columns={2} spacing={4} w="full">
                                    <Stat size="sm">
                                      <StatLabel>Total Booking</StatLabel>
                                      <StatNumber>{tenantDetails.statistics.totalBookings}</StatNumber>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel>Booking Aktif</StatLabel>
                                      <StatNumber>{tenantDetails.statistics.activeBookings}</StatNumber>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel>Dokumen</StatLabel>
                                      <StatNumber>
                                        {tenantDetails.statistics.approvedDocuments}/
                                        {tenantDetails.statistics.approvedDocuments + tenantDetails.statistics.pendingDocuments + tenantDetails.statistics.rejectedDocuments}
                                      </StatNumber>
                                      <StatHelpText>Disetujui</StatHelpText>
                                    </Stat>
                                    <Stat size="sm">
                                      <StatLabel>Hari Sebagai Penyewa</StatLabel>
                                      <StatNumber>{tenantDetails.statistics.daysAsTenant}</StatNumber>
                                    </Stat>
                                  </SimpleGrid>
                                  {tenantDetails.statistics.hasOverduePayments && (
                                    <Badge colorScheme="red">Ada Tunggakan</Badge>
                                  )}
                                </>
                              ) : (
                                <Text color="gray.500">Tidak ada statistik</Text>
                              )}
                            </VStack>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  </TabPanel>                  {/* Documents */}
                  <TabPanel px={0}>
                    {loadingDocuments ? (
                      <Center py={8}>
                        <Spinner />
                      </Center>
                    ) : documents.length === 0 ? (
                      <Center py={8}>
                        <VStack>
                          <FiFileText size={48} color="gray.300" />
                          <Text color="gray.500">Belum ada dokumen</Text>
                        </VStack>
                      </Center>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {documents.map((doc) => (
                          <Card key={doc.docId}>
                            <CardBody>
                              <Flex justify="space-between" align="start">
                                <VStack align="start" spacing={2}>
                                  <HStack>
                                    <Text fontWeight="bold">{doc.documentType?.name}</Text>
                                    {doc.isImage && (
                                      <Badge colorScheme="blue" size="sm">Gambar</Badge>
                                    )}
                                  </HStack>
                                  <Text color="gray.600">{doc.fileName}</Text>
                                  <HStack spacing={4}>
                                    <Badge colorScheme={getDocumentStatusColor(doc.status)}>
                                      {doc.status === 'approved' && 'Disetujui'}
                                      {doc.status === 'pending' && 'Menunggu'}
                                      {doc.status === 'rejected' && 'Ditolak'}
                                      {!['approved','pending','rejected'].includes(doc.status) && doc.status}
                                    </Badge>
                                    <Text fontSize="sm" color="gray.500">
                                      Diunggah: {new Date(doc.uploadedAt).toLocaleDateString('id-ID')}
                                    </Text>
                                  </HStack>
                                  {doc.notes && (
                                    <Text fontSize="sm" color="gray.600">
                                      Catatan: {doc.notes}
                                    </Text>
                                  )}
                                  {doc.approver && (
                                    <Text fontSize="sm" color="gray.500">
                                      Disetujui oleh: {doc.approver.fullName}
                                    </Text>
                                  )}
                                </VStack>
                                <VStack spacing={2}>
                                  {doc.isImage && (
                                    <Button 
                                      size="sm" 
                                      colorScheme="blue"
                                      variant="outline"
                                      onClick={() => fetchDocumentImage(doc.docId)}
                                      isLoading={imageLoading}
                                    >
                                      Pratinjau
                                    </Button>
                                  )}
                                  {doc.thumbnailUrl && (
                                    <Image 
                                      src={doc.thumbnailUrl} 
                                      boxSize="50px" 
                                      objectFit="cover"
                                      borderRadius="md"
                                    />
                                  )}
                                </VStack>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    )}                  </TabPanel>
                </TabPanels>
              </Tabs>            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Tutup
          </Button>
          <Button colorScheme="blue" onClick={() => {/* TODO: Export booking details */}}>
            Ekspor Detail
          </Button>
        </ModalFooter>
      </ModalContent>

      {/* Document Image Preview Modal */}
      {selectedDocumentImage && (
        <Modal isOpen={!!selectedDocumentImage} onClose={() => setSelectedDocumentImage(null)} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Pratinjau Dokumen</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Image 
                  src={selectedDocumentImage.url} 
                  maxH="500px" 
                  maxW="100%" 
                  objectFit="contain"
                  borderRadius="md"
                />
                {selectedDocumentImage.metadata && (
                  <HStack spacing={4} fontSize="sm" color="gray.600">
                    <Text>Format: {selectedDocumentImage.metadata.format}</Text>
                    <Text>Size: {(selectedDocumentImage.metadata.sizeBytes / 1024).toFixed(1)} KB</Text>
                    <Text>Dimensions: {selectedDocumentImage.metadata.width}×{selectedDocumentImage.metadata.height}</Text>
                  </HStack>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setSelectedDocumentImage(null)}>Tutup</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Modal>
  );
};

export default BookingDetailModal;
