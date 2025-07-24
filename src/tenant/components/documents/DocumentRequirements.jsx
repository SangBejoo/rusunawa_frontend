import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Heading,
  Divider,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import AgreementDownload from './AgreementDownload';

const DocumentRequirements = ({ tenant, showDownload = false }) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const isStudent = tenant?.tenantType?.name === 'mahasiswa';

  return (
    <Card bg={cardBg} borderRadius="lg" boxShadow="md">
      <CardBody>
        <VStack spacing={4} align="stretch">
          <HStack justifyContent="space-between" align="center">
            <Heading size="md">Document Requirements</Heading>
            <Badge colorScheme={isStudent ? 'blue' : 'purple'} px={3} py={1}>
              {isStudent ? 'Student (Mahasiswa)' : 'Non-Student'}
            </Badge>
          </HStack>
          
          <Divider />
          
          <Box>
            <Text mb={3} fontWeight="medium">
              {isStudent ? 'As a student, you need to upload:' : 'As a non-student, you need to upload:'}
            </Text>
            <VStack align="start" spacing={2} pl={4}>
              <HStack>
                <Text fontSize="sm">•</Text>
                <Text fontSize="sm">KTP (ID Card) - Required</Text>
              </HStack>
              {isStudent && (
                <>
                  <HStack>
                    <Text fontSize="sm">•</Text>
                    <Text fontSize="sm">KK (Family Card) - Required</Text>
                  </HStack>
                  <HStack>
                    <Text fontSize="sm">•</Text>
                    <Text fontSize="sm">Surat Perjanjian (Agreement Letter) - Required</Text>
                  </HStack>
                </>
              )}
            </VStack>
          </Box>
          
          {/* Agreement Download Section for Students */}
          {isStudent && showDownload && (
            <>
              <Divider />
              <AgreementDownload isStudent={isStudent} />
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DocumentRequirements;
