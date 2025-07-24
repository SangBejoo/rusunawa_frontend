import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FiBuilding,
  FiMapPin,
  FiLayers,
  FiUsers,
  FiHome,
  FiCalendar,
  FiInfo,
} from 'react-icons/fi';
import buildingService from '../../services/buildingService';

const BuildingDetailModal = ({ isOpen, onClose, building }) => {
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [buildingStats, setBuildingStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isOpen && building) {
      fetchBuildingDetails();
    }
  }, [isOpen, building]);

  const fetchBuildingDetails = async () => {
    if (!building?.buildingId) return;

    setLoading(true);
    try {
      // Fetch floors, rooms, and stats in parallel
      const [floorsResponse, roomsResponse, statsResponse] = await Promise.all([
        buildingService.getFloorsByBuilding(building.buildingId),
        buildingService.getRoomsByBuilding(building.buildingId, { limit: 100 }),
        buildingService.getBuildingStats(building.buildingId)
      ]);

      setFloors(floorsResponse.floors || []);
      setRooms(roomsResponse.rooms || []);
      setBuildingStats(statsResponse.stats?.[0] || null);
    } catch (error) {
      console.error('Failed to fetch building details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (genderType) => {
    switch (genderType) {
      case 'perempuan': return 'pink';
      case 'laki_laki': return 'blue';
      case 'mixed': return 'purple';
      default: return 'gray';
    }
  };

  const getGenderLabel = (genderType) => {
    switch (genderType) {
      case 'perempuan': return 'Perempuan';
      case 'laki_laki': return 'Laki-laki';
      case 'mixed': return 'Campuran';
      default: return genderType;
    }
  };

  const getClassificationBadge = (classification) => {
    const colors = {
      'perempuan': 'pink',
      'laki_laki': 'blue',
      'VIP': 'purple',
      'ruang_rapat': 'orange'
    };
    return colors[classification] || 'gray';
  };

  if (!building) return null;

  const occupancyRate = buildingStats?.totalRooms > 0 
    ? ((buildingStats.occupiedRooms / buildingStats.totalRooms) * 100).toFixed(1)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <FiBuilding />
            <VStack align="start" spacing={0}>
              <Text>{building.buildingName}</Text>
              <HStack>
                <Badge colorScheme={getBadgeColor(building.genderType)}>
                  {building.buildingCode}
                </Badge>
                <Badge colorScheme={building.isActive ? 'green' : 'red'}>
                  {building.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Building Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Informasi Gedung
              </Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FiBuilding />
                      <Text fontWeight="medium">Kode Gedung:</Text>
                      <Text>{building.buildingCode}</Text>
                    </HStack>
                    <HStack>
                      <FiUsers />
                      <Text fontWeight="medium">Tipe Gender:</Text>
                      <Badge colorScheme={getBadgeColor(building.genderType)}>
                        {getGenderLabel(building.genderType)}
                      </Badge>
                    </HStack>
                    <HStack>
                      <FiLayers />
                      <Text fontWeight="medium">Total Lantai:</Text>
                      <Text>{building.totalFloors}</Text>
                    </HStack>
                  </VStack>
                </GridItem>
                <GridItem>
                  <VStack align="start" spacing={2}>
                    {building.address && (
                      <HStack align="start">
                        <FiMapPin />
                        <Text fontWeight="medium">Alamat:</Text>
                        <Text>{building.address}</Text>
                      </HStack>
                    )}
                    <HStack align="start">
                      <FiCalendar />
                      <Text fontWeight="medium">Dibuat:</Text>
                      <Text>{new Date(building.createdAt).toLocaleDateString('id-ID')}</Text>
                    </HStack>
                  </VStack>
                </GridItem>
              </Grid>
              
              {building.description && (
                <Box mt={4}>
                  <Text fontWeight="medium" mb={2}>Deskripsi:</Text>
                  <Text color="gray.600">{building.description}</Text>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Statistics */}
            {buildingStats && (
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                  Statistik
                </Text>
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <Stat>
                    <StatLabel>Total Ruangan</StatLabel>
                    <StatNumber>{buildingStats.totalRooms}</StatNumber>
                    <StatHelpText>Di {building.totalFloors} lantai</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Ruang Tersedia</StatLabel>
                    <StatNumber color="green.500">{buildingStats.availableRooms}</StatNumber>
                    <StatHelpText>Siap dihuni</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Ruang Terisi</StatLabel>
                    <StatNumber color="blue.500">{buildingStats.occupiedRooms}</StatNumber>
                    <StatHelpText>Sedang dihuni</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Tingkat Okupansi</StatLabel>
                    <StatNumber>{occupancyRate}%</StatNumber>
                    <Progress value={occupancyRate} size="sm" colorScheme="blue" mt={2} />
                  </Stat>
                  <Stat>
                    <StatLabel>Total Kapasitas</StatLabel>
                    <StatNumber>{buildingStats.totalCapacity}</StatNumber>
                    <StatHelpText>Orang</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel>Breakdown Gender</StatLabel>
                    <StatNumber fontSize="md">
                      P: {buildingStats.femaleRooms} | L: {buildingStats.maleRooms}
                    </StatNumber>
                    <StatHelpText>VIP: {buildingStats.vipRooms} | Meeting: {buildingStats.meetingRooms}</StatHelpText>
                  </Stat>
                </Grid>
              </Box>
            )}

            <Divider />

            {/* Detailed Information Tabs */}
            <Box>
              <Tabs index={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>
                    <HStack>
                      <FiLayers />
                      <Text>Lantai ({floors.length})</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack>
                      <FiHome />
                      <Text>Ruangan ({rooms.length})</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Floors Tab */}
                  <TabPanel px={0}>
                    {loading ? (
                      <Center py={10}>
                        <Spinner size="lg" />
                      </Center>
                    ) : floors.length > 0 ? (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Lantai</Th>
                            <Th>Nama</Th>
                            <Th>Total Ruangan</Th>
                            <Th>Status</Th>
                            <Th>Deskripsi</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {floors.map((floor) => (
                            <Tr key={floor.floorId}>
                              <Td fontWeight="semibold">{floor.floorNumber}</Td>
                              <Td>{floor.floorName}</Td>
                              <Td>{floor.totalRooms}</Td>
                              <Td>
                                <Badge colorScheme={floor.isAvailable ? 'green' : 'red'}>
                                  {floor.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                                </Badge>
                              </Td>
                              <Td>
                                <Text fontSize="sm" color="gray.600">
                                  {floor.description || '-'}
                                </Text>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        Belum ada lantai yang terdaftar untuk gedung ini.
                      </Alert>
                    )}
                  </TabPanel>

                  {/* Rooms Tab */}
                  <TabPanel px={0}>
                    {loading ? (
                      <Center py={10}>
                        <Spinner size="lg" />
                      </Center>
                    ) : rooms.length > 0 ? (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Kode Ruangan</Th>
                            <Th>Nama</Th>
                            <Th>Lantai</Th>
                            <Th>Klasifikasi</Th>
                            <Th>Kapasitas</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {rooms.map((room) => (
                            <Tr key={room.roomId}>
                              <Td fontWeight="semibold">{room.fullRoomCode}</Td>
                              <Td>{room.name}</Td>
                              <Td>{room.floorNumber}</Td>
                              <Td>
                                <Badge colorScheme={getClassificationBadge(room.classification)}>
                                  {room.classification}
                                </Badge>
                              </Td>
                              <Td>{room.capacity}</Td>
                              <Td>
                                <Badge colorScheme={room.isAvailable ? 'green' : 'red'}>
                                  {room.isAvailable ? 'Tersedia' : 'Terisi'}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        Belum ada ruangan yang terdaftar untuk gedung ini.
                      </Alert>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuildingDetailModal;
