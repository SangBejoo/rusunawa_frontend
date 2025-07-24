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
  Avatar,
  Progress,
  SimpleGrid,
  Tooltip
} from '@chakra-ui/react';
import {  FiSearch,
  FiFilter,
  FiEye,
  FiMessageSquare,
  FiUser,
  FiMoreVertical,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiTool,
  FiHome,  
  FiZap,
  FiDroplet,
  FiWifi,
  FiThermometer,
  FiPlus,  
  FiRefreshCw,
  FiCheck,
  FiX,
  FiImage,
  FiTag
} from 'react-icons/fi';
import { MdAssignment as FiAssignmentIn } from 'react-icons/md';
import AdminLayout from '../../components/layout/AdminLayout';
import issueService from '../../services/issueService';
import IssueDetailModal from '../../components/modals/IssueDetailModal';
import EnhancedIssueDetailModal from '../../components/modals/EnhancedIssueDetailModal';
import SimpleIssueStatusModal from '../../components/modals/SimpleIssueStatusModal';
import IssuePriorityModal from '../../components/modals/IssuePriorityModal';
import { Pagination } from '../../components/common/Pagination';

const STATUS_LABELS_ID = {
  open: 'Terbuka',
  in_progress: 'Sedang Dikerjakan',
  resolved: 'Terselesaikan',
  closed: 'Ditutup',
  on_hold: 'Ditunda',
};
const PRIORITY_LABELS_ID = {
  low: 'Biasa',
  medium: 'Segera',
  high: 'Mendesak',
};

