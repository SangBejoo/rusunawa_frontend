import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  SimpleGrid
} from '@chakra-ui/react';
import { FaUser, FaEdit, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTenantAuth } from '../../context/tenantAuthContext';

/**
 * Profile Completion Status Component
 * Shows completion status and guides user to complete missing information
 */
const ProfileCompletionStatus = () => {
  const navigate = useNavigate();
  const { tenant } = useTenantAuth();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!tenant) return { percentage: 0, missingFields: [], completedFields: 0, totalFields: 0 };
    
    const requiredFields = [
      { key: 'user.fullName', label: 'Full Name', value: tenant.user?.fullName },
      { key: 'user.email', label: 'Email', value: tenant.user?.email },
      { key: 'phone', label: 'Phone', value: tenant.phone },
      { key: 'address', label: 'Address', value: tenant.address },
      { key: 'gender', label: 'Gender', value: tenant.gender },
      { key: 'typeId', label: 'Tenant Type', value: tenant.typeId }
    ];
    
    // Add student-specific fields if tenant is a student
    if (tenant.typeId === 1 || tenant.tenantType?.name === 'mahasiswa') {
      requiredFields.push(
        { key: 'nim', label: 'NIM', value: tenant.nim },
        { key: 'jurusan', label: 'Department', value: tenant.jurusan }
      );
    }
    
    // Add optional but recommended fields
    const optionalFields = [
      { key: 'homeLatitude', label: 'Home Location', value: tenant.homeLatitude && tenant.homeLongitude }
    ];
    
    const allFields = [...requiredFields, ...optionalFields];
    const completedFields = allFields.filter(field => field.value).length;
    const missingFields = allFields.filter(field => !field.value);
    
    return {
      percentage: Math.round((completedFields / allFields.length) * 100),
      missingFields,
      completedFields,
      totalFields: allFields.length,
      isComplete: missingFields.length === 0
    };
  };
  
  const profileStatus = calculateProfileCompletion();
  
  // Determine status type
  const getStatusType = () => {
    if (profileStatus.percentage === 100) return 'success';
    if (profileStatus.percentage >= 70) return 'warning';
    return 'error';
  };
  
  const statusType = getStatusType();
  
  return (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaUser} color="brand.500" />
              <Text fontWeight="bold">Profile Completion</Text>
            </HStack>
            <Badge 
              colorScheme={statusType === 'success' ? 'green' : statusType === 'warning' ? 'yellow' : 'red'}
              variant="solid"
            >
              {profileStatus.percentage}%
            </Badge>
          </HStack>
          
          <Progress 
            value={profileStatus.percentage} 
            colorScheme={statusType === 'success' ? 'green' : statusType === 'warning' ? 'yellow' : 'red'}
            size="lg" 
            borderRadius="md"
          />
          
          <Text fontSize="sm" color="gray.600">
            {profileStatus.completedFields} of {profileStatus.totalFields} fields completed
          </Text>
          
          {profileStatus.isComplete ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Profile Complete! 🎉</AlertTitle>
                <AlertDescription>
                  Your profile information is complete and up to date.
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <Alert status={statusType} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Profile Incomplete</AlertTitle>
                <AlertDescription>
                  Complete your profile to improve your booking experience.
                  {profileStatus.missingFields.length > 0 && (
                    <Box mt={2}>
                      <Text fontSize="sm" fontWeight="bold">Missing information:</Text>
                      <SimpleGrid columns={2} spacing={1} mt={1}>
                        {profileStatus.missingFields.slice(0, 4).map((field, index) => (
                          <Text key={index} fontSize="xs" color="gray.600">
                            • {field.label}
                          </Text>
                        ))}
                      </SimpleGrid>
                      {profileStatus.missingFields.length > 4 && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          ...and {profileStatus.missingFields.length - 4} more
                        </Text>
                      )}
                    </Box>
                  )}
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          <Button
            leftIcon={<FaEdit />}
            colorScheme="brand"
            variant="outline"
            size="sm"
            onClick={() => navigate('/tenant/profile/edit')}
          >
            {profileStatus.isComplete ? 'Edit Profile' : 'Complete Profile'}
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ProfileCompletionStatus;
