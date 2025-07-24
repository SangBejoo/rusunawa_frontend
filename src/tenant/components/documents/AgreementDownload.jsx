import React from 'react';
import {
  Box,
  Button,
  Text,
  Alert,
  AlertIcon,
  Icon,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FaDownload, FaFilePdf } from 'react-icons/fa';

const AgreementDownload = ({ isStudent = true, size = "sm" }) => {
  const toast = useToast();

  const handleDownloadAgreement = () => {
    try {
      const link = document.createElement('a');
      link.href = '/assets/documents/FORMULIR_IZIN_TINGGAL_DI_RUSUNAWA.pdf';
      link.download = 'FORMULIR_IZIN_TINGGAL_DI_RUSUNAWA.pdf';
      link.click();
      
      toast({
        title: 'Download Started',
        description: 'Agreement form download has started. Please fill it out and upload the completed form.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to download the agreement form. Please contact support.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!isStudent) {
    return null;
  }

  return (
    <VStack spacing={3} align="stretch">
      <Text fontWeight="medium">Agreement Letter Download</Text>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontSize="sm">
            Download the agreement form, fill it out completely, and upload the filled PDF.
          </Text>
        </Box>
      </Alert>
      <Button
        leftIcon={<FaDownload />}
        colorScheme="green"
        onClick={handleDownloadAgreement}
        size={size}
      >
        <Icon as={FaFilePdf} mr={2} />
        Download Agreement Form
      </Button>
    </VStack>
  );
};

export default AgreementDownload;
