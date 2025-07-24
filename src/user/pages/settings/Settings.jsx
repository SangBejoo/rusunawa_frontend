import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Switch,
  Text,
  useToast,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  FormErrorMessage,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  IconButton,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { FiDownload, FiUpload, FiServer, FiShield, FiMail } from 'react-icons/fi';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/authContext';
import settingsService from '../../services/settingsService';

const Settings = () => {
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isBackupOpen, onOpen: onBackupOpen, onClose: onBackupClose } = useDisclosure();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    sendBookingConfirmations: true,
    sendPaymentReminders: true,
    sendMarketingEmails: false,
  });
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoApproveBookings: false,
    defaultPaymentDueDays: 7,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    passwordMinLength: 8,
    maxLoginAttempts: 5,
  });
  
  // Password errors
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [profile, email, system, security] = await Promise.all([
        settingsService.getProfile(),
        settingsService.getEmailSettings(),
        settingsService.getSystemSettings(),
        settingsService.getSecuritySettings(),
      ]);

      setProfileData(profile.data || {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      setEmailSettings(email.data || emailSettings);
      setSystemSettings(system.data || systemSettings);
      setSecuritySettings(security.data || securitySettings);    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Settings Loaded (Mock Data)',
        description: 'Using demo data - backend settings API not implemented yet',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    
    try {
      await settingsService.updateProfile(profileData);
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingProfile(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate password
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setSavingPassword(true);
    
    try {
      await settingsService.changePassword(passwordData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Password update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingPassword(false);
    }
  };
  
  // Handle email settings update
  const handleEmailSettingsUpdate = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    
    try {
      await settingsService.updateEmailSettings(emailSettings);
      toast({
        title: 'Email settings updated',
        description: 'Your email notification preferences have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingEmail(false);
    }
  };
  
  // Handle system settings update
  const handleSystemSettingsUpdate = async (e) => {
    e.preventDefault();
    setSavingSystem(true);
    
    try {
      await settingsService.updateSystemSettings(systemSettings);
      toast({
        title: 'System settings updated',
        description: 'System settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSavingSystem(false);
    }
  };

  // Handle security settings update
  const handleSecuritySettingsUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await settingsService.updateSecuritySettings(securitySettings);
      toast({
        title: 'Security settings updated',
        description: 'Security settings have been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle backup creation
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const backup = await settingsService.createBackup();
      toast({
        title: 'Backup created',
        description: 'System backup has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onBackupClose();
    } catch (error) {
      toast({
        title: 'Backup failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  // Handle settings export
  const handleExportSettings = async () => {
    try {
      const blob = await settingsService.exportSettings();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rusunawa-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Settings exported',
        description: 'Settings have been exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <Spinner size="xl" />
        </Box>
      </AdminLayout>
    );
  }
    return (
    <AdminLayout>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Settings</Heading>
          <HStack spacing={3}>
            <Button leftIcon={<FiDownload />} onClick={handleExportSettings}>
              Export Settings
            </Button>
            <Button leftIcon={<FiServer />} onClick={onBackupOpen} colorScheme="blue">
              Create Backup
            </Button>
          </HStack>
        </Flex>

        {/* Warning banner for mock data */}
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Development Mode!</AlertTitle>
            <AlertDescription>
              Settings are currently using mock data. Backend settings APIs are not implemented yet. 
              Changes will appear to work but won't be persisted.
            </AlertDescription>
          </Box>
        </Alert>
        
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Profile</Tab>
            <Tab>Security</Tab>
            <Tab>Notifications</Tab>
            <Tab>System</Tab>
          </TabList>
          
          <TabPanels>
            {/* Profile Settings */}
            <TabPanel>
              <Card shadow="sm">
                <CardBody>
                  <Heading size="md" mb={4}>Profile Information</Heading>
                  <Divider mb={6} />
                  
                  <form onSubmit={handleProfileUpdate}>
                    <VStack spacing={4} align="flex-start">
                      <FormControl>
                        <FormLabel>Name</FormLabel>
                        <Input
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="brand" 
                        alignSelf="flex-end"
                        isLoading={savingProfile}
                      >
                        Save Changes
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Security Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Password Change */}
                <Card shadow="sm">
                  <CardBody>
                    <Heading size="md" mb={4}>Change Password</Heading>
                    <Divider mb={6} />
                    
                    <form onSubmit={handlePasswordChange}>
                      <VStack spacing={4} align="flex-start">
                        <FormControl isInvalid={!!passwordErrors.currentPassword}>
                          <FormLabel>Current Password</FormLabel>
                          <Input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          />
                          <FormErrorMessage>{passwordErrors.currentPassword}</FormErrorMessage>
                        </FormControl>
                        
                        <FormControl isInvalid={!!passwordErrors.newPassword}>
                          <FormLabel>New Password</FormLabel>
                          <Input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          />
                          <FormErrorMessage>{passwordErrors.newPassword}</FormErrorMessage>
                        </FormControl>
                        
                        <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                          <FormLabel>Confirm New Password</FormLabel>
                          <Input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          />
                          <FormErrorMessage>{passwordErrors.confirmPassword}</FormErrorMessage>
                        </FormControl>
                        
                        <Button 
                          type="submit" 
                          colorScheme="brand" 
                          alignSelf="flex-end"
                          isLoading={savingPassword}
                        >
                          Update Password
                        </Button>
                      </VStack>
                    </form>
                  </CardBody>
                </Card>

                {/* Security Settings */}
                <Card shadow="sm">
                  <CardBody>
                    <Heading size="md" mb={4}>Security Settings</Heading>
                    <Divider mb={6} />
                    
                    <form onSubmit={handleSecuritySettingsUpdate}>
                      <VStack spacing={6} align="flex-start">
                        <FormControl display="flex" alignItems="center">
                          <FormLabel mb="0" flex="1">
                            Two-Factor Authentication
                            <Badge ml={2} colorScheme={securitySettings.twoFactorEnabled ? 'green' : 'gray'}>
                              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </FormLabel>
                          <Switch
                            colorScheme="brand"
                            isChecked={securitySettings.twoFactorEnabled}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings, 
                              twoFactorEnabled: e.target.checked
                            })}
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <Select
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              sessionTimeout: parseInt(e.target.value)
                            })}
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={480}>8 hours</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Password Minimum Length</FormLabel>
                          <Select
                            value={securitySettings.passwordMinLength}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              passwordMinLength: parseInt(e.target.value)
                            })}
                          >
                            <option value={6}>6 characters</option>
                            <option value={8}>8 characters</option>
                            <option value={10}>10 characters</option>
                            <option value={12}>12 characters</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Maximum Login Attempts</FormLabel>
                          <Select
                            value={securitySettings.maxLoginAttempts}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              maxLoginAttempts: parseInt(e.target.value)
                            })}
                          >
                            <option value={3}>3 attempts</option>
                            <option value={5}>5 attempts</option>
                            <option value={10}>10 attempts</option>
                          </Select>
                        </FormControl>
                        
                        <Button 
                          type="submit" 
                          colorScheme="brand" 
                          alignSelf="flex-end"
                          leftIcon={<FiShield />}
                        >
                          Update Security Settings
                        </Button>
                      </VStack>
                    </form>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Notification Settings */}
            <TabPanel>
              <Card shadow="sm">
                <CardBody>
                  <Heading size="md" mb={4}>Email Notifications</Heading>
                  <Divider mb={6} />
                  
                  <form onSubmit={handleEmailSettingsUpdate}>
                    <VStack spacing={6} align="flex-start">
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Send booking confirmation emails
                        </FormLabel>
                        <Switch
                          colorScheme="brand"
                          isChecked={emailSettings.sendBookingConfirmations}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings, 
                            sendBookingConfirmations: e.target.checked
                          })}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Send payment reminder emails
                        </FormLabel>
                        <Switch
                          colorScheme="brand"
                          isChecked={emailSettings.sendPaymentReminders}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings, 
                            sendPaymentReminders: e.target.checked
                          })}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Send promotional emails
                        </FormLabel>
                        <Switch
                          colorScheme="brand"
                          isChecked={emailSettings.sendMarketingEmails}
                          onChange={(e) => setEmailSettings({
                            ...emailSettings, 
                            sendMarketingEmails: e.target.checked
                          })}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="brand" 
                        alignSelf="flex-end"
                        isLoading={savingEmail}
                        leftIcon={<FiMail />}
                      >
                        Save Preferences
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* System Settings */}
            <TabPanel>
              <Card shadow="sm">
                <CardBody>
                  <Heading size="md" mb={4}>System Settings</Heading>
                  <Divider mb={6} />
                  
                  <form onSubmit={handleSystemSettingsUpdate}>
                    <VStack spacing={6} align="flex-start">
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Maintenance Mode
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            Enable this to show maintenance page to all users
                          </Text>
                        </FormLabel>
                        <Switch
                          colorScheme="red"
                          isChecked={systemSettings.maintenanceMode}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings, 
                            maintenanceMode: e.target.checked
                          })}
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0" flex="1">
                          Auto-approve Bookings
                          <Text fontSize="sm" color="gray.500" mt={1}>
                            Automatically approve new booking requests
                          </Text>
                        </FormLabel>
                        <Switch
                          colorScheme="brand"
                          isChecked={systemSettings.autoApproveBookings}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings, 
                            autoApproveBookings: e.target.checked
                          })}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Default Payment Due Days</FormLabel>
                        <Select
                          value={systemSettings.defaultPaymentDueDays}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            defaultPaymentDueDays: parseInt(e.target.value)
                          })}
                        >
                          <option value={3}>3 days</option>
                          <option value={5}>5 days</option>
                          <option value={7}>7 days</option>
                          <option value={10}>10 days</option>
                          <option value={14}>14 days</option>
                        </Select>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Default number of days until payment is due after booking
                        </Text>
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="brand" 
                        alignSelf="flex-end"
                        isLoading={savingSystem}
                        leftIcon={<FiServer />}
                      >
                        Save System Settings
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Backup Creation Modal */}
        <Modal isOpen={isBackupOpen} onClose={onBackupClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create System Backup</ModalHeader>
            <ModalBody>
              <Alert status="info" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>System Backup</AlertTitle>
                  <AlertDescription>
                    This will create a complete backup of your system data including:
                    <br />• User accounts and settings
                    <br />• Room and booking data
                    <br />• Payment records
                    <br />• Documents and files
                    <br />• System configuration
                  </AlertDescription>
                </Box>
              </Alert>
              <Text>Are you sure you want to create a system backup?</Text>
            </ModalBody>
            <ModalFooter>
              <Button mr={3} onClick={onBackupClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleCreateBackup}
                isLoading={creatingBackup}
                loadingText="Creating..."
              >
                Create Backup
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </AdminLayout>
  );
};

export default Settings;
