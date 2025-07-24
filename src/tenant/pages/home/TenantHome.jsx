import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  Image,
  SimpleGrid,
  VStack,
  HStack,
  Card,
  CardBody,
  Stack,
  Icon,
  Divider,
  useColorModeValue,
  useBreakpointValue,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { 
  FaBed, 
  FaUsers, 
  FaWifi, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaShieldAlt, 
  FaHandshake,
  FaArrowRight,
  FaInfo
} from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import RoomCard from '../../components/room/RoomCard';
import roomService from '../../services/roomService';
import maleRoomImage from '../../../assets/images/male-room.jpg';

const TenantHome = () => {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  
  // Fetch featured rooms on component mount
  useEffect(() => {
    const fetchFeaturedRooms = async () => {
      try {
        const response = await roomService.getRooms({ featured: true, limit: 3 });
        setFeaturedRooms(response.rooms || []);
      } catch (error) {
        console.error('Error fetching featured rooms:', error);
      }
    };
    
    fetchFeaturedRooms();
  }, []);

  // Color mode values
  const heroBg = useColorModeValue('gray.50', 'gray.900');
  const featureBg = useColorModeValue('white', 'gray.800');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const statsBoxBg = useColorModeValue('blue.500', 'blue.400');
  
  // Responsive heading size
  const heroHeadingSize = useBreakpointValue({ base: '2xl', md: '3xl' });
  const sectionHeadingSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  // Fix any ListIcon usage in the Features section
  const Feature = ({ icon, title, text }) => {
    return (
      <Box p={5} shadow="md" borderWidth="1px" flex="1" borderRadius="md" bg={featureBg}>
        <Flex align="center" mb={2}>
          <Icon as={icon} boxSize={6} color="brand.500" />
          <Heading as="h3" size="md" ml={3}>
            {title}
          </Heading>
        </Flex>
        <Text color={subtitleColor}>{text}</Text>
      </Box>
    );
  };

  // Replace any usage of ListIcon in the FAQ section with proper List structure
  const FAQ = ({ title, description }) => {
    return (
      <Box mb={5}>
        <List spacing={3}>
          <ListItem>
            <ListIcon as={FaInfo} color="brand.500" />
            <Text as="span" fontWeight="bold">{title}</Text>
          </ListItem>
        </List>
        <Text ml={6} mt={2}>{description}</Text>
      </Box>
    );
  };

  return (
    <TenantLayout>      {/* Hero Section */}
      <Box
        bg="blue.500"
        bgGradient="linear(to-r, blue.500, purple.600)"
        position="relative"
        py={{ base: 16, md: 32 }}
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.700"
          zIndex="1"
        />
        <Container maxW="container.xl" position="relative" zIndex="2">
          <Flex direction="column" align="center" textAlign="center">
            <Heading
              color="white"
              size={heroHeadingSize}
              mb={4}
              fontWeight="bold"
            >
              Temukan Hunian Mahasiswa Terbaikmu
            </Heading>
            <Text
              color="whiteAlpha.900"
              fontSize={{ base: 'lg', md: 'xl' }}
              maxW="800px"
              mb={8}
            >
              Rusunawa PNJ menyediakan kamar nyaman dan terjangkau untuk mahasiswa dan profesional.
            </Text>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/tenant/rooms"
                colorScheme="brand"
                size="lg"
                rightIcon={<FaArrowRight />}
              >
                Lihat Kamar
              </Button>
              <Button
                as={RouterLink}
                to="/tenant/about"
                colorScheme="whiteAlpha"
                size="lg"
              >
                Tentang Rusunawa
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box py={12} bg={statsBoxBg} color="white">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <VStack align="center" spacing={2}>
              <Heading size="3xl">100+</Heading>
              <Text fontSize="lg">Kamar Tersedia</Text>
            </VStack>
            <VStack align="center" spacing={2}>
              <Heading size="3xl">500+</Heading>
              <Text fontSize="lg">Penyewa Puas</Text>
            </VStack>
            <VStack align="center" spacing={2}>
              <Heading size="3xl">24/7</Heading>
              <Text fontSize="lg">Dukungan & Keamanan</Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* About Section */}
      <Box py={16} bg={featureBg}>
        <Container maxW="container.xl">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            justify="space-between"
            gap={8}
          >
            <Box flex="1">
              <Heading size={sectionHeadingSize} mb={4}>
                Tentang Rusunawa PNJ
              </Heading>
              <Text color={subtitleColor} fontSize="lg" mb={6}>
                Rusunawa Politeknik Negeri Jakarta menyediakan hunian aman dan nyaman khusus untuk mahasiswa dan profesional. Berlokasi di dalam kampus, akses ke fasilitas pendidikan jadi lebih mudah.
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                <HStack align="center">
                  <Icon as={FaMapMarkerAlt} color="brand.500" boxSize={5} />
                  <Text>Lokasi Strategis</Text>
                </HStack>
                <HStack align="center">
                  <Icon as={FaWifi} color="brand.500" boxSize={5} />
                  <Text>Wi-Fi Gratis</Text>
                </HStack>
                <HStack align="center">
                  <Icon as={FaShieldAlt} color="brand.500" boxSize={5} />
                  <Text>Keamanan 24 Jam</Text>
                </HStack>
                <HStack align="center">
                  <Icon as={FaUsers} color="brand.500" boxSize={5} />
                  <Text>Kegiatan Komunitas</Text>
                </HStack>
              </SimpleGrid>
              <Button
                as={RouterLink}
                to="/tenant/about"
                colorScheme="brand"
                rightIcon={<FaArrowRight />}
              >
                Selengkapnya
              </Button>
            </Box>            <Box flex="1">
              <Image
                src={maleRoomImage}
                alt="Rusunawa building"
                borderRadius="lg"
                boxShadow="xl"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Featured Rooms Section */}
      <Box py={16}>
        <Container maxW="container.xl">
          <Heading size={sectionHeadingSize} mb={2} textAlign="center">
            Kamar Unggulan
          </Heading>
          <Text
            color={subtitleColor}
            fontSize="lg"
            mb={8}
            textAlign="center"
          >
            Temukan pilihan kamar favorit di Rusunawa PNJ
          </Text>
          
          {featuredRooms.length > 0 && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {featuredRooms.map((room) => {
                // Generate a proper unique key
                const roomKey = room.roomId || room.room_id || room.id || `room-${Math.random().toString(36).substr(2, 9)}`;
                
                return (
                  <RoomCard 
                    key={roomKey}
                    room={room} 
                  />
                );
              })}
            </SimpleGrid>
          )}
          
          <Box textAlign="center" mt={10}>
            <Button
              as={RouterLink}
              to="/tenant/rooms"
              colorScheme="brand"
              size="lg"
              rightIcon={<FaArrowRight />}
            >
              Lihat Semua Kamar
            </Button>
          </Box>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box py={16} bg={featureBg}>
        <Container maxW="container.xl">
          <Heading size={sectionHeadingSize} mb={2} textAlign="center">
            Cara Booking
          </Heading>
          <Text
            color={subtitleColor}
            fontSize="lg"
            mb={12}
            textAlign="center"
            maxW="800px"
            mx="auto"
          >
            Booking kamar di Rusunawa sangat mudah dan cepat
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <VStack align="center" spacing={4}>
              <Flex
                w="80px"
                h="80px"
                borderRadius="full"
                bg="brand.500"
                color="white"
                align="center"
                justify="center"
                fontSize="xl"
                fontWeight="bold"
                mb={2}
              >
                <Icon as={FaBed} boxSize={6} />
              </Flex>
              <Heading size="md">Pilih Kamar</Heading>
              <Text textAlign="center">
                Lihat daftar kamar dan pilih sesuai kebutuhanmu
              </Text>
            </VStack>
            
            <VStack align="center" spacing={4}>
              <Flex
                w="80px"
                h="80px"
                borderRadius="full"
                bg="brand.500"
                color="white"
                align="center"
                justify="center"
                fontSize="xl"
                fontWeight="bold"
                mb={2}
              >
                <Icon as={FaCalendarAlt} boxSize={6} />
              </Flex>
              <Heading size="md">Booking</Heading>
              <Text textAlign="center">
                Pilih tanggal check-in & check-out lalu ajukan booking
              </Text>
            </VStack>
            
            <VStack align="center" spacing={4}>
              <Flex
                w="80px"
                h="80px"
                borderRadius="full"
                bg="brand.500"
                color="white"
                align="center"
                justify="center"
                fontSize="xl"
                fontWeight="bold"
                mb={2}
              >
                <Icon as={FaHandshake} boxSize={6} />
              </Flex>
              <Heading size="md">Check-in</Heading>
              <Text textAlign="center">
                Selesaikan pembayaran, tanda tangan perjanjian, dan mulai tinggal di kamar baru
              </Text>
            </VStack>
          </SimpleGrid>
          
          <Box textAlign="center" mt={12}>
            <Button
              as={RouterLink}
              to="/tenant/register"
              colorScheme="brand"
              size="lg"
              rightIcon={<FaArrowRight />}
            >
              Daftar Sekarang
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={16} bg="brand.600" color="white">
        <Container maxW="container.xl">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
          >
            <Box maxW={{ base: 'full', md: '60%' }} mb={{ base: 6, md: 0 }}>
              <Heading size="xl" mb={4}>
                Siap Temukan Kamar Idamanmu?
              </Heading>
              <Text fontSize="lg">
                Bergabunglah bersama ratusan mahasiswa & profesional yang sudah menemukan hunian ideal di Rusunawa PNJ.
              </Text>
            </Box>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/tenant/rooms"
                colorScheme="whiteAlpha"
                size="lg"
              >
                Lihat Kamar
              </Button>
              <Button
                as={RouterLink}
                to="/tenant/register"
                bg="white"
                color="brand.600"
                _hover={{ bg: 'gray.100' }}
                size="lg"
              >
                Daftar Sekarang
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </TenantLayout>
  );
};

export default TenantHome;
