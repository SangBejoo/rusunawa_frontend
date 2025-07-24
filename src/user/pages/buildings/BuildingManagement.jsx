import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  IconButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiBuilding,
  FiLayers,
  FiMapPin,
  FiUsers,
  FiHome,
  FiSettings,
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { Pagination } from '../../components/common/Pagination';
import buildingService from '../../services/buildingService';
import BuildingCreateModal from '../../components/modals/BuildingCreateModal';
import BuildingDetailModal from '../../components/modals/BuildingDetailModal';
import FloorManagementTab from '../../components/FloorManagementTab';

const BuildingManagement = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingStats, setBuildingStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();

  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [buildingIdToDelete, setBuildingIdToDelete] = useState(null);
  const cancelRef = React.useRef();

  useEffect(() => {
    fetchBuildings();
    fetchBuildingStats();
  }, [pagination.page, pagination.limit, searchTerm, genderFilter, activeFilter]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await buildingService.getBuildings({
        page: pagination.page,
        limit: pagination.limit,
        genderType: genderFilter,
        isActive: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
        search: searchTerm
      });

      setBuildings(response.buildings || []);
      setPagination(prev => ({
        ...prev,
        total: response.totalCount || 0,
        totalPages: Math.ceil((response.totalCount || 0) / prev.limit)
      }));
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch buildings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildingStats = async () => {
    try {
      const response = await buildingService.getBuildingStats();
      setBuildingStats(response.stats || []);
    } catch (error) {
      console.error('Failed to fetch building stats:', error);
    }
  };

  const handleViewBuilding = async (buildingId) => {
    try {
      const building = await buildingService.getBuildingById(buildingId);
      setSelectedBuilding(building);
      onDetailOpen();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch building details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteBuilding = async () => {
    try {
      await buildingService.deleteBuilding(buildingIdToDelete);
      toast({
        title: '🗑️ Gedung Dihapus Permanen',
        description: 'Gedung telah berhasil dihapus secara permanen dari sistem',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      fetchBuildings();
      fetchBuildingStats();
    } catch (error) {
      console.error('Error deleting building:', error);
      
      // Extract detailed error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete building';
      
      // Check if it's a validation error (building has rooms/floors)
      const isValidationError = errorMessage.includes('has') && (errorMessage.includes('rooms') || errorMessage.includes('floors'));
      
      toast({
        title: isValidationError ? '⚠️ Tidak Dapat Menghapus Gedung' : '❌ Gagal Menghapus Gedung',
        description: isValidationError 
          ? `${errorMessage}. Hapus semua ruangan dan lantai terlebih dahulu.`
          : errorMessage,
        status: 'error',
        duration: isValidationError ? 6000 : 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setBuildingIdToDelete(null);
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

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = !searchTerm || 
      building.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.buildingCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = !genderFilter || building.genderType === genderFilter;
    const matchesActive = !activeFilter || 
      (activeFilter === 'active' && building.isActive) ||
      (activeFilter === 'inactive' && !building.isActive);
    
    return matchesSearch && matchesGender && matchesActive;
  });

  const computeOverallStats = () => {
    return buildingStats.reduce((acc, stat) => ({
      totalBuildings: buildingStats.length,
      totalRooms: acc.totalRooms + (stat.totalRooms || 0),
      totalCapacity: acc.totalCapacity + (stat.totalCapacity || 0),
      availableRooms: acc.availableRooms + (stat.availableRooms || 0),
      occupiedRooms: acc.occupiedRooms + (stat.occupiedRooms || 0),
    }), {
      totalBuildings: 0,
      totalRooms: 0,
      totalCapacity: 0,
      availableRooms: 0,
      occupiedRooms: 0,
    });
  };

  const overallStats = computeOverallStats();
  const occupancyRate = overallStats.totalRooms > 0 
    ? (overallStats.occupiedRooms / overallStats.totalRooms * 100).toFixed(1)
    : 0;

  return (
    <AdminLayout>
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              Manajemen Gedung & Lantai
            </Text>
            <Text color="gray.600">
              Kelola gedung, lantai, dan organisasi ruangan
            </Text>
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Tambah Gedung
          </Button>
        </Flex>

        {/* Overall Statistics */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Gedung</StatLabel>
                <StatNumber>{overallStats.totalBuildings}</StatNumber>
                <StatHelpText>Aktif: {buildings.filter(b => b.isActive).length}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Ruangan</StatLabel>
                <StatNumber>{overallStats.totalRooms}</StatNumber>
                <StatHelpText>Tersedia: {overallStats.availableRooms}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tingkat Okupansi</StatLabel>
                <StatNumber>{occupancyRate}%</StatNumber>
                <Progress 
                  value={occupancyRate} 
                  size="sm" 
                  colorScheme="blue" 
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Kapasitas</StatLabel>
                <StatNumber>{overallStats.totalCapacity}</StatNumber>
                <StatHelpText>Orang</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>
              <HStack>
                <FiBuilding />
                <Text>Gedung</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FiLayers />
                <Text>Lantai</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Buildings Tab */}
            <TabPanel px={0}>
              {/* Filters and Search */}
              <Flex gap={4} mb={6} wrap="wrap">
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Cari gedung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="Filter Gender"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  maxW="200px"
                >
                  <option value="perempuan">Perempuan</option>
                  <option value="laki_laki">Laki-laki</option>
                  <option value="mixed">Campuran</option>
                </Select>

                <Select
                  placeholder="Filter Status"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  maxW="200px"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </Select>
              </Flex>

              {/* Buildings Table */}
              {loading ? (
                <Center py={10}>
                  <Spinner size="lg" />
                </Center>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Kode Gedung</Th>
                        <Th>Nama Gedung</Th>
                        <Th>Gender</Th>
                        <Th>Lantai</Th>
                        <Th>Ruangan</Th>
                        <Th>Kapasitas</Th>
                        <Th>Okupansi</Th>
                        <Th>Status</Th>
                        <Th>Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredBuildings.map((building) => {
                        const buildingStat = buildingStats.find(s => s.buildingId === building.buildingId);
                        const buildingOccupancy = buildingStat?.totalRooms > 0 
                          ? ((buildingStat.occupiedRooms / buildingStat.totalRooms) * 100).toFixed(1)
                          : 0;

                        return (
                          <Tr key={building.buildingId}>
                            <Td fontWeight="semibold">{building.buildingCode}</Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{building.buildingName}</Text>
                                {building.address && (
                                  <Text fontSize="sm" color="gray.500">
                                    <FiMapPin style={{ display: 'inline', marginRight: '4px' }} />
                                    {building.address}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={getBadgeColor(building.genderType)}>
                                {getGenderLabel(building.genderType)}
                              </Badge>
                            </Td>
                            <Td>{building.totalFloors}</Td>
                            <Td>{buildingStat?.totalRooms || 0}</Td>
                            <Td>{buildingStat?.totalCapacity || 0}</Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm">{buildingOccupancy}%</Text>
                                <Progress 
                                  value={buildingOccupancy} 
                                  size="sm" 
                                  colorScheme="blue" 
                                  w="60px"
                                />
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={building.isActive ? 'green' : 'red'}>
                                {building.isActive ? 'Aktif' : 'Nonaktif'}
                              </Badge>
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
                                    icon={<FiEye />}
                                    onClick={() => handleViewBuilding(building.buildingId)}
                                  >
                                    Lihat Detail
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FiEdit />}
                                    onClick={() => {
                                      setSelectedBuilding(building);
                                      onCreateOpen();
                                    }}
                                  >
                                    Edit
                                  </MenuItem>
                                  <Divider />
                                  <MenuItem
                                    icon={<FiTrash2 />}
                                    color="red.500"
                                    onClick={() => {
                                      setBuildingIdToDelete(building.buildingId);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    Hapus
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>

                  {filteredBuildings.length === 0 && (
                    <Center py={10}>
                      <VStack>
                        <FiBuilding size={48} color="gray.300" />
                        <Text color="gray.500">Tidak ada gedung ditemukan</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>
              )}

              {/* Pagination */}
              {filteredBuildings.length > 0 && (
                <Flex justify="center" mt={6}>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </Flex>
              )}
            </TabPanel>

            {/* Floors Tab */}
            <TabPanel px={0}>
              <FloorManagementTab buildings={buildings} />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Modals */}
        <BuildingCreateModal
          isOpen={isCreateOpen}
          onClose={() => {
            onCreateClose();
            setSelectedBuilding(null);
          }}
          building={selectedBuilding}
          onSuccess={() => {
            fetchBuildings();
            fetchBuildingStats();
          }}
        />

        <BuildingDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          building={selectedBuilding}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteDialogOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.600">
                🗑️ Hapus Gedung Permanen
              </AlertDialogHeader>
              <AlertDialogBody>
                <VStack spacing={4} align="stretch">
                  <Text>
                    Apakah Anda yakin ingin <Text as="span" fontWeight="bold" color="red.500">menghapus permanen</Text> gedung ini?
                  </Text>
                  <Box p={4} bg="red.50" borderRadius="md" borderLeft="4px" borderColor="red.500">
                    <VStack spacing={2} align="start">
                      <Text fontSize="sm" fontWeight="medium" color="red.700">
                        ⚠️ Peringatan: Aksi Permanen
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        • Gedung akan dihapus secara permanen dari database
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        • Aksi ini TIDAK DAPAT dibatalkan
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        • Gedung harus kosong (tanpa ruangan dan lantai) untuk bisa dihapus
                      </Text>
                    </VStack>
                  </Box>
                  <Text fontSize="sm" color="gray.600">
                    Pastikan semua ruangan dan lantai telah dipindahkan atau dihapus terlebih dahulu.
                  </Text>
                </VStack>
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                  Batal
                </Button>
                <Button colorScheme="red" onClick={handleDeleteBuilding} ml={3}>
                  Hapus Permanen
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </AdminLayout>
  );
};

export default BuildingManagement;
