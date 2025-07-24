import React from 'react';
import { 
  Button, 
  HStack, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Icon,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useToast
} from '@chakra-ui/react';
import { 
  FaEye, 
  FaEllipsisV, 
  FaEdit, 
  FaTrash, 
  FaFileInvoice
} from 'react-icons/fa';

/**
 * Action buttons for booking management
 * @param {Object} props - Component props
 * @param {Object} props.booking - Booking data
 * @param {Function} props.onView - View booking handler
 * @param {Function} props.onEdit - Edit booking handler
 * @param {Function} props.onCancel - Cancel booking handler
 * @param {Function} props.onInvoice - Invoice handler
 * @returns {JSX.Element} BookingActionButtons component
 */
const BookingActionButtons = ({ 
  booking, 
  onView, 
  onEdit, 
  onCancel, 
  onInvoice 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef();

  const handleCancel = async () => {
    try {
      await onCancel(booking.id);
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  
  // Enhanced payment status detection - check for completed payments
  const hasCompletedPayment = booking.payments && booking.payments.some(p => 
    p.status === 'success' || p.status === 'verified' || p.status === 'settlement' || p.status === 'capture'
  );

  return (
    <>
      <HStack spacing={2}>
        <Button
          size="sm"
          leftIcon={<Icon as={FaEye} />}
          onClick={() => onView(booking)}
          variant="outline"
        >
          View
        </Button>

        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            variant="ghost"
            rightIcon={<Icon as={FaEllipsisV} />}
          />
          <MenuList>
            {hasCompletedPayment && (
              <MenuItem
                icon={<Icon as={FaFileInvoice} />}
                onClick={() => onInvoice(booking)}
              >
                Download Invoice
              </MenuItem>
            )}
            
            {booking.status === 'pending' && (
              <MenuItem
                icon={<Icon as={FaEdit} />}
                onClick={() => onEdit(booking)}
              >
                Edit Booking
              </MenuItem>
            )}
            
            {canCancel && (
              <MenuItem
                icon={<Icon as={FaTrash} />}
                onClick={onOpen}
                color="red.500"
              >
                Cancel Booking
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      </HStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Cancel Booking
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Keep Booking
              </Button>
              <Button colorScheme="red" onClick={handleCancel} ml={3}>
                Cancel Booking
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default BookingActionButtons;
