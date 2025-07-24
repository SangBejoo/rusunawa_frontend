import React, { useState } from 'react';
import {
  Box, Text, Flex, Button, Badge, Icon,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalFooter, ModalBody, ModalCloseButton,
  useDisclosure, useColorModeValue
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaFileAlt } from 'react-icons/fa';

const PolicyAgreement = ({ policy, onAgree, onDecline }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [agreeing, setAgreeing] = useState(false);
  const [declining, setDeclining] = useState(false);
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const handleAgree = async () => {
    setAgreeing(true);
    await onAgree();
    setAgreeing(false);
    onClose();
  };
  
  const handleDecline = async () => {
    setDeclining(true);
    await onDecline();
    setDeclining(false);
    onClose();
  };
  
  return (
    <>
      <Box 
        p={4}
        borderWidth="1px"
        borderRadius="md"
        borderColor={policy.signed ? 'green.500' : borderColor}
        bg={policy.signed ? 'green.50' : bgColor}
      >
        <Flex justify="space-between" align="center">
          <Flex align="center">
            <Icon 
              as={policy.signed ? FaCheckCircle : FaFileAlt} 
              mr={3}
              color={policy.signed ? 'green.500' : 'gray.500'}
            />
            <Box>
              <Text fontWeight="medium">{policy.name}</Text>
              <Text fontSize="sm" color="gray.500">Version: {policy.version}</Text>
            </Box>
          </Flex>
          
          <Flex align="center">
            {policy.signed ? (
              <Badge colorScheme="green" mr={3}>Agreed</Badge>
            ) : (
              <Badge colorScheme="yellow" mr={3}>Action Required</Badge>
            )}
            
            <Button 
              size="sm" 
              onClick={onOpen}
              variant={policy.signed ? "outline" : "solid"}
              colorScheme={policy.signed ? "green" : "brand"}
            >
              {policy.signed ? 'View Agreement' : 'Review & Sign'}
            </Button>
          </Flex>
        </Flex>
      </Box>
      
      {/* Policy Review Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {policy.name} - v{policy.version}
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <Text mb={4} fontStyle="italic" color="gray.500">
              Please review the following policy. You must agree to this policy to continue using the system.
            </Text>
            
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor={borderColor}
              bg={bgColor}
              maxH="400px"
              overflowY="auto"
            >
              <div dangerouslySetInnerHTML={{ __html: policy.content }} />
            </Box>
            
            {policy.signed && (
              <Flex mt={4} p={3} bg="green.50" borderRadius="md" align="center">
                <Icon as={FaCheckCircle} color="green.500" mr={2} />
                <Text color="green.700">
                  You agreed to this policy on {new Date(policy.signed_at).toLocaleDateString()}
                </Text>
              </Flex>
            )}
          </ModalBody>
          
          <ModalFooter>
            {!policy.signed ? (
              <>
                <Button 
                  variant="outline" 
                  colorScheme="red" 
                  mr={3} 
                  onClick={handleDecline}
                  isLoading={declining}
                  leftIcon={<FaTimesCircle />}
                >
                  Decline
                </Button>
                <Button 
                  colorScheme="green" 
                  onClick={handleAgree}
                  isLoading={agreeing}
                  leftIcon={<FaCheckCircle />}
                >
                  I Agree
                </Button>
              </>
            ) : (
              <Button onClick={onClose}>Close</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PolicyAgreement;
