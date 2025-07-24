import React from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
} from '@chakra-ui/react';

/**
 * A reusable date picker field component
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value (ISO date string)
 * @param {Function} props.onChange - Function called when date changes
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.isRequired - Whether the field is required
 * @param {boolean} props.isDisabled - Whether the field is disabled
 * @returns {React.ReactElement} The date picker field component
 */
const DatePickerField = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  minDate,
  maxDate,
  isRequired = false,
  isDisabled = false
}) => {
  // Format date object to YYYY-MM-DD for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d) ? '' : d.toISOString().split('T')[0];
  };

  // Format min/max dates if provided
  const minDateFormatted = minDate ? formatDateForInput(minDate) : undefined;
  const maxDateFormatted = maxDate ? formatDateForInput(maxDate) : undefined;
  
  // Handle date change
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled}>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <Input
        id={name}
        name={name}
        type="date"
        value={formatDateForInput(value)}
        onChange={handleChange}
        min={minDateFormatted}
        max={maxDateFormatted}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
      {helperText && !error && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default DatePickerField;
