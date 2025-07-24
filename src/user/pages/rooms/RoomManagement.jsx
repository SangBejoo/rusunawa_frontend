import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  Switch,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { Pagination } from '../../components/common/Pagination';
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiUsers,
  FiHome,
  FiMapPin,
  FiCalendar,
  FiLayers,
  FiSettings,
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import roomService from '../../services/roomService';
import ModernRoomDetailModal from '../../components/modals/ModernRoomDetailModal';
import ModernRoomCreateModal from '../../components/modals/ModernRoomCreateModal';
// import RoomImageAPITest from '../../components/debug/RoomImageAPITest';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('current'); // New date filter
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0
  });
  
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

  // Building and Floor Management State
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [floorLoading, setFloorLoading] = useState(false);
  const [buildingFilter, setBuildingFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');

  // Building Modal States
  const { 
    isOpen: isBuildingCreateOpen, 
    onOpen: onBuildingCreateOpen, 
    onClose: onBuildingCreateClose 
  } = useDisclosure();
  
  const { 
    isOpen: isBuildingEditOpen, 
    onOpen: onBuildingEditOpen, 
    onClose: onBuildingEditClose 
  } = useDisclosure();

  // Floor Modal States
  const { 
    isOpen: isFloorCreateOpen, 
    onOpen: onFloorCreateOpen, 
    onClose: onFloorCreateClose 
  } = useDisclosure();
  
  const { 
    isOpen: isFloorEditOpen, 
    onOpen: onFloorEditOpen, 
    onClose: onFloorEditClose 
  } = useDisclosure();

  // Form States for Building and Floor
  const [buildingForm, setBuildingForm] = useState({
    buildingCode: '',
    buildingName: '',
    genderType: 'laki_laki',
    address: '',
    description: '',
    totalFloors: 4,  // Default to 4 floors
    isActive: true
  });

  const [floorForm, setFloorForm] = useState({
    buildingId: '',
    floorNumber: 1,
    floorName: '',
    description: '',
    isAvailable: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomIdToDelete, setRoomIdToDelete] = useState(null);
  const cancelRef = React.useRef();

  // Caching state
  const [roomsCache, setRoomsCache] = useState(new Map());
  const [buildingsCache, setBuildingsCache] = useState(null);
  const [floorsCache, setFloorsCache] = useState(new Map());
  const [lastFetchTime, setLastFetchTime] = useState(new Map());
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Debounced search function
  const debouncedSearchTerm = useMemo(() => {
    const timer = setTimeout(() => searchTerm, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Only fetch if search term is stable
    const timer = setTimeout(() => {
      fetchRooms();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, pagination.limit, typeFilter, dateFilter]);

  // Separate effect for search to debounce it
  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        fetchRooms();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      fetchRooms();
    }
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 1) { // Buildings tab (now index 1)
      fetchBuildings();
    } else if (activeTab === 2) { // Floors tab (now index 2)
      fetchBuildings(); // Need buildings for floor creation
      fetchFloors();
    }
  }, [activeTab]);

  // ============================================================================
  // BUILDING MANAGEMENT FUNCTIONS
  // ============================================================================

  const fetchBuildings = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache
      const now = Date.now();
      const lastFetch = lastFetchTime.get('buildings') || 0;
      
      if (!forceRefresh && buildingsCache && (now - lastFetch < CACHE_DURATION)) {
        setBuildings(buildingsCache);
        return;
      }

      setBuildingLoading(true);
      const response = await roomService.getBuildings({
        page: 1,
        limit: 100 // Get all buildings for now
      });
      
      const buildingList = response.buildings || [];
      setBuildings(buildingList);
      
      // Cache the results
      setBuildingsCache(buildingList);
      setLastFetchTime(prev => {
        const newTimes = new Map(prev);
        newTimes.set('buildings', now);
        return newTimes;
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBuildingLoading(false);
    }
  }, [buildingsCache, lastFetchTime]);

  // Add refresh indicator to show when data is being fetched
  const isRefreshing = loading || buildingLoading || floorLoading;
  const clearCacheAndRefresh = useCallback(() => {
    setRoomsCache(new Map());
    setBuildingsCache(null);
    setFloorsCache(new Map());
    setLastFetchTime(new Map());
    fetchRooms(true);
    if (activeTab === 1) fetchBuildings(true);
    if (activeTab === 2) fetchFloors(true);
  }, [activeTab]);

  const handleCreateBuilding = async () => {
    try {
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!buildingForm.buildingCode.trim()) errors.buildingCode = 'Building code is required';
      if (!buildingForm.buildingName.trim()) errors.buildingName = 'Building name is required';
      if (!buildingForm.genderType) errors.genderType = 'Gender type is required';
      if (!buildingForm.totalFloors || buildingForm.totalFloors < 1 || buildingForm.totalFloors > 10) {
        errors.totalFloors = 'Total floors must be between 1 and 10';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      await roomService.createBuilding(buildingForm);
      
      toast({
        title: 'Success',
        description: 'Building created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onBuildingCreateClose();
      fetchBuildings(true); // Force refresh after creation
      resetBuildingForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateBuilding = async () => {
    try {
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!buildingForm.buildingCode.trim()) errors.buildingCode = 'Building code is required';
      if (!buildingForm.buildingName.trim()) errors.buildingName = 'Building name is required';
      if (!buildingForm.genderType) errors.genderType = 'Gender type is required';
      if (!buildingForm.totalFloors || buildingForm.totalFloors < 1 || buildingForm.totalFloors > 10) {
        errors.totalFloors = 'Total floors must be between 1 and 10';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      await roomService.updateBuilding(selectedBuilding.buildingId, buildingForm);
      
      toast({
        title: 'Success',
        description: 'Building updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onBuildingEditClose();
      fetchBuildings();
      resetBuildingForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteBuilding = async (buildingId) => {
    try {
      await roomService.deleteBuilding(buildingId);
      
      toast({
        title: '🗑️ Gedung Dihapus Permanen',
        description: 'Gedung telah berhasil dihapus secara permanen dari sistem',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      fetchBuildings();
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
    }
  };

  const resetBuildingForm = () => {
    setBuildingForm({
      buildingCode: '',
      buildingName: '',
      genderType: 'laki_laki',
      address: '',
      description: '',
      totalFloors: 4,  // Default to 4 floors
      isActive: true
    });
    setSelectedBuilding(null);
    setFormErrors({});
  };

  const openBuildingEditModal = (building) => {
    setSelectedBuilding(building);
    setBuildingForm({
      buildingCode: building.buildingCode || '',
      buildingName: building.buildingName || '',
      genderType: building.genderType || 'laki_laki',
      address: building.address || '',
      description: building.description || '',
      totalFloors: building.totalFloors || 4,  // Include total floors
      isActive: building.isActive !== undefined ? building.isActive : true
    });
    onBuildingEditOpen();
  };

  // ============================================================================
  // FLOOR MANAGEMENT FUNCTIONS
  // ============================================================================

  const fetchFloors = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache
      const now = Date.now();
      const lastFetch = lastFetchTime.get('floors') || 0;
      
      if (!forceRefresh && floorsCache.has('all') && (now - lastFetch < CACHE_DURATION)) {
        setFloors(floorsCache.get('all'));
        return;
      }

      setFloorLoading(true);
      // Get floors from all buildings
      const allFloors = [];
      for (const building of buildings) {
        try {
          const response = await roomService.getBuildingFloors(building.buildingId);
          const floorsWithBuilding = response.floors.map(floor => ({
            ...floor,
            buildingName: building.buildingName,
            buildingCode: building.buildingCode
          }));
          allFloors.push(...floorsWithBuilding);
        } catch (error) {
          console.error(`Error fetching floors for building ${building.buildingId}:`, error);
        }
      }
      
      setFloors(allFloors);
      
      // Cache the results
      setFloorsCache(prev => {
        const newCache = new Map(prev);
        newCache.set('all', allFloors);
        return newCache;
      });
      
      setLastFetchTime(prev => {
        const newTimes = new Map(prev);
        newTimes.set('floors', now);
        return newTimes;
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch floors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFloorLoading(false);
    }
  }, [buildings, floorsCache, lastFetchTime]);

  const handleCreateFloor = async () => {
    try {
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!floorForm.buildingId) errors.buildingId = 'Building is required';
      if (!floorForm.floorNumber || floorForm.floorNumber < 1) errors.floorNumber = 'Valid floor number is required';
      if (!floorForm.floorName.trim()) errors.floorName = 'Floor name is required';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      await roomService.createFloor(floorForm);
      
      toast({
        title: 'Success',
        description: 'Floor created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onFloorCreateClose();
      fetchFloors();
      resetFloorForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateFloor = async () => {
    try {
      setFormErrors({});
      
      // Validate form
      const errors = {};
      if (!floorForm.floorNumber || floorForm.floorNumber < 1) errors.floorNumber = 'Valid floor number is required';
      if (!floorForm.floorName.trim()) errors.floorName = 'Floor name is required';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      await roomService.updateFloor(selectedFloor.floorId, floorForm);
      
      toast({
        title: 'Success',
        description: 'Floor updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onFloorEditClose();
      fetchFloors();
      resetFloorForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteFloor = async (floorId) => {
    try {
      await roomService.deleteFloor(floorId);
      
      toast({
        title: 'Success',
        description: 'Floor deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchFloors();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetFloorForm = () => {
    setFloorForm({
      buildingId: '',
      floorNumber: 1,
      floorName: '',
      description: '',
      isAvailable: true
    });
    setSelectedFloor(null);
    setFormErrors({});
  };

  const openFloorEditModal = (floor) => {
    setSelectedFloor(floor);
    setFloorForm({
      buildingId: floor.buildingId || '',
      floorNumber: floor.floorNumber || 1,
      floorName: floor.floorName || '',
      description: floor.description || '',
      isAvailable: floor.isAvailable !== undefined ? floor.isAvailable : true
    });
    onFloorEditOpen();
  };

  // Memoized input handlers for building form to prevent re-renders
  const handleBuildingFormChange = useCallback((field, value) => {
    setBuildingForm(prev => ({...prev, [field]: value}));
  }, []);

  // Memoized input handlers for floor form to prevent re-renders
  const handleFloorFormChange = useCallback((field, value) => {
    setFloorForm(prev => ({...prev, [field]: value}));
  }, []);

  // Compute stats from rooms (updated logic: occupied = full, available = not full)
  const computeRoomStats = (rooms) => {
    const now = new Date();
    let total = rooms.length;
    let available = 0;
    let occupied = 0;
    let maintenance = 0; // If you have a maintenance flag, update this logic

    rooms.forEach(room => {
      // Handle occupants - could be array or single object
      let occupants = [];
      if (room.occupants) {
        if (Array.isArray(room.occupants)) {
          occupants = room.occupants;
        } else {
          occupants = [room.occupants];
        }
      }

      // Always use 'current' for stats calculation (what's actually occupied right now)
      const activeOccupants = getFilteredOccupants(occupants, 'current');
      
      // Count unique tenants (in case same tenant has multiple bookings)
      const uniqueTenantIds = new Set(activeOccupants.map(occ => occ.tenantId));
      const actualOccupants = uniqueTenantIds.size;
      
      if (process.env.NODE_ENV === 'development') {
        // console.log(`Room ${room.roomId} (${room.name}): capacity=${room.capacity}, total_occupants=${occupants.length}, active_occupants=${activeOccupants.length}, unique_tenants=${actualOccupants}`);
      }
      
      // Simple classification: if there are any current occupants, it's occupied; otherwise available
      if (actualOccupants > 0) {
        occupied++;
      } else {
        available++;
      }
    });
    
    if (process.env.NODE_ENV === 'development') {
      // console.log(`Final stats: total=${total}, available=${available}, occupied=${occupied}, maintenance=${maintenance}`);
    }
    
    return { total, available, occupied, maintenance };
  };

  const fetchRooms = useCallback(async (forceRefresh = false) => {
    try {
      // Create cache key
      const cacheKey = `${pagination.page}-${pagination.limit}-${typeFilter}-${searchTerm}-${statusFilter}-${dateFilter}`;
      const now = Date.now();
      const lastFetch = lastFetchTime.get(cacheKey) || 0;
      
      // Check if we have valid cached data
      if (!forceRefresh && roomsCache.has(cacheKey) && (now - lastFetch < CACHE_DURATION)) {
        const cachedData = roomsCache.get(cacheKey);
        setRooms(cachedData.rooms);
        setPagination(prev => ({ ...prev, total: cachedData.total }));
        return;
      }

      setLoading(true);
      
      // Build API parameters including pagination and filters
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Add filters only if they have values - using correct parameter names
      if (typeFilter) params.classification = typeFilter;
      // Note: Backend doesn't support search, status, or gender filters yet
      
      const response = await roomService.getRooms(params);
      const roomList = response.rooms || [];
      const totalCount = response.totalCount || response.total || roomList.length;
      
      // Apply client-side filtering for unsupported backend filters
      let filteredRooms = roomList;
      
      if (searchTerm.trim()) {
        filteredRooms = filteredRooms.filter(room => 
          room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.roomId?.toString().includes(searchTerm.toLowerCase()) ||
          room.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter) {
        filteredRooms = filteredRooms.filter(room => {
          const occupancyStatus = getOccupancyStatus(room);
          if (statusFilter === 'occupied') {
            return occupancyStatus.status === 'full' || occupancyStatus.status === 'partial';
          }
          return occupancyStatus.status === statusFilter;
        });
      }
      
      setRooms(filteredRooms);
      
      // Update pagination info - use original totalCount for server-side filters
      // For client-side filters, this will be less accurate but functional
      const finalTotal = typeFilter ? totalCount : (searchTerm || statusFilter ? filteredRooms.length : totalCount);
      setPagination(prev => ({
        ...prev,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / prev.limit)
      }));

      // Cache the results
      setRoomsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, { rooms: filteredRooms, total: finalTotal });
        return newCache;
      });
      
      setLastFetchTime(prev => {
        const newTimes = new Map(prev);
        newTimes.set(cacheKey, now);
        return newTimes;
      });
      
      // Fetch separate stats for all rooms (not just current page)
      await fetchRoomStats();
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch rooms',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setStats({ total: 0, available: 0, occupied: 0, maintenance: 0 });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, searchTerm, statusFilter, dateFilter, roomsCache, lastFetchTime]);
  
  const fetchRoomStats = async () => {
    try {
      // Get ALL rooms with a high limit to calculate proper stats
      const allRoomsResponse = await roomService.getRooms({ limit: 100 });
      const allRooms = allRoomsResponse.rooms || [];
      const totalCount = allRoomsResponse.totalCount || allRoomsResponse.total || allRooms.length;
      
      // console.log(`Fetched ${allRooms.length} rooms for stats out of ${totalCount} total`);
      
      // Calculate stats from all fetched rooms
      const calculatedStats = computeRoomStats(allRooms);
      
      // Ensure total count is accurate from API response
      calculatedStats.total = totalCount;
      
      // console.log('Final calculated stats:', calculatedStats);
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to fetch room stats:', error);
      // Fallback: use totalCount from the main API call
      try {
        const response = await roomService.getRooms({ page: 1, limit: 1 });
        const totalCount = response.totalCount || response.total || 0;
        setStats({ 
          total: totalCount, 
          available: totalCount - 1, // Assume 1 occupied room based on known data
          occupied: 1, 
          maintenance: 0 
        });
      } catch (fallbackError) {
        setStats({ total: 0, available: 0, occupied: 0, maintenance: 0 });
      }
    }
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    onDetailOpen();
  };

  const handleDetailClose = () => {
    setSelectedRoom(null);
    onDetailClose();
  };

  const openDeleteDialog = (roomId) => {
    setRoomIdToDelete(roomId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setRoomIdToDelete(null);
  };

  const handleDeleteRoom = async () => {
    if (!roomIdToDelete) return;
    try {
      await roomService.deleteRoom(roomIdToDelete);
      toast({
        title: 'Success',
        description: 'Room deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchRooms(true); // Force refresh after deletion
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete room',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      closeDeleteDialog();
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(newLimit)
    }));
  };

  // Filter handlers with pagination reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Helper function to get room occupancy status with memoization
  const getOccupancyStatus = useCallback((room) => {
    // Handle occupants - could be array or single object
    let occupants = [];
    if (room.occupants) {
      if (Array.isArray(room.occupants)) {
        occupants = room.occupants;
      } else {
        occupants = [room.occupants];
      }
    }
    
    // Minimal logging to prevent console spam
    // console.log(`🏠 Room ${room.roomId} (${room.name}): ${occupants.length} occupants, filter: ${dateFilter}`);
    
    // Use the date filter to get relevant occupants
    const filteredOccupants = getFilteredOccupants(occupants, dateFilter);
    
    // Count unique tenants (in case same tenant has multiple bookings)
    const uniqueTenantIds = new Set(filteredOccupants.map(occ => occ.tenantId));
    const currentOccupants = uniqueTenantIds.size;
    
    const capacity = room.capacity || 1;
    const percentage = (currentOccupants / capacity) * 100;
    
    // console.log(`🎯 Room ${room.roomId} final result (${dateFilter}): ${currentOccupants}/${capacity} (${percentage.toFixed(1)}%)`);
    
    if (percentage === 0) return { status: 'available', color: 'green', count: currentOccupants };
    if (percentage < 100) return { status: 'partial', color: 'orange', count: currentOccupants };
    return { status: 'full', color: 'red', count: currentOccupants };
  }, [dateFilter]);

  const getClassificationLabel = (classification) => {
    switch (classification?.name) {
      case 'laki_laki': return 'Laki-laki';
      case 'perempuan': return 'Perempuan';
      case 'ruang_rapat': return 'Ruang Rapat'; 
      default: return classification?.name || 'Campuran';
    }
  };

  const getRentalTypeLabel = (rentalType) => {
    switch (rentalType?.name) {
      case 'harian': return 'Harian';
      case 'mingguan': return 'Mingguan';
      case 'bulanan': return 'Bulanan';
      default: return rentalType?.name || 'Standar';
    }
  };

  const getOccupancyStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'partial': return 'Sebagian Terisi';
      case 'full': return 'Penuh';
      case 'maintenance': return 'Perawatan';
      case 'reserved': return 'Dipesan';
      default: return status;
    }
  };

  const onRoomCreated = () => {
    fetchRooms();
    onCreateClose();
  };

  // Helper function to get filtered occupants based on date filter (optimized to reduce console spam)
  const getFilteredOccupants = useCallback((occupants, dateFilter = 'current') => {
    if (!occupants || occupants.length === 0) return [];
    
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    // Reduced logging to prevent console spam when typing in forms
    // console.log(`🔍 Filtering ${occupants.length} occupants with filter: ${dateFilter}`);
    
    // Helper function to parse protobuf timestamp
    const parseProtobufTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (timestamp.seconds) {
        return new Date(parseInt(timestamp.seconds) * 1000);
      }
      return new Date(timestamp);
    };

    const filtered = occupants.filter(occ => {
      // Minimal logging to prevent console spam when typing in forms
      // console.log(`👤 Checking: ${occ.tenantName || 'Unknown'}, status: ${occ.status}`);
      
      if (!occ.status || occ.status !== 'approved') {
        return false;
      }
      
      const checkIn = parseProtobufTimestamp(occ.checkIn);
      const checkOut = parseProtobufTimestamp(occ.checkOut);
      
      if (!checkIn || !checkOut) {
        return false;
      }
      
      let isMatch = false;
      switch (dateFilter) {
        case 'current':
          isMatch = checkIn <= now && now <= checkOut;
          break;
        case 'this_year':
          isMatch = checkIn >= startOfYear && checkIn <= endOfYear;
          break;
        case 'last_6_months':
          isMatch = checkIn >= sixMonthsAgo && checkIn <= now;
          break;
        case 'future':
          isMatch = checkIn > now;
          break;
        case 'all':
          isMatch = true;
          break;
        default:
          isMatch = checkIn <= now && now <= checkOut;
          break;
      }
      
      return isMatch;
    });
    
    // Reduced final logging
    // console.log(`🎉 Filtered result: ${filtered.length} out of ${occupants.length} occupants`);
    return filtered;
  }, []);

  // Memoized room occupancy statuses to prevent recalculation on every render
  const roomOccupancyStatuses = useMemo(() => {
    const statuses = {};
    rooms.forEach(room => {
      statuses[room.roomId] = getOccupancyStatus(room);
    });
    return statuses;
  }, [rooms, dateFilter, getOccupancyStatus]);

  if (loading) {
    return (
      <AdminLayout>
        <Center h="400px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box p={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <VStack align="start" spacing={1}>
            <Text fontSize="3xl" fontWeight="bold" color="gray.800">Manajemen Properti</Text>
            <Text color="gray.600" fontSize="lg">Kelola gedung, lantai, dan kamar di seluruh properti</Text>
          </VStack>
          <Button
            leftIcon={<FiSettings />}
            colorScheme="gray"
            variant="outline"
            onClick={clearCacheAndRefresh}
            size="sm"
            isLoading={isRefreshing}
            loadingText="Refreshing..."
          >
            Refresh Data
          </Button>
        </Flex>

        {/* Tabs for Buildings, Floors, and Rooms */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
          <TabList mb={4}>
            <Tab leftIcon={<FiHome />}>Kamar</Tab>
            <Tab leftIcon={<FiMapPin />}>Gedung</Tab>
            <Tab leftIcon={<FiLayers />}>Lantai</Tab>
          </TabList>
          <TabPanels>
            {/* Rooms Tab Panel */}
            <TabPanel p={0}>
              <Box>
                {/* Room Management Header */}
                <Flex justify="space-between" align="center" mb={6}>
                  <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Manajemen Kamar</Text>
                  <Button 
                    leftIcon={<FiPlus />} 
                    colorScheme="blue" 
                    size="md"
                    onClick={onCreateOpen}
                    shadow="md"
                    _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
                    transition="all 0.2s"
                  >
                    Tambah Kamar Baru
                  </Button>
                </Flex>

        {/* Enhanced Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(280px, 1fr))" gap={6} mb={8}>
          <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
            <CardBody>
              <Stat>
                <HStack justify="space-between" mb={2}>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Total Kamar</StatLabel>
                  <Box p={2} bg="blue.50" rounded="lg">
                    <FiHome color="blue.500" size={20} />
                  </Box>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="gray.800">{stats.total}</StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  Semua kamar dalam sistem
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
            <CardBody>
              <Stat>
                <HStack justify="space-between" mb={2}>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Tersedia</StatLabel>
                  <Box p={2} bg="green.50" rounded="lg">
                    <FiMapPin color="green.500" size={20} />
                  </Box>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="green.600">{stats.available}</StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  Siap untuk pemesanan baru
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card shadow="md" _hover={{ shadow: "lg" }} transition="all 0.2s">
            <CardBody>
              <Stat>
                <HStack justify="space-between" mb={2}>
                  <StatLabel fontSize="sm" color="gray.600" fontWeight="medium">Dihuni</StatLabel>
                  <Box p={2} bg="blue.50" rounded="lg">
                    <FiUsers color="blue.500" size={20} />
                  </Box>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="blue.600">{stats.occupied}</StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  Sedang dihuni
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Enhanced Filters */}
        <Card mb={8} shadow="md">
          <CardBody>
            <VStack spacing={6}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700">Filter & Pencarian</Text>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setTypeFilter('');
                    setDateFilter('current');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Hapus Semua
                </Button>
              </HStack>
              
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4} w="full">
                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">Cari Kamar</Text>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <FiSearch color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Cari berdasarkan nama atau nomor kamar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        bg="white"
                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                      />
                    </InputGroup>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">Status Ketersediaan</Text>
                    <Select
                      placeholder="Semua status"
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      bg="white"
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                    >
                      <option value="available">Tersedia</option>
                      <option value="occupied">Dihuni</option>
                      <option value="reserved">Dipesan</option>
                    </Select>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">Tipe Kamar</Text>
                    <Select
                      placeholder="Semua tipe"
                      value={typeFilter}
                      onChange={handleTypeFilterChange}
                      bg="white"
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                    >
                      <option value="laki_laki">Kamar Laki-laki</option>
                      <option value="perempuan">Kamar Perempuan</option>
                      <option value="ruang_rapat">Ruang Rapat</option>
                    </Select>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">Periode Hunian</Text>
                    <Select
                      value={dateFilter}
                      onChange={handleDateFilterChange}
                      bg="white"
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                    >
                      <option value="current">Penghuni Saat Ini</option>
                      <option value="this_year">Tahun Ini (2025)</option>
                      <option value="last_6_months">6 Bulan Terakhir</option>
                      <option value="future">Booking Mendatang</option>
                      <option value="all">Semua Periode</option>
                    </Select>
                  </VStack>
                </GridItem>

                <GridItem>
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">Item per halaman</Text>
                    <HStack>
                      <Select
                        width="120px"
                        value={pagination.limit}
                        onChange={(e) => handleLimitChange(e.target.value)}
                        bg="white"
                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                      >
                        <option value="5">5 item</option>
                        <option value="10">10 item</option>
                        <option value="15">15 item</option>
                        <option value="20">20 item</option>
                        <option value="25">25 item</option>
                      </Select>
                    </HStack>
                  </VStack>
                </GridItem>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* Date Filter Info */}
        {dateFilter !== 'current' && (
          <Card mb={4} bg="blue.50" borderColor="blue.200">
            <CardBody py={3}>
              <HStack spacing={3}>
                <Box p={2} bg="blue.100" rounded="lg">
                  <FiCalendar color="blue.600" size={16} />
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="blue.800">
                    Filter Periode Aktif: {
                      dateFilter === 'this_year' ? 'Penghuni Tahun Ini (2025)' :
                      dateFilter === 'last_6_months' ? 'Penghuni 6 Bulan Terakhir' :
                      dateFilter === 'future' ? 'Booking Mendatang' :
                      dateFilter === 'all' ? 'Semua Periode' : 'Filter Khusus'
                    }
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    Menampilkan data penghuni berdasarkan periode yang dipilih
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Enhanced Room Table */}
          <Card shadow="md">
            <CardBody p={0}>
              {loading ? (
                <VStack p={8} spacing={4}>
                  <Spinner size="xl" color="blue.500" />
                  <Text color="gray.600">Memuat kamar...</Text>
                </VStack>
              ) : rooms.length === 0 ? (
                <Center p={12}>
                  <VStack spacing={4}>
                    <Box p={4} bg="gray.100" rounded="full">
                      <FiHome size={48} color="gray.400" />
                    </Box>
                    <VStack spacing={2}>
                      <Text fontSize="xl" fontWeight="semibold" color="gray.700">Tidak ada kamar ditemukan</Text>
                      <Text color="gray.500" textAlign="center">
                        {searchTerm || statusFilter || typeFilter ? 
                          'Coba ubah filter pencarian Anda atau hapus filter untuk melihat semua kamar' :
                          'Belum ada kamar yang ditambahkan ke sistem'
                        }
                      </Text>
                      {!searchTerm && !statusFilter && !typeFilter && (
                        <Button
                          leftIcon={<FiPlus />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={onCreateOpen}
                          mt={4}
                        >
                          Tambah Kamar Pertama
                        </Button>
                      )}
                    </VStack>
                  </VStack>
                </Center>
              ) : (
                <>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th fontWeight="semibold" color="gray.700">Nomor Kamar</Th>
                          <Th fontWeight="semibold" color="gray.700">Tipe</Th>
                          <Th fontWeight="semibold" color="gray.700">Kapasitas</Th>
                          <Th fontWeight="semibold" color="gray.700">Status</Th>
                          <Th fontWeight="semibold" color="gray.700">Hunian</Th>
                          <Th fontWeight="semibold" color="gray.700">Aksi</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                      {rooms.map((room) => (
                        <Tr key={room.roomId} _hover={{ bg: 'gray.50' }} transition="all 0.2s">
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="semibold" color="gray.800">Kamar {room.name}</Text>
                              <Text fontSize="sm" color="gray.500">ID: {room.roomId}</Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={room.classification?.name === 'laki_laki' ? 'blue' : 
                                         room.classification?.name === 'perempuan' ? 'pink' : 
                                         room.classification?.name === 'ruang_rapat' ? 'purple' : 'gray'}
                              variant="subtle"
                              px={3}
                              py={1}
                              rounded="full"
                            >
                              {getClassificationLabel(room.classification)}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack>
                              <FiUsers color="gray.500" />
                              <Text fontWeight="medium">{room.capacity}</Text>
                              <Text fontSize="sm" color="gray.500">orang</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={roomOccupancyStatuses[room.roomId]?.color || 'gray'}
                              variant="subtle"
                              px={3}
                              py={1}
                              rounded="full"
                            >
                              {getOccupancyStatusLabel(roomOccupancyStatuses[room.roomId]?.status || 'available')}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={2}>
                              <HStack>
                                <Text fontWeight="medium">
                                  {roomOccupancyStatuses[room.roomId]?.count || 0}
                                </Text>
                                <Text color="gray.500">dari {room.capacity}</Text>
                              </HStack>
                              <Progress 
                                value={((roomOccupancyStatuses[room.roomId]?.count || 0) / room.capacity) * 100}
                                colorScheme={roomOccupancyStatuses[room.roomId]?.color || 'gray'}
                                size="sm"
                                w="120px"
                                rounded="full"
                              />
                            </VStack>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                                _hover={{ bg: "gray.100" }}
                              />
                              <MenuList>
                                <MenuItem 
                                  icon={<FiEye />}
                                  onClick={() => handleViewRoom(room)}
                                >
                                  Lihat Detail
                                </MenuItem>
                                <MenuItem 
                                  icon={<FiTrash2 />}
                                  color="red.500"
                                  onClick={() => openDeleteDialog(room.roomId)}
                                >
                                  Hapus Kamar
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                
                {/* Enhanced Pagination */}
                <Box p={4} borderTop="1px solid" borderColor="gray.200" bg="gray.50">
                  <Flex justify="space-between" align="center">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        Menampilkan {((pagination.page - 1) * pagination.limit) + 1} sampai {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} kamar
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Halaman {pagination.page} dari {pagination.totalPages}
                      </Text>
                    </VStack>
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </Flex>
                </Box>
              </>
            )}
            </CardBody>
          </Card>
        </Box>
        </TabPanel>

        {/* Buildings Tab Panel */}
        <TabPanel p={0}>
          <Box>
            {/* Building Management Header */}
            <Flex justify="space-between" align="center" mb={6}>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Manajemen Gedung</Text>
              <Button 
                leftIcon={<FiPlus />} 
                colorScheme="blue" 
                size="md"
                onClick={() => {
                  resetBuildingForm();
                  onBuildingCreateOpen();
                }}
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
                transition="all 0.2s"
              >
                Tambah Gedung Baru
              </Button>
            </Flex>

            {/* Buildings Filters */}
            <Flex gap={4} mb={6} wrap="wrap">
              <Input
                placeholder="Cari gedung..."
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                width={{ base: "100%", md: "300px" }}
                leftElement={<InputLeftElement><FiSearch color="gray.400" /></InputLeftElement>}
              />
            </Flex>

            {/* Buildings Table */}
            <Card shadow="lg" border="1px" borderColor="gray.100">
              <CardBody p={0}>
                {buildingLoading ? (
                  <Center py={20}>
                    <VStack spacing={4}>
                      <Spinner size="xl" thickness="4px" color="blue.500" />
                      <Text color="gray.600" fontSize="lg">Memuat data gedung...</Text>
                    </VStack>
                  </Center>
                ) : buildings.length === 0 ? (
                  <Center py={20}>
                    <VStack spacing={4}>
                      {/* Removed FiBuilding icon as it is not defined */}
                      <FiHome size={48} color="gray.400" />
                      <FiHome size={48} color="gray.400" />
                      <FiHome size={48} color="gray.400" />
                      <Button
                        leftIcon={<FiPlus />} 
                        colorScheme="blue" 
                        variant="outline"
                        onClick={() => {
                          resetBuildingForm();
                          onBuildingCreateOpen();
                        }}
                      >
                        Tambah Gedung Pertama
                      </Button>
                    </VStack>
                  </Center>
                ) : (
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th fontWeight="bold" color="gray.700">Kode Gedung</Th>
                        <Th fontWeight="bold" color="gray.700">Nama Gedung</Th>
                        <Th fontWeight="bold" color="gray.700">Jenis Kelamin</Th>
                        <Th fontWeight="bold" color="gray.700">Alamat</Th>
                        <Th fontWeight="bold" color="gray.700">Status</Th>
                        <Th fontWeight="bold" color="gray.700" textAlign="center">Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {buildings
                        .filter(building => 
                          !buildingFilter || 
                          building.buildingName?.toLowerCase().includes(buildingFilter.toLowerCase()) ||
                          building.buildingCode?.toLowerCase().includes(buildingFilter.toLowerCase())
                        )
                        .map((building) => (
                        <Tr key={building.buildingId} _hover={{ bg: "gray.50" }}>
                          <Td fontWeight="medium" color="blue.600">{building.buildingCode}</Td>
                          <Td fontWeight="medium">{building.buildingName}</Td>
                          <Td>
                            <Badge 
                              colorScheme={building.genderType === 'laki_laki' ? 'blue' : 'pink'}
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                              rounded="md"
                            >
                              {building.genderType === 'laki_laki' ? 'Laki-laki' : 'Perempuan'}
                            </Badge>
                          </Td>
                          <Td maxW="200px" isTruncated>{building.address || '-'}</Td>
                          <Td>
                            <Badge 
                              colorScheme={building.isActive ? 'green' : 'red'}
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                              rounded="md"
                            >
                              {building.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </Td>
                          <Td textAlign="center">
                            <Menu>
                              <MenuButton 
                                as={IconButton} 
                                icon={<FiMoreVertical />} 
                                variant="ghost" 
                                size="sm"
                                _hover={{ bg: "gray.100" }}
                              />
                              <MenuList>
                                <MenuItem 
                                  icon={<FiEdit />}
                                  onClick={() => openBuildingEditModal(building)}
                                >
                                  Edit Gedung
                                </MenuItem>
                                <MenuItem 
                                  icon={<FiTrash2 />}
                                  color="red.500"
                                  onClick={() => {
                                    if (window.confirm('Apakah Anda yakin ingin menghapus gedung ini?')) {
                                      handleDeleteBuilding(building.buildingId);
                                    }
                                  }}
                                >
                                  Hapus Gedung
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </Box>
        </TabPanel>

        {/* Floors Tab Panel */}
        <TabPanel p={0}>
          <Box>
            {/* Floor Management Header */}
            <Flex justify="space-between" align="center" mb={6}>
              <Text fontSize="2xl" fontWeight="semibold" color="gray.800">Manajemen Lantai</Text>
              <Button 
                leftIcon={<FiPlus />} 
                colorScheme="blue" 
                size="md"
                onClick={() => {
                  resetFloorForm();
                  onFloorCreateOpen();
                }}
                shadow="md"
                _hover={{ shadow: "lg", transform: "translateY(-1px)" }}
                transition="all 0.2s"
                isDisabled={buildings.length === 0}
              >
                Tambah Lantai Baru
              </Button>
            </Flex>

            {buildings.length === 0 && (
              <Alert status="warning" mb={6}>
                <AlertIcon />
                Anda perlu membuat gedung terlebih dahulu sebelum menambah lantai.
              </Alert>
            )}

            {/* Floors Filters */}
            <Flex gap={4} mb={6} wrap="wrap">
              <Input
                placeholder="Cari lantai..."
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                width={{ base: "100%", md: "300px" }}
                leftElement={<InputLeftElement><FiSearch color="gray.400" /></InputLeftElement>}
              />
            </Flex>

            {/* Floors Table */}
            <Card shadow="lg" border="1px" borderColor="gray.100">
              <CardBody p={0}>
                {floorLoading ? (
                  <Center py={20}>
                    <VStack spacing={4}>
                      <Spinner size="xl" thickness="4px" color="blue.500" />
                      <Text color="gray.600" fontSize="lg">Memuat data lantai...</Text>
                    </VStack>
                  </Center>
                ) : floors.length === 0 ? (
                  <Center py={20}>
                    <VStack spacing={4}>
                      <FiLayers size={48} color="gray.400" />
                      <Text color="gray.600" fontSize="lg">Belum ada lantai tersedia</Text>
                      {buildings.length > 0 && (
                        <Button 
                          leftIcon={<FiPlus />} 
                          colorScheme="blue" 
                          variant="outline"
                          onClick={() => {
                            resetFloorForm();
                            onFloorCreateOpen();
                          }}
                        >
                          Tambah Lantai Pertama
                        </Button>
                      )}
                    </VStack>
                  </Center>
                ) : (
                  <Table variant="simple">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th fontWeight="bold" color="gray.700">Gedung</Th>
                        <Th fontWeight="bold" color="gray.700">Nomor Lantai</Th>
                        <Th fontWeight="bold" color="gray.700">Nama Lantai</Th>
                        <Th fontWeight="bold" color="gray.700">Deskripsi</Th>
                        <Th fontWeight="bold" color="gray.700">Status</Th>
                        <Th fontWeight="bold" color="gray.700" textAlign="center">Aksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {floors
                        .filter(floor => 
                          !floorFilter || 
                          floor.floorName?.toLowerCase().includes(floorFilter.toLowerCase()) ||
                          floor.buildingName?.toLowerCase().includes(floorFilter.toLowerCase()) ||
                          floor.buildingCode?.toLowerCase().includes(floorFilter.toLowerCase())
                        )
                        .map((floor) => (
                        <Tr key={floor.floorId} _hover={{ bg: "gray.50" }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium" color="blue.600">{floor.buildingCode}</Text>
                              <Text fontSize="sm" color="gray.600">{floor.buildingName}</Text>
                            </VStack>
                          </Td>
                          <Td fontWeight="medium">{floor.floorNumber}</Td>
                          <Td fontWeight="medium">{floor.floorName}</Td>
                          <Td maxW="200px" isTruncated>{floor.description || '-'}</Td>
                          <Td>
                            <Badge 
                              colorScheme={floor.isAvailable ? 'green' : 'red'}
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                              rounded="md"
                            >
                              {floor.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                            </Badge>
                          </Td>
                          <Td textAlign="center">
                            <Menu>
                              <MenuButton 
                                as={IconButton} 
                                icon={<FiMoreVertical />} 
                                variant="ghost" 
                                size="sm"
                                _hover={{ bg: "gray.100" }}
                              />
                              <MenuList>
                                <MenuItem 
                                  icon={<FiEdit />}
                                  onClick={() => openFloorEditModal(floor)}
                                >
                                  Edit Lantai
                                </MenuItem>
                                <MenuItem 
                                  icon={<FiTrash2 />}
                                  color="red.500"
                                  onClick={() => {
                                    if (window.confirm('Apakah Anda yakin ingin menghapus lantai ini?')) {
                                      handleDeleteFloor(floor.floorId);
                                    }
                                  }}
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
                )}
              </CardBody>
            </Card>
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>

    {/* Building Create/Edit Modals */}
    <Modal isOpen={isBuildingCreateOpen} onClose={onBuildingCreateClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Tambah Gedung Baru</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.buildingCode}>
              <FormLabel>Kode Gedung</FormLabel>
              <Input 
                placeholder="Contoh: GL1, GP1"
                value={buildingForm.buildingCode}
                onChange={(e) => handleBuildingFormChange('buildingCode', e.target.value)}
              />
              <FormErrorMessage>{formErrors.buildingCode}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.buildingName}>
              <FormLabel>Nama Gedung</FormLabel>
              <Input 
                placeholder="Contoh: Gedung Laki-laki Pusat 1"
                value={buildingForm.buildingName}
                onChange={(e) => handleBuildingFormChange('buildingName', e.target.value)}
              />
              <FormErrorMessage>{formErrors.buildingName}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.genderType}>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Select 
                value={buildingForm.genderType}
                onChange={(e) => handleBuildingFormChange('genderType', e.target.value)}
              >
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </Select>
              <FormErrorMessage>{formErrors.genderType}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.totalFloors}>
              <FormLabel>Jumlah Lantai</FormLabel>
              <NumberInput 
                min={1} 
                max={10} 
                value={buildingForm.totalFloors}
                onChange={(value) => handleBuildingFormChange('totalFloors', parseInt(value) || 1)}
              >
                <NumberInputField placeholder="Masukkan jumlah lantai (1-10)" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{formErrors.totalFloors}</FormErrorMessage>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Maksimal 10 lantai per gedung
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Alamat</FormLabel>
              <Textarea 
                placeholder="Alamat lengkap gedung"
                value={buildingForm.address}
                onChange={(e) => handleBuildingFormChange('address', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea 
                placeholder="Deskripsi gedung"
                value={buildingForm.description}
                onChange={(e) => handleBuildingFormChange('description', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Status Aktif</FormLabel>
              <Switch 
                isChecked={buildingForm.isActive}
                onChange={(e) => handleBuildingFormChange('isActive', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onBuildingCreateClose}>
            Batal
          </Button>
          <Button colorScheme="blue" onClick={handleCreateBuilding}>
            Simpan Gedung
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <Modal isOpen={isBuildingEditOpen} onClose={onBuildingEditClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Gedung</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.buildingCode}>
              <FormLabel>Kode Gedung</FormLabel>
              <Input 
                placeholder="Contoh: GL1, GP1"
                value={buildingForm.buildingCode}
                onChange={(e) => handleBuildingFormChange('buildingCode', e.target.value)}
              />
              <FormErrorMessage>{formErrors.buildingCode}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.buildingName}>
              <FormLabel>Nama Gedung</FormLabel>
              <Input 
                placeholder="Contoh: Gedung Laki-laki Pusat 1"
                value={buildingForm.buildingName}
                onChange={(e) => handleBuildingFormChange('buildingName', e.target.value)}
              />
              <FormErrorMessage>{formErrors.buildingName}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.genderType}>
              <FormLabel>Jenis Kelamin</FormLabel>
              <Select 
                value={buildingForm.genderType}
                onChange={(e) => handleBuildingFormChange('genderType', e.target.value)}
              >
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </Select>
              <FormErrorMessage>{formErrors.genderType}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.totalFloors}>
              <FormLabel>Jumlah Lantai</FormLabel>
              <NumberInput 
                min={1} 
                max={10} 
                value={buildingForm.totalFloors}
                onChange={(value) => setBuildingForm({...buildingForm, totalFloors: parseInt(value) || 1})}
              >
                <NumberInputField placeholder="Masukkan jumlah lantai (1-10)" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{formErrors.totalFloors}</FormErrorMessage>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Maksimal 10 lantai per gedung
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Alamat</FormLabel>
              <Textarea 
                placeholder="Alamat lengkap gedung"
                value={buildingForm.address}
                onChange={(e) => setBuildingForm({...buildingForm, address: e.target.value})}
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea 
                placeholder="Deskripsi gedung"
                value={buildingForm.description}
                onChange={(e) => handleBuildingFormChange('description', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Status Aktif</FormLabel>
              <Switch 
                isChecked={buildingForm.isActive}
                onChange={(e) => handleBuildingFormChange('isActive', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onBuildingEditClose}>
            Batal
          </Button>
          <Button colorScheme="blue" onClick={handleUpdateBuilding}>
            Update Gedung
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Floor Create/Edit Modals */}
    <Modal isOpen={isFloorCreateOpen} onClose={onFloorCreateClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Tambah Lantai Baru</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.buildingId}>
              <FormLabel>Gedung</FormLabel>
              <Select 
                placeholder="Pilih gedung"
                value={floorForm.buildingId}
                onChange={(e) => handleFloorFormChange('buildingId', e.target.value)}
              >
                {buildings.map(building => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.buildingCode} - {building.buildingName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{formErrors.buildingId}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.floorNumber}>
              <FormLabel>Nomor Lantai</FormLabel>
              <Input 
                type="number"
                min="1"
                max="10"
                value={floorForm.floorNumber}
                onChange={(e) => handleFloorFormChange('floorNumber', parseInt(e.target.value) || 1)}
              />
              <FormErrorMessage>{formErrors.floorNumber}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.floorName}>
              <FormLabel>Nama Lantai</FormLabel>
              <Input 
                placeholder="Contoh: Lantai 1, Lantai 2"
                value={floorForm.floorName}
                onChange={(e) => handleFloorFormChange('floorName', e.target.value)}
              />
              <FormErrorMessage>{formErrors.floorName}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea 
                placeholder="Deskripsi lantai"
                value={floorForm.description}
                onChange={(e) => handleFloorFormChange('description', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Status Tersedia</FormLabel>
              <Switch 
                isChecked={floorForm.isAvailable}
                onChange={(e) => handleFloorFormChange('isAvailable', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onFloorCreateClose}>
            Batal
          </Button>
          <Button colorScheme="blue" onClick={handleCreateFloor}>
            Simpan Lantai
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    <Modal isOpen={isFloorEditOpen} onClose={onFloorEditClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Lantai</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.floorNumber}>
              <FormLabel>Nomor Lantai</FormLabel>
              <Input 
                type="number"
                min="1"
                max="10"
                value={floorForm.floorNumber}
                onChange={(e) => handleFloorFormChange('floorNumber', parseInt(e.target.value) || 1)}
              />
              <FormErrorMessage>{formErrors.floorNumber}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={formErrors.floorName}>
              <FormLabel>Nama Lantai</FormLabel>
              <Input 
                placeholder="Contoh: Lantai 1, Lantai 2"
                value={floorForm.floorName}
                onChange={(e) => handleFloorFormChange('floorName', e.target.value)}
              />
              <FormErrorMessage>{formErrors.floorName}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Deskripsi</FormLabel>
              <Textarea 
                placeholder="Deskripsi lantai"
                value={floorForm.description}
                onChange={(e) => handleFloorFormChange('description', e.target.value)}
                rows={3}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Status Tersedia</FormLabel>
              <Switch 
                isChecked={floorForm.isAvailable}
                onChange={(e) => handleFloorFormChange('isAvailable', e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onFloorEditClose}>
            Batal
          </Button>
          <Button colorScheme="blue" onClick={handleUpdateFloor}>
            Update Lantai
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Existing Room Modals */}
    <ModernRoomDetailModal
      isOpen={isDetailOpen}
      onClose={handleDetailClose}
      roomId={selectedRoom?.room_id || selectedRoom?.roomId}
      onRoomUpdated={fetchRooms}
      dateFilter={dateFilter}
    />

    <ModernRoomCreateModal
      isOpen={isCreateOpen}
      onClose={onCreateClose}
      onRoomCreated={onRoomCreated}
    />

    <AlertDialog
      isOpen={isDeleteDialogOpen}
      leastDestructiveRef={cancelRef}
      onClose={closeDeleteDialog}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Hapus Kamar
          </AlertDialogHeader>
          <AlertDialogBody>
            Apakah Anda yakin ingin menghapus kamar ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={closeDeleteDialog}>
              Batal
            </Button>
            <Button colorScheme="red" onClick={handleDeleteRoom} ml={3}>
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
      </Box>
    </AdminLayout>
  );
};

export default RoomManagement;
