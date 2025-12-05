import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  HStack,
  VStack,
  Text,
  Flex,
  Spacer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  Tooltip
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  ViewIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { FaUsers, FaUserShield, FaUserTie, FaFilter } from 'react-icons/fa';
import userService from '../../services/userService';
import { useAuth } from '../../context/authContext';
import AdminLayout from '../../components/layout/AdminLayout';

// Role configurations - Updated to match database schema
const ROLE_CONFIG = {
  1: { name: 'admin', label: 'Admin', color: 'red', icon: FaUserShield },
  3: { name: 'super_admin', label: 'Super Admin', color: 'purple', icon: FaUserShield },
  4: { name: 'wakil_direktorat', label: 'Wakil Direktorat', color: 'green', icon: FaUserTie }
};

// Available roles for admin and wakil_direktorat management
const MANAGEABLE_ROLES = [
  { value: '', label: 'All Roles' },
  { value: '1', label: 'Admin' },
  { value: '3', label: 'Super Admin' },
  { value: '4', label: 'Wakil Direktorat' }
];

const UserManagement = () => {
  // State
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    roleId: '1',
    password: ''
  });
  const [isEdit, setIsEdit] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    superAdmins: 0,
    wakilDirektorat: 0
  });

  // Hooks
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const { 
    isOpen: isFormOpen, 
    onOpen: onFormOpen, 
    onClose: onFormClose 
  } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const { 
    isOpen: isViewOpen, 
    onOpen: onViewOpen, 
    onClose: onViewClose 
  } = useDisclosure();

  // Colors
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all users by setting a reasonable limit to get all records
      const response = await userService.getUsers({ 
        limit: 100  // Sufficient for admin user management
      });
      
      if (response && response.users) {
        // Filter only admin, super_admin, and wakil_direktorat users
        const manageableUsers = response.users.filter(user => 
          user.role && (user.role.name === 'admin' || user.role.name === 'super_admin' || user.role.name === 'wakil_direktorat')
        );
        
        setUsers(manageableUsers);
        setFilteredUsers(manageableUsers);
        
        // Calculate stats
        const adminCount = manageableUsers.filter(user => user.role.name === 'admin').length;
        const superAdminCount = manageableUsers.filter(user => user.role.name === 'super_admin').length;
        const wakilCount = manageableUsers.filter(user => user.role.name === 'wakil_direktorat').length;
        
        setStats({
          total: manageableUsers.length,
          admins: adminCount,
          superAdmins: superAdminCount,
          wakilDirektorat: wakilCount
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.roleId.toString() === roleFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role?.name.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debug current user (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Current User Info:', {
        user: currentUser,
        role: currentUser?.role,
        roleName: currentUser?.role?.name,
        userId: currentUser?.userId,
        roleId: currentUser?.roleId
      });
    }
  }, [currentUser]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that name field doesn't contain an email
    if (formData.fullName.includes('@')) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid name. Email should be entered in the Email field.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    // Validate that email is properly formatted
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setLoading(true);
      
      if (isEdit && selectedUser) {
        // Update user
        const updateData = {
          fullName: formData.fullName,
          email: formData.email,
          roleId: parseInt(formData.roleId)
        };
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await userService.updateUser(selectedUser.userId, updateData);
        
        toast({
          title: 'Success',
          description: 'User updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new user - map frontend fields to backend requirements
        const createData = {
          name: formData.fullName,  // Backend expects 'name', not 'fullName'
          email: formData.email,
          role: formData.roleId === '1' ? 'admin' : 
                formData.roleId === '3' ? 'super_admin' : 
                'wakil_direktorat',  // Backend expects role string, not roleId
          password: formData.password
        };
        
        await userService.createUser(createData);
        
        toast({
          title: 'Success',
          description: 'User created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Refresh users and close modal
      await fetchUsers();
      handleCloseForm();
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Operation failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDelete = async () => {
    try {
      setLoading(true);
      await userService.deleteUser(deleteUserId);
      
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchUsers();
      onDeleteClose();
      setDeleteUserId(null);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Open create form
  const handleCreate = () => {
    setIsEdit(false);
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      roleId: '1',
      password: ''
    });
    onFormOpen();
  };

  // Open edit form
  const handleEdit = (user) => {
    setIsEdit(true);
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId.toString(),
      password: ''
    });
    onFormOpen();
  };

  // Open view modal
  const handleView = (user) => {
    setSelectedUser(user);
    onViewOpen();
  };

  // Open delete confirmation
  const handleDeleteConfirm = (userId) => {
    setDeleteUserId(userId);
    onDeleteOpen();
  };

  // Close form and reset
  const handleCloseForm = () => {
    setFormData({
      fullName: '',
      email: '',
      roleId: '1',
      password: ''
    });
    setSelectedUser(null);
    setIsEdit(false);
    onFormClose();
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const config = ROLE_CONFIG[role.roleId];
    if (!config) return null;
    
    return (
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
    );
  };

  // Check if current user can manage the target user
  const canManageUser = (targetUser) => {
    if (!currentUser || !targetUser) {
      return false;
    }
    
    // Get current user role name - handle different possible structures
    const currentUserRole = currentUser.role?.name || currentUser.roleName || 
                           (currentUser.roleId === 1 ? 'admin' : 
                            currentUser.roleId === 3 ? 'super_admin' : 
                            currentUser.roleId === 4 ? 'wakil_direktorat' : null);
    
    // Current user cannot manage themselves
    if (currentUser.userId === targetUser.userId) {
      return false;
    }
    
    // Only super_admin can manage (edit/delete) users
    return currentUserRole === 'super_admin';
  };

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <VStack>
            <Spinner size="xl" />
            <Text>Loading users...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="brand.600">
              User Management
            </Heading>
            <Text color="gray.600">
              Manage admin and wakil direktorat users. Only super admins can create, edit, or delete users.
            </Text>
          </VStack>
          
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            onClick={handleCreate}
            isDisabled={!currentUser || (currentUser.role?.name !== 'super_admin' && currentUser.roleId !== 3)}
          >
            Add User
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Card>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{stats.total}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Admins</StatLabel>
                <StatNumber>{stats.admins}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Super Admins</StatLabel>
                <StatNumber>{stats.superAdmins}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Wakil Direktorat</StatLabel>
                <StatNumber>{stats.wakilDirektorat}</StatNumber>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
              
              <Select
                maxW="200px"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                icon={<FaFilter />}
              >
                {MANAGEABLE_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
              
              <Spacer />
              
              <Button
                variant="outline"
                leftIcon={<SettingsIcon />}
                onClick={fetchUsers}
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead bg={tableHeaderBg}>
                  <Tr>
                    <Th>User</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Created At</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((user) => (
                    <Tr key={user.userId}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{user.fullName}</Text>
                          <Text fontSize="sm" color="gray.500">
                            ID: {user.userId}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>{user.email}</Td>
                      <Td>{getRoleBadge(user.role)}</Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="View Details">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              icon={<ViewIcon />}
                              onClick={() => handleView(user)}
                            />
                          </Tooltip>
                          
                          {canManageUser(user) && (
                            <>
                              <Tooltip label="Edit User">
                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={<EditIcon />}
                                  onClick={() => handleEdit(user)}
                                />
                              </Tooltip>
                              
                              <Tooltip label="Delete User">
                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  icon={<DeleteIcon />}
                                  onClick={() => handleDeleteConfirm(user.userId)}
                                />
                              </Tooltip>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            
            {filteredUsers.length === 0 && (
              <Center py={10}>
                <VStack>
                  <FaUsers size={48} color="gray" />
                  <Text color="gray.500">No users found</Text>
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit User Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="md">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {isEdit ? 'Edit User' : 'Create New User'}
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      fullName: e.target.value
                    }))}
                    placeholder="Enter full name (e.g., John Doe)"
                  />
                  <FormHelperText>Enter the person's full name, not their email address</FormHelperText>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="Enter email address"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={formData.roleId}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      roleId: e.target.value
                    }))}
                  >
                    <option value="1">Admin</option>
                    <option value="3">Super Admin</option>
                    <option value="4">Wakil Direktorat</option>
                  </Select>
                </FormControl>
                
                <FormControl isRequired={!isEdit}>
                  <FormLabel>
                    Password {isEdit && <Text as="span" fontSize="sm" color="gray.500">(leave empty to keep current)</Text>}
                  </FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="brand"
                isLoading={loading}
              >
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* View User Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Details</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedUser && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>Full Name</Text>
                  <Text>{selectedUser.fullName}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Email</Text>
                  <Text>{selectedUser.email}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Role</Text>
                  {getRoleBadge(selectedUser.role)}
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>User ID</Text>
                  <Text>{selectedUser.userId}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Created At</Text>
                  <Text>{new Date(selectedUser.createdAt).toLocaleString('id-ID')}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Last Updated</Text>
                  <Text>{new Date(selectedUser.updatedAt).toLocaleString('id-ID')}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={onViewClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete User
            </AlertDialogHeader>
            
            <AlertDialogBody>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogBody>
            
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={loading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
    </AdminLayout>
  );
};

export default UserManagement;
