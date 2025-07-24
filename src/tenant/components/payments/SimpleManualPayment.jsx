import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Image,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  Divider,
  Icon,
  Badge,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FaUpload, FaEye, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { paymentService } from '../../services/paymentService';

const SimpleManualPayment = ({ 
  bookingId, 
  invoiceId, 
  amount, 
  onPaymentSuccess, 
  onCancel 
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    transferDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // UI hooks
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle file selection with preview
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload JPG, PNG, or GIF images only',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload files smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!formData.bankName.trim()) {
      errors.push('Bank name is required');
    }
    
    if (!formData.accountNumber.trim()) {
      errors.push('Account number is required');
    }
    
    if (!formData.accountHolderName.trim()) {
      errors.push('Account holder name is required');
    }
    
    if (!selectedFile) {
      errors.push('Payment proof image is required');
    }
    
    return errors;
  };

  // Submit payment
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Please complete all required fields',
        description: validationErrors.join(', '),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result.split(',')[1];          const paymentData = {
            bookingId: bookingId,
            invoiceId: invoiceId,
            amount: amount,
            paymentChannel: 'bank_transfer',
            notes: formData.notes || 'Manual bank transfer payment',
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountHolderName: formData.accountHolderName,
            transferDate: new Date(formData.transferDate).toISOString(),
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            imageContent: base64Content,
            contentEncoding: 'base64'
          };

          const response = await paymentService.createManualPayment(paymentData);

          toast({
            title: 'Payment Submitted Successfully!',
            description: 'Your payment proof has been uploaded and is awaiting admin verification.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          if (onPaymentSuccess) {
            onPaymentSuccess(response);
          }

        } catch (error) {
          console.error('Payment submission error:', error);
          toast({
            title: 'Payment Submission Failed',
            description: error.message || 'Failed to submit payment. Please try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Error Processing File',
        description: 'Failed to process the selected file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Payment Amount Card */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4}>
            <Icon as={FaInfoCircle} color="blue.500" boxSize="32px" />
            <VStack spacing={2} textAlign="center">
              <Text fontSize="lg" fontWeight="bold">
                Payment Amount
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {formatCurrency(amount)}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Please transfer this exact amount
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Bank Information */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Transfer to Our Bank Account</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={1} spacing={4}>
            <Box p={4} bg="blue.50" borderRadius="md" borderLeft="4px" borderColor="blue.500">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">Bank BNI</Text>
                <Text>Account: <strong>0123456789</strong></Text>
                <Text>Name: <strong>Yayasan Rusunawa PNJ</strong></Text>
              </VStack>
            </Box>
            <Box p={4} bg="green.50" borderRadius="md" borderLeft="4px" borderColor="green.500">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold">Bank Mandiri</Text>
                <Text>Account: <strong>9876543210</strong></Text>
                <Text>Name: <strong>Yayasan Rusunawa PNJ</strong></Text>
              </VStack>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Payment Form */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Upload Payment Proof</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Bank Details */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bank Name</FormLabel>
                <Select
                  placeholder="Select bank"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                >
                  <option value="BNI">Bank BNI</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BCA">Bank BCA</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="Other">Other Bank</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Your Account Number</FormLabel>
                <Input
                  placeholder="Enter your account number"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Account Holder Name</FormLabel>
                <Input
                  placeholder="Name on your account"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Transfer Date</FormLabel>
                <Input
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => handleInputChange('transferDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <Textarea
                placeholder="Any additional information about the transfer"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </FormControl>

            <Divider />

            {/* File Upload */}
            <FormControl isRequired>
              <FormLabel>Payment Receipt/Proof</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                p={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Upload your bank transfer receipt or payment confirmation (JPG, PNG, GIF - Max 5MB)
              </Text>
            </FormControl>

            {/* Image Preview */}
            {imagePreview && (
              <VStack spacing={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>Preview:</Text>
                  <Image
                    src={imagePreview}
                    alt="Payment proof preview"
                    maxH="200px"
                    objectFit="contain"
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={onOpen}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Click image to view full size
                  </Text>
                </Box>
                
                <Badge colorScheme="green" p={2} borderRadius="md">
                  <HStack spacing={2}>
                    <Icon as={FaCheckCircle} />
                    <Text>File: {selectedFile?.name}</Text>
                  </HStack>
                </Badge>
              </VStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <HStack spacing={4} justify="flex-end">
        <Button
          variant="outline"
          onClick={onCancel}
          isDisabled={loading}
        >
          Cancel
        </Button>
        <Button
          colorScheme="blue"
          leftIcon={<FaUpload />}
          onClick={handleSubmit}
          isLoading={loading}
          loadingText="Submitting..."
          isDisabled={!selectedFile || !formData.bankName || !formData.accountNumber || !formData.accountHolderName}
        >
          Submit Payment Proof
        </Button>
      </HStack>

      {/* Full Size Image Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payment Proof Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Payment proof full size"
                w="100%"
                objectFit="contain"
                borderRadius="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default SimpleManualPayment;
