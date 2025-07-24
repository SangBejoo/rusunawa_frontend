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
  SimpleGrid,
  Box,
  Card,
  CardBody,
  Heading,
  Divider,
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
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  AspectRatio,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Progress
} from '@chakra-ui/react';
import {
  FiHome,
  FiUsers,
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
  FiMaximize2,
  FiCamera,
  FiUpload,
  FiRefreshCw
} from 'react-icons/fi';
import roomService from '../../services/roomService';
import ImageUploadPreview from '../common/ImageUploadPreview';
import AmenityManager from '../common/AmenityManager';
import RoomImageGallery from '../room/RoomImageGallery';

// Image Gallery Component
// Main Room Detail Modal Component
const ModernRoomDetailModal = ({ isOpen, onClose, roomId, onRoomUpdated, dateFilter = 'current' }) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // New state for buildings and floors
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingFloors, setLoadingFloors] = useState(false);
  
  const toast = useToast();

  // Helper function to get filtered occupants based on date filter (same as RoomManagement)
  const getFilteredOccupants = (occupants, dateFilter = 'current') => {
    if (!occupants || occupants.length === 0) return [];
    
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    console.log(`🔍 [Modal] Filtering ${occupants.length} occupants with filter: ${dateFilter}`);
    console.log(`📅 [Modal] Today: ${now.toISOString()}`);
    
    // Helper function to parse protobuf timestamp
    const parseProtobufTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (timestamp instanceof Date) return timestamp;
      if (timestamp.seconds) {
        return new Date(parseInt(timestamp.seconds) * 1000);
      }
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) return date;
      }
      return new Date(timestamp);
    };

    const filtered = occupants.filter(occ => {
      console.log(`👤 [Modal] Checking occupant: ${occ.tenantName}, status: ${occ.status}, checkIn: ${occ.checkIn}, checkOut: ${occ.checkOut}`);
      
      if (!occ.status || occ.status !== 'approved') {
        console.log(`❌ [Modal] Rejected: status is ${occ.status}, not approved`);
        return false;
      }
      
      const checkIn = parseProtobufTimestamp(occ.checkIn);
      const checkOut = parseProtobufTimestamp(occ.checkOut);
      
      console.log(`📅 [Modal] Parsed dates - checkIn: ${checkIn?.toISOString()}, checkOut: ${checkOut?.toISOString()}`);
      
      if (!checkIn || !checkOut) {
        console.log(`❌ [Modal] Rejected: invalid dates`);
        return false;
      }
      
      let isMatch = false;
      switch (dateFilter) {
        case 'current':
          isMatch = checkIn <= now && now <= checkOut;
          console.log(`🎯 [Modal] Current filter: checkIn(${checkIn.toDateString()}) <= now(${now.toDateString()}) <= checkOut(${checkOut.toDateString()}) = ${isMatch}`);
          break;
          
        case 'this_year':
          isMatch = checkIn >= startOfYear && checkIn <= endOfYear;
          console.log(`📆 [Modal] This year filter: ${isMatch}`);
          break;
          
        case 'last_6_months':
          isMatch = checkIn >= sixMonthsAgo && checkIn <= now;
          console.log(`📅 [Modal] Last 6 months filter: ${isMatch}`);
          break;
          
        case 'future':
          isMatch = checkIn > now;
          console.log(`🔮 [Modal] Future filter: ${isMatch}`);
          break;
          
        case 'all':
          isMatch = true;
          console.log(`🌐 [Modal] All filter: ${isMatch}`);
          break;
          
        default:
          isMatch = checkIn <= now && now <= checkOut;
          console.log(`🎯 [Modal] Default filter: ${isMatch}`);
          break;
      }
      
      console.log(`✅ [Modal] Final result for ${occ.tenantName}: ${isMatch}`);
      return isMatch;
    });
    
    console.log(`🎉 [Modal] Filtered result: ${filtered.length} out of ${occupants.length} occupants match filter ${dateFilter}`);
    return filtered;
  };

  // Helper function to get occupancy statistics by period
  const getOccupancyStats = () => {
    if (!room || !room.occupants) return {};
    
    const periods = ['current', 'this_year', 'last_6_months', 'future', 'all'];
    const stats = {};
    
    periods.forEach(period => {
      const filtered = getFilteredOccupants(room.occupants, period);
      
      // For 'current' period, count concurrent active bookings (beds occupied)
      // For other periods, count unique tenants who stayed during that period
      let count;
      
      if (period === 'current') {
        // Count concurrent active bookings (each booking = 1 bed occupied)
        const now = new Date();
        const concurrentBookings = filtered.filter(occ => {
          const checkIn = new Date(occ.checkIn);
          const checkOut = new Date(occ.checkOut);
          return checkIn <= now && now <= checkOut;
        });
        count = concurrentBookings.length; // Each booking occupies 1 bed
        
        console.log(`🛏️ [${period}] Concurrent bookings: ${count} (${concurrentBookings.map(b => `${b.tenantName}(${b.tenantId})`).join(', ')})`);
      } else {
        // For historical/future periods, count unique tenants
        const uniqueTenants = new Set(filtered.map(occ => occ.tenantId));
        count = uniqueTenants.size;
        
        console.log(`👥 [${period}] Unique tenants: ${count} (${Array.from(uniqueTenants).join(', ')})`);
      }
      
      const percentage = Math.round((count / (room.capacity || 1)) * 100);
      
      // Add warning for over-capacity situations
      const isOverCapacity = count > room.capacity;
      
      stats[period] = {
        count,
        percentage,
        status: count === 0 ? 'available' : count >= room.capacity ? 'full' : 'partial',
        color: isOverCapacity ? 'red' : count === 0 ? 'green' : count >= room.capacity ? 'orange' : 'green',
        isOverCapacity,
        anomaly: isOverCapacity ? `⚠️ Over-capacity: ${count} > ${room.capacity}` : null
      };
    });
    
    return stats;
  };

  // Helper function to standardize gender display
  const getGenderDisplay = (gender) => {
    switch (gender) {
      case 'L':
      case 'male':
      case 'laki_laki':
        return { label: 'Laki-laki', color: 'blue' };
      case 'P':
      case 'female':
      case 'perempuan':
        return { label: 'Perempuan', color: 'pink' };
      default:
        return { label: gender || 'Tidak Diketahui', color: 'gray' };
    }
  };

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomDetails();
    }
  }, [isOpen, roomId]);

  // Fetch buildings when editing starts
  useEffect(() => {
    if (isEditing && buildings.length === 0) {
      fetchBuildings();
    }
  }, [isEditing]);

  // Fetch floors when building changes in edit mode
  useEffect(() => {
    if (isEditing && editFormData.buildingId) {
      fetchFloors(editFormData.buildingId);
    }
  }, [isEditing, editFormData.buildingId]);  // Fetch buildings for the dropdown
  const fetchBuildings = async () => {
    try {
      setLoadingBuildings(true);
      const response = await roomService.getBuildings({
        page: 1,
        limit: 100 // Get all buildings
      });
      setBuildings(response.buildings || []);
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load buildings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingBuildings(false);
    }
  };

  // Fetch floors for selected building
  const fetchFloors = async (buildingId) => {
    if (!buildingId) {
      setFloors([]);
      return;
    }
    
    try {
      setLoadingFloors(true);
      const response = await roomService.getBuildingFloors(buildingId);
      setFloors(response.floors || []);
    } catch (error) {
      console.error('Error fetching floors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load floors',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setFloors([]);
    } finally {
      setLoadingFloors(false);
    }
  };

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      console.log(`Fetching room details for roomId: ${roomId}`);
      const response = await roomService.getRoomById(roomId);
      console.log('Room API Response:', response);
      
      // Check if response has the expected structure
      if (!response || !response.room) {
        throw new Error('Invalid response structure: missing room data');
      }
      
      // Transform the API response to match component expectations
      const transformedRoom = {
        room_id: response.room.roomId,
        name: response.room.name,
        classification_id: response.room.classificationId,
        rental_type_id: response.room.rentalTypeId,
        capacity: response.room.capacity,
        description: response.room.description,
        created_at: response.room.createdAt,
        updated_at: response.room.updatedAt,
        classification: response.room.classification?.name || '-',
        rental_type: response.room.rentalType?.name || '-',
        // Building and Floor Information
        buildingId: response.room.buildingId,
        floorId: response.room.floorId,
        roomNumber: response.room.roomNumber,
        fullRoomCode: response.room.fullRoomCode,
        floorNumber: response.room.floorNumber,
        buildingCode: response.room.buildingCode,
        buildingName: response.room.buildingName,
        buildingGender: response.room.buildingGender,
        floorName: response.room.floorName,
        isAvailable: response.room.isAvailable,
        amenities: response.room.amenities?.map(amenity => ({
          id: `${amenity.roomId}_${amenity.name}`,
          room_id: amenity.roomId,
          name: amenity.name,
          custom_feature_name: amenity.customFeatureName,
          description: amenity.description,
          quantity: amenity.quantity,
          isCustom: amenity.isCustom
        })) || [],
        occupants: response.room.occupants?.map(occupant => ({
          bookingId: occupant.bookingId,
          tenantId: occupant.tenantId,
          tenantName: occupant.name,
          email: occupant.email,
          gender: occupant.gender,
          checkIn: occupant.checkIn,
          checkOut: occupant.checkOut,
          status: occupant.status,
          paymentStatus: occupant.paymentStatus
        })) || [],
        images: response.room.images?.map(img => ({
          image_id: img.imageId || img.image_id,
          room_id: img.roomId || img.room_id,
          image_name: img.imageName || img.image_name,
          content_type: img.contentType || img.content_type,
          file_size: img.fileSize || img.file_size,
          is_primary: img.isPrimary || img.is_primary,
          uploaded_at: img.uploadedAt || img.uploaded_at
        })) || []
      };
        console.log('Transformed room data:', transformedRoom);
      console.log('Room ID for images:', transformedRoom.room_id);
      setRoom(transformedRoom);
      setEditFormData({
        name: transformedRoom.name,
        description: transformedRoom.description,
        capacity: transformedRoom.capacity,
        classification_id: transformedRoom.classification_id,
        rental_type_id: transformedRoom.rental_type_id,
        buildingId: transformedRoom.buildingId,
        floorId: transformedRoom.floorId,
        roomNumber: transformedRoom.roomNumber,
        amenities: transformedRoom.amenities,
        images: transformedRoom.images
      });
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch room details: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const response = await roomService.updateRoom(roomId, editFormData);
      setRoom(response.room);
      setIsEditing(false);
      
      toast({
        title: 'Sukses',
        description: 'Kamar berhasil diperbarui',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      if (onRoomUpdated) {
        onRoomUpdated(response.room);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update room',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      classification_id: room.classification_id,
      rental_type_id: room.rental_type_id,
      buildingId: room.buildingId,
      floorId: room.floorId,
      roomNumber: room.roomNumber,
      amenities: room.amenities || [],
      images: room.images || []
    });
  };

  // Handle building selection change
  const handleBuildingChange = (buildingId) => {
    setEditFormData(prev => ({
      ...prev,
      buildingId: buildingId,
      floorId: '' // Reset floor when building changes
    }));
  };

  const handleAmenitiesChange = (newAmenities) => {
    setEditFormData(prev => ({
      ...prev,
      amenities: newAmenities
    }));
  };

  const handleImagesChange = (newImages) => {
    setEditFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  if (loading && !room) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Memuat detail kamar...</Text>
              </VStack>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (!room) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Center py={20}>
              <Alert status="error">
                <AlertIcon />
                Gagal memuat detail kamar
              </Alert>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Text fontSize="xl" fontWeight="bold">
                  {room.name}
                </Text>
                {room.fullRoomCode && (
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                    {room.fullRoomCode}
                  </Badge>
                )}
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <HStack spacing={1}>
                  <FiMapPin size="14px" />
                  <Text fontSize="sm" color="gray.600">
                    {room.buildingName} - {room.floorName || `Lantai ${room.floorNumber}`}
                  </Text>
                </HStack>
                <Badge colorScheme="blue">{room.classification}</Badge>
                <Badge colorScheme="green">{room.rental_type}</Badge>
                <Badge colorScheme="purple">ID: {room.room_id}</Badge>
                {dateFilter !== 'current' && (
                  <Badge colorScheme="orange" variant="solid">
                    {dateFilter === 'this_year' ? 'Periode: Tahun Ini' :
                     dateFilter === 'last_6_months' ? 'Periode: 6 Bulan Terakhir' :
                     dateFilter === 'future' ? 'Periode: Mendatang' :
                     dateFilter === 'all' ? 'Periode: Semua' : 'Filter Khusus'}
                  </Badge>
                )}
              </HStack>
            </VStack>
            
            <HStack>
              <IconButton
                icon={<FiRefreshCw />}
                variant="outline"
                onClick={fetchRoomDetails}
                isLoading={loading}
                title="Muat ulang data"
              />
              <Button
                leftIcon={isEditing ? <FiCheck /> : <FiEdit />}
                colorScheme={isEditing ? "green" : "blue"}
                onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
                isLoading={loading}
              >
                {isEditing ? 'Simpan Perubahan' : 'Edit Kamar'}
              </Button>
              {isEditing && (
                <Button
                  leftIcon={<FiX />}
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Batal
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton />

        <ModalBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Ikhtisar</Tab>
              <Tab>Hunian {(room.occupants || []).length > 0 ? `(${room.occupants.length})` : ''}</Tab>
              <Tab>Gambar {(room.images || []).length > 0 ? `(${room.images.length})` : ''}</Tab>
              <Tab>Fasilitas {(room.amenities || []).length > 0 ? `(${room.amenities.length})` : ''}</Tab>
            </TabList>

            <TabPanels>              {/* Overview Tab */}
              <TabPanel>
                <VStack spacing={6}>
                  {/* Basic Information */}
                  <Card w="full">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Informasi Kamar</Heading>
                        
                        {isEditing ? (
                          <VStack spacing={4}>
                            <HStack w="full" spacing={4}>
                              <FormControl flex="2">
                                <FormLabel>Nama Kamar</FormLabel>
                                <Input
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                  }))}
                                />
                              </FormControl>                              <FormControl flex="1">
                                <FormLabel>Kapasitas</FormLabel>
                                <NumberInput
                                  value={editFormData.capacity}
                                  onChange={(value) => setEditFormData(prev => ({
                                    ...prev,
                                    capacity: parseInt(value) || 4
                                  }))}
                                  min={1}
                                  max={4}
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                  Maksimal 4 orang
                                </Text>
                              </FormControl>
                            </HStack>
                            
                            <FormControl>
                              <FormLabel>Deskripsi</FormLabel>
                              <Textarea
                                value={editFormData.description}
                                onChange={(e) => setEditFormData(prev => ({
                                  ...prev,
                                  description: e.target.value
                                }))}
                                rows={3}
                              />
                            </FormControl>
                            
                            {/* Building and Floor Selection */}
                            <HStack w="full" spacing={4}>
                              <FormControl flex="1">
                                <FormLabel>Gedung</FormLabel>
                                <Select
                                  value={editFormData.buildingId || ''}
                                  onChange={(e) => handleBuildingChange(e.target.value)}
                                  placeholder="Pilih gedung"
                                  isDisabled={loadingBuildings}
                                >
                                  {buildings.map((building) => (
                                    <option key={building.buildingId} value={building.buildingId}>
                                      {building.buildingCode} - {building.buildingName}
                                    </option>
                                  ))}
                                </Select>
                                {loadingBuildings && (
                                  <HStack mt={1}>
                                    <Spinner size="sm" />
                                    <Text fontSize="sm" color="gray.500">Memuat gedung...</Text>
                                  </HStack>
                                )}
                              </FormControl>

                              <FormControl flex="1">
                                <FormLabel>Lantai</FormLabel>
                                <Select
                                  value={editFormData.floorId || ''}
                                  onChange={(e) => setEditFormData(prev => ({
                                    ...prev,
                                    floorId: e.target.value
                                  }))}
                                  placeholder={editFormData.buildingId ? "Pilih lantai" : "Pilih gedung terlebih dahulu"}
                                  isDisabled={loadingFloors || !editFormData.buildingId}
                                >
                                  {floors.map((floor) => (
                                    <option key={floor.floorId} value={floor.floorId}>
                                      {floor.floorName}
                                    </option>
                                  ))}
                                </Select>
                                {loadingFloors && editFormData.buildingId && (
                                  <HStack mt={1}>
                                    <Spinner size="sm" />
                                    <Text fontSize="sm" color="gray.500">Memuat lantai...</Text>
                                  </HStack>
                                )}
                              </FormControl>
                            </HStack>

                            <FormControl>
                              <FormLabel>Nomor Kamar</FormLabel>
                              <Input
                                value={editFormData.roomNumber || ''}
                                onChange={(e) => setEditFormData(prev => ({
                                  ...prev,
                                  roomNumber: e.target.value
                                }))}
                                placeholder="Masukkan nomor kamar (contoh: 01, 02, A1)"
                              />
                              <Text fontSize="sm" color="gray.500" mt={1}>
                                Nomor kamar dalam lantai yang dipilih
                              </Text>
                            </FormControl>
                          </VStack>
                        ) : (
                          <>
                            {/* Room Code and Building Information */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                              <Card bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.400">
                                <CardBody p={4}>
                                  <VStack align="start" spacing={2}>
                                    <HStack>
                                      <FiHome color="blue" />
                                      <Text fontWeight="bold" color="blue.600">Informasi Lokasi</Text>
                                    </HStack>
                                    <VStack align="start" spacing={1}>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Kode Kamar:</Text>
                                        <Badge colorScheme="blue" fontSize="sm" fontWeight="bold">
                                          {room.fullRoomCode || `${room.buildingCode}-${room.roomNumber}`}
                                        </Badge>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Gedung:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">
                                          {room.buildingName} ({room.buildingCode})
                                        </Text>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Lantai:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">
                                          {room.floorName || `Lantai ${room.floorNumber}`}
                                        </Text>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">No. Kamar:</Text>
                                        <Text fontSize="sm" fontWeight="semibold">
                                          {room.roomNumber}
                                        </Text>
                                      </HStack>
                                    </VStack>
                                  </VStack>
                                </CardBody>
                              </Card>

                              <Card bg="green.50" borderLeft="4px solid" borderLeftColor="green.400">
                                <CardBody p={4}>
                                  <VStack align="start" spacing={2}>
                                    <HStack>
                                      <FiUsers color="green" />
                                      <Text fontWeight="bold" color="green.600">Spesifikasi Kamar</Text>
                                    </HStack>
                                    <VStack align="start" spacing={1}>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Kapasitas:</Text>
                                        <Badge colorScheme="green" fontSize="sm">
                                          {room.capacity} orang
                                        </Badge>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Gender:</Text>
                                        <Badge 
                                          colorScheme={room.buildingGender === 'perempuan' ? 'pink' : 'blue'} 
                                          fontSize="sm"
                                        >
                                          {room.buildingGender === 'perempuan' ? 'Perempuan' : 'Laki-laki'}
                                        </Badge>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Ketersediaan:</Text>
                                        <Badge 
                                          colorScheme={room.isAvailable ? 'green' : 'red'} 
                                          fontSize="sm"
                                        >
                                          {room.isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                                        </Badge>
                                      </HStack>
                                      <HStack>
                                        <Text fontSize="sm" color="gray.600" minW="100px">Sistem Tarif:</Text>
                                        <Badge colorScheme="purple" fontSize="sm">
                                          Harga Dinamis
                                        </Badge>
                                      </HStack>
                                    </VStack>
                                  </VStack>
                                </CardBody>
                              </Card>
                            </SimpleGrid>

                            {room.description && (
                              <Box>
                                <Text fontWeight="semibold" mb={2}>Deskripsi</Text>
                                <Text color="gray.600">{room.description}</Text>
                              </Box>
                            )}

                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                              <Box>
                                <Text fontWeight="semibold" mb={1}>Klasifikasi</Text>
                                <Badge colorScheme="blue" p={2}>
                                  {room.classification}
                                </Badge>
                              </Box>
                              
                              <Box>
                                <Text fontWeight="semibold" mb={1}>Tipe Sewa</Text>
                                <Badge colorScheme="green" p={2}>
                                  {room.rental_type}
                                </Badge>
                              </Box>
                              
                              <Box>
                                <Text fontWeight="semibold" mb={1}>Status</Text>
                                <Badge 
                                  colorScheme={room.status === 'available' ? 'green' : 'red'} 
                                  p={2}
                                >
                                  {room.status === 'available' ? 'Tersedia' : room.status === 'full' ? 'Penuh' : room.status || 'Tersedia'}
                                </Badge>
                              </Box>
                            </SimpleGrid>
                          </>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>                  {/* Current Occupants */}
                  <Card w="full">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between">
                          <Heading size="md">
                            Penghuni {dateFilter === 'current' ? 'Saat Ini' : 
                                     dateFilter === 'this_year' ? 'Tahun Ini' :
                                     dateFilter === 'last_6_months' ? '6 Bulan Terakhir' :
                                     dateFilter === 'future' ? 'Mendatang' : 'Semua'}
                          </Heading>
                          <HStack spacing={2}>
                            <Badge colorScheme="blue" size="sm">
                              {getFilteredOccupants(room.occupants || [], dateFilter).length}/{room.capacity}
                            </Badge>
                            <Badge 
                              colorScheme={getFilteredOccupants(room.occupants || [], dateFilter).length === room.capacity ? "red" : "green"}
                              size="sm"
                            >
                              {getFilteredOccupants(room.occupants || [], dateFilter).length === room.capacity ? "Penuh" : "Tersedia"}
                            </Badge>
                          </HStack>
                        </HStack>
                        
                        {getFilteredOccupants(room.occupants || [], dateFilter).length > 0 ? (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            {getFilteredOccupants(room.occupants, dateFilter).map((occupant, index) => (
                              <Card key={occupant.bookingId || index} size="sm">
                                <CardBody>
                                  <HStack spacing={3}>
                                    <Avatar 
                                      size="md" 
                                      name={occupant.tenantName}
                                      bg={getGenderDisplay(occupant.gender).color + '.500'}
                                    />
                                    <VStack align="start" spacing={1} flex="1">
                                      <Text fontWeight="bold" fontSize="sm">
                                        {occupant.tenantName}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        ID: {occupant.tenantId}
                                      </Text>
                                      {occupant.email && (
                                        <Text fontSize="xs" color="gray.600">
                                          {occupant.email}
                                        </Text>
                                      )}
                                      {occupant.checkIn && (
                                        <HStack spacing={1}>
                                          <FiCalendar size="12px" />
                                          <Text fontSize="xs" color="gray.500">
                                            Masuk: {new Date(occupant.checkIn).toLocaleDateString()}
                                          </Text>
                                        </HStack>
                                      )}
                                      {occupant.checkOut && (
                                        <HStack spacing={1}>
                                          <FiCalendar size="12px" />
                                          <Text fontSize="xs" color="gray.500">
                                            Keluar: {new Date(occupant.checkOut).toLocaleDateString()}
                                          </Text>
                                        </HStack>
                                      )}
                                      <HStack spacing={2}>
                                        {occupant.status && (
                                          <Badge 
                                            size="xs" 
                                            colorScheme={
                                              occupant.status === 'active' ? 'green' :
                                              occupant.status === 'inactive' ? 'red' : 'gray'
                                            }
                                          >
                                            {occupant.status === 'active' ? 'Aktif' : occupant.status === 'inactive' ? 'Tidak Aktif' : occupant.status}
                                          </Badge>
                                        )}
                                        {occupant.paymentStatus && (
                                          <Badge 
                                            size="xs" 
                                            colorScheme={
                                              occupant.paymentStatus === 'paid' ? 'green' :
                                              occupant.paymentStatus === 'pending' ? 'yellow' : 'red'
                                            }
                                          >
                                            {occupant.paymentStatus === 'paid' ? 'Lunas' : occupant.paymentStatus === 'pending' ? 'Menunggu' : occupant.paymentStatus}
                                          </Badge>
                                        )}
                                      </HStack>
                                    </VStack>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))}
                          </SimpleGrid>
                        ) : (
                          <Center py={8}>
                            <VStack spacing={3}>
                              <FiUsers size={48} color="gray.400" />
                              <Text color="gray.500" textAlign="center">
                                Tidak ada penghuni saat ini
                              </Text>
                              <Text fontSize="sm" color="gray.400" textAlign="center">
                                Kamar ini tersedia untuk pemesanan baru
                              </Text>
                            </VStack>
                          </Center>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Occupancy Tab */}
              <TabPanel>
                <VStack spacing={6}>
                  {/* Occupancy Overview */}
                  <Card w="full">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Statistik Hunian</Heading>
                        
                        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                          {(() => {
                            const stats = getOccupancyStats();
                            return [
                              { period: 'current', label: 'Saat Ini', description: 'Penghuni aktif hari ini' },
                              { period: 'this_year', label: 'Tahun Ini', description: 'Total penghuni tahun 2025' },
                              { period: 'last_6_months', label: '6 Bulan', description: 'Penghuni 6 bulan terakhir' },
                              { period: 'future', label: 'Mendatang', description: 'Booking di masa depan' },
                              { period: 'all', label: 'Total', description: 'Semua penghuni' }
                            ].map(({ period, label, description }) => {
                              const stat = stats[period] || { count: 0, percentage: 0, color: 'gray' };
                              return (
                                <Card 
                                  key={period} 
                                  borderLeft="4px solid"
                                  borderLeftColor={`${stat.color}.400`}
                                  bg={period === 'current' ? `${stat.color}.50` : 'white'}
                                >
                                  <CardBody p={4}>
                                    <VStack align="stretch" spacing={2}>
                                      <HStack justify="space-between" align="start">
                                        <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                                          {label}
                                        </Text>
                                        <VStack spacing={1} align="end">
                                          {period === 'current' && (
                                            <Badge colorScheme={stat.color} size="sm">AKTIF</Badge>
                                          )}
                                          {stat.isOverCapacity && (
                                            <Badge colorScheme="red" size="sm" variant="solid">
                                              ⚠️ ANOMALI
                                            </Badge>
                                          )}
                                        </VStack>
                                      </HStack>
                                      
                                      <HStack justify="space-between" align="center">
                                        <Text fontSize="2xl" fontWeight="bold" color={`${stat.color}.600`}>
                                          {stat.count}/{room.capacity}
                                        </Text>
                                        {stat.isOverCapacity && (
                                          <Badge colorScheme="red" size="xs" variant="outline">
                                            +{stat.count - room.capacity}
                                          </Badge>
                                        )}
                                      </HStack>
                                      
                                      <Box>
                                        <Progress 
                                          value={Math.min(stat.percentage, 100)} 
                                          colorScheme={stat.color}
                                          size="sm"
                                          rounded="full"
                                        />
                                        <HStack justify="space-between" mt={1}>
                                          <Text fontSize="xs" color="gray.500">
                                            {stat.percentage}% penuh
                                          </Text>
                                          {stat.isOverCapacity && (
                                            <Text fontSize="xs" color="red.500" fontWeight="bold">
                                              OVER CAPACITY!
                                            </Text>
                                          )}
                                        </HStack>
                                      </Box>
                                      
                                      <Text fontSize="xs" color="gray.500">
                                        {description}
                                      </Text>
                                      
                                      {stat.anomaly && (
                                        <Alert status="error" size="sm" p={2}>
                                          <AlertIcon boxSize="12px" />
                                          <Text fontSize="xs">{stat.anomaly}</Text>
                                        </Alert>
                                      )}
                                    </VStack>
                                  </CardBody>
                                </Card>
                              );
                            });
                          })()}
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Detailed Occupants List */}
                  <Card w="full">
                    <CardBody>
                      <VStack align="stretch" spacing={4}>
                        <Heading size="md">Detail Penghuni</Heading>
                        
                        {room.occupants && room.occupants.length > 0 ? (
                          <VStack spacing={4} align="stretch">
                            {[
                              { filter: 'current', title: '🟢 Penghuni Aktif Saat Ini', color: 'green' },
                              { filter: 'future', title: '🔵 Booking Mendatang', color: 'blue' },
                              { filter: 'all', title: '📊 Semua Riwayat Penghuni', color: 'gray' }
                            ].map(({ filter, title, color }) => {
                              const filteredOccupants = getFilteredOccupants(room.occupants, filter);
                              
                              if (filteredOccupants.length === 0 && filter !== 'all') return null;
                              
                              return (
                                <Box key={filter}>
                                  <Text fontWeight="semibold" mb={3} color={`${color}.600`}>
                                    {title} ({filteredOccupants.length})
                                  </Text>
                                  
                                  {filteredOccupants.length > 0 ? (
                                    <VStack spacing={4} align="stretch">
                                      {/* Duplicate Detection Alert */}
                                      {(() => {
                                        const tenantCounts = {};
                                        filteredOccupants.forEach(occ => {
                                          tenantCounts[occ.tenantId] = (tenantCounts[occ.tenantId] || 0) + 1;
                                        });
                                        const duplicates = Object.entries(tenantCounts)
                                          .filter(([_, count]) => count > 1)
                                          .map(([tenantId, count]) => ({ tenantId, count }));
                                          
                                        if (duplicates.length > 0) {
                                          return (
                                            <Alert status="warning" size="sm">
                                              <AlertIcon />
                                              <VStack align="start" spacing={1}>
                                                <Text fontSize="sm" fontWeight="bold">
                                                  ⚠️ Duplicate Bookings Detected!
                                                </Text>
                                                <Text fontSize="xs">
                                                  {duplicates.map(d => `Tenant ${d.tenantId} (${d.count} bookings)`).join(', ')}
                                                </Text>
                                              </VStack>
                                            </Alert>
                                          );
                                        }
                                        return null;
                                      })()}
                                      
                                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        {filteredOccupants.map((occupant, index) => {
                                          const checkIn = new Date(occupant.checkIn);
                                          const checkOut = new Date(occupant.checkOut);
                                          const now = new Date();
                                          
                                          let statusBadge = 'gray';
                                          let statusText = 'Unknown';
                                          
                                          if (checkIn <= now && now <= checkOut) {
                                            statusBadge = 'green';
                                            statusText = 'Aktif';
                                          } else if (checkIn > now) {
                                            statusBadge = 'blue';
                                            statusText = 'Mendatang';
                                          } else if (checkOut < now) {
                                            statusBadge = 'gray';
                                            statusText = 'Selesai';
                                          }
                                          
                                          // Check if this tenant has multiple bookings
                                          const duplicateCount = filteredOccupants.filter(o => o.tenantId === occupant.tenantId).length;
                                          const isDuplicate = duplicateCount > 1;
                                          
                                          return (
                                            <Card 
                                              key={`${occupant.tenantId}-${occupant.bookingId}-${index}`} 
                                              size="sm"
                                              borderLeft={isDuplicate ? "4px solid" : "none"}
                                              borderLeftColor={isDuplicate ? "orange.400" : "transparent"}
                                              bg={isDuplicate ? "orange.50" : "white"}
                                            >
                                              <CardBody p={4}>
                                                <VStack align="stretch" spacing={3}>
                                                  <HStack justify="space-between" align="start">
                                                    <HStack>
                                                      <Avatar size="sm" name={occupant.tenantName} />
                                                      <VStack align="start" spacing={0}>
                                                        <HStack>
                                                          <Text fontWeight="semibold" fontSize="sm">
                                                            {occupant.tenantName}
                                                          </Text>
                                                          {isDuplicate && (
                                                            <Badge colorScheme="orange" size="xs">
                                                              DUPLICATE
                                                            </Badge>
                                                          )}
                                                        </HStack>
                                                        <Text fontSize="xs" color="gray.500">
                                                          ID: {occupant.tenantId} | Booking: {occupant.bookingId}
                                                        </Text>
                                                      </VStack>
                                                    </HStack>
                                                    <Badge colorScheme={statusBadge} size="sm">
                                                      {statusText}
                                                    </Badge>
                                                  </HStack>
                                                
                                                <Box bg="gray.50" p={2} rounded="md">
                                                  <VStack spacing={1} align="stretch">
                                                    <HStack justify="space-between">
                                                      <Text fontSize="xs" color="gray.600">Check-in:</Text>
                                                      <Text fontSize="xs" fontWeight="medium">
                                                        {checkIn.toLocaleDateString('id-ID')}
                                                      </Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                      <Text fontSize="xs" color="gray.600">Check-out:</Text>
                                                      <Text fontSize="xs" fontWeight="medium">
                                                        {checkOut.toLocaleDateString('id-ID')}
                                                      </Text>
                                                    </HStack>
                                                    <HStack justify="space-between">
                                                      <Text fontSize="xs" color="gray.600">Durasi:</Text>
                                                      <Text fontSize="xs" fontWeight="medium">
                                                        {Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))} hari
                                                      </Text>
                                                    </HStack>
                                                  </VStack>
                                                </Box>
                                                
                                                <HStack justify="space-between">
                                                  <Badge colorScheme="purple" size="sm">
                                                    {getGenderDisplay(occupant.gender).label}
                                                  </Badge>
                                                  <Badge 
                                                    colorScheme={occupant.paymentStatus === 'paid' ? 'green' : 'orange'} 
                                                    size="sm"
                                                  >
                                                    {occupant.paymentStatus === 'paid' ? 'Lunas' : 'Pending'}
                                                  </Badge>
                                                </HStack>
                                              </VStack>
                                            </CardBody>
                                          </Card>
                                        );
                                      })}
                                      </SimpleGrid>
                                    </VStack>
                                  ) : (
                                    <Alert status="info">
                                      <AlertIcon />
                                      <Text fontSize="sm">
                                        Tidak ada penghuni untuk periode {title.toLowerCase()}
                                      </Text>
                                    </Alert>
                                  )}
                                </Box>
                              );
                            })}
                          </VStack>
                        ) : (
                          <Center py={8}>
                            <VStack spacing={3}>
                              <FiUsers size={48} color="gray.300" />
                              <Text fontSize="lg" fontWeight="semibold" color="gray.500">
                                Belum Ada Penghuni
                              </Text>
                              <Text fontSize="sm" color="gray.400" textAlign="center">
                                Kamar ini belum memiliki riwayat penghuni atau booking
                              </Text>
                            </VStack>
                          </Center>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>              {/* Images Tab */}
              <TabPanel>                {isEditing ? (
                  <RoomImageGallery 
                    roomId={room.room_id}
                    isEditable={true}
                    onImagesChange={(images) => {
                      // Update both the edit form data and the main room state
                      setEditFormData(prev => ({ ...prev, images }));
                      setRoom(prev => ({ ...prev, images }));
                    }}
                  />
                ) : (
                  <RoomImageGallery 
                    roomId={room.room_id}
                    isEditable={false}
                    onImagesChange={(images) => {
                      // Update the main room state to reflect image count in tab
                      setRoom(prev => ({ ...prev, images }));
                    }}
                  />
                )}
              </TabPanel>

              {/* Amenities Tab */}
              <TabPanel>
                <AmenityManager
                  amenities={isEditing ? editFormData.amenities : room.amenities}
                  onAmenitiesChange={handleAmenitiesChange}
                  readOnly={!isEditing}
                  showStandardOptions={isEditing}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Tutup</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModernRoomDetailModal;
