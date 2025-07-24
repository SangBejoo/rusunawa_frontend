import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  InputLeftElement,
  Input,
  Select,
  Flex,
  Skeleton,
  Alert,
  AlertIcon,
  useDisclosure,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Divider,
  Icon
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDownload,
  FiMapPin,
  FiUser,
  FiUsers,
  FiPhone,
  FiMail,
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiFileText
} from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import TenantDetailModal from '../../components/modals/TenantDetailModal';
import TenantEditModal from '../../components/modals/TenantEditModal';
import tenantService from '../../services/tenantService';
import roomService from '../../services/roomService';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [allTenants, setAllTenants] = useState([]); // Store all tenants for client-side filtering
  const [rooms, setRooms] = useState([]);
  const [invoicesData, setInvoicesData] = useState({}); // Store invoice data by tenant ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState(null);
  const [tenantsEnhanced, setTenantsEnhanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Separate search term for debouncing

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    gender: '',
    distanceRange: '',
    sortBy: 'distanceToCampus',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  // Debounce search input
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500); // 500ms delay

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  useEffect(() => {
    // Load initial data only once
    const loadData = async () => {
      await fetchRooms();
      await fetchTenants();
      await fetchAllInvoices();
    };
    loadData();
  }, []); // Only run once on component mount

  useEffect(() => {
    // Apply client-side filters whenever filters change or allTenants changes
    if (allTenants.length > 0) {
      const filteredTenants = applyClientSideFilters(allTenants);
      setTenants(filteredTenants);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: filteredTenants.length,
        page: 1 // Reset to first page when filters change
      }));
    }
  }, [filters, searchTerm, allTenants]);  // Re-process tenants when rooms or invoices data changes
  useEffect(() => {
    if (rooms.length > 0 && tenants.length > 0 && !tenantsEnhanced) {
      console.log('Rooms and tenants loaded, enhancing data...');
      enhanceTenantData();
      setTenantsEnhanced(true);
    }
  }, [rooms, tenants, invoicesData, tenantsEnhanced]);
  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms();
      const roomsList = response?.rooms || response?.data?.rooms || [];
      console.log('Rooms fetched:', roomsList);
      console.log('Room occupants details:', roomsList.map(room => ({
        roomId: room.roomId,
        name: room.name,
        occupants: room.occupants
      })));
      setRooms(roomsList);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };
  const enhanceTenantData = () => {
    if (tenants.length === 0 || rooms.length === 0) return;
    
    console.log('Enhancing tenant data with room assignments and invoice statistics...');
    const enhancedTenants = tenants.map(tenant => {
      const tenantId = tenant.tenant_id || tenant.tenantId;
      console.log(`Processing tenant ${tenantId} (${tenant.name || tenant.user?.fullName})`);
      
      // Find room where this tenant is an occupant
      const assignedRoom = rooms.find(room => 
        room.occupants?.some(occupant => {
          const match = occupant.tenantId === tenantId && occupant.status === 'approved';
          console.log(`  Checking room ${room.roomId} (${room.name}), occupant ${occupant.tenantId}, status ${occupant.status}, match: ${match}`);
          return match;
        })
      );
      
      console.log(`  Tenant ${tenantId} assigned room:`, assignedRoom ? `${assignedRoom.roomId} (${assignedRoom.name})` : 'None');
      
      // Get the occupant details for additional info
      const occupantDetails = assignedRoom?.occupants?.find(occupant => 
        occupant.tenantId === tenantId && 
        occupant.status === 'approved'
      );
      
      // Calculate invoice-based statistics
      const tenantInvoices = invoicesData[tenantId] || [];
      console.log(`  Processing ${tenantInvoices.length} invoices for tenant ${tenantId}`);
      
      let totalPaid = 0;
      let outstandingBalance = 0;
      
      tenantInvoices.forEach(invoice => {
        const amount = parseFloat(invoice.amount) || 0;
        if (invoice.status === 'paid') {
          totalPaid += amount;
        } else if (invoice.status === 'unpaid' || invoice.status === 'pending') {
          outstandingBalance += amount;
        }
        console.log(`    Invoice ${invoice.invoice_id}: amount=${amount}, status=${invoice.status}`);
      });
      
      console.log(`  Tenant ${tenantId} financial summary: totalPaid=${totalPaid}, outstanding=${outstandingBalance}`);
      
      return {
        ...tenant,
        current_room: assignedRoom ? {
          ...assignedRoom,
          number: assignedRoom.name,
          type: assignedRoom.classification?.name || 'Standard',
          occupant_details: occupantDetails
        } : null,
        computed_status: assignedRoom ? 'active' : 'non active',
        // Add invoice-based financial data
        financial_summary: {
          total_paid: totalPaid,
          outstanding_balance: outstandingBalance,
          total_invoices: tenantInvoices.length,
          paid_invoices: tenantInvoices.filter(inv => inv.status === 'paid').length,
          unpaid_invoices: tenantInvoices.filter(inv => inv.status === 'unpaid' || inv.status === 'pending').length
        }
      };
    });
    
    setTenants(enhancedTenants);
    console.log('Enhanced tenants with room info and financial data:', enhancedTenants?.[0]);
  };
  const fetchTenants = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Since backend filters aren't working properly, we'll fetch all tenants
      // and do client-side filtering for better user experience
      const params = {
        page: 1, // Always fetch page 1 for client-side filtering
        limit: 100, // Fetch more records for client-side filtering
        sortBy: 'distanceToCampus',
        sortOrder: 'asc'
      };
      
      // Add timestamp to prevent caching when force refresh is requested
      if (forceRefresh) {
        params._t = Date.now();
      }
      
      console.log('Fetching all tenants for client-side filtering', forceRefresh ? '(forced refresh)' : '');
      
      const response = await tenantService.getTenants(params);
      console.log('Tenants API response:', response);
      
      // Handle response structure - extract tenants array properly
      const tenantsList = response?.tenants || response?.data?.tenants || [];
      console.log('Extracted tenants list:', tenantsList.length, 'tenants');
      
      // Map API response to frontend expected format
      const mappedTenants = tenantsList.map(tenant => ({
        ...tenant,
        // Map API fields to frontend expected fields for compatibility
        tenant_id: tenant.tenantId,
        name: tenant.user?.fullName,
        email: tenant.user?.email,
        type: tenant.tenantType?.name,
        // Determine computed status: active if has approved booking, non active otherwise
        computed_status: tenant.bookings?.some(booking => booking.bookingStatus === 'approved') ? 'active' : 'non active',
        // Create financial summary from statistics
        financial_summary: {
          total_paid: tenant.statistics?.totalAmountPaid || 0,
          outstanding_balance: tenant.statistics?.outstandingAmount || 0,
          total_invoices: tenant.statistics?.totalBookings || 0
        },
        // Map current room assignment
        current_room: tenant.currentRoomAssignment ? {
          number: tenant.currentRoomAssignment.roomName || `Room ${tenant.currentRoomAssignment.roomId}`,
          type: 'Standard'
        } : null
      }));
      
      console.log('Mapped tenants with affirmasi status:', mappedTenants.filter(t => t.tenantId === 9).map(t => ({
        tenantId: t.tenantId,
        name: t.name,
        isAfirmasi: t.isAfirmasi,
        jurusan: t.jurusan
      })));
      
      // Store all tenants without filtering for client-side processing
      setAllTenants(mappedTenants);
      setTenantsEnhanced(false); // Reset enhancement flag
      
      // Fetch invoices for the loaded tenants
      if (mappedTenants.length > 0) {
        await fetchInvoicesForTenants(mappedTenants);
      }
      
      // If rooms are already loaded, enhance the data immediately
      if (rooms.length > 0) {
        setTimeout(() => {
          enhanceTenantData();
          setTenantsEnhanced(true);
        }, 100);
      }
      
      // Apply initial filtering
      const filteredTenants = applyClientSideFilters(mappedTenants);
      setTenants(filteredTenants);
      
      setPagination(prev => ({
        ...prev,
        total: filteredTenants.length
      }));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };  const fetchInvoicesForTenants = async (tenantsList = tenants) => {
    if (tenantsList.length === 0) return;
    
    try {
      console.log('Fetching invoices for tenants:', tenantsList.length);
      const invoicesMap = {};
      
      // Fetch invoices for each tenant
      await Promise.all(
        tenantsList.map(async (tenant) => {
          const tenantId = tenant.tenant_id || tenant.tenantId;
          if (tenantId) {
            try {
              const invoiceResponse = await tenantService.getTenantInvoices(tenantId);
              const invoices = invoiceResponse?.invoices || invoiceResponse?.data?.invoices || [];
              invoicesMap[tenantId] = invoices;
              console.log(`Invoices for tenant ${tenantId}:`, invoices);
            } catch (error) {
              console.error(`Error fetching invoices for tenant ${tenantId}:`, error);
              invoicesMap[tenantId] = [];
            }
          }
        })
      );
      
      setInvoicesData(invoicesMap);
      console.log('All invoices fetched:', invoicesMap);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchAllInvoices = async () => {
    return fetchInvoicesForTenants(tenants);
  };

  const handleViewDetails = async (tenantId) => {
    try {
      console.log('Attempting to fetch tenant details for ID:', tenantId);
      
      // Fetch tenant details
      const tenantResponse = await tenantService.getTenantById(tenantId);
      console.log('Received tenant API response:', tenantResponse);
      
      // Extract tenant data from the response structure
      const tenantDetails = tenantResponse?.tenant || tenantResponse;      // Fetch additional tenant data (documents, payments, bookings)
      console.log('Fetching additional data for tenant:', tenantId);
        // Try to fetch payments directly first to debug
      try {
        console.log('Attempting direct payment fetch...');
        const directPaymentResponse = await tenantService.getTenantPaymentHistory(tenantId);
        console.log('Direct payment response:', directPaymentResponse);
        
        // Also try a direct axios call to double-check
        const api = (await import('../../utils/apiClient')).default;
        const axiosResponse = await api.get(`/tenants/${tenantId}/payments`);
        console.log('Direct axios payment response:', axiosResponse.data);
      } catch (directError) {
        console.error('Direct payment fetch failed:', directError);
      }
      
      const [documentsResponse, paymentsResponse, bookingsResponse] = await Promise.allSettled([
        tenantService.getTenantDocuments(tenantId),
        tenantService.getTenantPaymentHistory(tenantId),
        tenantService.getTenantBookings(tenantId)
      ]);
        console.log('Documents response:', documentsResponse);
      console.log('Payments response:', paymentsResponse);
      console.log('Bookings response:', bookingsResponse);
      
      // Log any API failures
      if (documentsResponse.status === 'rejected') {
        console.error('Documents API failed:', documentsResponse.reason);
      }
      if (paymentsResponse.status === 'rejected') {
        console.error('Payments API failed:', paymentsResponse.reason);
      }
      if (bookingsResponse.status === 'rejected') {
        console.error('Bookings API failed:', bookingsResponse.reason);
      }
        // Find assigned room
      const assignedRoom = rooms.find(room => 
        room.occupants?.some(occupant => 
          occupant.tenantId === tenantId && 
          occupant.status === 'approved'
        )
      );
      
      // Get the occupant details for additional info
      const occupantDetails = assignedRoom?.occupants?.find(occupant => 
        occupant.tenantId === tenantId && 
        occupant.status === 'approved'
      );
        // Enhance tenant details with additional information
      const enhancedTenantDetails = {
        ...tenantDetails,
        current_room: assignedRoom ? {
          ...assignedRoom,
          number: assignedRoom.name,
          type: assignedRoom.classification?.name || 'Standard',
          occupant_details: occupantDetails
        } : null,
        computed_status: assignedRoom ? 'active' : 'non active',        documents: documentsResponse.status === 'fulfilled' ? 
          (documentsResponse.value?.documents || documentsResponse.value?.data?.documents || []) : [],
        payments: paymentsResponse.status === 'fulfilled' ? 
          (paymentsResponse.value?.payments || paymentsResponse.value?.data?.payments || []) : [],
        bookings: bookingsResponse.status === 'fulfilled' ? 
          (bookingsResponse.value?.bookings || bookingsResponse.value?.data?.bookings || []) : []
      };
      
      console.log('Extracted payments array:', enhancedTenantDetails.payments);
      console.log('Extracted bookings array:', enhancedTenantDetails.bookings);
      console.log('Extracted documents array:', enhancedTenantDetails.documents);
      
      console.log('Enhanced tenant details:', enhancedTenantDetails);
      
      setSelectedTenant(enhancedTenantDetails);
      onOpen();
    } catch (err) {
      console.error('Error fetching tenant details:', err);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateTenant = async (tenantId, updateData) => {
    try {
      await tenantService.updateTenant(tenantId, updateData);
      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTenants();
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle edit tenant
  const handleEditTenant = async (tenantId) => {
    try {
      console.log('Opening edit modal for tenant ID:', tenantId);
      
      // Fetch tenant details for editing
      const tenantResponse = await tenantService.getTenantById(tenantId);
      const tenantDetails = tenantResponse?.tenant || tenantResponse;
      
      console.log('Fetched tenant details for editing:', tenantDetails);
      
      setSelectedTenantForEdit(tenantDetails);
      onEditOpen();
    } catch (err) {
      console.error('Error fetching tenant for edit:', err);
      toast({
        title: 'Error',
        description: 'Gagal memuat data penyewa untuk diedit',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle tenant update from edit modal
  const handleTenantUpdated = async () => {
    // Refresh the tenants list after successful update
    console.log('Refreshing tenant data after update...');
    
    // Clear existing data first to force a clean reload
    setAllTenants([]);
    setTenants([]);
    
    // Force refresh with timestamp to prevent caching
    await fetchTenants(true);
    
    // Also refresh room data to ensure everything is up to date
    if (rooms.length > 0) {
      console.log('Enhancing tenant data after update...');
      setTimeout(() => {
        enhanceTenantData();
        setTenantsEnhanced(true);
      }, 200);
    }
    
    console.log('Tenant data refresh completed');
  };

  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await tenantService.deleteTenant(tenantId);
        toast({
          title: 'Success',
          description: 'Tenant deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchTenants();
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Export tenants as CSV
  const handleExport = () => {
    if (!tenants || tenants.length === 0) {
      alert('No tenant data to export.');
      return;
    }
    // Define professional CSV headers
    const headers = [
      'ID Penyewa', 'Nama Lengkap', 'Email', 'Nomor HP', 'Tipe Penyewa', 'Jenis Kelamin', 'Alamat', 'NIM', 'Jurusan',
      'Status Verifikasi', 'Status Penyewa', 'Nama Kamar', 'Tanggal Registrasi', 'Total Booking', 'Booking Aktif', 'Booking Selesai',
      'Total Pembayaran', 'Tagihan Belum Lunas', 'Rata-rata Pembayaran Bulanan', 'Jarak ke Kampus (km)', 'Tanggal Terakhir Pembayaran'
    ];
    // Map tenants to CSV rows
    const rows = tenants.map(tenant => [
      tenant.tenant_id || tenant.tenantId || '',
      tenant.name || tenant.user?.fullName || '',
      tenant.email || tenant.user?.email || '',
      tenant.phone || '',
      tenant.type || tenant.tenantType?.name || '',
      tenant.gender === 'L' ? 'Laki-laki' : tenant.gender === 'P' ? 'Perempuan' : '',
      tenant.address || '',
      tenant.nim || '',
      tenant.jurusan || '',
      tenant.isVerified ? 'Terverifikasi' : 'Belum',
      tenant.computed_status || tenant.status || '',
      tenant.current_room?.number || tenant.currentRoomAssignment?.roomName || '',
      tenant.statistics?.registrationDate || tenant.createdAt || '',
      tenant.statistics?.totalBookings || '',
      tenant.statistics?.activeBookings || '',
      tenant.statistics?.completedBookings || '',
      tenant.statistics?.totalAmountPaid || tenant.financial_summary?.total_paid || 0,
      tenant.statistics?.outstandingAmount || tenant.financial_summary?.outstanding_balance || 0,
      tenant.statistics?.averageMonthlyPayment || '',
      tenant.distanceToCampus || '',
      tenant.statistics?.lastPaymentDate || ''
    ]);
    // Build CSV string
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    // Download as file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenants_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'non active': return 'gray';
      case 'inactive': return 'gray'; // Legacy fallback
      case 'pending': return 'yellow'; // Legacy fallback
      case 'suspended': return 'red'; // Legacy fallback
      default: return 'gray';
    }
  };
  const getTypeColor = (type) => {
    switch (type) {
      case 'mahasiswa': return 'blue';
      case 'non_mahasiswa': return 'purple';
      default: return 'gray';
    }
  };

  const getDistanceColor = (distance) => {
    if (!distance || distance === 0) return 'gray';
    const dist = parseFloat(distance);
    if (isNaN(dist)) return 'gray';
    if (dist > 20) return 'green';  // Far distances are now high priority (green)
    if (dist > 10) return 'yellow'; // Medium-far distances are medium priority
    if (dist > 5) return 'orange';  // Medium-close distances are lower priority
    return 'red';                  // Closest distances are lowest priority (red)
  };

  const getDistanceCategory = (distance) => {
    if (!distance || distance === 0) return 'Jarak Tidak Diketahui';
    const dist = parseFloat(distance);
    if (isNaN(dist)) return 'Data Jarak Tidak Valid';
    if (dist > 20) return 'Jauh - Prioritas Tinggi';
    if (dist > 10) return 'Sedang - Prioritas Menengah';
    if (dist > 5) return 'Dekat - Prioritas Rendah';
    return 'Sangat Dekat - Prioritas Terendah';
  };

  const formatDistance = (distance) => {
    if (!distance || distance === 0) return 'Tidak diketahui';
    const dist = parseFloat(distance);
    if (isNaN(dist)) return 'Tidak valid';
    return `${dist.toFixed(1)} km`;
  };

  // Client-side filtering function since backend filters aren't working
  const applyClientSideFilters = (tenantsToFilter = allTenants) => {
    let filtered = [...tenantsToFilter];
    
    // Apply search filter
    const searchQuery = (filters.search || searchTerm || '').toLowerCase().trim();
    if (searchQuery) {
      filtered = filtered.filter(tenant => {
        const name = (tenant.name || tenant.user?.fullName || '').toLowerCase();
        const email = (tenant.email || tenant.user?.email || '').toLowerCase();
        const nim = (tenant.nim || '').toLowerCase();
        const phone = (tenant.phone || '').toLowerCase();
        
        return name.includes(searchQuery) || 
               email.includes(searchQuery) || 
               nim.includes(searchQuery) || 
               phone.includes(searchQuery);
      });
    }
    
    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(tenant => {
        const tenantType = tenant.type || tenant.tenantType?.name;
        return tenantType === filters.type;
      });
    }
    
    // Apply gender filter
    if (filters.gender) {
      const targetGender = filters.gender === 'male' ? 'L' : 'P';
      filtered = filtered.filter(tenant => tenant.gender === targetGender);
    }
    
    // Apply status filter (based on computed status)
    if (filters.status) {
      filtered = filtered.filter(tenant => {
        const status = tenant.computed_status || 
                      (tenant.currentRoomAssignment ? 'active' : 
                       (tenant.isVerified ? 'inactive' : 'pending'));
        return status === filters.status;
      });
    }
    
    // Apply distance range filter
    if (filters.distanceRange) {
      filtered = filtered.filter(tenant => {
        const distance = parseFloat(tenant.distanceToCampus || 0);
        
        switch (filters.distanceRange) {
          case '0-5':
            return distance >= 0 && distance <= 5;
          case '5-10':
            return distance > 5 && distance <= 10;
          case '10-20':
            return distance > 10 && distance <= 20;
          case '20-50':
            return distance > 20 && distance <= 50;
          case '50+':
            return distance > 50;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'distanceToCampus';
    const sortOrder = filters.sortOrder || 'asc';
    
    console.log(`Applying sort: ${sortBy} ${sortOrder} to ${filtered.length} tenants`);
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'distanceToCampus':
        case 'distance_to_campus':
          aValue = parseFloat(a.distanceToCampus || 0);
          bValue = parseFloat(b.distanceToCampus || 0);
          break;
        case 'name':
          aValue = (a.name || a.user?.fullName || '').toLowerCase();
          bValue = (b.name || b.user?.fullName || '').toLowerCase();
          break;
        case 'created_at':
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'status':
          aValue = a.computed_status || 'non active';
          bValue = b.computed_status || 'non active';
          break;
        default:
          return 0;
      }
      
      // For distance sorting, handle special cases
      if (sortBy === 'distanceToCampus' || sortBy === 'distance_to_campus') {
        // Handle null/undefined values - put them at the end
        if (aValue === 0 && bValue === 0) return 0;
        if (aValue === 0) return sortOrder === 'asc' ? 1 : -1;
        if (bValue === 0) return sortOrder === 'asc' ? -1 : 1;
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    console.log(`After sorting by ${sortBy} ${sortOrder}:`, 
      filtered.slice(0, 5).map(t => ({
        name: t.name || t.user?.fullName,
        distance: t.distanceToCampus,
        status: t.computed_status
      }))
    );
    
    console.log(`Applied filters - ${filtered.length} tenants remain from ${tenantsToFilter.length}`);
    console.log('Active filters:', { searchQuery, ...filters });
    
    return filtered;
  };

  // Get paginated tenants for display
  const getPaginatedTenants = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return tenants.slice(startIndex, endIndex);
  };

  if (error) {
    return (
      <AdminLayout>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          {error}
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        {/* Page Header */}
        <Flex justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">Manajemen Penghuni</Heading>
            <Text color="gray.600">
              Kelola seluruh penghuni dan informasi mereka - saat ini diurutkan berdasarkan {
                filters.sortBy === 'distanceToCampus' 
                  ? `jarak ke kampus (${filters.sortOrder === 'asc' ? 'terdekat ke terjauh' : 'terjauh ke terdekat'})`
                  : `${filters.sortBy} (${filters.sortOrder === 'asc' ? 'naik' : 'turun'})`
              }
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Button leftIcon={<FiDownload />} variant="outline" onClick={handleExport}>
              Ekspor
            </Button>
            {/* Removed Add Tenant button */}
          </HStack>
        </Flex>
        {/* Unified Filters Section */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              {/* Search and Basic Filters */}
              <Box w="full">
                <Text fontWeight="semibold" mb={3} color="blue.600">
                  <Icon as={FiSearch} mr={2} />
                  Pencarian dan Filter Penyewa
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Cari nama, email, NIM..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  <Select
                    placeholder="Semua Tipe"
                    value={filters.type}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, type: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="non_mahasiswa">Non-Mahasiswa</option>
                  </Select>
                  <Select
                    placeholder="Semua Status"
                    value={filters.status}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, status: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="active">Aktif</option>
                    <option value="non active">Tidak Aktif</option>
                  </Select>
                  <Select
                    placeholder="Semua Gender"
                    value={filters.gender}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, gender: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </Select>
                </Grid>
              </Box>
              
              <Divider />
              
              {/* Distance Filter and Sorting */}
              <Box w="full">
                <Text fontWeight="semibold" mb={3} color="purple.600">
                  <Icon as={FiMapPin} mr={2} />
                  Filter Jarak ke Kampus & Pengurutan
                </Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                  <Select
                    placeholder="Semua Jarak"
                    value={filters.distanceRange}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, distanceRange: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    borderColor="purple.300"
                    _focus={{ borderColor: "purple.500" }}
                  >
                    <option value="0-5">0-5 km (Sangat Dekat)</option>
                    <option value="5-10">5-10 km (Dekat)</option>
                    <option value="10-20">10-20 km (Sedang)</option>
                    <option value="20-50">20-50 km (Jauh)</option>
                    <option value="50+">50+ km (Sangat Jauh)</option>
                  </Select>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, sortBy: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    borderColor="purple.300"
                  >
                    <option value="distanceToCampus">Urutkan berdasarkan Jarak</option>
                    <option value="name">Urutkan berdasarkan Nama</option>
                    <option value="created_at">Urutkan berdasarkan Tanggal Gabung</option>
                    <option value="status">Urutkan berdasarkan Status</option>
                  </Select>
                  <Select
                    value={filters.sortOrder}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, sortOrder: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    borderColor="purple.300"
                  >
                    {filters.sortBy === 'distanceToCampus' ? (
                      <>
                        <option value="asc">Terdekat ke Terjauh (Prioritas Tinggi dulu)</option>
                        <option value="desc">Terjauh ke Terdekat (Jarak Jauh dulu)</option>
                      </>
                    ) : (
                      <>
                        <option value="asc">Naik (A-Z, Lama ke Baru)</option>
                        <option value="desc">Turun (Z-A, Baru ke Lama)</option>
                      </>
                    )}
                  </Select>
                </Grid>
              </Box>
              
              {/* Clear Filters Button & Active Filters Summary */}
              <Box w="full">
                <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
                  <Button
                    leftIcon={<FiFilter />}
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({
                        search: '',
                        type: '',
                        status: '',
                        gender: '',
                        distanceRange: '',
                        sortBy: 'distanceToCampus',
                        sortOrder: 'asc'
                      });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    Reset Semua Filter
                  </Button>
                  
                  {/* Active Filters Summary */}
                  <HStack spacing={2} flex="1" justify="flex-end" wrap="wrap">
                    {(searchTerm || filters.search) && (
                      <Badge colorScheme="blue" variant="subtle">
                        Pencarian: {searchTerm || filters.search}
                      </Badge>
                    )}
                    {filters.type && (
                      <Badge colorScheme="green" variant="subtle">
                        Tipe: {filters.type === 'mahasiswa' ? 'Mahasiswa' : 'Non-Mahasiswa'}
                      </Badge>
                    )}
                    {filters.status && (
                      <Badge colorScheme="orange" variant="subtle">
                        Status: {filters.status}
                      </Badge>
                    )}
                    {filters.gender && (
                      <Badge colorScheme="purple" variant="subtle">
                        Gender: {filters.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                      </Badge>
                    )}
                    {filters.distanceRange && (
                      <Badge colorScheme="teal" variant="subtle">
                        Jarak: {filters.distanceRange} km
                      </Badge>
                    )}
                    {filters.sortBy !== 'distanceToCampus' && (
                      <Badge colorScheme="gray" variant="subtle">
                        Urut: {filters.sortBy}
                      </Badge>
                    )}
                  </HStack>
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
        {/* Tenants Table */}
        <Card>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Penghuni</Th>
                    <Th>Tipe</Th>
                    <Th>Kontak</Th>
                    <Th cursor="pointer">
                      <HStack spacing={1}>
                        <Icon as={FiMapPin} />
                        <Text>Jarak ke Kampus</Text>
                        {filters.sortBy === 'distanceToCampus' && (
                          <Badge size="sm" colorScheme="purple" variant="outline">
                            {filters.sortOrder === 'asc' ? '↑ Terdekat dulu' : '↓ Terjauh dulu'}
                          </Badge>
                        )}
                      </HStack>
                    </Th>
                    <Th>Kamar</Th>
                    <Th>Keuangan</Th>
                    <Th>Status</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                {/* Table Body */}
                <Tbody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <Tr key={`skeleton-${index}`}>
                        <Td><Skeleton height="40px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                        <Td><Skeleton height="20px" /></Td>
                      </Tr>
                    ))
                  ) : tenants.length > 0 ? (
                    getPaginatedTenants().map((tenant) => (
                      <Tr key={tenant.tenant_id || tenant.tenantId}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar
                              size="sm"
                              name={tenant.name || tenant.user?.fullName}
                              src={tenant.profile_picture}
                            />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="medium">{String(tenant.name || tenant.user?.fullName || 'N/A')}</Text>
                              <Text fontSize="sm" color="gray.500">
                                ID: {String(tenant.tenant_id || tenant.tenantId || 'N/A')}
                              </Text>
                              {(tenant.nim) && (
                                <Text fontSize="xs" color="blue.500">
                                  NIM: {String(tenant.nim)}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <Badge colorScheme={getTypeColor(tenant.type || tenant.tenantType?.name)}>
                              {(tenant.type === 'mahasiswa' || tenant.tenantType?.name === 'mahasiswa') ? 'Mahasiswa' : 'Non-Mahasiswa'}
                            </Badge>
                            {/* Show additional info for students */}
                            {(tenant.type === 'mahasiswa' || tenant.tenantType?.name === 'mahasiswa') && (
                              <>
                                {tenant.jurusan && (
                                  <Text fontSize="xs" color="blue.600" fontWeight="medium">
                                    📚 {tenant.jurusan}
                                  </Text>
                                )}
                                {tenant.isAfirmasi !== undefined && (
                                  <Badge 
                                    size="sm" 
                                    colorScheme={tenant.isAfirmasi ? "orange" : "gray"}
                                    variant="subtle"
                                  >
                                    {tenant.isAfirmasi ? "🎯 Afirmasi" : "Reguler"}
                                  </Badge>
                                )}
                              </>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <HStack spacing={1}>
                              <FiMail size={12} />
                              <Text fontSize="sm">{String(tenant.email || tenant.user?.email || 'N/A')}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <FiPhone size={12} />
                              <Text fontSize="sm">{String(tenant.phone || 'N/A')}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1} align="flex-start">
                            <HStack spacing={2}>
                              <Icon as={FiMapPin} color={`${getDistanceColor(tenant.distanceToCampus)}.500`} />
                              <Badge 
                                colorScheme={getDistanceColor(tenant.distanceToCampus)}
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                              >
                                {formatDistance(tenant.distanceToCampus)}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {getDistanceCategory(tenant.distanceToCampus)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          {tenant.current_room ? (
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="medium">
                                Kamar {tenant.current_room.number}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {tenant.current_room.type}
                              </Text>
                            </VStack>
                          ) : (
                            <Text color="gray.500">Belum ada kamar</Text>
                          )}
                        </Td>

                        {/* Financial Summary */}
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <HStack spacing={1}>
                              <Icon as={FiCreditCard} color="green.500" boxSize={3} />
                              <Text fontSize="xs" color="green.600" fontWeight="medium">
                                Lunas: Rp {(tenant.financial_summary?.total_paid || 0).toLocaleString()}
                              </Text>
                            </HStack>
                            {tenant.financial_summary?.outstanding_balance > 0 && (
                              <HStack spacing={1}>
                                <Icon as={FiCreditCard} color="red.500" boxSize={3} />
                                <Text fontSize="xs" color="red.600" fontWeight="medium">
                                  Tagihan: Rp {tenant.financial_summary.outstanding_balance.toLocaleString()}
                                </Text>
                              </HStack>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {tenant.financial_summary?.total_invoices || 0} tagihan
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(tenant.computed_status || tenant.status)}>
                            {(() => {
                              const status = String(tenant.computed_status || tenant.status || 'Unknown');
                              if (status === 'active') return 'Aktif';
                              if (status === 'inactive') return 'Tidak Aktif';
                              if (status === 'pending') return 'Menunggu';
                              if (status === 'suspended') return 'Ditangguhkan';
                              return status;
                            })()}
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
                                onClick={() => handleViewDetails(tenant.tenant_id || tenant.tenantId)}
                              >
                                Lihat Detail
                              </MenuItem>
                              <MenuItem
                                icon={<FiEdit />}
                                onClick={() => handleEditTenant(tenant.tenant_id || tenant.tenantId)}
                                color="blue.600"
                              >
                                Edit Data Penyewa
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={8} textAlign="center" py={8}>
                        <VStack spacing={3}>
                          <Text color="gray.500" fontSize="lg">
                            {allTenants.length > 0 ? 'Tidak ada penghuni yang sesuai dengan filter' : 'Tidak ada penghuni ditemukan'}
                          </Text>
                          {allTenants.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSearchTerm('');
                                setFilters({
                                  search: '',
                                  type: '',
                                  status: '',
                                  gender: '',
                                  distanceRange: '',
                                  sortBy: 'distanceToCampus',
                                  sortOrder: 'asc'
                                });
                              }}
                            >
                              Reset Filter
                            </Button>
                          )}
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
            
            {/* Empty State */}
            {!loading && tenants.length === 0 && (
              <VStack spacing={4} py={12} px={6} textAlign="center">
                <Icon as={FiUsers} size="48px" color="gray.400" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                    Tidak ada penghuni ditemukan
                  </Text>
                  <Text fontSize="sm" color="gray.500" maxW="md">
                    {allTenants.length === 0 
                      ? "Belum ada data penghuni yang terdaftar."
                      : "Tidak ada penghuni yang sesuai dengan filter yang dipilih. Coba ubah atau hapus beberapa filter."
                    }
                  </Text>
                </VStack>
                {allTenants.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={() => {
                      setFilters({
                        search: '',
                        type: '',
                        status: '',
                        gender: '',
                        distanceRange: '',
                        sortBy: 'distance_to_campus',
                        sortOrder: 'asc'
                      });
                      setSearchTerm('');
                    }}
                  >
                    Hapus Semua Filter
                  </Button>
                )}
              </VStack>
            )}
            
            {/* Pagination */}
            {!loading && tenants.length > 0 && (
              <Flex justify="space-between" align="center" p={4} borderTop="1px" borderColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  Menampilkan {tenants.length > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} sampai{' '}
                  {Math.min(pagination.page * pagination.limit, tenants.length)} dari{' '}
                  {tenants.length} hasil
                  {tenants.length !== allTenants.length && (
                    <Text as="span" color="blue.600" ml={2}>
                      (difilter dari {allTenants.length} total penghuni)
                    </Text>
                  )}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page * pagination.limit >= tenants.length}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Berikutnya
                  </Button>
                </HStack>
              </Flex>
            )}
          </CardBody>
        </Card>
        {/* Tenant Detail Modal */}
        <TenantDetailModal
          isOpen={isOpen}
          onClose={onClose}
          tenant={selectedTenant}
          onUpdate={handleUpdateTenant}
        />
        
        {/* Tenant Edit Modal */}
        <TenantEditModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          tenant={selectedTenantForEdit}
          onUpdate={handleTenantUpdated}
        />
      </VStack>
    </AdminLayout>
  );
};

export default TenantManagement;
