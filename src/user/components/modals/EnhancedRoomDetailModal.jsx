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
  Image,
  SimpleGrid,
  Box,
  Card,
  CardBody,
  Heading,
  Divider,
  Tag,
  TagLabel,
  IconButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiStar,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiCheck,
  FiX,
  FiImage,
  FiMaximize2
} from 'react-icons/fi';
import roomService from '../../services/roomService';

const RoomImageGallery = ({ images, roomName }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!images || images.length === 0) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <FiImage size={48} color="gray" />
            <Text color="gray.500">No images available</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  const mainImage = images[selectedImageIndex] || images[0];

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody p={0}>
          {/* Main Image */}
          <Box position="relative">
            <Image
              src={roomService.getRoomImageUrl(mainImage.image_id)}
              alt={`${roomName} - Main`}
              w="full"
              h="300px"
              objectFit="cover"
              borderTopRadius="md"
              fallback={
                <Center h="300px" bg="gray.100">
                  <Spinner />
                </Center>
              }
            />
            
            {/* Primary badge */}
            {mainImage.is_primary && (
              <Badge
                position="absolute"
                top={3}
                left={3}
                colorScheme="yellow"
                leftIcon={<FiStar />}
              >
                Primary
              </Badge>
            )}

            {/* Expand button */}
            <IconButton
              position="absolute"
              top={3}
              right={3}
              icon={<FiMaximize2 />}
              size="sm"
              colorScheme="whiteAlpha"
              onClick={onOpen}
              title="View full size"
            />

            {/* Image counter */}
            <Badge
              position="absolute"
              bottom={3}
              right={3}
              colorScheme="blackAlpha"
            >
              {selectedImageIndex + 1} of {images.length}
            </Badge>
          </Box>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <Box p={3}>
              <HStack spacing={2} overflowX="auto">
                {images.map((image, index) => (
                  <Box
                    key={image.image_id}
                    cursor="pointer"
                    onClick={() => setSelectedImageIndex(index)}
                    borderWidth={2}
                    borderColor={index === selectedImageIndex ? 'blue.500' : 'transparent'}
                    borderRadius="md"
                    minW="60px"
                    h="60px"
                  >
                    <Image
                      src={roomService.getRoomImageUrl(image.image_id)}
                      alt={`${roomName} - ${index + 1}`}
                      w="60px"
                      h="60px"
                      objectFit="cover"
                      borderRadius="md"
                      fallback={
                        <Center w="60px" h="60px" bg="gray.100">
                          <Spinner size="sm" />
                        </Center>
                      }
                    />
                  </Box>
                ))}
              </HStack>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Full size image modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" size="lg" />
          <ModalBody p={0}>
            <Center h="90vh">
              <Image
                src={roomService.getRoomImageUrl(mainImage.image_id)}
                alt={`${roomName} - Full size`}
                maxH="90vh"
                maxW="90vw"
                objectFit="contain"
                borderRadius="md"
              />
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

