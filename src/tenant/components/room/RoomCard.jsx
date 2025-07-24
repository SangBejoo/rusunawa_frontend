import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Image,
  Badge,
  Text,
  Button,
  Flex,
  Heading,
  Stack,
  useColorModeValue,
  HStack,
  Icon,
  AspectRatio,
  Tooltip,
  Progress,
  Spinner
} from '@chakra-ui/react';
import { FaBed, FaUsers, FaWifi, FaThermometerHalf, FaRegClock } from 'react-icons/fa';
import { MdLocationOn, MdPerson, MdTimer, MdHome, MdHotel } from 'react-icons/md';
import roomService from '../../services/roomService';
import bookingService from '../../services/bookingService';
import { getRoomTypeDisplay, getRoomCapacityText, calculateRoomOccupancy, getOccupancyBadgeInfo } from '../../utils/roomUtils';
import { defaultImages, getDefaultRoomImage } from '../../utils/imageUtils';
import { formatCurrency } from '../../utils/formatters';
import { useTenantAuth } from '../../context/tenantAuthContext';

/**
 * RoomCard component displays a room in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.room - Room data
 * @returns {JSX.Element} Room card component
 */
const RoomCard = ({ room }) => {
  // Hooks must be called at the top level
  const { tenant } = useTenantAuth();
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');  
  const [occupancyStatus, setOccupancyStatus] = useState('available');
  const [isLoading, setIsLoading] = useState(false);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [dynamicRates, setDynamicRates] = useState({ daily: 0, monthly: 0 });
  const [loadingRates, setLoadingRates] = useState(false);
  
  // Ensure room ID is properly accessed with fallback
  const roomId = room?.room_id || room?.roomId || room?.id;

  const fetchDynamicRates = async () => {
    if (!tenant?.tenantId || !roomId) return;
    
    try {
      setLoadingRates(true);
      
      // Get daily rate
      const dailyRateResponse = await bookingService.getDynamicRate(
        tenant.tenantId,
        roomId,
        1 // Daily rental type
      );
      
      // Get monthly rate (only if not ruang_rapat)
      let monthlyRate = 0;
      if (room?.classification?.name !== 'ruang_rapat') {
        const monthlyRateResponse = await bookingService.getDynamicRate(
          tenant.tenantId,
          roomId,
          2 // Monthly rental type
        );
        monthlyRate = monthlyRateResponse?.rate || 0;
      }

      setDynamicRates({
        daily: dailyRateResponse?.rate || 0,
        monthly: monthlyRate
      });

    } catch (err) {
      console.error('Error loading dynamic rates for room:', roomId, err);
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchOccupancyStatus = async () => {
    try {
      // Only attempt to fetch if we have a valid room ID
      if (!roomId || roomId === 'undefined') {
        console.warn('Missing or invalid room ID for occupancy check:', room);
        return;
      }

      // Use the occupancy data from room if available, otherwise fetch
      if (room.occupancy) {
        setOccupancyStatus(room.occupancy);
      } else if (room.occupants) {
        // Calculate from occupants array
        const occupancyData = calculateRoomOccupancy(room);
        setOccupancyStatus(occupancyData);
      } else {
        // Fallback: fetch from API
        const response = await roomService.getRoomOccupancyStatus(roomId);
        setOccupancyStatus(response);
      }
    } catch (error) {
      console.error('Error fetching occupancy status:', error);
      // Default to basic occupancy info on error
      setOccupancyStatus({
        capacity: room?.capacity || 4,
        occupied_slots: 0,
        available_slots: room?.capacity || 4,
        occupancy_percentage: 0,
        status: 'available'
      });
    } finally {      setIsLoading(false);
    }
  };

  const fetchPrimaryImage = async () => {
    try {
      setImageLoading(true);
      
      if (!roomId || roomId === 'undefined') {
        return;
      }

      const image = await roomService.getPrimaryRoomImage(roomId);
      if (image) {
        setPrimaryImage(image);
      }
    } catch (error) {
      // Silently handle image fetch errors in production
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching primary image for room ${roomId}:`, error.message);
      }
    } finally {
      setImageLoading(false);
    }
  };
  useEffect(() => {
    // Only fetch if room has a valid ID
    if ((room?.room_id || room?.roomId) && 
        (room.room_id !== 'undefined' || room.roomId !== 'undefined')) {
      fetchOccupancyStatus();
      fetchPrimaryImage(); // Fetch primary image
      fetchDynamicRates(); // Fetch dynamic rates
    }
  }, [room, tenant?.tenantId]);
  
  // Helper function to get formatted room price display
  const getFormattedRoomPrice = () => {
    if (loadingRates) {
      return 'Loading...';
    }
    
    const isMeetingRoom = room?.classification?.name === 'ruang_rapat';
    const dailyRate = dynamicRates.daily;
    const monthlyRate = dynamicRates.monthly;
    
    if (isMeetingRoom) {
      return dailyRate ? `${formatCurrency(dailyRate)}/day` : 'N/A';
    } else {
      // Show both daily and monthly rates for regular rooms
      const dailyDisplay = dailyRate ? `${formatCurrency(dailyRate)}/day` : 'N/A';
      const monthlyDisplay = monthlyRate ? `${formatCurrency(monthlyRate)}/month` : 'N/A';
      return `${dailyDisplay} • ${monthlyDisplay}`;
    }
  };

  // Helper function to get classification display name
  const getClassificationDisplayName = (classificationName) => {
    const classificationMap = {
      'perempuan': 'Female Room',
      'laki_laki': 'Male Room', 
      'VIP': 'VIP Room',
      'ruang_rapat': 'Meeting Room'
    };
    return classificationMap[classificationName] || classificationName;  };

  // Early return guard for room prop
  if (!room) {
    return null; 
  }

  const {
    room_id,
    name,
    classification,
    rentalType,
    rate,
    capacity,
    description,
    amenities = []
  } = room;
  
  // Determine room image based on classification
  const roomImage = defaultImages[classification?.name] || defaultImages.perempuan;
  
  // Get room type display info
  const classInfo = getRoomTypeDisplay(classification?.name || '');
  
  // Determine if this is a meeting room
  const isMeetingRoom = classification?.name === 'ruang_rapat';
  
  // Get room features directly from the provided amenities
  const hasAC = amenities.some(a => a.feature?.name === 'AC');
  const hasBathroom = amenities.some(a => a.feature?.name === 'private_bathroom');
  
  // Get occupancy status badge
  const getOccupancyBadge = () => {
    const badgeInfo = getOccupancyBadgeInfo(room);
    if (!badgeInfo) return null;
    
    return (
      <Badge colorScheme={badgeInfo.colorScheme} ml={2}>
        {badgeInfo.text}
      </Badge>
    );
  };  
  // Image URL priority: database primary image > room.imageUrl > default image
  const imageUrl = primaryImage?.imageUrl || room.imageUrl || getDefaultRoomImage(room);
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      borderColor={cardBorder}
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-5px)' }}
    >
      {/* Room Image */}
      <AspectRatio ratio={16 / 9} position="relative">
        <Box>
          <Image 
            src={imageUrl} 
            alt={name} 
            objectFit="cover"
            fallbackSrc={defaultImages.default}
          />
          {/* Loading overlay for image */}
          {imageLoading && (
            <Flex
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.300"
              align="center"
              justify="center"
            >
              <Spinner size="sm" color="white" />
            </Flex>
          )}
          {/* Primary image badge */}
          {primaryImage && (
            <Badge
              position="absolute"
              top={2}
              left={2}
              colorScheme="blue"
              variant="solid"
              fontSize="xs"
            >
              Photo
            </Badge>
          )}
        </Box>
      </AspectRatio>
      
      <Box p={5} display="flex" flexDirection="column">
        {/* Room Type Badge with Occupancy Status */}
        <Flex align="center" mb={2}>
          <Badge 
            colorScheme={
              classification?.name === 'perempuan' ? 'pink' :
              classification?.name === 'laki_laki' ? 'blue' :
              classification?.name === 'VIP' ? 'purple' :
              classification?.name === 'ruang_rapat' ? 'green' : 'gray'
            } 
            alignSelf="flex-start"
          >
            {getClassificationDisplayName(classification?.name)}
          </Badge>
          {getOccupancyBadge()}
        </Flex>
        
        {/* Room Name */}
        <Heading as="h3" size="md" mb={2}>
          {name}
        </Heading>
        
        {/* Rate - with dynamic price display */}
        <Flex align="center" mb={3}>
          <Text fontWeight="bold" fontSize="sm" color="green.600">
            {getFormattedRoomPrice()}
          </Text>
        </Flex>
        
        {/* Description */}
        <Text 
          color="gray.600" 
          fontSize="sm" 
          noOfLines={2} 
          mb={4}
          flex="1"
        >
          {description || 'No description provided for this room.'}
        </Text>
        
        {/* Features */}
        <Stack spacing={2} mt="auto">
          {/* Only show capacity for non-meeting rooms */}
          <HStack>
            {!isMeetingRoom && (
              <Flex align="center">
                <MdPerson />
                <Text ml={1} fontSize="sm">{getRoomCapacityText(room)}</Text>
              </Flex>
            )}
            
            {rentalType && (
              <Flex align="center" ml={3}>
                <MdTimer />
                <Text ml={1} fontSize="sm">
                  {rentalType.name === 'harian' ? 'Harian' : 'Bulanan'}
                </Text>
              </Flex>
            )}
          </HStack>
          
          {/* Occupancy information for dorms */}
          {occupancyStatus && classification?.name !== 'ruang_rapat' && (
            <Tooltip 
              label={`${occupancyStatus.occupied_slots || 0} out of ${occupancyStatus.capacity || 4} beds occupied`} 
              hasArrow
            >
              <Box>
                <Flex align="center" justify="space-between" mt={1}>
                  <Flex align="center">
                    <MdHotel />
                    <Text ml={1} fontSize="sm">Occupancy:</Text>
                  </Flex>
                  <Text fontSize="sm" fontWeight="medium">
                    {occupancyStatus.occupied_slots || 0}/{occupancyStatus.capacity || 4}
                  </Text>
                </Flex>
                <Progress 
                  value={occupancyStatus.occupancy_percentage || 0} 
                  size="xs" 
                  colorScheme={
                    (occupancyStatus.occupancy_percentage || 0) >= 100 ? "red" :
                    (occupancyStatus.occupancy_percentage || 0) > 50 ? "orange" : "green"
                  }
                  mt={1}
                  borderRadius="full"
                />
              </Box>
            </Tooltip>
          )}
            {/* Amenities with proper keys */}
          <HStack>
            {amenities.map((amenity, index) => {
              // Ensure we render a string, not an object
              let displayText;
              if (typeof amenity === 'object') {
                displayText = amenity.feature?.name || 
                             amenity.name || 
                             amenity.customFeatureName || 
                             'Unknown Feature';
              } else {
                displayText = String(amenity);
              }
              
              return (
                <Badge key={`${roomId}-amenity-${index}`} colorScheme="blue" variant="subtle">
                  {displayText}
                </Badge>
              );
            })}
          </HStack>
          
          {/* Critical fix: Ensure room ID is passed correctly in the URL */}
          <Button 
            as={RouterLink} 
            to={`/tenant/rooms/${roomId}`} 
            colorScheme="blue" 
            variant="solid"
            size="sm"
            isDisabled={occupancyStatus?.is_fully_booked}
          >
            {occupancyStatus?.is_fully_booked ? 'Fully Booked' : 'View Details'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default RoomCard;
