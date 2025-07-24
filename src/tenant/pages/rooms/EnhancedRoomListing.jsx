import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  CardFooter,
  Image,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Flex,
  Icon,
  useColorModeValue,
  useToast,
  useDisclosure,
  Tooltip,
  Progress,
  Divider
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaBed,
  FaUsers,
  FaWifi,
  FaParking,
  FaTv,
  FaSnowflake,
  FaMapMarkerAlt,
  FaStar,
  FaHeart,
  FaEye,
  FaCalendarPlus
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import EnhancedBookingModal from '../../components/booking/EnhancedBookingModal';
import roomService from '../../services/roomService';
import { useEnhancedPayments, usePaymentAnalytics } from '../../hooks/useEnhancedPayments';
import { formatCurrency } from '../../components/helpers/typeConverters';
import { calculateRoomOccupancy } from '../../utils/roomUtils';

const EnhancedRoomListing = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Enhanced payment hooks for analytics
  const { analytics } = usePaymentAnalytics();
  
  // State management
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [rentalTypes, setRentalTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [viewCounts, setViewCounts] = useState(new Map());
  
  // Filter state
  const [filters, setFilters] = useState({
    classification: searchParams.get('classification') || '',
    rentalType: searchParams.get('rental') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    amenities: searchParams.getAll('amenities') || [],
    sortBy: searchParams.get('sortBy') || 'price_asc'
  });
  
  // Booking form state
  const [bookingDates, setBookingDates] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    rentalType: null
  });
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Available amenities for filtering
  const availableAmenities = [
    { id: 'wifi', label: 'Wi-Fi', icon: FaWifi },
    { id: 'parking', label: 'Parking', icon: FaParking },
    { id: 'tv', label: 'TV', icon: FaTv },
    { id: 'ac', label: 'Air Conditioning', icon: FaSnowflake }
  ];
  
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [rooms, filters]);
  
  useEffect(() => {
    updateSearchParams();
  }, [filters, bookingDates]);
  
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // Fetch rooms, classifications, and rental types in parallel
      const [roomsResponse, classificationsResponse, rentalTypesResponse] = await Promise.all([
        roomService.getRooms({ status: 'available' }),
        roomService.getClassifications(),
        roomService.getRentalTypes()
      ]);
      
      // Adapt rooms to include occupancy information
      const adaptedRooms = (roomsResponse.data || roomsResponse.rooms || []).map(room => ({
        ...room,
        // Ensure proper field mapping
        id: room.roomId,
        room_id: room.roomId,
        // Calculate occupancy from occupants array
        occupancy: calculateRoomOccupancy(room)
      }));
      
      setRooms(adaptedRooms);
      setClassifications(classificationsResponse.data || []);
      setRentalTypes(rentalTypesResponse.data || []);
      
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('roomFavorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
      
      // Load view counts from localStorage
      const savedViews = localStorage.getItem('roomViews');
      if (savedViews) {
        setViewCounts(new Map(JSON.parse(savedViews)));
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load rooms. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });
    
    Object.entries(bookingDates).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    
    setSearchParams(params);
  };
  
  const applyFilters = () => {
    let filtered = [...rooms];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(room =>
        room.name?.toLowerCase().includes(searchLower) ||
        room.description?.toLowerCase().includes(searchLower) ||
        room.location?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply classification filter
    if (filters.classification) {
      filtered = filtered.filter(room => 
        room.classification?.toLowerCase() === filters.classification.toLowerCase()
      );
    }
    
    // Apply rental type filter
    if (filters.rentalType) {
      filtered = filtered.filter(room => 
        room.rentalType?.name?.toLowerCase() === filters.rentalType.toLowerCase()
      );
    }
    
    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(room => (room.rate || 0) >= parseFloat(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(room => (room.rate || 0) <= parseFloat(filters.maxPrice));
    }
    
    // Apply amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(room => {
        const roomAmenities = room.amenities || [];
        return filters.amenities.every(amenity => 
          roomAmenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        );
      });
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (a.rate || 0) - (b.rate || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.rate || 0) - (a.rate || 0));
        break;
      case 'name_asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'rating_desc':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (viewCounts.get(b.id) || 0) - (viewCounts.get(a.id) || 0));
        break;
      default:
        break;
    }
    
    setFilteredRooms(filtered);
  };
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const handleAmenityToggle = (amenityId) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };
  
  const handleRoomView = (room) => {
    // Track view count
    const newCount = (viewCounts.get(room.id) || 0) + 1;
    const newViewCounts = new Map(viewCounts);
    newViewCounts.set(room.id, newCount);
    setViewCounts(newViewCounts);
    
    // Save to localStorage
    localStorage.setItem('roomViews', JSON.stringify([...newViewCounts]));
    
    // Navigate to room details
    navigate(`/tenant/rooms/${room.id}`);
  };
  
  const handleFavoriteToggle = (roomId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(roomId)) {
      newFavorites.delete(roomId);
      toast({
        title: 'Removed from favorites',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } else {
      newFavorites.add(roomId);
      toast({
        title: 'Added to favorites',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('roomFavorites', JSON.stringify([...newFavorites]));
  };
  
  const handleBookRoom = (room) => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      toast({
        title: 'Dates Required',
        description: 'Please select check-in and check-out dates first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Find the rental type for this room
    const roomRentalType = rentalTypes.find(rt => rt.id === room.rentalTypeId);
    
    setSelectedRoom(room);
    setBookingDates(prev => ({ ...prev, rentalType: roomRentalType }));
    onOpen();
  };
  
  const clearFilters = () => {
    setFilters({
      classification: '',
      rentalType: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      amenities: [],
      sortBy: 'price_asc'
    });
  };
  
  const renderRoomCard = (room) => {
    const isFavorited = favorites.has(room.id);
    const viewCount = viewCounts.get(room.id) || 0;
    const hasRecommendation = analytics?.recommendedRooms?.includes(room.id);
    
    return (
      <Card
        key={room.id}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        transition="all 0.2s"
        _hover={{
          transform: 'translateY(-4px)',
          shadow: 'xl',
          borderColor: 'brand.300'
        }}
        position="relative"
      >
        {/* Room Image */}
        <Box position="relative">
          <Image
            src={room.imageUrl || '/placeholder-room.jpg'}
            alt={room.name}
            h="200px"
            w="full"
            objectFit="cover"
          />
          
          {/* Favorite Button */}
          <Button
            position="absolute"
            top={2}
            right={2}
            size="sm"
            colorScheme={isFavorited ? 'red' : 'gray'}
            variant={isFavorited ? 'solid' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              handleFavoriteToggle(room.id);
            }}
            bg={isFavorited ? 'red.500' : 'white'}
            color={isFavorited ? 'white' : 'gray.600'}
            _hover={{
              bg: isFavorited ? 'red.600' : 'gray.100'
            }}
          >
            <Icon as={FaHeart} />
          </Button>
          
          {/* Recommendation Badge */}
          {hasRecommendation && (
            <Badge
              position="absolute"
              top={2}
              left={2}
              colorScheme="green"
              variant="solid"
              fontSize="xs"
            >
              Recommended
            </Badge>
          )}
          
          {/* View Count */}
          {viewCount > 0 && (
            <Badge
              position="absolute"
              bottom={2}
              left={2}
              colorScheme="blue"
              variant="solid"
              fontSize="xs"
            >
              <Icon as={FaEye} mr={1} />
              {viewCount} views
            </Badge>
          )}
        </Box>
        
        <CardBody>
          <VStack spacing={3} align="stretch">
            {/* Room Header */}
            <Flex justify="space-between" align="flex-start">
              <Box>
                <Heading size="md" mb={1}>{room.name}</Heading>
                <HStack spacing={2}>
                  <Badge colorScheme="brand">{room.classification}</Badge>
                  <Badge variant="outline">{room.rentalType?.name || 'Unknown'}</Badge>
                </HStack>
              </Box>
              
              {room.rating && (
                <HStack>
                  <Icon as={FaStar} color="yellow.400" />
                  <Text fontSize="sm" fontWeight="medium">
                    {room.rating.toFixed(1)}
                  </Text>
                </HStack>
              )}
            </Flex>
            
            {/* Room Details */}
            <VStack spacing={2} align="stretch">
              <HStack>
                <Icon as={FaUsers} color="gray.500" />
                <Text fontSize="sm">Capacity: {room.capacity || 1} person(s)</Text>
              </HStack>
              
              {room.location && (
                <HStack>
                  <Icon as={FaMapMarkerAlt} color="gray.500" />
                  <Text fontSize="sm" noOfLines={1}>{room.location}</Text>
                </HStack>
              )}
              
              {room.amenities && room.amenities.length > 0 && (
                <HStack wrap="wrap" spacing={1}>
                  {room.amenities.slice(0, 3).map((amenity, index) => {
                    const amenityConfig = availableAmenities.find(a => 
                      amenity.toLowerCase().includes(a.id)
                    );
                    
                    return (
                      <Tooltip key={index} label={amenity}>
                        <Badge size="sm" variant="outline">
                          {amenityConfig && <Icon as={amenityConfig.icon} mr={1} />}
                          {amenity}
                        </Badge>
                      </Tooltip>
                    );
                  })}
                  {room.amenities.length > 3 && (
                    <Badge size="sm" variant="outline">
                      +{room.amenities.length - 3} more
                    </Badge>
                  )}
                </HStack>
              )}
            </VStack>
            
            {/* Price */}
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                {formatCurrency(room.rate || 0)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                per {room.rentalType?.name === 'harian' ? 'day' : 'month'}
              </Text>
            </Box>
            
            {room.description && (
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {room.description}
              </Text>
            )}
          </VStack>
        </CardBody>
        
        <CardFooter pt={0}>
          <HStack spacing={2} width="full">
            <Button
              variant="outline"
              leftIcon={<FaEye />}
              onClick={() => handleRoomView(room)}
              flex={1}
            >
              View Details
            </Button>
            <Button
              colorScheme="brand"
              leftIcon={<FaCalendarPlus />}
              onClick={() => handleBookRoom(room)}
              flex={1}
            >
              Book Now
            </Button>
          </HStack>
        </CardFooter>
      </Card>
    );
  };
  
  if (isLoading) {
    return (
      <TenantLayout>
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="50vh">
            <VStack spacing={4}>
              <Spinner size="xl" color="brand.500" thickness="4px" />
              <Text>Loading available rooms...</Text>
            </VStack>
          </Flex>
        </Container>
      </TenantLayout>
    );
  }
  
  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Available Rooms
            </Heading>
            <Text color="gray.500">
              Find the perfect room for your stay with integrated booking and payment
            </Text>
          </Box>
          
          {/* Search and Filters */}
          <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Date Selection */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Check-in Date</Text>
                    <Input
                      type="date"
                      value={bookingDates.checkIn}
                      onChange={(e) => setBookingDates(prev => ({
                        ...prev,
                        checkIn: e.target.value
                      }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Check-out Date</Text>
                    <Input
                      type="date"
                      value={bookingDates.checkOut}
                      onChange={(e) => setBookingDates(prev => ({
                        ...prev,
                        checkOut: e.target.value
                      }))}
                      min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                {/* Search and Basic Filters */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaSearch color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search rooms..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </InputGroup>
                  
                  <Select
                    placeholder="All Classifications"
                    value={filters.classification}
                    onChange={(e) => handleFilterChange('classification', e.target.value)}
                  >
                    {classifications.map(classification => (
                      <option key={classification.id} value={classification.name}>
                        {classification.name}
                      </option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder="All Rental Types"
                    value={filters.rentalType}
                    onChange={(e) => handleFilterChange('rentalType', e.target.value)}
                  >
                    {rentalTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name === 'harian' ? 'Daily' : 'Monthly'}
                      </option>
                    ))}
                  </Select>
                  
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="popular">Most Popular</option>
                  </Select>
                </SimpleGrid>
                
                {/* Price Range */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Min Price</Text>
                    <Input
                      type="number"
                      placeholder="Minimum price"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>Max Price</Text>
                    <Input
                      type="number"
                      placeholder="Maximum price"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </Box>
                </SimpleGrid>
                
                {/* Amenities Filter */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Amenities</Text>
                  <HStack wrap="wrap" spacing={2}>
                    {availableAmenities.map(amenity => (
                      <Button
                        key={amenity.id}
                        size="sm"
                        variant={filters.amenities.includes(amenity.id) ? 'solid' : 'outline'}
                        colorScheme={filters.amenities.includes(amenity.id) ? 'brand' : 'gray'}
                        leftIcon={<Icon as={amenity.icon} />}
                        onClick={() => handleAmenityToggle(amenity.id)}
                      >
                        {amenity.label}
                      </Button>
                    ))}
                  </HStack>
                </Box>
                
                {/* Clear Filters */}
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    Showing {filteredRooms.length} of {rooms.length} rooms
                  </Text>
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
          
          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {/* Results */}
          {filteredRooms.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              No rooms found matching your criteria. Try adjusting your filters.
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredRooms.map(renderRoomCard)}
            </SimpleGrid>
          )}
        </VStack>
        
        {/* Enhanced Booking Modal */}
        {selectedRoom && (
          <EnhancedBookingModal
            isOpen={isOpen}
            onClose={onClose}
            room={selectedRoom}
            checkInDate={bookingDates.checkIn}
            checkOutDate={bookingDates.checkOut}
            rentalType={bookingDates.rentalType}
          />
        )}
      </Container>
    </TenantLayout>
  );
};

export default EnhancedRoomListing;
