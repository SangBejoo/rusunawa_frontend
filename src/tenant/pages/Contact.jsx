import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Icon,
  HStack,
  VStack,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
} from 'react-icons/fa';
import TenantLayout from '../components/layout/TenantLayout';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.700');
  const featureBg = useColorModeValue('gray.50', 'gray.800');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement actual contact form submission
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: 'Message Sent!',
        description: 'Thank you for your message. We will get back to you soon.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TenantLayout>
      <Box minH="100vh">
        {/* Hero Section */}
        <Box py={16} bg={featureBg}>
          <Container maxW="container.xl">
            <VStack spacing={6} textAlign="center">
              <Heading size="2xl" color="brand.600">
                Contact Us
              </Heading>
              <Text fontSize="xl" maxW="800px" color="gray.600">
                Get in touch with us for any questions, concerns, or assistance regarding 
                your accommodation at Rusunawa PNJ.
              </Text>
            </VStack>
          </Container>
        </Box>

        {/* Contact Information */}
        <Box py={16}>
          <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} mb={16}>
              <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                <CardBody textAlign="center" p={8}>
                  <Icon as={FaMapMarkerAlt} boxSize={12} color="brand.500" mb={4} />
                  <Heading size="md" mb={4}>Address</Heading>
                  <Text color="gray.600">
                    Politeknik Negeri Jakarta<br />
                    Jl. Prof. Dr. G.A. Siwabessy<br />
                    Kampus UI Depok<br />
                    Depok 16425
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                <CardBody textAlign="center" p={8}>
                  <Icon as={FaPhone} boxSize={12} color="brand.500" mb={4} />
                  <Heading size="md" mb={4}>Phone</Heading>
                  <Text color="gray.600">
                    Main Office:<br />
                    +62 21 7270036<br />
                    Rusunawa Office:<br />
                    +62 21 7270037
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                <CardBody textAlign="center" p={8}>
                  <Icon as={FaEnvelope} boxSize={12} color="brand.500" mb={4} />
                  <Heading size="md" mb={4}>Email</Heading>
                  <Text color="gray.600">
                    General Inquiries:<br />
                    info@rusunawa.pnj.ac.id<br />
                    Support:<br />
                    support@rusunawa.pnj.ac.id
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                <CardBody textAlign="center" p={8}>
                  <Icon as={FaClock} boxSize={12} color="brand.500" mb={4} />
                  <Heading size="md" mb={4}>Office Hours</Heading>
                  <Text color="gray.600">
                    Monday - Friday:<br />
                    8:00 AM - 5:00 PM<br />
                    Saturday:<br />
                    8:00 AM - 12:00 PM
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Contact Form and Map */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12}>
              {/* Contact Form */}
              <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                <CardBody p={8}>
                  <Heading size="lg" mb={6}>Send us a Message</Heading>
                  <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={6}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                        <FormControl isRequired>
                          <FormLabel>Full Name</FormLabel>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                          />
                        </FormControl>
                      </SimpleGrid>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
                        <FormControl>
                          <FormLabel>Phone Number</FormLabel>
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>Subject</FormLabel>
                          <Input
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Enter message subject"
                          />
                        </FormControl>
                      </SimpleGrid>

                      <FormControl isRequired>
                        <FormLabel>Message</FormLabel>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Enter your message"
                          rows={6}
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        width="100%"
                        isLoading={isSubmitting}
                        loadingText="Sending..."
                      >
                        Send Message
                      </Button>
                    </VStack>
                  </Box>
                </CardBody>
              </Card>

              {/* Additional Information */}
              <VStack spacing={8} align="stretch">
                {/* Emergency Contact */}
                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody p={8}>
                    <Heading size="md" mb={4} color="red.500">Emergency Contact</Heading>
                    <VStack spacing={3} align="start">
                      <HStack>
                        <Icon as={FaPhone} color="red.500" />
                        <Text fontWeight="medium">24/7 Emergency Hotline:</Text>
                      </HStack>
                      <Text fontSize="lg" fontWeight="bold" color="red.500">
                        +62 812-3456-7890
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        For urgent matters outside office hours
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Social Media */}
                <Card bg={cardBg} borderWidth="1px" borderColor="gray.200">
                  <CardBody p={8}>
                    <Heading size="md" mb={4}>Follow Us</Heading>
                    <VStack spacing={4} align="start">
                      <HStack spacing={3}>
                        <Icon as={FaFacebook} color="blue.500" boxSize={5} />
                        <Text>@RusunawaPNJ</Text>
                      </HStack>
                      <HStack spacing={3}>
                        <Icon as={FaInstagram} color="pink.500" boxSize={5} />
                        <Text>@rusunawa_pnj</Text>
                      </HStack>
                      <HStack spacing={3}>
                        <Icon as={FaWhatsapp} color="green.500" boxSize={5} />
                        <Text>+62 812-3456-7890</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Quick Tips */}
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Quick Tip:</Text>
                    <Text fontSize="sm">
                      For faster response, please include your student ID or booking reference 
                      number in your message.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            </SimpleGrid>
          </Container>
        </Box>
      </Box>
    </TenantLayout>
  );
};

export default Contact;
