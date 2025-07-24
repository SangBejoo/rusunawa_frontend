// Invoice-Based Room Access Component
// File: /web/src/tenant/pages/bookings/InvoiceBasedAccess.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Image,
  SimpleGrid,
  Divider,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClock,
  FaKey,
  FaFileInvoice,
  FaCalendarAlt,
  FaBuilding,
  FaUser,
  FaInfoCircle,
  FaArrowLeft,
  FaRefresh
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useRoomAccess } from '../../hooks/useBookingStatus';
import { formatDate, formatDateTime } from '../../components/helpers/dateFormatter';
import { formatCurrency } from '../../components/helpers/typeConverters';

const InvoiceBasedAccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Extract invoice ID from booking (you might need to adjust this based on your data structure)
  const [invoiceId, setInvoiceId] = useState(null);
  
  // Use the smart room access hook
  const {
    booking,
    invoice,
    loading,
    accessResult,
    hasAccess,
    accessReason,
    restrictions,
    statusDetails
  } = useRoomAccess(bookingId, invoiceId);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Set invoice ID when booking is loaded
  React.useEffect(() => {
    if (booking && booking.invoice_id) {
      setInvoiceId(booking.invoice_id);
    } else if (booking && booking.invoices && booking.invoices.length > 0) {
      setInvoiceId(booking.invoices[0].invoiceId || booking.invoices[0].invoice_id);
    }
  }, [booking]);

  // Get access status display
  const getAccessStatusDisplay = () => {
    if (hasAccess) {
      return {
        icon: FaCheckCircle,
        color: 'green',
        title: 'Access Granted',
        message: 'You have access to your room based on your paid invoice.',
        variant: 'solid'
      };
    }

    if (statusDetails?.status === 'payment_overdue') {
      return {
        icon: FaTimesCircle,
        color: 'red',
        title: 'Access Denied - Payment Required',
        message: 'Please complete your payment to gain room access.',
        variant: 'solid'
      };
    }

    if (statusDetails?.status === 'overdue') {
      return {
        icon: FaExclamationTriangle,
        color: 'orange',
        title: 'Checkout Overdue',
        message: 'Your checkout date has passed. Please contact administration.',
        variant: 'solid'
      };
    }

    return {
      icon: FaClock,
      color: 'yellow',
      title: 'Access Pending',
      message: accessReason || 'Checking access permissions...',
      variant: 'outline'
    };
  };

  const accessDisplay = getAccessStatusDisplay();

  // Handle refresh
  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle contact admin
  const handleContactAdmin = () => {
    toast({
      title: 'Contact Information',
      description: 'Please contact administration at admin@rusunawa.com or call +62-XXX-XXXX-XXXX',
      status: 'info',
      duration: 8000,
      isClosable: true
    });
  };

  if (loading) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6} align="center" minH="60vh" justify="center">
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text>Verifying room access...</Text>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  if (!booking || !invoice) {
    return (
      <TenantLayout>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6}>
            <Button 
              leftIcon={<FaArrowLeft />} 
              onClick={() => navigate('/tenant/bookings')}
              alignSelf="start"
            >
              Back to Bookings
            </Button>
            
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Booking or Invoice Not Found</Text>
                <Text>Unable to verify room access. Please check your booking details.</Text>
              </Box>
            </Alert>
          </VStack>
        </Container>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6}>
          {/* Header */}
          <HStack w="full" justify="space-between">
            <Button 
              leftIcon={<FaArrowLeft />} 
              onClick={() => navigate('/tenant/bookings')}
              variant="ghost"
            >
              Back to Bookings
            </Button>
            
            <Button 
              leftIcon={<FaRefresh />} 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
            >
              Refresh Status
            </Button>
          </HStack>

          {/* Main Access Status Card */}
          <Card 
            w="full" 
            bg={bgColor}
            borderWidth="2px"
            borderColor={`${accessDisplay.color}.200`}
            borderRadius="xl"
            shadow="lg"
          >
            <CardBody textAlign="center" py={8}>
              <VStack spacing={6}>
                <Icon 
                  as={accessDisplay.icon} 
                  boxSize={16} 
                  color={`${accessDisplay.color}.500`}
                />
                
                <VStack spacing={2}>
                  <Heading size="lg" color={`${accessDisplay.color}.600`}>
                    {accessDisplay.title}
                  </Heading>
                  
                  <Text fontSize="lg" maxW="md">
                    {accessDisplay.message}
                  </Text>
                </VStack>

                <Badge 
                  colorScheme={accessDisplay.color}
                  variant={accessDisplay.variant}
                  fontSize="md"
                  px={4}
                  py={2}
                  borderRadius="full"
                >
                  Status: {statusDetails?.status?.replace('_', ' ').toUpperCase() || 'CHECKING'}
                </Badge>

                {/* Action buttons based on status */}
                {statusDetails?.status === 'payment_overdue' && (
                  <Button 
                    colorScheme="red" 
                    size="lg"
                    onClick={() => navigate(`/tenant/invoices/${invoiceId}/payment`)}
                  >
                    Complete Payment
                  </Button>
                )}

                {restrictions && restrictions.length > 0 && (
                  <Button 
                    colorScheme="orange" 
                    variant="outline"
                    onClick={onOpen}
                  >
                    View Restrictions
                  </Button>
                )}

                {!hasAccess && statusDetails?.status !== 'payment_overdue' && (
                  <Button 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={handleContactAdmin}
                  >
                    Contact Administration
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Booking Details Card */}
          <Card w="full" bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <Icon as={FaBuilding} color="blue.500" />
                <Heading size="md">Booking Details</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Booking Info */}
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Booking ID</Text>
                    <Text fontWeight="bold" fontSize="xl">#{booking.booking_id || booking.id}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Room</Text>
                    <Text fontWeight="semibold">{booking.room?.name || 'N/A'}</Text>
                    {booking.room?.classification && (
                      <Badge colorScheme="purple" mt={1}>
                        {booking.room.classification.name}
                      </Badge>
                    )}
                  </Box>

                  {/* Prominent Dates - As Requested */}
                  <Box w="full">
                    <Text fontSize="sm" color="gray.500" mb={3}>Booking Period</Text>
                    <VStack spacing={3} align="start">
                      <HStack>
                        <Icon as={FaCalendarAlt} color="green.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">CHECK-IN</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">
                            {formatDate(booking.check_in_date || booking.checkInDate)}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack>
                        <Icon as={FaCalendarAlt} color="red.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">CHECK-OUT</Text>
                          <Text fontSize="2xl" fontWeight="bold" color="red.600">
                            {formatDate(booking.check_out_date || booking.checkOutDate)}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Box>
                </VStack>

                {/* Invoice Info */}
                <VStack align="start" spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Invoice</Text>
                    <Text fontWeight="semibold">#{invoice.invoice_number || invoice.invoiceNumber}</Text>
                    <Badge 
                      colorScheme={invoice.status === 'paid' ? 'green' : 'yellow'}
                      mt={1}
                    >
                      {invoice.status?.toUpperCase()}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>Amount</Text>
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {formatCurrency(invoice.amount || invoice.total_amount)}
                    </Text>
                  </Box>

                  {invoice.paid_at && (
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Paid At</Text>
                      <Text>{formatDateTime(invoice.paid_at)}</Text>
                    </Box>
                  )}

                  {invoice.due_date && !invoice.paid_at && (
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Due Date</Text>
                      <Text color="red.500">{formatDate(invoice.due_date)}</Text>
                    </Box>
                  )}
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Status Details Card */}
          {statusDetails && (
            <Card w="full" bg={bgColor} borderColor={borderColor}>
              <CardHeader>
                <HStack>
                  <Icon as={FaInfoCircle} color="blue.500" />
                  <Heading size="md">Status Information</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack>
                    <Text fontWeight="semibold">Current Status:</Text>
                    <Badge colorScheme={accessDisplay.color}>
                      {statusDetails.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </HStack>
                  
                  <Text>{statusDetails.reason}</Text>
                  
                  {statusDetails.actions && statusDetails.actions.length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Recommended Actions:</Text>
                      <VStack align="start" spacing={1}>
                        {statusDetails.actions.map((action, index) => (
                          <Text key={index} fontSize="sm" color="gray.600">
                            • {action.replace('_', ' ')}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Restrictions Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Access Restrictions</ModalHeader>
            <ModalBody>
              <VStack align="start" spacing={3}>
                {restrictions.map((restriction, index) => (
                  <HStack key={index} align="start">
                    <Icon as={FaExclamationTriangle} color="orange.500" mt={1} />
                    <Text>{restriction.replace('_', ' ')}</Text>
                  </HStack>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </TenantLayout>
  );
};

export default InvoiceBasedAccess;
