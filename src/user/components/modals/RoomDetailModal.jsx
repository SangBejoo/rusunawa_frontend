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
  Flex
} from '@chakra-ui/react';
import {
  FiUsers,
  FiHome,
  FiDollarSign,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiUserMinus,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiWifi,
  FiTv,
  FiWind,
  FiZap
} from 'react-icons/fi';
import roomService from '../../services/roomService';
import { tenantService } from '../../services/tenantService';

const RoomDetailModal = ({ isOpen, onClose, room, onRoomUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && room) {
      fetchRoomDetails();
    }
  }, [isOpen, room]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await roomService.getRoomById(room.roomId || room.id);
      setRoomData(response.room || response);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch room details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyStatus = (roomInfo) => {
    const currentOccupants = roomInfo?.occupants?.length || 0;
    const capacity = roomInfo?.capacity || 1;
    const percentage = (currentOccupants / capacity) * 100;
    
    if (percentage === 0) return { status: 'available', color: 'green' };
    if (percentage < 100) return { status: 'partial', color: 'orange' };
    return { status: 'full', color: 'red' };
  };

  const getClassificationLabel = (classification) => {
    switch (classification?.name) {
      case 'laki_laki': return 'Male';
      case 'perempuan': return 'Female';
      default: return classification?.name || 'Mixed';
    }
  };

  const getRentalTypeLabel = (rentalType) => {
    switch (rentalType?.name) {
      case 'harian': return 'Daily';
      case 'mingguan': return 'Weekly';
      case 'bulanan': return 'Monthly';
      default: return rentalType?.name || 'Standard';
    }
  };

  const getOccupancyPercentage = () => {
    if (!roomData || !roomData.capacity) return 0;
    return (roomData.occupants?.length || 0) / roomData.capacity * 100;
  };

  const handleUpdateRoomStatus = async (newStatus) => {
    try {
      await roomService.updateRoomStatus(room.roomId || room.id, newStatus);
      toast({
        title: 'Success',
        description: 'Room status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onRoomUpdated();
      fetchRoomDetails();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update room status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveOccupant = async (tenantId) => {
    if (window.confirm('Are you sure you want to remove this occupant?')) {
      try {
        await roomService.removeOccupant(room.roomId || room.id, tenantId);
        toast({
          title: 'Success',
          description: 'Occupant removed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchRoomDetails();
        onRoomUpdated();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove occupant',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  if (!room) return null;

  const displayRoom = roomData || room;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack>
            <FiHome />
            <Text>Room {displayRoom.name} Details</Text>
            <Badge colorScheme={getOccupancyStatus(displayRoom).color} ml={2}>
              {getOccupancyStatus(displayRoom).status}
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
              {/* Room Overview */}
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Room Information</StatLabel>
                      <StatNumber>Room {displayRoom.name}</StatNumber>
                      <StatHelpText>
                        {getRentalTypeLabel(displayRoom.rentalType)} • {getClassificationLabel(displayRoom.classification)} • Capacity {displayRoom.capacity}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Rate System</StatLabel>
                      <StatNumber>
                        <Badge colorScheme="green" fontSize="sm">
                          Dynamic Pricing
                        </Badge>
                      </StatNumber>
                      <StatHelpText>Based on tenant type</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Stat>
                      <StatLabel>Occupancy</StatLabel>
                      <StatNumber>{displayRoom.occupants?.length || 0}/{displayRoom.capacity}</StatNumber>
                      <StatHelpText>
                        <Progress 
                          value={getOccupancyPercentage()} 
                          colorScheme={getOccupancyPercentage() > 80 ? 'red' : 'blue'}
                          mt={2}
                          hasStripe
                          isAnimated
                        />
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Quick Actions</Text>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<FiSettings />} size="sm">
                          Update Status
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            onClick={() => handleUpdateRoomStatus('available')}
                            icon={<FiCheckCircle />}
                          >
                            Set Available
                          </MenuItem>
                          <MenuItem 
                            onClick={() => handleUpdateRoomStatus('maintenance')}
                            icon={<FiAlertCircle />}
                          >
                            Set Maintenance
                          </MenuItem>
                          <MenuItem 
                            onClick={() => handleUpdateRoomStatus('occupied')}
                            icon={<FiUsers />}
                          >
                            Set Occupied
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>

              {/* Amenities */}
              <Card>
                <CardHeader>
                  <Heading size="md">Room Amenities</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {displayRoom.amenities?.map((amenity) => (
                      <HStack key={amenity.featureId} spacing={3}>
                        <Box
                          p={2}
                          rounded="md"
                          bg="green.100"
                          color="green.600"
                        >
                          <FiCheckCircle />
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {amenity.feature.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {amenity.feature.description}
                          </Text>
                          {amenity.quantity > 1 && (
                            <Text fontSize="xs" color="blue.500">
                              Qty: {amenity.quantity}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    )) || <Text color="gray.500">No amenities listed</Text>}
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Detailed Information Tabs */}
              <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>Current Occupants ({displayRoom.occupants?.length || 0})</Tab>
                  <Tab>Room History</Tab>
                  <Tab>Maintenance Records</Tab>
                  <Tab>Photos & Documents</Tab>
                </TabList>

                <TabPanels>
                  {/* Current Occupants */}
                  <TabPanel px={0}>
                    {displayRoom.occupants?.length === 0 ? (
                      <Center py={8}>
                        <VStack>
                          <FiUsers size={48} color="gray.300" />
                          <Text color="gray.500">No current occupants</Text>
                        </VStack>
                      </Center>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {displayRoom.occupants?.map((occupant) => (
                          <Card key={occupant.bookingId}>
                            <CardBody>
                              <Flex justify="space-between" align="start">
                                <HStack spacing={4}>
                                  <Avatar 
                                    size="md" 
                                    name={occupant.name}
                                  />
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold">{occupant.name}</Text>
                                    <HStack spacing={4}>
                                      <HStack spacing={1}>
                                        <FiMail size={14} />
                                        <Text fontSize="sm" color="gray.600">
                                          {occupant.email}
                                        </Text>
                                      </HStack>
                                    </HStack>
                                    <HStack spacing={4}>
                                      <Badge colorScheme="blue">
                                        {occupant.gender}
                                      </Badge>
                                      <HStack spacing={1}>
                                        <FiCalendar size={14} />
                                        <Text fontSize="sm" color="gray.600">
                                          {new Date(occupant.checkIn).toLocaleDateString()} - {new Date(occupant.checkOut).toLocaleDateString()}
                                        </Text>
                                      </HStack>
                                      <Badge colorScheme={occupant.paymentStatus === 'paid' ? 'green' : 'red'}>
                                        {occupant.paymentStatus}
                                      </Badge>
                                    </HStack>
                                  </VStack>
                                </HStack>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreVertical />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem icon={<FiEye />}>
                                      View Profile
                                    </MenuItem>
                                    <MenuItem 
                                      icon={<FiUserMinus />}
                                      color="red.500"
                                      onClick={() => handleRemoveOccupant(occupant.tenantId)}
                                    >
                                      Remove from Room
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    )}
                  </TabPanel>

                  {/* Room History */}
                  <TabPanel px={0}>
                    <Center py={8}>
                      <VStack>
                        <FiClock size={48} color="gray.300" />
                        <Text color="gray.500">No history records</Text>
                      </VStack>
                    </Center>
                  </TabPanel>

                  {/* Maintenance Records */}
                  <TabPanel px={0}>
                    <Center py={8}>
                      <VStack>
                        <FiSettings size={48} color="gray.300" />
                        <Text color="gray.500">No maintenance records</Text>
                      </VStack>
                    </Center>
                  </TabPanel>

                  {/* Photos & Documents */}
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="bold">Room Photos</Text>
                      <Text color="gray.500">No photos available</Text>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="blue" onClick={() => {/* TODO: Edit room */}}>
            Edit Room
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RoomDetailModal;
