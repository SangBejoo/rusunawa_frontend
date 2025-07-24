import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useColorModeValue,
  Spinner,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TenantLayout from '../../components/layout/TenantLayout';
import RoomCard from '../../components/room/RoomCard';
import roomService from '../../services/roomService';
import { useTenantAuth } from '../../context/tenantAuthContext';
import { calculateRoomOccupancy } from '../../utils/roomUtils';

const RoomListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    classification: searchParams.get('type') || '',
    rentalType: searchParams.get('rental') || '',
    search: searchParams.get('search') || '',
  });
  const [classifications, setClassifications] = useState([]);
  const [rentalTypes, setRentalTypes] = useState([]);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.700');
  
  // Fetch rooms based on filters
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create API parameters based on filters
        const params = {};
        
        if (filter.classification) {
          params.classification = filter.classification;
        }
        
        if (filter.rentalType) {
          params.rental_type = filter.rentalType;
        }
        
        if (filter.search) {
          params.search = filter.search;
        }
        
        // Get room data using our service
        const response = await roomService.getRooms(params);
        
        // Adapt rooms to include occupancy information
        const adaptedRooms = (response.rooms || []).map(room => ({
          ...room,
          // Ensure proper field mapping for component compatibility
          room_id: room.roomId,
          id: room.roomId,
          // Calculate occupancy from occupants array
          occupancy: calculateRoomOccupancy(room)
        }));
        
        setRooms(adaptedRooms);
        
        // Update URL with search parameters
        setSearchParams({
          ...(filter.classification ? { type: filter.classification } : {}),
          ...(filter.rentalType ? { rental: filter.rentalType } : {}),
          ...(filter.search ? { search: filter.search } : {})
        });
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(err.message || 'Gagal memuat kamar. Silakan coba lagi nanti.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRooms();
  }, [filter, setSearchParams]);
  
  // Extract unique room types from the data itself
  useEffect(() => {
    const extractUniqueTypes = (rooms) => {
      const classSet = new Set();
      const typeSet = new Set();
      
      rooms.forEach(room => {
        if (room.classification?.name) {
          classSet.add(room.classification.name);
        }
        if (room.rentalType?.name) {
          typeSet.add(room.rentalType.name);
        }
      });
      
      return {
        classifications: Array.from(classSet),
        rentalTypes: Array.from(typeSet)
      };
    };
    
    if (rooms.length > 0) {
      const { classifications: classArray, rentalTypes: typeArray } = extractUniqueTypes(rooms);
      setClassifications(classArray);
      setRentalTypes(typeArray);
    }
  }, [rooms]);
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilter({
      classification: '',
      rentalType: '',
      search: ''
    });
  };
  
  // Navigate to room details
  const handleViewRoom = (roomId) => {
    navigate(`/tenant/rooms/${roomId}`);
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    setFilter(prev => ({
      ...prev,
      search: e.target.value
    }));
  };
  
  // Translate classification names for display
  const getClassificationLabel = (name) => {
    switch (name) {
      case 'perempuan': return 'Female Dorm';
      case 'laki_laki': return 'Male Dorm';
      case 'VIP': return 'VIP Room';
      case 'ruang_rapat': return 'Meeting Room';
      default: return name;
    }
  };
  
  // Translate rental type names for display
  const getRentalTypeLabel = (name) => {
    switch (name) {
      case 'harian': return 'Daily';
      case 'bulanan': return 'Monthly';
      default: return name;
    }
  };

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading as="h1" size="xl">Kamar Tersedia</Heading>
            <Text mt={2} color="gray.600">Cari dan pesan akomodasi di Rusunawa PNJ</Text>
          </Box>
          
          {/* Filter Section */}
          <Box bg={bgColor} p={6} borderRadius="lg" shadow="md">
            <Stack 
              direction={{ base: 'column', md: 'row' }} 
              spacing={4}
              align={{ base: 'stretch', md: 'flex-end' }}
            >
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Cari</Text>
                <Input
                  placeholder="Cari berdasarkan nama kamar"
                  value={filter.search}
                  onChange={handleSearchChange}
                  variant="filled"
                />
              </Box>
              
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Tipe Kamar</Text>
                <Select
                  placeholder="Semua Tipe"
                  value={filter.classification}
                  onChange={(e) => handleFilterChange('classification', e.target.value)}
                  variant="filled"
                >
                  {classifications.map(cls => (
                    <option key={cls} value={cls}>
                      {getClassificationLabel(cls)}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Box flex={1}>
                <Text mb={2} fontWeight="medium">Periode Sewa</Text>
                <Select
                  placeholder="Semua Periode"
                  value={filter.rentalType}
                  onChange={(e) => handleFilterChange('rentalType', e.target.value)}
                  variant="filled"
                >
                  {rentalTypes.map(type => (
                    <option key={type} value={type}>
                      {getRentalTypeLabel(type)}
                    </option>
                  ))}
                </Select>
              </Box>
              
              <Button 
                leftIcon={<SearchIcon />}
                colorScheme="blue" 
                px={8}
                onClick={() => setFilter({...filter})} // Trigger re-fetch
              >
                Cari
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleClearFilters}
              >
                Bersihkan
              </Button>
            </Stack>
          </Box>
          
          {/* Loading State */}
          {isLoading && (
            <Flex justify="center" py={10}>
              <Spinner 
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
              />
            </Flex>
          )}
          
          {/* Error State */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {/* Results */}
          {!isLoading && !error && (
            <>
              <Box>
                <Text fontWeight="medium">
                  {rooms.length} room{rooms.length !== 1 ? 's' : ''} found
                </Text>
              </Box>
              
              {rooms.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {rooms.map((room) => (
                    <RoomCard 
                      key={room.roomId} 
                      room={room} 
                      onClick={() => handleViewRoom(room.roomId)}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <Box textAlign="center" py={10}>
                  <Heading as="h4" size="md" color="gray.500">
                    No rooms found matching your criteria
                  </Heading>
                  <Text mt={2}>Try adjusting your filters</Text>
                </Box>
              )}
            </>
          )}
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default RoomListing;
