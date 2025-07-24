import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiActivity, 
  FiTrendingUp, 
  FiDollarSign, 
  FiCalendar,
  FiZap,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';

const StreamingAnalytics = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [analysisType, setAnalysisType] = useState('overall-metrics');
  
  const wsRef = useRef(null);
  const contentRef = useRef(null);
  const toast = useToast();

  // Colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // WebSocket base URL - adjust according to your backend setup
  const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://qtd9x9cp-8001.asse.devtunnels.ms';

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  const connectWebSocket = (endpoint) => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_BASE_URL}/ws/analytics/${endpoint}`;
    console.log(`🔌 Connecting to: ${wsUrl}`);
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      setIsConnected(true);
      setIsStreaming(true);
      setError('');
      setContent('');
      setStatus('Terhubung ke server AI...');
      console.log('✅ WebSocket connected');
      
      toast({
        title: 'Connected',
        description: 'Terhubung ke streaming AI',
        status: 'success',
        duration: 2000,
      });
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'status':
            setStatus(message.content);
            break;
            
          case 'chunk':
            setContent(prev => prev + message.content);
            break;
            
          case 'complete':
            setIsStreaming(false);
            setStatus('✅ Analisis selesai!');
            console.log('🎉 Streaming completed');
            
            toast({
              title: 'Analysis Complete',
              description: 'AI analysis has been completed',
              status: 'success',
              duration: 3000,
            });
            break;
            
          case 'error':
            setError(message.content);
            setIsStreaming(false);
            setStatus('❌ Terjadi kesalahan');
            console.error('❌ WebSocket error:', message.content);
            
            toast({
              title: 'Error',
              description: message.content,
              status: 'error',
              duration: 5000,
            });
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    wsRef.current.onerror = (error) => {
      const errorMsg = 'Koneksi WebSocket gagal. Pastikan server berjalan.';
      setError(errorMsg);
      setIsStreaming(false);
      setIsConnected(false);
      console.error('❌ WebSocket error:', error);
      
      toast({
        title: 'Connection Failed',
        description: errorMsg,
        status: 'error',
        duration: 5000,
      });
    };
    
    wsRef.current.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
      console.log('🔌 WebSocket disconnected');
    };
  };
  const startAnalysis = (type) => {
    setAnalysisType(type);
    const endpoints = {
      'overall-metrics': 'overall',
      'daily-trends': `daily-trends?date=${new Date().toISOString().split('T')[0]}`,
      'monthly-performance': `monthly-performance?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`,
      'revenue-patterns': 'revenue-patterns'
    };
    
    connectWebSocket(endpoints[type]);
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  const getAnalysisTitle = (type) => {
    const titles = {
      'overall-metrics': '🎯 Analisis Metrik Keseluruhan',
      'daily-trends': '📈 Tren Harian',
      'monthly-performance': '📊 Performa Bulanan',
      'revenue-patterns': '💰 Pola Pendapatan'
    };
    return titles[type] || '🤖 Analisis AI';
  };

  const getAnalysisIcon = (type) => {
    const icons = {
      'overall-metrics': FiActivity,
      'daily-trends': FiCalendar,
      'monthly-performance': FiTrendingUp,
      'revenue-patterns': FiDollarSign
    };
    return icons[type] || FiActivity;
  };
  const formatContent = (text) => {
    if (!text) return [];
    
    // Enhanced formatting for DeepSeek AI thinking process
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Handle headers
      if (line.startsWith('###')) {
        return (
          <Heading key={index} size="md" color="blue.600" mt={4} mb={2}>
            {line.replace('###', '').trim()}
          </Heading>
        );
      }
      if (line.startsWith('##')) {
        return (
          <Heading key={index} size="lg" color="blue.700" mt={4} mb={2}>
            {line.replace('##', '').trim()}
          </Heading>
        );
      }
      
      // Handle thinking indicators with emojis
      if (line.includes('🤔')) {
        return (
          <Text key={index} my={2} p={3} bg="blue.50" borderLeft="4px" borderColor="blue.400" fontStyle="italic">
            {line}
          </Text>
        );
      }
      
      // Handle insights with lightbulb
      if (line.includes('💡')) {
        return (
          <Text key={index} my={2} p={3} bg="yellow.50" borderLeft="4px" borderColor="yellow.400" fontWeight="semibold">
            {line}
          </Text>
        );
      }
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().match(/^\d+\./)) {
        return (
          <Text key={index} ml={4} my={1}>
            {line.trim()}
          </Text>
        );
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <Text key={index} my={1}>
            {parts.map((part, i) => 
              i % 2 === 1 ? <Text as="strong" key={i}>{part}</Text> : part
            )}
          </Text>
        );
      }
      
      // Regular text
      return line.trim() ? (
        <Text key={index} my={1}>
          {line}
        </Text>
      ) : (
        <Box key={index} h={2} />
      );
    });
  };

  const AnalysisIcon = getAnalysisIcon(analysisType);

  return (
    <VStack spacing={6} align="stretch">
      {/* Control Panel */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardHeader>
          <HStack>
            <FiZap color="orange" />
            <Heading size="md">Streaming AI Analytics</Heading>
            {isConnected && (
              <Badge colorScheme="green" variant="subtle">
                <HStack spacing={1}>
                  <Box w={2} h={2} bg="green.500" borderRadius="full" />
                  <Text>Connected</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} mb={4}>
            <Button
              onClick={() => startAnalysis('overall-metrics')}
              isLoading={isStreaming && analysisType === 'overall-metrics'}
              colorScheme={analysisType === 'overall-metrics' ? 'blue' : 'gray'}
              variant={analysisType === 'overall-metrics' ? 'solid' : 'outline'}
              leftIcon={<FiActivity />}
              size="sm"
            >
              Metrik Keseluruhan
            </Button>
            
            <Button
              onClick={() => startAnalysis('daily-trends')}
              isLoading={isStreaming && analysisType === 'daily-trends'}
              colorScheme={analysisType === 'daily-trends' ? 'blue' : 'gray'}
              variant={analysisType === 'daily-trends' ? 'solid' : 'outline'}
              leftIcon={<FiCalendar />}
              size="sm"
            >
              Tren Harian
            </Button>
            
            <Button
              onClick={() => startAnalysis('monthly-performance')}
              isLoading={isStreaming && analysisType === 'monthly-performance'}
              colorScheme={analysisType === 'monthly-performance' ? 'blue' : 'gray'}
              variant={analysisType === 'monthly-performance' ? 'solid' : 'outline'}
              leftIcon={<FiTrendingUp />}
              size="sm"
            >
              Performa Bulanan
            </Button>
            
            <Button
              onClick={() => startAnalysis('revenue-patterns')}
              isLoading={isStreaming && analysisType === 'revenue-patterns'}
              colorScheme={analysisType === 'revenue-patterns' ? 'blue' : 'gray'}
              variant={analysisType === 'revenue-patterns' ? 'solid' : 'outline'}
              leftIcon={<FiDollarSign />}
              size="sm"
            >
              Pola Pendapatan
            </Button>
          </SimpleGrid>
          
          {isConnected && (
            <HStack justify="space-between" mt={4}>
              <HStack>
                {isStreaming ? (
                  <Spinner size="sm" color="blue.500" />
                ) : (
                  <FiCheckCircle color="green" />
                )}
                <Text fontSize="sm" color="gray.600">{status}</Text>
              </HStack>
              
              <Button
                onClick={disconnect}
                variant="outline"
                size="sm"
                colorScheme="red"
              >
                Disconnect
              </Button>
            </HStack>
          )}
        </CardBody>
      </Card>

      {/* Analysis Results */}
      <Card bg={cardBg} border="1px" borderColor={borderColor} minH="500px">
        <CardHeader>
          <HStack>
            <AnalysisIcon />
            <Heading size="md">{getAnalysisTitle(analysisType)}</Heading>
            {isStreaming && (
              <Badge colorScheme="blue" variant="subtle">
                <HStack spacing={1}>
                  <Spinner size="xs" />
                  <Text>Streaming...</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}
          
          <Box
            ref={contentRef}
            h="400px"
            overflowY="auto"
            p={4}
            bg="gray.50"
            borderRadius="md"
            border="1px"
            borderColor={borderColor}
          >
            {content ? (
              <VStack align="stretch" spacing={2}>
                {formatContent(content)}
                {isStreaming && (
                  <HStack>
                    <Box w={2} h={4} bg="blue.500" borderRadius="sm" />
                    <Text fontSize="sm" color="gray.500">AI sedang menulis...</Text>
                  </HStack>
                )}
              </VStack>
            ) : (
              <VStack justify="center" h="full" color="gray.500">
                {isConnected ? (
                  <VStack>
                    <Spinner size="lg" />
                    <Text>Menunggu respons AI...</Text>
                  </VStack>
                ) : (
                  <VStack>
                    <FiZap size={32} />
                    <Text textAlign="center">
                      Pilih jenis analisis untuk memulai streaming AI insights
                    </Text>
                  </VStack>
                )}
              </VStack>
            )}
          </Box>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default StreamingAnalytics;
