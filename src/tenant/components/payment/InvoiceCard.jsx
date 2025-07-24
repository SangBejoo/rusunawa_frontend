import React from 'react';
import {
  Box,
  Badge,
  Button,
  Text,
  Flex,
  VStack,
  HStack,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FaFileInvoiceDollar, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate, formatDateTime, formatCurrency } from '../helpers/dateFormatter';
import { statusDisplayMap } from '../helpers/typeConverters';

const InvoiceStatusBadge = ({ status }) => {
  let colorScheme;
  let icon;
  
  switch(status) {
    case 'paid':
      colorScheme = 'green';
      icon = <FaCheckCircle />;
      break;
    case 'pending':
      colorScheme = 'yellow';
      icon = <FaClock />;
      break;
    case 'failed':
      colorScheme = 'red';
      icon = <FaTimesCircle />;
      break;
    case 'refunded':
      colorScheme = 'purple';
      icon = <FaCheckCircle />;
      break;
    default:
      colorScheme = 'gray';
      icon = <FaClock />;
  }
  
  return (
    <Badge 
      colorScheme={colorScheme} 
      display="flex" 
      alignItems="center" 
      px={2} 
      py={1} 
      borderRadius="md"
    >
      {icon}
      <Text ml={1}>{statusDisplayMap[status] || status}</Text>
    </Badge>
  );
};

const InvoiceCard = ({ invoice, onViewDetails, onPay }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isPaid = invoice.status === 'paid';
  const isOverdue = !isPaid && new Date(invoice.due_date) < new Date();
  
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={isOverdue ? 'red.300' : borderColor}
      bg={bgColor}
      boxShadow="sm"
      position="relative"
      overflow="hidden"
    >
      {isOverdue && (
        <Box 
          position="absolute" 
          top={0} 
          right={0} 
          bg="red.500" 
          color="white" 
          px={2} 
          py={1} 
          fontSize="xs" 
          fontWeight="bold"
          transform="rotate(45deg) translateX(20px) translateY(-10px)"
          width="150px"
          textAlign="center"
          boxShadow="sm"
        >
          JATUH TEMPO
        </Box>
      )}
      
      <Flex justifyContent="space-between" alignItems="flex-start" mb={3}>
        <VStack align="flex-start" spacing={1}>
          <Text fontWeight="bold" fontSize="lg">{invoice.invoice_no}</Text>
          <Text fontSize="sm" color="gray.500">
            ID: {invoice.invoice_id}
          </Text>
        </VStack>
        <InvoiceStatusBadge status={invoice.status} />
      </Flex>
      
      <Divider my={3} />
      
      <VStack align="stretch" spacing={2}>
        <Flex justify="space-between">
          <HStack>
            <FaFileInvoiceDollar />
            <Text>Jumlah</Text>
          </HStack>
          <Text fontWeight="bold">{formatCurrency(invoice.amount)}</Text>
        </Flex>
        
        <Flex justify="space-between">
          <HStack>
            <FaCalendarAlt />
            <Text>Tanggal Terbit</Text>
          </HStack>
          <Text>{formatDate(invoice.issued_at)}</Text>
        </Flex>
        
        <Flex justify="space-between">
          <HStack>
            <FaClock />
            <Text>Batas Waktu</Text>
          </HStack>
          <Text color={isOverdue ? 'red.500' : 'inherit'}>
            {formatDate(invoice.due_date)}
          </Text>
        </Flex>
        
        {invoice.paid_at && (
          <Flex justify="space-between">
            <HStack>
              <FaCheckCircle color="green.500" />
              <Text>Dibayar Pada</Text>
            </HStack>
            <Text>{formatDateTime(invoice.paid_at)}</Text>
          </Flex>
        )}
      </VStack>
      
      <Divider my={3} />
      
      <Flex justifyContent="space-between" mt={3}>
        <Button 
          colorScheme="gray" 
          variant="outline" 
          size="sm"
          onClick={() => onViewDetails(invoice)}
        >
          Detail
        </Button>
        
        {!isPaid && (
          <Button 
            colorScheme="brand" 
            size="sm"
            onClick={() => onPay(invoice)}
          >
            Bayar Sekarang
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default InvoiceCard;