const RoomAmenitiesSection = ({ amenities }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  if (!amenities || amenities.length === 0) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <Text color="gray.500">No amenities listed</Text>
        </CardBody>
      </Card>
    );
  }

  const standardAmenities = amenities.filter(a => !a.is_custom);
  const customAmenities = amenities.filter(a => a.is_custom);

  return (
    <VStack spacing={4} align="stretch">
      {standardAmenities.length > 0 && (
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="sm" mb={3}>Standard Amenities</Heading>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
              {standardAmenities.map((amenity, index) => (
                <Tag key={index} size="md" colorScheme="blue" variant="subtle">
                  <TagLabel>
                    {amenity.feature?.name?.replace('_', ' ').toUpperCase() || 'Unknown'}
                    {amenity.quantity > 1 && ` (${amenity.quantity})`}
                  </TagLabel>
                </Tag>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}

      {customAmenities.length > 0 && (
        <Card bg={cardBg}>
          <CardBody>
            <Heading size="sm" mb={3}>Custom Amenities</Heading>
            <VStack spacing={2} align="stretch">
              {customAmenities.map((amenity, index) => (
                <Card key={index} bg="green.50" borderColor="green.200" borderWidth={1}>
                  <CardBody p={3}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text fontWeight="bold" fontSize="sm">
                            {amenity.custom_feature_name}
                          </Text>
                          {amenity.quantity > 1 && (
                            <Badge colorScheme="green">x{amenity.quantity}</Badge>
                          )}
                        </HStack>
                        {amenity.custom_description && (
                          <Text fontSize="xs" color="gray.600">
                            {amenity.custom_description}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

const EnhancedRoomDetailModal = ({ 
  isOpen, 
  onClose, 
  room, 
  onEdit, 
  onDelete,
  loading = false 
}) => {
  const [roomImages, setRoomImages] = useState([]);
  const [roomAmenities, setRoomAmenities] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(false);
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (room && isOpen) {
      fetchRoomImages();
      fetchRoomAmenities();
    }
  }, [room, isOpen]);

  const fetchRoomImages = async () => {
    if (!room?.room_id) return;

    try {
      setLoadingImages(true);
      const response = await roomService.getRoomImages(room.room_id);
      setRoomImages(response.images || []);
    } catch (error) {
      console.error('Failed to fetch room images:', error);
      setRoomImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchRoomAmenities = async () => {
    if (!room?.room_id) return;

    try {
      setLoadingAmenities(true);
      const response = await roomService.getRoomAmenities(room.room_id);
      setRoomAmenities(response.amenities || []);
    } catch (error) {
      console.error('Failed to fetch room amenities:', error);
      setRoomAmenities([]);
    } finally {
      setLoadingAmenities(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'green';
      case 'occupied':
        return 'red';
      case 'maintenance':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getOccupancyStatus = () => {
    if (!room?.occupants) return { status: 'Available', color: 'green', count: 0 };
    
    const currentOccupants = room.occupants.filter(occ => 
      occ.status === 'approved' && 
      (!occ.check_out || new Date(occ.check_out) > new Date())
    );
    
    const capacity = room.capacity || 1;
    const occupiedCount = currentOccupants.length;
    
    if (occupiedCount >= capacity) {
      return { status: 'Full', color: 'red', count: occupiedCount };
    } else if (occupiedCount > 0) {
      return { status: 'Partially Occupied', color: 'yellow', count: occupiedCount };
    } else {
      return { status: 'Available', color: 'green', count: 0 };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!room) {
    return null;
  }

  const occupancyInfo = getOccupancyStatus();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack justify="space-between">
            <HStack>
              <FiHome />
              <VStack align="start" spacing={0}>
                <Text>{room.name || 'Unnamed Room'}</Text>
                <Text fontSize="sm" color="gray.500" fontWeight="normal">
                  ID: {room.room_id}
                </Text>
              </VStack>
            </HStack>
            
            <HStack>
              <Badge colorScheme={occupancyInfo.color} fontSize="sm">
                {occupancyInfo.status}
              </Badge>
              
              {onEdit && onDelete && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEdit />} onClick={() => onEdit(room)}>
                      Edit Room
                    </MenuItem>
                    <MenuItem 
                      icon={<FiTrash2 />} 
                      color="red.500"
                      onClick={() => onDelete(room.room_id)}
                    >
                      Delete Room
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Center py={10}>
              <Spinner size="xl" />
            </Center>
          ) : (
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              {/* Left Column - Images and Basic Info */}
              <GridItem>
                <VStack spacing={6}>
                  {/* Room Images */}
                  <Box w="full">
                    <Heading size="md" mb={4}>Room Images</Heading>
                    {loadingImages ? (
                      <Center h="300px">
                        <Spinner />
                      </Center>
                    ) : (
                      <RoomImageGallery images={roomImages} roomName={room.name} />
                    )}
                  </Box>

                  {/* Basic Information */}
                  <Card w="full" bg={cardBg}>
                    <CardBody>
                      <Heading size="md" mb={4}>Basic Information</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                        <Stat>
                          <StatLabel>Classification</StatLabel>
                          <StatNumber fontSize="lg">
                            {room.classification?.name?.charAt(0).toUpperCase() + 
                             room.classification?.name?.slice(1).replace('_', ' ') || 'N/A'}
                          </StatNumber>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Rental Type</StatLabel>
                          <StatNumber fontSize="lg">
                            {room.rental_type?.name?.charAt(0).toUpperCase() + 
                             room.rental_type?.name?.slice(1) || 'N/A'}
                          </StatNumber>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Capacity</StatLabel>
                          <StatNumber fontSize="lg">
                            {room.capacity || 'N/A'} people
                          </StatNumber>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Rate System</StatLabel>
                          <StatNumber fontSize="lg" color="green.500">
                            <Badge colorScheme="green" fontSize="sm">
                              Dynamic Pricing
                            </Badge>
                          </StatNumber>
                          <StatHelpText>
                            Based on tenant type
                          </StatHelpText>
                        </Stat>
                      </SimpleGrid>

                      {room.description && (
                        <Box mt={4}>
                          <Text fontSize="sm" color="gray.600" mb={1}>Description</Text>
                          <Text>{room.description}</Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </GridItem>

              {/* Right Column - Amenities and Occupants */}
              <GridItem>
                <VStack spacing={6}>
                  {/* Room Amenities */}
                  <Box w="full">
                    <Heading size="md" mb={4}>
                      Amenities ({roomAmenities.length})
                    </Heading>
                    {loadingAmenities ? (
                      <Center h="200px">
                        <Spinner />
                      </Center>
                    ) : (
                      <RoomAmenitiesSection amenities={roomAmenities} />
                    )}
                  </Box>

                  {/* Occupancy Information */}
                  <Card w="full" bg={cardBg}>
                    <CardBody>
                      <Heading size="md" mb={4}>Occupancy Information</Heading>
                      <HStack justify="space-between" mb={4}>
                        <Stat>
                          <StatLabel>Current Occupants</StatLabel>
                          <StatNumber color={occupancyInfo.color === 'red' ? 'red.500' : 'green.500'}>
                            {occupancyInfo.count} / {room.capacity || 1}
                          </StatNumber>
                          <StatHelpText>{occupancyInfo.status}</StatHelpText>
                        </Stat>
                        
                        <Badge 
                          colorScheme={occupancyInfo.color} 
                          fontSize="md" 
                          p={2} 
                          borderRadius="md"
                        >
                          {occupancyInfo.status}
                        </Badge>
                      </HStack>

                      {room.occupants && room.occupants.length > 0 ? (
                        <VStack spacing={3} align="stretch">
                          <Text fontSize="sm" color="gray.600" fontWeight="bold">
                            Current Tenants:
                          </Text>
                          {room.occupants
                            .filter(occ => occ.status === 'approved')
                            .map((occupant, index) => (
                            <Card key={index} bg="blue.50" borderColor="blue.200">
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <HStack>
                                    <Avatar size="sm" name={occupant.name} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="bold" fontSize="sm">
                                        {occupant.name}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {occupant.email}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  
                                  <VStack align="end" spacing={0}>
                                    <Badge 
                                      colorScheme={occupant.payment_status === 'paid' ? 'green' : 'yellow'}
                                      fontSize="xs"
                                    >
                                      {occupant.payment_status}
                                    </Badge>
                                    <Text fontSize="xs" color="gray.500">
                                      Until: {formatDate(occupant.check_out)}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      ) : (
                        <Text color="gray.500" textAlign="center">
                          No current occupants
                        </Text>
                      )}
                    </CardBody>
                  </Card>

                  {/* Timestamps */}
                  <Card w="full" bg={cardBg}>
                    <CardBody>
                      <Heading size="sm" mb={3}>Timestamps</Heading>
                      <SimpleGrid columns={1} spacing={2}>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Created:</Text>
                          <Text fontSize="sm">{formatDate(room.created_at)}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Last Updated:</Text>
                          <Text fontSize="sm">{formatDate(room.updated_at)}</Text>
                        </HStack>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </VStack>
              </GridItem>
            </Grid>
          )}
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnhancedRoomDetailModal;
