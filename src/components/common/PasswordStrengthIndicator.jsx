import React from 'react';
import {
  Box,
  Progress,
  Text,
  VStack,
  HStack,
  Badge,
  List,
  ListItem,
  ListIcon,
  Collapse
} from '@chakra-ui/react';
import { CheckIcon, MinusIcon } from '@chakra-ui/icons';
import { getPasswordStrength } from '../../utils/sharedValidation';

const PasswordStrengthIndicator = ({ password, showDetails = false }) => {
  const strength = getPasswordStrength(password);
  
  if (!password) return null;

  return (
    <VStack align="stretch" spacing={2} mt={2}>
      <HStack justify="space-between" align="center">
        <Text fontSize="sm" color="gray.600">
          Password Strength:
        </Text>
        <Badge colorScheme={strength.color} variant="solid" size="sm">
          {strength.label}
        </Badge>
      </HStack>
      
      <Progress 
        value={strength.percentage} 
        colorScheme={strength.color} 
        size="sm" 
        borderRadius="md"
        bg="gray.200"
      />
      
      <Collapse in={showDetails && strength.feedback.length > 0} animateOpacity>
        <Box mt={2} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
          <Text fontWeight="medium" mb={2} color="gray.700">
            Requirements:
          </Text>
          <List spacing={1}>
            {[
              'At least 8 characters',
              'Lowercase letter',
              'Uppercase letter', 
              'Number',
              'Special character'
            ].map((requirement, index) => {
              const isComplete = !strength.feedback.includes(requirement);
              return (
                <ListItem key={index}>
                  <HStack spacing={2}>
                    <ListIcon 
                      as={isComplete ? CheckIcon : MinusIcon} 
                      color={isComplete ? 'green.500' : 'gray.400'}
                      boxSize={3}
                    />
                    <Text color={isComplete ? 'green.600' : 'gray.600'}>
                      {requirement}
                    </Text>
                  </HStack>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Collapse>
    </VStack>
  );
};

export default PasswordStrengthIndicator;
