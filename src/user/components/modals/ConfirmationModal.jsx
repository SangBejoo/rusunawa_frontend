import React, { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya',
  cancelText = 'Batal',
  confirmColorScheme = 'blue',
  isDestructive = false,
  isLoading = false,
  isDisabled = false,
}) => {
  const cancelRef = useRef();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>
            {typeof message === 'string' ? message : message}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button 
              ref={cancelRef} 
              onClick={onClose}
              isDisabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              colorScheme={confirmColorScheme}
              onClick={handleConfirm}
              ml={3}
              isLoading={isLoading}
              isDisabled={isDisabled}
              loadingText={confirmText}
            >
              {confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default ConfirmationModal;
