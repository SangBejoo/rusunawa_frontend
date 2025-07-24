import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  Image,
  Card,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaWifi,
  FaShieldAlt,
  FaUsers,
  FaClock,
  FaHome,
} from 'react-icons/fa';
import TenantLayout from '../components/layout/TenantLayout';
import maleRoomImage from '../../assets/images/male-room.jpg';

const About = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const featureBg = useColorModeValue('gray.50', 'gray.800');

  return (
    <TenantLayout>
      <Box minH="100vh">
        {/* Hero Section */}
        <Box py={16} bg={featureBg}>
          <Container maxW="container.xl">
            <VStack spacing={6} textAlign="center">
              <Heading size="2xl" color="brand.600">
                About Rusunawa PNJ
              </Heading>
              <Text fontSize="xl" maxW="800px" color="gray.600">
                Rusunawa Politeknik Negeri Jakarta provides safe, comfortable, and affordable accommodation 
                designed specifically for students and professionals.
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Story Section */}
        <Box py={16}>
          <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} align="center">
              <Box>
                <Heading size="xl" mb={6}>
                  Our Story
                </Heading>
                <Text fontSize="lg" mb={4} color="gray.600">
                  Established as part of Politeknik Negeri Jakarta's commitment to student welfare, 
                  Rusunawa PNJ has been providing quality accommodation since its inception.
                </Text>
                <Text fontSize="lg" mb={4} color="gray.600">
                  Located strategically on campus, our dormitories offer convenient access to 
                  educational facilities while providing a comfortable living environment that 
                  supports academic success.
                </Text>
                <Text fontSize="lg" color="gray.600">
                  We pride ourselves on creating a community where students can focus on their 
                  studies while enjoying a safe and supportive living environment.
                </Text>
              </Box>              <Box>
                <Image
                  src={maleRoomImage}
                  alt="Rusunawa Building"
                  borderRadius="lg"
                  boxShadow="xl"
                />
              </Box>
            </SimpleGrid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box py={16} bg={featureBg}>
          <Container maxW="container.xl">
            <VStack spacing={12}>
              <Heading size="xl" textAlign="center">
                Why Choose Rusunawa PNJ?
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaMapMarkerAlt} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>Prime Location</Heading>
                    <Text color="gray.600">
                      Located directly on campus for easy access to all educational facilities
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaWifi} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>Modern Amenities</Heading>
                    <Text color="gray.600">
                      Free high-speed Wi-Fi, air conditioning, and modern facilities
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaShieldAlt} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>24/7 Security</Heading>
                    <Text color="gray.600">
                      Round-the-clock security ensures a safe living environment
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaUsers} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>Community Living</Heading>
                    <Text color="gray.600">
                      Foster friendships and collaboration in our vibrant community
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaClock} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>24/7 Support</Heading>
                    <Text color="gray.600">
                      Our staff is always available to help with any concerns
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody textAlign="center" p={8}>
                    <Icon as={FaHome} boxSize={12} color="brand.500" mb={4} />
                    <Heading size="md" mb={4}>Affordable Rates</Heading>
                    <Text color="gray.600">
                      Quality accommodation at student-friendly prices
                    </Text>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </Container>
        </Box>

        {/* Mission & Vision */}
        <Box py={16}>
          <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12}>
              <Card bg={cardBg} p={8} borderWidth="1px" borderColor="gray.200">
                <CardBody>
                  <Heading size="lg" mb={6} color="brand.600">Our Mission</Heading>
                  <Text fontSize="lg" color="gray.600">
                    To provide safe, comfortable, and affordable accommodation that supports 
                    the academic and personal development of students at Politeknik Negeri Jakarta.
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg} p={8} borderWidth="1px" borderColor="gray.200">
                <CardBody>
                  <Heading size="lg" mb={6} color="brand.600">Our Vision</Heading>
                  <Text fontSize="lg" color="gray.600">
                    To be the premier student accommodation provider, creating a supportive 
                    community that fosters academic excellence and personal growth.
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Container>
        </Box>
      </Box>
    </TenantLayout>
  );
};

export default About;
