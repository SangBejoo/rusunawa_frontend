import React from 'react';
import { 
  Box, 
  Container, 
  Stack, 
  SimpleGrid, 
  Text, 
  Link, 
  useColorModeValue, 
  Image, 
  Divider,
  Heading,
  Flex
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../../assets/images/rusunawa-logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerBg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box 
      bg={footerBg} 
      color={useColorModeValue('gray.700', 'gray.200')}
      borderTopWidth="1px"
      borderColor={borderColor}
    >
      <Container as={Stack} maxW="container.xl" py={10}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Image src={logo} width="150px" alt="Rusunawa Logo" />
            </Box>
            <Text fontSize="sm">
              Rusunawa PNJ provides comfortable and affordable accommodation for students and professionals
              at Politeknik Negeri Jakarta.
            </Text>
            <Stack direction="row" spacing={6}>
              <Link href="#" isExternal>
                <FaFacebook size="20px" />
              </Link>
              <Link href="#" isExternal>
                <FaTwitter size="20px" />
              </Link>
              <Link href="#" isExternal>
                <FaInstagram size="20px" />
              </Link>
              <Link href="#" isExternal>
                <FaYoutube size="20px" />
              </Link>
            </Stack>
          </Stack>
          <Stack align="flex-start">
            <Heading as="h5" size="sm" mb={2}>Navigation</Heading>
            <Link as={RouterLink} to="/tenant">Home</Link>
            <Link as={RouterLink} to="/tenant/rooms">Rooms</Link>
            <Link as={RouterLink} to="/tenant/about">About Us</Link>
            <Link as={RouterLink} to="/tenant/contact">Contact</Link>
          </Stack>
          <Stack align="flex-start">
            <Heading as="h5" size="sm" mb={2}>Legal</Heading>
            <Link as={RouterLink} to="/tenant/terms">Terms of Service</Link>
            <Link as={RouterLink} to="/tenant/privacy">Privacy Policy</Link>
            <Link as={RouterLink} to="/tenant/faq">FAQ</Link>
          </Stack>
          <Stack align="flex-start">
            <Heading as="h5" size="sm" mb={2}>Contact</Heading>
            <Flex align="center">
              <FaMapMarkerAlt />
              <Text ml={2}>Jl. Prof. DR. G.A. Siwabessy, Kampus UI Depok 16425</Text>
            </Flex>
            <Flex align="center">
              <FaPhone />
              <Text ml={2}>+62-21-7270036</Text>
            </Flex>
            <Flex align="center">
              <FaEnvelope />
              <Text ml={2}>info@rusunawa.pnj.ac.id</Text>
            </Flex>
          </Stack>
        </SimpleGrid>
      </Container>
      
      <Divider borderColor={borderColor} />
      
      <Box py={4}>
        <Container maxW="container.xl">
          <Text textAlign="center">
            © {currentYear} Rusunawa Politeknik Negeri Jakarta. All rights reserved.
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
