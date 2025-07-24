import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Skeleton,
  useColorModeValue,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Icon,
  Progress,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FaUpload, FaFilePdf, FaFileImage } from 'react-icons/fa';
import TenantLayout from '../../components/layout/TenantLayout';
import DocumentCard from '../../components/document/DocumentCard';
import DocumentViewer from '../../components/document/DocumentViewer';
import ProfileCompletionStatus from '../../components/profile/ProfileCompletionStatus';
import { useDocumentVerification } from '../../hooks/useDocumentVerification';
import documentService from '../../services/documentService';
import tenantAuthService from '../../services/tenantAuthService';
import { useTenantAuth } from '../../context/tenantAuthContext';
import DocumentRequirements from '../../components/documents/DocumentRequirements';

const Documents = () => {
  const { tenant } = useTenantAuth();
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { verificationStatus: bookingVerificationStatus } = useDocumentVerification();
  
  // Check if user is a student (mahasiswa)
  const isStudent = tenant?.tenantType?.name === 'mahasiswa';
  
  // Booking eligibility banner component
  const BookingEligibilityBanner = () => {
    if (bookingVerificationStatus.canBook) {
      return (
        <Alert status="success" variant="subtle" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Ready to Book! 🎉</AlertTitle>
            <AlertDescription>
              All required documents are verified. You can now book rooms. 
              <Button 
                as={RouterLink} 
                to="/tenant/rooms" 
                ml={2} 
                size="sm" 
                colorScheme="green" 
                variant="outline"
              >
                Browse Rooms
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      );
    }
    
    // Show detailed information about missing/pending documents
    const status = bookingVerificationStatus.statusType === 'warning' ? 'warning' : 'error';
    
    return (
      <Alert status={status} variant="subtle" borderRadius="lg">
        <AlertIcon />
        <Box w="full">
          <AlertTitle>Document Verification Required</AlertTitle>
          <AlertDescription>
            <Text mb={2}>{bookingVerificationStatus.message}</Text>
            
            {/* Show missing documents details for students */}
            {bookingVerificationStatus.missingDocuments && bookingVerificationStatus.missingDocuments.length > 0 && (
              <Box mt={3} p={3} bg="rgba(0,0,0,0.05)" borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {isStudent ? 'Required Documents for Students:' : 'Required Documents:'}
                </Text>
                <VStack spacing={1} align="start">
                  {bookingVerificationStatus.missingDocuments.map((doc) => (
                    <HStack key={doc.id} fontSize="sm">
                      <Text>•</Text>
                      <Text>{doc.label}</Text>
                      <Badge 
                        size="sm" 
                        colorScheme={
                          doc.status === 'missing' ? 'red' : 
                          doc.status === 'pending' ? 'yellow' : 
                          doc.status === 'rejected' ? 'red' : 'gray'
                        }
                      >
                        {doc.status === 'missing' ? 'Not Uploaded' : 
                         doc.status === 'pending' ? 'Pending Review' : 
                         doc.status === 'rejected' ? 'Rejected' : doc.status}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
            
            <HStack mt={3} spacing={2}>
              {!bookingVerificationStatus.hasDocuments && (
                <Button 
                  as={RouterLink} 
                  to="/tenant/documents/upload" 
                  size="sm" 
                  colorScheme="orange" 
                  variant="outline"
                >
                  Upload Documents
                </Button>
              )}
              
              {bookingVerificationStatus.missingDocuments?.some(doc => doc.status === 'missing') && (
                <Button 
                  as={RouterLink} 
                  to="/tenant/documents/upload" 
                  size="sm" 
                  colorScheme="blue" 
                  variant="outline"
                >
                  Upload Missing Documents
                </Button>
              )}
            </HStack>
          </AlertDescription>
        </Box>
      </Alert>
    );
  };
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  
  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await documentService.getTenantDocuments();
        setDocuments(response.documents || []);
        
        // If we have documents, select the first one by default
        if (response.documents && response.documents.length > 0) {
          setSelectedDocument(response.documents[0]);
        }
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(err.message || "Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  // Handle document selection
  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
  };
    // Handle document deletion
  const handleDocumentDelete = async (documentId) => {
    try {
      console.log('Documents page: Attempting to delete document', documentId);
      console.log('Current tenant:', tenantAuthService.getCurrentTenant()); // Debug tenant info
      
      await documentService.deleteDocument(documentId);
      
      // Update the documents list
      setDocuments(prev => prev.filter(doc => doc.docId !== documentId));
      
      // If the deleted document was selected, clear selection
      if (selectedDocument && selectedDocument.docId === documentId) {
        setSelectedDocument(null);
      }
      
      console.log('Document deleted successfully from frontend state');
    } catch (err) {
      console.error("Documents page: Error deleting document:", err);
      throw err; // Let the DocumentViewer component handle the error
    }
  };
  
  // Handle document replacement via redirect
  const handleDocumentReplace = (documentId) => {
    const document = documents.find(doc => doc.docId === documentId);
    if (document) {
      // Navigate to upload page with docType pre-filled
      window.location.href = `/tenant/documents/upload?docType=${document.docTypeId}`;
    }
  };
  
  // Filter documents by status
  const approvedDocuments = documents.filter(doc => doc.status === 'approved');
  const pendingDocuments = documents.filter(doc => doc.status === 'pending');
  const rejectedDocuments = documents.filter(doc => doc.status === 'rejected');
  
  // Compute document verification status based on new system
  const computeVerificationStatus = () => {
    const status = bookingVerificationStatus;
    
    if (!status) {
      return { text: 'Loading...', color: 'gray' };
    }
    
    if (status.canBook) {
      return { text: 'All Requirements Met', color: 'green' };
    }
    
    if (status.statusType === 'error') {
      return { text: 'Action Required', color: 'red' };
    }
    
    if (status.statusType === 'warning') {
      return { text: 'Pending Verification', color: 'yellow' };
    }
    
    return { text: 'Incomplete', color: 'gray' };
  };
  
  const verificationStatus = computeVerificationStatus();
  
  // Calculate progress based on required documents for user type
  const calculateProgress = () => {
    const status = bookingVerificationStatus;
    if (!status || !status.requiredCount) return 0;
    
    const approvedRequired = status.requiredCount - (status.missingDocuments?.length || 0);
    return (approvedRequired / status.requiredCount) * 100;
  };
  
  const verificationProgress = calculateProgress();

  return (
    <TenantLayout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header with upload button */}
          <HStack justifyContent="space-between" flexWrap="wrap">
            <VStack align="flex-start" spacing={1}>
              <Heading size="lg">My Documents</Heading>
              <Text color="gray.500">Upload and manage your identification documents</Text>
            </VStack>
            
            <Button
              as={RouterLink}
              to="/tenant/documents/upload"
              leftIcon={<FaUpload />}
              colorScheme="brand"
            >
              Upload New Document
            </Button>
          </HStack>
          
          {/* Booking Eligibility Banner */}
          <BookingEligibilityBanner />
          
          {/* Document Requirements Section */}
          <DocumentRequirements tenant={tenant} showDownload={true} />
          
          {/* Profile Completion Status */}
          <ProfileCompletionStatus />
          
          {/* Verification status card */}
          <Box 
            bg={cardBg} 
            p={6} 
            borderRadius="lg" 
            boxShadow="md"
          >
            <VStack spacing={4} align="stretch">
              <HStack justifyContent="space-between">
                <Heading size="md">Verification Status</Heading>
                <Badge colorScheme={verificationStatus.color} px={2} py={1}>
                  {verificationStatus.text}
                </Badge>
              </HStack>
              
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text>Document Verification Progress</Text>
                  <Text fontSize="sm" color="gray.500">
                    {isStudent ? 'Required: 3 documents' : 'Required: 1 document'}
                  </Text>
                </HStack>
                <Progress 
                  value={verificationProgress} 
                  colorScheme={verificationStatus.color} 
                  size="md" 
                  borderRadius="md"
                />
                <HStack justify="space-between" mt={1}>
                  <Text fontSize="sm">{Math.round(verificationProgress)}%</Text>
                  <Text fontSize="sm">
                    {bookingVerificationStatus.requiredCount - (bookingVerificationStatus.missingDocuments?.length || 0)}/
                    {bookingVerificationStatus.requiredCount} Required
                  </Text>
                </HStack>
              </Box>
              
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <HStack p={3} bg={highlightColor} borderRadius="md">
                  <Icon as={FaFilePdf} boxSize={6} color="brand.500" />
                  <Box>
                    <Text fontWeight="bold">{documents.length}</Text>
                    <Text fontSize="sm">Total Documents</Text>
                  </Box>
                </HStack>
                
                <HStack p={3} bg="blue.50" borderRadius="md">
                  <Icon as={FaFileImage} boxSize={6} color="blue.500" />
                  <Box>
                    <Text fontWeight="bold">{bookingVerificationStatus.requiredCount || (isStudent ? 3 : 1)}</Text>
                    <Text fontSize="sm">Required</Text>
                  </Box>
                </HStack>
                
                <HStack p={3} bg="green.50" borderRadius="md">
                  <Icon as={FaFileImage} boxSize={6} color="green.500" />
                  <Box>
                    <Text fontWeight="bold">{approvedDocuments.length}</Text>
                    <Text fontSize="sm">Approved</Text>
                  </Box>
                </HStack>
                
                <HStack p={3} bg="red.50" borderRadius="md">
                  <Icon as={FaFileImage} boxSize={6} color="red.500" />
                  <Box>
                    <Text fontWeight="bold">{bookingVerificationStatus.missingDocuments?.length || 0}</Text>
                    <Text fontSize="sm">Missing/Issues</Text>
                  </Box>
                </HStack>
              </SimpleGrid>
              
              {rejectedDocuments.length > 0 && (
                <Text color="red.500" fontSize="sm">
                  You have {rejectedDocuments.length} document(s) that need your attention.
                  Please replace them with valid documents.
                </Text>
              )}
            </VStack>
          </Box>
          
          {/* Main content */}
          {loading ? (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Skeleton height="200px" />
              <Skeleton height="200px" />
              <Skeleton height="200px" />
            </SimpleGrid>
          ) : error ? (
            <Box p={6} textAlign="center" bg={cardBg} borderRadius="lg">
              <Text color="red.500">{error}</Text>
              <Button mt={4} onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Box>
          ) : documents.length === 0 ? (
            <Box 
              p={8} 
              textAlign="center" 
              bg={cardBg} 
              borderRadius="lg" 
              boxShadow="md"
            >
              <Icon as={FaFilePdf} boxSize={12} color="gray.400" mb={4} />
              <Heading size="md" mb={2}>No Documents Uploaded</Heading>
              <Text color="gray.500" mb={6}>
                You need to upload your identification documents for verification
              </Text>
              <Button
                as={RouterLink}
                to="/tenant/documents/upload"
                colorScheme="brand"
                leftIcon={<FaUpload />}
              >
                Upload Documents
              </Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
              {/* Documents list */}
              <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" height="fit-content">
                <Tabs colorScheme="brand" isFitted variant="enclosed">
                  <TabList mb={4}>
                    <Tab fontWeight="medium">All ({documents.length})</Tab>
                    <Tab fontWeight="medium">
                      Approved ({approvedDocuments.length})
                    </Tab>
                    <Tab fontWeight="medium">
                      Pending ({pendingDocuments.length})
                    </Tab>
                    <Tab fontWeight="medium">
                      Rejected ({rejectedDocuments.length})
                    </Tab>
                  </TabList>
                  
                  <TabPanels>
                    <TabPanel p={0}>                      <VStack spacing={4} align="stretch">
                        {documents.map((doc) => (
                          <DocumentCard
                            key={doc.docId}
                            document={doc}
                            showStatus
                            isSelected={selectedDocument?.docId === doc.docId}
                            onView={() => handleDocumentSelect(doc)}
                            onDelete={handleDocumentDelete}
                          />
                        ))}
                      </VStack>
                    </TabPanel>
                    
                    <TabPanel p={0}>
                      {approvedDocuments.length ? (                        <VStack spacing={4} align="stretch">
                          {approvedDocuments.map((doc) => (
                            <DocumentCard
                              key={doc.docId}
                              document={doc}
                              showStatus
                              isSelected={selectedDocument?.docId === doc.docId}
                              onView={() => handleDocumentSelect(doc)}
                              onDelete={handleDocumentDelete}
                            />
                          ))}
                        </VStack>
                      ) : (
                        <Text textAlign="center" py={8} color="gray.500">
                          No approved documents yet
                        </Text>
                      )}
                    </TabPanel>
                    
                    <TabPanel p={0}>
                      {pendingDocuments.length ? (                        <VStack spacing={4} align="stretch">
                          {pendingDocuments.map((doc) => (
                            <DocumentCard
                              key={doc.docId}
                              document={doc}
                              showStatus
                              isSelected={selectedDocument?.docId === doc.docId}
                              onView={() => handleDocumentSelect(doc)}
                              onDelete={handleDocumentDelete}
                            />
                          ))}
                        </VStack>
                      ) : (
                        <Text textAlign="center" py={8} color="gray.500">
                          No pending documents
                        </Text>
                      )}
                    </TabPanel>
                    
                    <TabPanel p={0}>
                      {rejectedDocuments.length ? (                        <VStack spacing={4} align="stretch">
                          {rejectedDocuments.map((doc) => (
                            <DocumentCard
                              key={doc.docId}
                              document={doc}
                              showStatus
                              isSelected={selectedDocument?.docId === doc.docId}
                              onView={() => handleDocumentSelect(doc)}
                              onDelete={handleDocumentDelete}
                            />
                          ))}
                        </VStack>
                      ) : (
                        <Text textAlign="center" py={8} color="gray.500">
                          No rejected documents
                        </Text>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Box>
              
              {/* Document preview */}
              <Box>
                {selectedDocument ? (
                  <DocumentViewer
                    document={selectedDocument}
                    onDelete={handleDocumentDelete}
                    onReplace={handleDocumentReplace}
                  />
                ) : (
                  <Box 
                    bg={cardBg} 
                    p={6} 
                    borderRadius="lg" 
                    boxShadow="md"
                    textAlign="center"
                  >
                    <Text>Please select a document to view details</Text>
                  </Box>
                )}
              </Box>
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </TenantLayout>
  );
};

export default Documents;
