import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <Flex 
      direction="column"
      justifyContent="center"
      alignItems="center"
      height="50vh"
      width="100%"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="brand.500"
        size="xl"
      />
      <Text mt={4} color="gray.500">
        {message}
      </Text>
    </Flex>
  );
};

export default LoadingSpinner;
