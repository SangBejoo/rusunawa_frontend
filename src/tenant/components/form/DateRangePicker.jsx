import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { format, addDays, addMonths, differenceInDays, differenceInMonths, isAfter, isSameDay } from 'date-fns';

/**
 * DateRangePicker component that handles both daily and monthly rental types
 * 
 * @param {Object} props - Component props
 * @param {string} props.startDate - Start date in ISO format
 * @param {string} props.endDate - End date in ISO format
 * @param {Function} props.onStartDateChange - Function called when start date changes
 * @param {Function} props.onEndDateChange - Function called when end date changes
 * @param {boolean} props.showDuration - Whether to show duration text
 * @param {string} props.rentalType - The rental type: 'harian' (daily) or 'bulanan' (monthly)
 * @returns {JSX.Element} DateRangePicker component
 */
const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  showDuration = false,
  rentalType = 'harian'
}) => {
  const [duration, setDuration] = useState(1);
  const isMonthly = rentalType === 'bulanan';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Format for display
  const formatDate = (date) => {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd');
  };
  
  // Calculate and set duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isMonthly) {
        const months = Math.max(1, differenceInMonths(end, start) + (isSameDay(end, addMonths(start, differenceInMonths(end, start))) ? 0 : 1));
        setDuration(months);
      } else {
        const days = Math.max(1, differenceInDays(end, start));
        setDuration(days);
      }
    } else {
      setDuration(1);
    }
  }, [startDate, endDate, isMonthly]);
  
  // Update end date when start date and duration change
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    if (onStartDateChange) {
      onStartDateChange(newStartDate);
    }
    
    if (newStartDate && duration > 0) {
      const start = new Date(newStartDate);
      let newEndDate;
      
      if (isMonthly) {
        newEndDate = addMonths(start, duration);
      } else {
        newEndDate = addDays(start, duration);
      }
      
      if (onEndDateChange) {
        onEndDateChange(format(newEndDate, 'yyyy-MM-dd'));
      }
    }
  };
  
  // Handle duration change directly
  const handleDurationChange = (value) => {
    const newDuration = parseInt(value, 10) || 1;
    setDuration(newDuration);
    
    if (startDate) {
      const start = new Date(startDate);
      let newEndDate;
      
      if (isMonthly) {
        newEndDate = addMonths(start, newDuration);
      } else {
        newEndDate = addDays(start, newDuration);
      }
      
      if (onEndDateChange) {
        onEndDateChange(format(newEndDate, 'yyyy-MM-dd'));
      }
    }
  };
  
  // When end date changes directly (less common)
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (onEndDateChange) {
      onEndDateChange(newEndDate);
    }
  };
  
  // Get minimum allowed end date based on start date
  const getMinEndDate = () => {
    if (!startDate) return formatDate(today);
    const start = new Date(startDate);
    return formatDate(isMonthly ? addMonths(start, 1) : addDays(start, 1));
  };

  return (
    <Box>
      <HStack spacing={4} wrap="wrap">
        <FormControl flex="1" minW="180px">
          <FormLabel>Check-in Date</FormLabel>
          <Input
            type="date"
            value={formatDate(startDate)}
            min={formatDate(today)}
            onChange={handleStartDateChange}
          />
        </FormControl>
        
        {isMonthly ? (
          <FormControl flex="1" minW="120px">
            <FormLabel>Duration (Months)</FormLabel>
            <NumberInput
              min={1}
              max={12}
              value={duration}
              onChange={handleDurationChange}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        ) : (
          <FormControl flex="1" minW="120px">
            <FormLabel>Duration (Days)</FormLabel>
            <NumberInput
              min={1}
              max={30}
              value={duration}
              onChange={handleDurationChange}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}
        
        <FormControl flex="1" minW="180px">
          <FormLabel>Check-out Date</FormLabel>
          <Input
            type="date"
            value={formatDate(endDate)}
            min={getMinEndDate()}
            onChange={handleEndDateChange}
            readOnly={isMonthly} // For monthly rentals, we calculate this automatically
          />
        </FormControl>
      </HStack>
      
      {showDuration && startDate && endDate && (
        <Text mt={2} color="gray.600">
          {isMonthly
            ? `Duration: ${duration} month${duration === 1 ? '' : 's'}`
            : `Duration: ${duration} day${duration === 1 ? '' : 's'}`}
        </Text>
      )}
      
      {isAfter(new Date(startDate), new Date(endDate)) && (
        <Alert status="error" mt={2} size="sm" borderRadius="md">
          <AlertIcon />
          Check-out date must be after check-in date
        </Alert>
      )}
    </Box>
  );
};

export default DateRangePicker;
