import React from 'react';
import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  VisuallyHidden,
  chakra,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const ListHeader = ({ children }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  );
};

const SocialButton = ({ children, label, href }) => {
  return (
    <chakra.button
      bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
      rounded={'full'}
      w={8}
      h={8}
      cursor={'pointer'}
      as={'a'}
      href={href}
      target="_blank"
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  );
};

const Footer = () => {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      mt="auto"
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr 1fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Text fontSize="xl" fontWeight="bold" color="brand.500">
                Rusunawa
              </Text>
            </Box>
            <Text fontSize={'sm'}>
              © {new Date().getFullYear()} Rusunawa. All rights reserved
            </Text>
            <Stack direction={'row'} spacing={6}>
              <SocialButton label={'Twitter'} href={'#'}>
                <FaTwitter />
              </SocialButton>
              <SocialButton label={'YouTube'} href={'#'}>
                <FaYoutube />
              </SocialButton>
              <SocialButton label={'Instagram'} href={'#'}>
                <FaInstagram />
              </SocialButton>
            </Stack>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Company</ListHeader>
            <Link as={RouterLink} to={'/tenant/about'}>About us</Link>
            <Link as={RouterLink} to={'/tenant/contact'}>Contact us</Link>
            <Link as={RouterLink} to={'/tenant/testimonials'}>Testimonials</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Support</ListHeader>
            <Link as={RouterLink} to={'/tenant/help'}>Help Center</Link>
            <Link as={RouterLink} to={'/tenant/terms'}>Terms of Service</Link>
            <Link as={RouterLink} to={'/tenant/privacy'}>Privacy Policy</Link>
          </Stack>          <Stack align={'flex-start'}>
            <ListHeader>Rooms</ListHeader>
            <Link as={RouterLink} to={'/tenant/rooms?type=mahasiswa'}>For Students</Link>
            <Link as={RouterLink} to={'/tenant/rooms?type=VIP'}>VIP Rooms</Link>
            <Link as={RouterLink} to={'/tenant/rooms?type=ruang_rapat'}>Meeting Rooms</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <ListHeader>Book Now</ListHeader>
            <Link as={RouterLink} to={'/tenant/rooms'}>View All Rooms</Link>
            <Link as={RouterLink} to={'/tenant/promotions'}>Special Offers</Link>
            <Link as={RouterLink} to={'/tenant/faq'}>FAQs</Link>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Footer;
