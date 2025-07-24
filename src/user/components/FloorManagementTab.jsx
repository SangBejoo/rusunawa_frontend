import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Tooltip,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  Card,
  CardBody,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiLayers,
  FiBuilding,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
} from 'react-icons/fi';
import buildingService from '../../services/buildingService';
import FloorCreateModal from '../modals/FloorCreateModal';
import ConfirmationModal from '../modals/ConfirmationModal';

const FloorManagementTab = ({ buildings = [] }) => {
  const [floors, setFloors] = useState([]);
  const [filteredFloors, setFilteredFloors] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('floorNumber');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [deletingFloor, setDeletingFloor] = useState(null);
  const [floorStats, setFloorStats] = useState({});

  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const toast = useToast();

  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0].buildingId);
    }
  }, [buildings]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloors();
      fetchFloorStats();
    } else {
      setFloors([]);
      setFloorStats({});
    }
  }, [selectedBuilding]);

  useEffect(() => {
    filterAndSortFloors();
  }, [floors, searchTerm, sortBy, statusFilter]);

  const fetchFloors = async () => {
    if (!selectedBuilding) return;

    setLoading(true);
    try {
      const response = await buildingService.getFloorsByBuilding(selectedBuilding);
      setFloors(response.floors || []);
    } catch (error) {
      console.error('Failed to fetch floors:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data lantai',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFloorStats = async () => {
    if (!selectedBuilding) return;

    try {
      const response = await buildingService.getBuildingStats(selectedBuilding);
      const stats = response.stats?.[0] || {};
      setFloorStats(stats);
    } catch (error) {
      console.error('Failed to fetch floor stats:', error);
    }
  };

  const filterAndSortFloors = () => {
    let filtered = [...floors];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(floor =>
        floor.floorName.toLowerCase().includes(searchLower) ||
        floor.floorNumber.toString().includes(searchLower) ||
        (floor.description && floor.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(floor => {
        if (statusFilter === 'available') return floor.isAvailable;
        if (statusFilter === 'unavailable') return !floor.isAvailable;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'floorNumber':
          return a.floorNumber - b.floorNumber;
        case 'floorName':
          return a.floorName.localeCompare(b.floorName);
        case 'totalRooms':
          return (b.totalRooms || 0) - (a.totalRooms || 0);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredFloors(filtered);
  };

  const handleCreateFloor = () => {
    setEditingFloor(null);
    onCreateModalOpen();
  };

  const handleEditFloor = (floor) => {
    setEditingFloor(floor);
    onCreateModalOpen();
  };

  const handleDeleteFloor = (floor) => {
    setDeletingFloor(floor);
    onDeleteModalOpen();
  };

  const confirmDelete = async () => {
    if (!deletingFloor) return;

    try {
      await buildingService.deleteFloor(deletingFloor.floorId);
      toast({
        title: 'Berhasil',
        description: `Lantai ${deletingFloor.floorNumber} berhasil dihapus`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchFloors();
      fetchFloorStats();
    } catch (error) {
      console.error('Failed to delete floor:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal menghapus lantai',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteModalClose();
      setDeletingFloor(null);
    }
  };

  const handleFloorSaved = () => {
    fetchFloors();
    fetchFloorStats();
    toast({
      title: 'Berhasil',
      description: editingFloor ? 'Lantai berhasil diperbarui' : 'Lantai berhasil ditambahkan',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const selectedBuildingData = buildings.find(b => b.buildingId === selectedBuilding);

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold">
              Manajemen Lantai
            </Text>
            <Text color="gray.600">
              Kelola lantai dalam gedung rusunawa
            </Text>
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleCreateFloor}
            isDisabled={!selectedBuilding}
          >
            Tambah Lantai
          </Button>
        </Flex>

        {/* Building Selection */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <FiBuilding />
                <Text fontWeight="semibold">Pilih Gedung</Text>
              </HStack>
              
              <Select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                placeholder="Pilih gedung untuk melihat lantai"
              >
                {buildings.map((building) => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingCode} - {building.buildingName}
                  </option>
                ))}
              </Select>

              {selectedBuildingData && (
                <Alert status="info" variant="left-accent">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold">
                      {selectedBuildingData.buildingName}
                    </Text>
                    <HStack spacing={4} fontSize="sm">
                      <Text>Kode: {selectedBuildingData.buildingCode}</Text>
                      <Text>Total Lantai: {selectedBuildingData.totalFloors}</Text>
                      <Badge colorScheme={selectedBuildingData.isActive ? 'green' : 'red'}>
                        {selectedBuildingData.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </HStack>
                  </VStack>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Statistics */}
        {selectedBuilding && Object.keys(floorStats).length > 0 && (
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            <Stat>
              <StatLabel>Total Lantai</StatLabel>
              <StatNumber>{floors.length}</StatNumber>
              <StatHelpText>Di gedung ini</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Lantai Tersedia</StatLabel>
              <StatNumber color="green.500">
                {floors.filter(f => f.isAvailable).length}
              </StatNumber>
              <StatHelpText>Siap digunakan</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Total Ruangan</StatLabel>
              <StatNumber color="blue.500">{floorStats.totalRooms || 0}</StatNumber>
              <StatHelpText>Di semua lantai</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Lantai Tertinggi</StatLabel>
              <StatNumber>{Math.max(...floors.map(f => f.floorNumber), 0)}</StatNumber>
              <StatHelpText>Nomor lantai maksimal</StatHelpText>
            </Stat>
          </Grid>
        )}

        {/* Filters and Search */}
        {selectedBuilding && (
          <Card>
            <CardBody>
              <HStack spacing={4} wrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Cari lantai..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Select
                  maxW="200px"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="floorNumber">Urutkan: Nomor Lantai</option>
                  <option value="floorName">Urutkan: Nama</option>
                  <option value="totalRooms">Urutkan: Jumlah Ruangan</option>
                  <option value="createdAt">Urutkan: Terbaru</option>
                </Select>

                <Select
                  maxW="200px"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="available">Tersedia</option>
                  <option value="unavailable">Tidak Tersedia</option>
                </Select>

                <Spacer />

                <HStack>
                  <FiFilter />
                  <Text fontSize="sm" color="gray.600">
                    {filteredFloors.length} dari {floors.length} lantai
                  </Text>
                </HStack>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Floors Table */}
        {selectedBuilding && (
          <Card>
            <CardBody p={0}>
              {loading ? (
                <Center py={10}>
                  <Spinner size="lg" />
                </Center>
              ) : filteredFloors.length > 0 ? (
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Lantai</Th>
                      <Th>Nama Lantai</Th>
                      <Th isNumeric>Total Ruangan</Th>
                      <Th>Status</Th>
                      <Th>Deskripsi</Th>
                      <Th>Dibuat</Th>
                      <Th width="100px">Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredFloors.map((floor) => (
                      <Tr key={floor.floorId} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <HStack>
                            <FiLayers />
                            <Text fontWeight="semibold">{floor.floorNumber}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text>{floor.floorName}</Text>
                        </Td>
                        <Td isNumeric>
                          <HStack justify="flex-end">
                            <FiHome />
                            <Text>{floor.totalRooms || 0}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={floor.isAvailable ? 'green' : 'red'}
                            variant="subtle"
                            display="flex"
                            alignItems="center"
                            gap={1}
                            w="fit-content"
                          >
                            {floor.isAvailable ? <FiCheckCircle /> : <FiXCircle />}
                            {floor.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            noOfLines={2}
                            maxW="200px"
                          >
                            {floor.description || '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(floor.createdAt).toLocaleDateString('id-ID')}
                          </Text>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<FiEdit2 />}
                                onClick={() => handleEditFloor(floor)}
                              >
                                Edit Lantai
                              </MenuItem>
                              <MenuItem
                                icon={<FiTrash2 />}
                                onClick={() => handleDeleteFloor(floor)}
                                color="red.600"
                                isDisabled={floor.totalRooms > 0}
                              >
                                Hapus Lantai
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : floors.length === 0 ? (
                <Center py={10}>
                  <VStack spacing={3}>
                    <FiLayers size={48} color="gray.400" />
                    <Text color="gray.600">Belum ada lantai untuk gedung ini</Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={handleCreateFloor}
                    >
                      Tambah Lantai Pertama
                    </Button>
                  </VStack>
                </Center>
              ) : (
                <Center py={10}>
                  <VStack spacing={3}>
                    <FiSearch size={48} color="gray.400" />
                    <Text color="gray.600">Tidak ada lantai yang sesuai dengan filter</Text>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Reset Filter
                    </Button>
                  </VStack>
                </Center>
              )}
            </CardBody>
          </Card>
        )}

        {!selectedBuilding && buildings.length > 0 && (
          <Alert status="info">
            <AlertIcon />
            Pilih gedung untuk melihat dan mengelola lantai
          </Alert>
        )}

        {buildings.length === 0 && (
          <Alert status="warning">
            <AlertIcon />
            Belum ada gedung yang tersedia. Tambahkan gedung terlebih dahulu untuk mengelola lantai.
          </Alert>
        )}
      </VStack>

      {/* Modals */}
      <FloorCreateModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        onSave={handleFloorSaved}
        editingFloor={editingFloor}
        buildings={buildings}
        selectedBuildingId={selectedBuilding}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        onConfirm={confirmDelete}
        title="Hapus Lantai"
        message={
          deletingFloor && (
            <VStack spacing={3} align="start">
              <Text>
                Apakah Anda yakin ingin menghapus lantai <strong>{deletingFloor.floorNumber}</strong> - 
                <strong>{deletingFloor.floorName}</strong>?
              </Text>
              {deletingFloor.totalRooms > 0 && (
                <Alert status="error" size="sm">
                  <AlertIcon />
                  Lantai ini memiliki {deletingFloor.totalRooms} ruangan. Hapus semua ruangan terlebih dahulu.
                </Alert>
              )}
            </VStack>
          )
        }
        confirmText="Hapus"
        confirmColorScheme="red"
        isDestructive
        isDisabled={deletingFloor?.totalRooms > 0}
      />
    </Box>
  );
};

export default FloorManagementTab;
