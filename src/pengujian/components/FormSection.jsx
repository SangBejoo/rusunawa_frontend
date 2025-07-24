import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  RadioGroup,
  Radio,
  CheckboxGroup,
  Checkbox,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';

const FormSection = ({ 
  title, 
  description, 
  children, 
  isRequired = false,
  alertMessage,
  alertType = 'info'
}) => {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Card bg={cardBg} variant="outline" mb={6}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Box>
            <HStack>
              <Heading size="md" color="brand.600">
                {title}
              </Heading>
              {isRequired && (
                <Badge colorScheme="red" size="sm">Required</Badge>
              )}
            </HStack>
            {description && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                {description}
              </Text>
            )}
          </Box>
          
          {alertMessage && (
            <Alert status={alertType} size="sm" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {alertMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <Divider />
          
          {children}
        </VStack>
      </CardBody>
    </Card>
  );
};

// Reusable form components
export const ScaleQuestion = ({ 
  label, 
  value, 
  onChange, 
  min = 1, 
  max = 5, 
  labels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'],
  isRequired = true 
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    <VStack spacing={3}>
      <Slider
        value={value || min}
        onChange={onChange}
        min={min}
        max={max}
        step={1}
        colorScheme="brand"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb boxSize={6}>
          <Box color="brand.500" fontSize="sm" fontWeight="bold">
            {value || min}
          </Box>
        </SliderThumb>
      </Slider>
      
      <HStack justify="space-between" w="full" fontSize="xs" color="gray.600">
        {labels.map((label, index) => (
          <Text key={index} textAlign="center" minW="60px">
            {index + 1}. {label}
          </Text>
        ))}
      </HStack>
    </VStack>
  </FormControl>
);

export const MultipleChoiceQuestion = ({ 
  label, 
  value, 
  onChange, 
  options, 
  isRequired = true 
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    <RadioGroup value={value} onChange={onChange}>
      <VStack align="start" spacing={2}>
        {options.map((option, index) => (
          <Radio key={index} value={option.value} colorScheme="brand">
            <Text fontSize="sm">{option.label}</Text>
          </Radio>
        ))}
      </VStack>
    </RadioGroup>
  </FormControl>
);

export const CheckboxQuestion = ({ 
  label, 
  value = [], 
  onChange, 
  options, 
  isRequired = false 
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    <CheckboxGroup value={value} onChange={onChange} colorScheme="brand">
      <VStack align="start" spacing={2}>
        {options.map((option, index) => (
          <Checkbox key={index} value={option.value}>
            <Text fontSize="sm">{option.label}</Text>
          </Checkbox>
        ))}
      </VStack>
    </CheckboxGroup>
  </FormControl>
);

export const TextQuestion = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  isRequired = false,
  isTextarea = false,
  rows = 4
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    {isTextarea ? (
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        resize="vertical"
      />
    ) : (
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </FormControl>
);

export const SelectQuestion = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Pilih opsi...", 
  isRequired = true 
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    <Select 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    >
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  </FormControl>
);

export const NumberQuestion = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  isRequired = false 
}) => (
  <FormControl isRequired={isRequired}>
    <FormLabel fontWeight="medium">{label}</FormLabel>
    <NumberInput 
      value={value || ''} 
      onChange={(valueString) => onChange(valueString)}
      min={min}
      max={max}
    >
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </FormControl>
);

export default FormSection;