const IssueManagement = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('reportedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIssue, setSelectedIssue] = useState(null);  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    high_priority: 0,
    critical_priority: 0,
    low_priority: 0,
    medium_priority: 0,
    no_priority: 0,
    with_attachments: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Unified pagination state
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
    isOpen: isStatusUpdateOpen, 
    onOpen: onStatusUpdateOpen, 
    onClose: onStatusUpdateClose 
  } = useDisclosure();

  const { 
    isOpen: isPriorityModalOpen, 
    onOpen: onPriorityModalOpen, 
    onClose: onPriorityModalClose 
  } = useDisclosure();

  const toast = useToast();

  useEffect(() => {
    fetchIssues();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);
  
  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        sortBy,
        sortOrder,
      };
      const response = await issueService.getIssues(params);
      const issuesList = response.issues || response.data || [];
      const totalCount = response.totalCount || issuesList.length;
      
      setIssues(issuesList);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        totalPages: Math.ceil(totalCount / prev.limit)
      }));

      // Keep for backward compatibility
      setPage(pagination.page);
      setPageSize(pagination.limit);
      setTotalCount(totalCount);

      // Try to use backend stats if available (future-proof)
      if (response.stats && typeof response.stats === 'object') {
        setStats(response.stats);
      } else {
        // Fetch all issues for stats (with current filters, but no pagination)
        const allParams = {
          ...params,
          page: 1,
          limit: 500, // Use higher limit to get all issues for accurate stats
        };
        const allResponse = await issueService.getIssues(allParams);
        const allIssues = allResponse.issues || allResponse.data || [];
        const totalCount = allResponse.totalCount || allResponse.total || allIssues.length;
        const currentDate = new Date();
        // Remove overdue from stats calculation and UI
        const stats = allIssues.reduce((acc, issue) => {
          acc.total++;
          // Count by status
          const status = (issue.status || '').toLowerCase();
          switch (status) {
            case 'open':
              acc.open++;
              break;
            case 'in_progress':
              acc.in_progress++;
              break;
            case 'resolved':
              acc.resolved++;
              break;
            case 'closed':
              acc.closed++;
              break;
            default:
              break;
          }
          // Count by priority
          const priority = (issue.priority || '').toLowerCase();
          switch (priority) {
            case 'high':
              acc.high_priority++;
              break;
            case 'critical':
              acc.critical_priority++;
              break;
            case 'low':
              acc.low_priority++;
              break;
            case 'medium':
              acc.medium_priority++;
              break;
            default:
              // Count issues without priority
              if (!issue.priority) {
                acc.no_priority++;
              }
              break;
          }
          // Count issues with attachments
          if ((issue.attachmentCount || issue.attachment_count || issue.totalAttachments || 0) > 0 || issue.hasImageAttachment) {
            acc.with_attachments++;
          }
          // Overdue removed
          return acc;
        }, {
          total: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          high_priority: 0,
          critical_priority: 0,
          low_priority: 0,
          medium_priority: 0,
          no_priority: 0,
          with_attachments: 0
        });
        
        // Ensure total count is accurate from API response
        stats.total = totalCount;
        
        setStats(stats);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch issues',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    onDetailOpen();
  };

  const handleUpdateStatus = (issue) => {
    setSelectedIssue(issue);
    onStatusUpdateOpen();
  };

  const handleAssignPriority = (issue) => {
    setSelectedIssue(issue);
    onPriorityModalOpen();
  };

  const onIssueUpdated = () => {
    fetchIssues();
    onDetailClose();
  };

  const onPriorityUpdated = async () => {
    // Force refresh the issues list with a slight delay to ensure backend is updated
    setTimeout(async () => {
      await fetchIssues();
      
      // If there's a selected issue and a detail modal is open, update the selected issue with fresh data
      if (selectedIssue && isDetailOpen) {
        try {
          const updatedIssue = await issueService.getIssueById(selectedIssue.issueId || selectedIssue.id);
          const issueData = updatedIssue.issue || updatedIssue;
          console.log('Updated issue data:', issueData);
          setSelectedIssue(issueData);
        } catch (error) {
          console.error('Error fetching updated issue:', error);
        }
      }
    }, 500); // Small delay to ensure backend processing is complete
    
    onPriorityModalClose();
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    setPage(newPage); // Keep for backward compatibility
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: parseInt(newLimit)
    }));
    setPage(1); // Keep for backward compatibility
    setPageSize(parseInt(newLimit)); // Keep for backward compatibility
  };

  // Filter handlers with pagination reset
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setPage(1); // Keep for backward compatibility
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setPage(1); // Keep for backward compatibility
  };

  const handlePriorityFilterChange = (e) => {
    setPriorityFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setPage(1); // Keep for backward compatibility
  };

  const filteredIssues = issues
    .filter(issue => {
      const matchesSearch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.room_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || issue.status === statusFilter;
      
      // Handle priority filtering including "no_priority" case
      let matchesPriority = !priorityFilter;
      if (priorityFilter === 'no_priority') {
        matchesPriority = !issue.priority || issue.priority === '';
      } else if (priorityFilter) {
        matchesPriority = issue.priority === priorityFilter;
      }
      
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      const getValue = (item) => {
        switch (sortBy) {
          case 'priority':
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[item.priority?.toLowerCase()] || 0;
          case 'reportedAt':
            return new Date(item.reportedAt).getTime();
          case 'status':
            return item.status;
          case 'issueId':
            return item.issueId;
          default:
            return item[sortBy] || '';
        }
      };
      
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'orange';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      case 'on_hold': return 'yellow';
      default: return 'gray';
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'orange';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'low': return FiCheckCircle;
      case 'medium': return FiClock;
      case 'high': return FiAlertCircle;
      case 'critical': return FiZap;
      default: return FiClock;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'maintenance': return FiTool;
      case 'electrical': return FiZap;
      case 'plumbing': return FiDroplet;
      case 'internet': return FiWifi;
      case 'hvac': return FiThermometer;
      case 'room': return FiHome;
      default: return FiAlertCircle;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'maintenance': return 'orange';
      case 'electrical': return 'yellow';
      case 'plumbing': return 'blue';
      case 'internet': return 'purple';
      case 'hvac': return 'cyan';
      case 'room': return 'green';
      default: return 'gray';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Component for assignee display based on status (simple approach)
  const AssigneeCell = ({ issue }) => {
    const getAssignmentInfo = (status) => {
      switch (status?.toLowerCase()) {
        case 'in_progress':
          return {
            text: 'Ditugaskan (Sedang Dikerjakan)',
            color: 'blue.500',
            bgColor: 'blue.50',
            icon: FiTool
          };        case 'resolved':
          return {
            text: 'Terselesaikan',
            color: 'green.500',
            bgColor: 'green.50',
            icon: FiCheckCircle
          };
        case 'closed':
          return {
            text: 'Ditutup',
            color: 'gray.500',
            bgColor: 'gray.50',
            icon: FiX
          };
        case 'open':
        default:
          return {
            text: 'Belum Ditugaskan',
            color: 'orange.500',
            bgColor: 'orange.50',
            icon: FiClock
          };
      }
    };

    const assignmentInfo = getAssignmentInfo(issue.status);
    const IconComponent = assignmentInfo.icon;

    return (
      <Box
        p={2}
        borderRadius="md"
        bg={assignmentInfo.bgColor}
        borderWidth="1px"
        borderColor={assignmentInfo.color}
        minW="120px"
      >        <HStack spacing={2}>
          <IconComponent size={14} color={assignmentInfo.color} />
          <Text fontSize="sm" color={assignmentInfo.color} fontWeight="medium">
            {assignmentInfo.text}
          </Text>
        </HStack>      </Box>
    );
  };

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
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">Manajemen Isu</Text>
            <Text color="gray.600">
              Pantau, tetapkan prioritas, dan selesaikan masalah fasilitas & pemeliharaan
            </Text>
            <Text fontSize="sm" color="purple.600" fontWeight="medium">
              💡 Sebagai admin, Anda dapat menetapkan prioritas pada setiap issue untuk membantu tim maintenance
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Button 
              leftIcon={<FiRefreshCw />} 
              variant="outline"
              onClick={fetchIssues}
            >
              Muat Ulang
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Isu</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiAlertCircle />
                    <Text>Semua isu</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Terbuka</StatLabel>
                <StatNumber color="orange.500">{stats.open}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiClock />
                    <Text>Isu baru</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Sedang Dikerjakan</StatLabel>
                <StatNumber color="blue.500">{stats.in_progress}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTool />
                    <Text>Sedang diproses</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Terselesaikan/Ditutup</StatLabel>
                <StatNumber color="green.500">{stats.resolved + stats.closed}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiCheckCircle />
                    <Text>Isu selesai</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Prioritas Tinggi</StatLabel>
                <StatNumber color="orange.500">{stats.high_priority}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiAlertCircle />
                    <Text>Butuh perhatian</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>


          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Belum Ada Prioritas</StatLabel>
                <StatNumber color="purple.500">{stats.no_priority}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiTag />
                    <Text>Perlu ditetapkan admin</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Dengan Lampiran</StatLabel>
                <StatNumber color="blue.500">{stats.with_attachments}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <FiImage />
                    <Text>Ada gambar/berkas</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Priority Assignment Information */}
        {stats.no_priority > 0 && (
          <Alert status="info" mb={6} borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="bold">
                {stats.no_priority} issue{stats.no_priority > 1 ? 's' : ''} belum memiliki prioritas
              </Text>
              <Text fontSize="sm" mt={1}>
                Sebagai admin, Anda dapat menetapkan prioritas untuk membantu tim maintenance mengutamakan 
                penanganan berdasarkan tingkat urgensi. Klik tombol "Tetapkan Prioritas" pada setiap issue 
                untuk menentukan level prioritas (Low, Medium, High, atau Critical).
              </Text>
            </Box>
          </Alert>
        )}

        {/* Filters */}
        <Card mb={6}>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Cari isu, pelapor, atau kamar..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </GridItem>

              <GridItem>
                <Select
                  placeholder="Filter berdasarkan status"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                >
                  <option value="open">Terbuka</option>
                  <option value="in_progress">Sedang Dikerjakan</option>
                  <option value="resolved">Terselesaikan</option>
                  <option value="closed">Ditutup</option>
                  <option value="on_hold">Ditunda</option>
                </Select>
              </GridItem>              <GridItem>
                <Select
                  placeholder="Filter berdasarkan prioritas"
                  value={priorityFilter}
                  onChange={handlePriorityFilterChange}
                >
                  <option value="no_priority">Belum Ada Prioritas</option>
                  <option value="low">Prioritas Rendah</option>
                  <option value="medium">Prioritas Sedang</option>
                  <option value="high">Prioritas Tinggi</option>
                  <option value="critical">Prioritas Kritis</option>
                </Select>
              </GridItem>              <GridItem>
                <Select
                  placeholder="Urutkan..."
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <option value="reportedAt-desc">Terbaru</option>
                  <option value="reportedAt-asc">Terlama</option>
                  <option value="priority-desc">Prioritas (Tinggi ke Rendah)</option>
                  <option value="priority-asc">Prioritas (Rendah ke Tinggi)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="issueId-desc">ID (Tinggi ke Rendah)</option>
                  <option value="issueId-asc">ID (Rendah ke Tinggi)</option>
                </Select>
              </GridItem>
              
              <GridItem>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">Jumlah per halaman:</Text>
                  <Select
                    width="100px"
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                    <option value="25">25</option>
                  </Select>
                </HStack>
              </GridItem>

              <GridItem>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setPriorityFilter('');
                    setSortBy('reportedAt');
                    setSortOrder('desc');
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  size="md"
                  width="100%"
                >
                  Hapus Semua Filter
                </Button>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Issue Table */}
        <Card>
          <CardBody p={0}>
            {filteredIssues.length === 0 ? (
              <Center p={8}>
                <VStack>
                  <FiAlertCircle size={48} color="gray.300" />
                  <Text fontSize="lg" color="gray.500">Tidak ada isu ditemukan</Text>
                  <Text color="gray.400">Coba ubah filter pencarian Anda</Text>
                </VStack>
              </Center>
            ) : (
              <Box overflowX="auto">                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Isu</Th>
                      <Th>Pelapor</Th>
                      <Th>Kamar</Th>
                      <Th>Prioritas</Th>
                      <Th>Status</Th>
                      <Th>Lampiran</Th>
                      <Th>Status Penugasan</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredIssues.map((issue) => {
                      const CategoryIcon = getCategoryIcon(issue.category);
                      return (
                        <Tr key={issue.issueId} _hover={{ bg: 'gray.50' }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium" fontSize="sm">
                                {issue.title || `Isu #${issue.issueId}`}
                              </Text>
                              <Text fontSize="xs" color="gray.500" noOfLines={2}>
                                {issue.description}
                              </Text>
                              <HStack spacing={2}>
                                <Text fontSize="xs" color="gray.400">
                                  #ID: {issue.issueId}
                                </Text>
                                {issue.category && (
                                  <Badge variant="outline" colorScheme={getCategoryColor(issue.category)} fontSize="xs">
                                    {issue.category}
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="xs" color="gray.400">
                                Dilaporkan: {new Date(issue.reportedAt).toLocaleDateString()} {new Date(issue.reportedAt).toLocaleTimeString()}
                              </Text>                            </VStack>
                          </Td>
                          <Td>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={issue.reporter_name || `Pengguna ${issue.reportedBy}`}
                                src={issue.reporter_photo}
                              />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {issue.reporter_name || `ID Pengguna: ${issue.reportedBy}`}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {issue.reporter_type || 'Penghuni'}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  ID Penyewa: {issue.tenantId}
                                </Text>                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <HStack>
                              <FiHome />
                              <Text fontSize="sm">{issue.room_number || 'Area Umum'}</Text>                            </HStack>
                          </Td>
                          <Td>
                            {issue.priority ? (
                              <HStack spacing={2}>
                                {(() => {
                                  const PriorityIcon = getPriorityIcon(issue.priority);
                                  return <PriorityIcon size={14} color={`var(--chakra-colors-${getPriorityColor(issue.priority)}-500)`} />;
                                })()}
                                <Badge 
                                  colorScheme={getPriorityColor(issue.priority)}
                                  variant="solid"
                                  fontSize="xs"
                                >
                                  {PRIORITY_LABELS_ID[issue.priority?.toLowerCase()]?.toUpperCase() || issue.priority.toUpperCase()}
                                </Badge>
                              </HStack>
                            ) : (
                              <VStack spacing={1} align="start">
                                <Badge variant="outline" colorScheme="red" fontSize="xs">
                                  PRIORITAS BELUM DITETAPKAN
                                </Badge>
                                <Button 
                                  size="xs" 
                                  colorScheme="purple" 
                                  variant="ghost"
                                  leftIcon={<FiTag />}
                                  onClick={() => handleAssignPriority(issue)}
                                >
                                  Tetapkan
                                </Button>
                              </VStack>                            )}
                          </Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(issue.status)}>
                              {STATUS_LABELS_ID[issue.status] || issue.status}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <FiImage />
                                <Badge variant="outline" colorScheme="blue">
                                  {(issue.attachmentCount || issue.attachment_count || issue.totalAttachments || 0)}
                                </Badge>
                                {(issue.attachmentCount || issue.attachment_count || issue.totalAttachments) > 0 && (
                                  <Tooltip label="Isu memiliki lampiran">
                                    <Badge colorScheme="green" size="sm">✓</Badge>
                                  </Tooltip>
                                )}
                              </HStack>
                              {issue.hasImageAttachment && (
                                <Badge colorScheme="purple" variant="outline" fontSize="xs">
                                  ADA GAMBAR
                                </Badge>
                              )}
                              {issue.imageFileUrl && (
                                <Text fontSize="xs" color="blue.500">
                                  📷 Gambar Utama
                                </Text>
                              )}
                              {(issue.commentCount || 0) > 0 && (
                                <HStack>
                                  <FiMessageSquare size={12} />
                                  <Text fontSize="xs" color="gray.500">
                                    {issue.commentCount} komentar
                                  </Text>
                                </HStack>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <AssigneeCell issue={issue} />
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
                                  onClick={() => handleViewIssue(issue)}                                >
                                  Lihat Detail
                                </MenuItem>
                                {issue.status === 'open' && (
                                  <MenuItem 
                                    icon={<FiAssignmentIn />}
                                    onClick={() => handleUpdateStatus(issue)}
                                  >
                                    Mulai Kerjakan
                                  </MenuItem>
                                )}                                {issue.status === 'in_progress' && (
                                  <MenuItem 
                                    icon={<FiCheck />}
                                    color="green.500"
                                    onClick={() => handleUpdateStatus(issue)}
                                  >
                                    Perbarui Status
                                  </MenuItem>
                                )}
                                {issue.status === 'resolved' && (
                                  <MenuItem 
                                    icon={<FiCheck />}
                                    color="blue.500"
                                    onClick={() => handleUpdateStatus(issue)}
                                  >
                                    Tandai Selesai
                                  </MenuItem>
                                )}
                                <MenuItem
                                  icon={<FiMessageSquare />}
                                  onClick={() => handleViewIssue(issue)}                                >
                                  Tambah Komentar
                                </MenuItem>

                                {/* Priority Assignment */}
                                <MenuItem
                                  icon={<FiTag />}
                                  color="purple.500"
                                  onClick={() => handleAssignPriority(issue)}
                                >
                                  {issue.priority ? 'Ubah Prioritas' : 'Tetapkan Prioritas'}
                                </MenuItem>                                {/* Priority-specific suggestions */}
                                {issue.priority === 'critical' && issue.status !== 'resolved' && issue.status !== 'closed' && (
                                  <MenuItem 
                                    icon={<FiZap />}
                                    color="red.500"
                                    onClick={() => handleUpdateStatus(issue)}
                                  >
                                    🚨 Tangani Isu Kritis
                                  </MenuItem>
                                )}
                                
                                {issue.priority === 'high' && issue.status !== 'resolved' && issue.status !== 'closed' && (
                                  <MenuItem 
                                    icon={<FiAlertCircle />}
                                    color="orange.500"
                                    onClick={() => handleUpdateStatus(issue)}
                                  >
                                    ⚡ Prioritaskan Isu Ini
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
            
            {/* Pagination */}
            {!loading && issues.length > 0 && (
              <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
                <Text fontSize="sm" color="gray.600">
                  Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} isu
                </Text>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Modals */}
        <EnhancedIssueDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          issue={selectedIssue}
          onIssueUpdated={onIssueUpdated}
          currentUser={{ id: 1, name: 'Admin User' }} // TODO: Get from auth context
        />
        <SimpleIssueStatusModal
          isOpen={isStatusUpdateOpen}
          onClose={onStatusUpdateClose}
          issue={selectedIssue}
          onIssueUpdated={fetchIssues}
        />
        <IssuePriorityModal
          isOpen={isPriorityModalOpen}
          onClose={onPriorityModalClose}
          issue={selectedIssue}
          onUpdated={onPriorityUpdated}
        />
      </Box>
    </AdminLayout>
  );
};

export default IssueManagement;
