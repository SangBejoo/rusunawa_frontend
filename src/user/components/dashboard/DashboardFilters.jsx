import React from 'react';
import {
  Box,
  Flex,
  Select,
  Button,
  HStack,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { FiFilter, FiCalendar, FiRefreshCw } from 'react-icons/fi';

const DashboardFilters = ({ 
  dateRange, 
  onDateRangeChange,
  onRefresh 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const filterBg = useColorModeValue('white', 'gray.700');

  const handleDateRangeChange = (value) => {
    onDateRangeChange(value);
  };
  
  // Get date range options
  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
  ];

  return (
    <>
      <Flex justify="space-between" align="center" mb={5}>
        <HStack>
          <Select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            size="sm"
            bg={filterBg}
            width="160px"
            icon={<FiCalendar />}
            borderRadius="md"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          
          {/* Mobile view filters button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            icon={<FiFilter />}
            size="sm"
            onClick={onOpen}
            aria-label="Open filters"
          />
          
          {/* Desktop view additional filters */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Select
              placeholder="All Buildings"
              size="sm"
              bg={filterBg}
              width="160px"
              borderRadius="md"
            >
              <option value="1">Building 1</option>
              <option value="2">Building 2</option>
              <option value="3">Building 3</option>
            </Select>

            <Select
              placeholder="All Room Types"
              size="sm"
              bg={filterBg}
              width="160px"
              borderRadius="md"
            >
              <option value="female">Female Dorms</option>
              <option value="male">Male Dorms</option>
              <option value="vip">VIP Rooms</option>
              <option value="meeting">Meeting Rooms</option>
            </Select>
          </HStack>
        </HStack>
        
        <Button
          leftIcon={<FiRefreshCw />}
          size="sm"
          onClick={onRefresh}
          variant="ghost"
        >
          Refresh
        </Button>
      </Flex>

      {/* Mobile Filters Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Dashboard Filters</DrawerHeader>

          <DrawerBody>
            <Box mt={4}>
              <FormControl mb={4}>
                <FormLabel>Date Range</FormLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Building</FormLabel>
                <Select placeholder="All Buildings">
                  <option value="1">Building 1</option>
                  <option value="2">Building 2</option>
                  <option value="3">Building 3</option>
                </Select>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Room Type</FormLabel>
                <Select placeholder="All Room Types">
                  <option value="female">Female Dorms</option>
                  <option value="male">Male Dorms</option>
                  <option value="vip">VIP Rooms</option>
                  <option value="meeting">Meeting Rooms</option>
                </Select>
              </FormControl>
              
              <Button width="full" colorScheme="blue" mt={4} onClick={onClose}>
                Apply Filters
              </Button>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default DashboardFilters;
