import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Icon,
  useToast,
  useColorModeValue,
  Progress,
} from '@chakra-ui/react';
import { 
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';

const BookingRejectionModal = ({ isOpen, onClose, booking, onRejected }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Alasan diperlukan',
        description: 'Silakan berikan alasan penolakan booking ini',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onRejected(booking.bookingId, reason.trim());
      
      // Clear form and close modal
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        title: 'Gagal Menolak Booking',
        description: error.message || 'Terjadi kesalahan saat menolak booking',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnOverlayClick={!isSubmitting}>
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaTimes} color="red.500" />
            <Text>Tolak Booking</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Booking Info */}
            <Box p={4} bg="gray.50" borderRadius="md" borderColor={borderColor} borderWidth="1px">
              <VStack spacing={2} align="stretch">
                <Text fontWeight="bold" fontSize="lg">
                  Booking #{booking?.bookingId}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Penyewa: {booking?.tenant?.user?.fullName}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Kamar: {booking?.room?.name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Total: Rp {booking?.totalAmount?.toLocaleString('id-ID')}
                </Text>
              </VStack>
            </Box>

            {/* Warning Alert */}
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  Peringatan
                </Text>
                <Text fontSize="sm">
                  Booking ini akan ditolak dan penyewa akan menerima notifikasi penolakan. 
                  Pastikan alasan penolakan jelas dan dapat dipahami.
                </Text>
              </Box>
            </Alert>

            {/* Reason Input */}
            <FormControl isRequired>
              <FormLabel>Alasan Penolakan</FormLabel>
              <Textarea
                placeholder="Berikan alasan yang jelas mengapa booking ini ditolak. Contoh: Dokumen belum lengkap, kamar tidak sesuai gender, dll."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                isDisabled={isSubmitting}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Alasan ini akan dikirim kepada penyewa melalui email notifikasi
              </Text>
            </FormControl>

            {/* Progress bar during submission */}
            {isSubmitting && (
              <Box>
                <Text fontSize="sm" mb={2}>Memproses penolakan...</Text>
                <Progress size="sm" isIndeterminate colorScheme="red" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={handleClose}
              isDisabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Menolak..."
              isDisabled={!reason.trim()}
              leftIcon={<FaTimes />}
            >
              Tolak Booking
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BookingRejectionModal;
