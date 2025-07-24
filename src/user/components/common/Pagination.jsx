import React from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = isMobile ? 3 : 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // First page
    if (startPage > 1) {
      pageNumbers.push(
        <Button
          key={1}
          onClick={() => onPageChange(1)}
          size="sm"
          variant="outline"
          colorScheme="brand"
        >
          1
        </Button>
      );
      
      if (startPage > 2) {
        pageNumbers.push(
          <Text key="ellipsis-start" mx={2}>
            ...
          </Text>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          onClick={() => onPageChange(i)}
          size="sm"
          colorScheme="brand"
          variant={currentPage === i ? 'solid' : 'outline'}
        >
          {i}
        </Button>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <Text key="ellipsis-end" mx={2}>
            ...
          </Text>
        );
      }
      
      pageNumbers.push(
        <Button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          size="sm"
          variant="outline"
          colorScheme="brand"
        >
          {totalPages}
        </Button>
      );
    }
    
    return pageNumbers;
  };
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <HStack spacing={2} justify="center">
      <IconButton
        icon={<ChevronLeftIcon />}
        onClick={handlePrevious}
        isDisabled={currentPage === 1}
        aria-label="Previous page"
        size="sm"
        variant="outline"
      />
      
      {renderPageNumbers()}
      
      <IconButton
        icon={<ChevronRightIcon />}
        onClick={handleNext}
        isDisabled={currentPage === totalPages}
        aria-label="Next page"
        size="sm"
        variant="outline"
      />
    </HStack>
  );
};
