import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Icon,
  useColorModeValue,
  Image,
  Badge,
  Stack,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiWifi,
  FiTv,
  FiUsers,
  FiMapPin,
  FiStar,
  FiCheck,
  FiPhone,
  FiMail
} from 'react-icons/fi';

const TenantLanding = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, cyan.50)',
    'linear(to-br, gray.900, blue.900)'
  );

  const features = [
    {
      icon: FiHome,
      title: 'Kamar Modern',
      description: 'Kamar bersih, nyaman, dan lengkap dengan fasilitas modern.'
    },
    {
      icon: FiWifi,
      title: 'WiFi Gratis',
      description: 'Akses internet cepat di seluruh kamar dan area bersama.'
    },
    {
      icon: FiTv,
      title: 'Hiburan',
      description: 'Fasilitas TV dan hiburan di kamar maupun area umum.'
    },
    {
      icon: FiUsers,
      title: 'Komunitas',
      description: 'Gabung komunitas penghuni yang aktif dan dapatkan teman baru.'
    }
  ];

  const roomTypes = [
    {
      name: 'Kamar Harian',
      price: 'Rp 100.000',
      period: '/hari',
      features: ['Kamar bersama', 'Kamar mandi bersama', 'WiFi gratis', 'Meja belajar'],
      popular: false
    },
    {
      name: 'Kamar Bulanan',
      price: 'Rp 2.500.000',
      period: '/bulan',
      features: ['Kamar bersama', 'Kamar mandi dalam', 'WiFi gratis', 'Meja belajar', 'Lemari pakaian'],
      popular: true
    },
    {
      name: 'Kamar VIP',
      price: 'Rp 3.500.000',
      period: '/bulan',
      features: ['Kamar pribadi', 'Kamar mandi dalam', 'WiFi gratis', 'Meja belajar', 'AC', 'Kulkas mini'],
      popular: false
    }
  ];

  return (
    <Box minH="100vh" bg={bgGradient}>
      {/* Header */}
      <Box bg={bgColor} shadow="sm" position="sticky" top={0} zIndex={1000}>
        <Container maxW="7xl" py={4}>
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              Rusunawa PNJ
            </Heading>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/tenant/login"
                variant="ghost"
                colorScheme="blue"
              >
                Masuk
              </Button>
              <Button
                as={RouterLink}
                to="/tenant/register"
                colorScheme="blue"
              >
                Daftar
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={8} textAlign="center">
          <Heading
            size="2xl"
            bgGradient="linear(to-r, blue.600, cyan.500)"
            bgClip="text"
            fontWeight="extrabold"
          >
            Temukan Hunian Nyaman, Aman, dan Terjangkau
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="2xl">
            Dapatkan akomodasi modern, nyaman, dan terjangkau khusus untuk mahasiswa dan profesional muda di Rusunawa PNJ.
          </Text>
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => navigate('/tenant/rooms')}
              leftIcon={<FiHome />}
            >
              Lihat Kamar
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="blue"
              onClick={() => navigate('/tenant/register')}
            >
              Daftar Sekarang
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Container maxW="7xl" py={16}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">Kenapa Pilih Rusunawa?</Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Kami bukan sekadar tempat tinggal, tapi juga komunitas untuk berkembang dan sukses bersama.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
            {features.map((feature, index) => (
              <Card key={index} bg={bgColor} shadow="md" _hover={{ transform: 'translateY(-4px)' }} transition="all 0.2s">
                <CardBody textAlign="center">
                  <VStack spacing={4}>
                    <Icon as={feature.icon} boxSize={12} color="blue.500" />
                    <Heading size="md">{feature.title}</Heading>
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* Room Types Section */}
      <Container maxW="7xl" py={16}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">Pilih Tipe Kamar</Heading>
            <Text fontSize="lg" color="gray.600" maxW="2xl">
              Pilih tipe kamar sesuai kebutuhan dan budget kamu.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {roomTypes.map((room, index) => (
              <Card key={index} bg={bgColor} shadow="lg" position="relative" _hover={{ transform: 'translateY(-4px)' }} transition="all 0.2s">
                {room.popular && (
                  <Badge
                    colorScheme="blue"
                    position="absolute"
                    top={-2}
                    left="50%"
                    transform="translateX(-50%)"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    Paling Favorit
                  </Badge>
                )}
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <VStack spacing={2} textAlign="center">
                      <Heading size="lg">{room.name}</Heading>
                      <HStack spacing={1} justify="center">
                        <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                          {room.price}
                        </Text>
                        <Text color="gray.500">{room.period}</Text>
                      </HStack>
                    </VStack>

                    <Divider />

                    <VStack spacing={3} align="stretch">
                      {room.features.map((feature, featureIndex) => (
                        <HStack key={featureIndex}>
                          <Icon as={FiCheck} color="green.500" />
                          <Text>{feature}</Text>
                        </HStack>
                      ))}
                    </VStack>

                    <Button
                      colorScheme={room.popular ? "blue" : "gray"}
                      variant={room.popular ? "solid" : "outline"}
                      size="lg"
                      onClick={() => navigate('/tenant/rooms')}
                    >
                      Lihat Detail
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="blue.600" color="white" py={16}>
        <Container maxW="7xl">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl">Siap Tinggal di Rusunawa?</Heading>
            <Text fontSize="lg" maxW="2xl">
              Bergabunglah bersama ribuan mahasiswa & profesional yang sudah memilih Rusunawa sebagai hunian mereka. Daftar sekarang dan amankan kamarmu!
            </Text>
            <HStack spacing={4}>
              <Button
                size="lg"
                bg="white"
                color="blue.600"
                _hover={{ bg: 'gray.100' }}
                onClick={() => navigate('/tenant/register')}
              >
                Daftar Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => navigate('/tenant/rooms')}
              >
                Lihat Kamar
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={bgColor} py={8} borderTop="1px" borderColor="gray.200">
        <Container maxW="7xl">
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8}>
            <GridItem>
              <VStack align="start" spacing={4}>
                <Heading size="md" color="blue.600">Rusunawa PNJ</Heading>
                <Text color="gray.600">
                  Solusi hunian modern untuk mahasiswa & profesional muda.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={4}>
                <Heading size="sm">Tautan Cepat</Heading>
                <VStack align="start" spacing={2}>
                  <Button variant="link" as={RouterLink} to="/tenant/rooms" colorScheme="blue">
                    Lihat Kamar
                  </Button>
                  <Button variant="link" as={RouterLink} to="/tenant/login" colorScheme="blue">
                    Masuk
                  </Button>
                  <Button variant="link" as={RouterLink} to="/tenant/register" colorScheme="blue">
                    Daftar
                  </Button>
                </VStack>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack align="start" spacing={4}>
                <Heading size="sm">Kontak</Heading>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FiPhone} />
                    <Text>+62 123 456 7890</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiMail} />
                    <Text>info@rusunawa.com</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiMapPin} />
                    <Text>Jakarta, Indonesia</Text>
                  </HStack>
                </VStack>
              </VStack>
            </GridItem>
          </Grid>
          <Divider my={8} />
          <Text textAlign="center" color="gray.600">
            © 2024 Rusunawa PNJ. Seluruh hak cipta dilindungi.
          </Text>
        </Container>
      </Box>
    </Box>
  );
};

export default TenantLanding;
