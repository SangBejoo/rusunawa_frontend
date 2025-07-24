import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, SimpleGrid, Stat, StatLabel,
  StatNumber, StatHelpText, StatArrow, useColorModeValue,
  Spinner, VStack, Button, Flex, Icon, Card, CardBody,
  Badge, HStack, Alert, AlertIcon
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaCalendarAlt, FaFileInvoiceDollar, FaBed, FaTools, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import { useTenantAuth } from '../../context/tenantAuthContext';
import bookingService from '../../services/bookingService';
import paymentService from '../../services/paymentService';
import invoiceService from '../../services/invoiceService';

const Dashboard = () => {
  const { tenant } = useTenantAuth();
  const [activeBookings, setActiveBookings] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    pendingPayments: 0,
    totalPaid: 0,
    overdueInvoices: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const statBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
    useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenant?.tenantId) return;
      
      try {
        // Fetch active bookings
        const bookingsResponse = await bookingService.getTenantBookings(tenant.tenantId, 'active');
        setActiveBookings(bookingsResponse.bookings || []);
        
        // Fetch invoices and payments using tenant-specific endpoints
        const invoicesResponse = await paymentService.getTenantInvoices(tenant.tenantId);
        const invoices = invoicesResponse.invoices || [];
        
        const paymentsResponse = await paymentService.getTenantPayments(tenant.tenantId);
        const payments = paymentsResponse.payments || [];
        
        // Filter pending and overdue invoices
        const pending = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'partially_paid');
        const overdue = pending.filter(inv => new Date(inv.dueDate) < new Date());
        
        setPendingInvoices(pending);
        setRecentPayments(payments.slice(0, 5)); // Show last 5 payments
        
        // Calculate stats
        const totalPaid = payments
          .filter(p => p.status === 'verified')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const pendingAmount = pending.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        setDashboardStats({
          totalBookings: bookingsResponse.bookings?.length || 0,
          pendingPayments: pendingAmount,
          totalPaid: totalPaid,
          overdueInvoices: overdue.length
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [tenant?.tenantId]);
  
  const renderLoadingState = () => (
    <VStack spacing={8} py={10}>
      <Spinner size="xl" thickness="4px" color="brand.500" />
      <Text>Loading your dashboard...</Text>
    </VStack>
  );
  
  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="xl">Dashboard</Heading>
          <Text mt={2} color="gray.600">
            Welcome back, {tenant?.user?.full_name || tenant?.name || 'Tenant'}!
          </Text>
        </Box>
        
        {isLoading ? (
          renderLoadingState()
        ) : (
          <>
            {/* Stats Overview */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
              <Stat
                bg={statBg}
                p={6}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <StatLabel fontSize="md" fontWeight="medium">Active Bookings</StatLabel>
                <StatNumber fontSize="3xl">{activeBookings.length}</StatNumber>
                <StatHelpText>
                  <Flex justify="space-between" align="center" mt={2}>
                    <Text color="gray.500">Current stays</Text>
                    <Icon as={FaBed} color="green.500" />
                  </Flex>
                </StatHelpText>
              </Stat>
              
              <Stat
                bg={statBg}
                p={6}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <StatLabel fontSize="md" fontWeight="medium">Pending Payments</StatLabel>
                <StatNumber fontSize="3xl">{pendingInvoices.length}</StatNumber>
                <StatHelpText>
                  <Flex justify="space-between" align="center" mt={2}>
                    <Text color={pendingInvoices.length > 0 ? "red.500" : "gray.500"}>
                      {pendingInvoices.length > 0 ? "Action required" : "All paid"}
                    </Text>
                    <Icon as={FaFileInvoiceDollar} color={pendingInvoices.length > 0 ? "red.500" : "green.500"} />
                  </Flex>
                </StatHelpText>
              </Stat>
              
              <Stat
                bg={statBg}
                p={6}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <StatLabel fontSize="md" fontWeight="medium">Document Status</StatLabel>
                <StatNumber fontSize="3xl">Complete</StatNumber>
                <StatHelpText>
                  <Flex justify="space-between" align="center" mt={2}>
                    <Text color="gray.500">All documents approved</Text>
                    <Icon as={FaCalendarAlt} color="green.500" />
                  </Flex>
                </StatHelpText>
              </Stat>
              
              <Stat
                bg={statBg}
                p={6}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <StatLabel fontSize="md" fontWeight="medium">Maintenance Issues</StatLabel>
                <StatNumber fontSize="3xl">0</StatNumber>
                <StatHelpText>
                  <Flex justify="space-between" align="center" mt={2}>
                    <Text color="gray.500">No pending issues</Text>
                    <Icon as={FaTools} color="green.500" />
                  </Flex>
                </StatHelpText>
              </Stat>
            </SimpleGrid>
            
            {/* Quick Links */}
            <Box mb={10}>
              <Heading size="lg" mb={4}>Quick Actions</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Button
                  as={RouterLink}
                  to="/tenant/rooms"
                  colorScheme="blue"
                  size="lg"
                  height="auto"
                  py={5}
                  rightIcon={<FaArrowRight />}
                >
                  Browse Rooms
                </Button>
                
                <Button
                  as={RouterLink}
                  to="/tenant/payments/history"
                  colorScheme="green"
                  size="lg"
                  height="auto"
                  py={5}
                  rightIcon={<FaArrowRight />}
                >
                  Payment History
                </Button>
                
                <Button
                  as={RouterLink}
                  to="/tenant/documents"
                  colorScheme="purple"
                  size="lg"
                  height="auto"
                  py={5}
                  rightIcon={<FaArrowRight />}
                >
                  My Documents
                </Button>
                
                <Button
                  as={RouterLink}
                  to="/tenant/issues/report"
                  colorScheme="orange"
                  size="lg"
                  height="auto"
                  py={5}
                  rightIcon={<FaArrowRight />}
                >
                  Report Issue
                </Button>
              </SimpleGrid>
            </Box>
          </>
        )}
      </Container>
    </TenantLayout>
  );
};

export default Dashboard;
