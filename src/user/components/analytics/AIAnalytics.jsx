import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Skeleton,
  SkeletonText,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useToast,
  Divider,
  Tooltip,
  Spinner,
  Flex,
  Center,
  Fade,
  ScaleFade,
  CircularProgress,
  CircularProgressLabel,
  ButtonGroup,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Spacer,
  Code,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Switch,
  FormControl,
  FormLabel,
  Textarea,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps
} from '@chakra-ui/react';
import {
  FiZap,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTarget,
  FiBarChart,
  FiPieChart,
  FiClock,
  FiStar,
  FiFlag,
  FiSettings,
  FiDownload,
  FiShare2,
  FiEye,
  FiEyeOff,
  FiActivity,
  FiDatabase,
  FiCloud,
  FiCpu,
  FiBookmark,
  FiMaximize2,
  FiMinimize2,
  FiPause,
  FiPlay,
  FiStop,  FiX,
  FiSquare
} from 'react-icons/fi';
import { MdPsychology, MdAutoAwesome, MdInsights, MdScience } from 'react-icons/md';
import aiAnalyticsService from '../../services/aiAnalyticsService';

const AIAnalytics = () => {
  // Generate unique component ID for debugging mount/unmount cycles
  const componentId = useRef(`AIAnalytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  // Debug log removed for cleaner console output
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const successBg = useColorModeValue('green.50', 'green.900');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  
  // Additional color mode values for conditional components
  const loadingCardBg = useColorModeValue('blue.50', 'blue.900');
  const progressTrackColor = useColorModeValue('blue.100', 'blue.800');
  const progressBg = useColorModeValue('gray.100', 'gray.600');
  const stepperBg = useColorModeValue('white', 'gray.700');
  const stepperBorderColor = useColorModeValue('gray.200', 'gray.600');
  
  const toast = useToast();
  
  // Core state
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [serviceAvailable, setServiceAvailable] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Enhanced loading state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [actualTime, setActualTime] = useState(0);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [canCancel, setCanCancel] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [analysisType, setAnalysisType] = useState(null);
  const [detailedStatus, setDetailedStatus] = useState(null);
  
  // UI state
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);  
  // Refs
  const intervalRef = useRef(null);
  const timeRef = useRef(null);
  const cancelRef = useRef(null);
  const serviceCheckInProgress = useRef(false);
  
  // Modals
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isResultModalOpen, onOpen: onResultModalOpen, onClose: onResultModalClose } = useDisclosure();
  const { isOpen: isCancelDialogOpen, onOpen: onCancelDialogOpen, onClose: onCancelDialogClose } = useDisclosure();
  
  // Stepper for progress tracking
  const processingSteps = [
    { title: 'Inisialisasi', description: 'Mempersiapkan AI model' },
    { title: 'Pengumpulan Data', description: 'Mengumpulkan data analytics' },
    { title: 'AI Reasoning', description: 'Model sedang menganalisis' },
    { title: 'Pola & Tren', description: 'Identifikasi insight' },
    { title: 'Rekomendasi', description: 'Menyusun actionable insights' },
    { title: 'Finalisasi', description: 'Menyiapkan hasil' }
  ];
  
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: processingSteps.length
  });  // Check service availability on mount
  useEffect(() => {
    let isMounted = true;
    let checkTimeout;
    
    const checkService = async () => {      // Prevent double execution in React.StrictMode
      if (serviceCheckInProgress.current || !isMounted) {
        // Service check already in progress, skipping...
        return;
      }
        serviceCheckInProgress.current = true;
      // Component mounted, checking service availability...
      
      try {
        await checkServiceAvailability();
      } finally {
        if (isMounted) {
          serviceCheckInProgress.current = false;
        }
      }
    };
    
    // Debounce the service check to prevent rapid calls
    checkTimeout = setTimeout(() => {
      checkService();
    }, 100);
    
    // Check for notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
      return () => {
      isMounted = false;
      serviceCheckInProgress.current = false;
      if (checkTimeout) clearTimeout(checkTimeout);
      // Component unmounting...
    };
  }, []);
  const handleManualServiceCheck = async () => {
    console.log('🔄 Manual service check requested - clearing cache first');
    aiAnalyticsService.clearServiceStatusCache();
    await checkServiceAvailability();
  };

  const checkServiceAvailability = useCallback(async () => {
    try {
      console.log(`🔍 AIAnalytics [${componentId.current}]: Checking service availability...`);
      const status = await aiAnalyticsService.checkServiceStatus();
      console.log(`🔍 Service availability check result [${componentId.current}]:`, status);
      
      // Be more lenient - only mark as unavailable if definitely offline
      setServiceAvailable(status.available && status.status !== 'offline');
      
      if (!status.available) {
        console.warn(`⚠️ AI Analytics service is not available [${componentId.current}]:`, status);
      }
    } catch (error) {
      console.error(`❌ Service availability check failed [${componentId.current}]:`, error);
      setServiceAvailable(false);
    }
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeRef.current) clearInterval(timeRef.current);
    };
  }, []);

  // Time tracking
  const startTimeTracking = useCallback(() => {
    const startTime = Date.now();
    setProcessingStartTime(startTime);
    setActualTime(0);
    
    timeRef.current = setInterval(() => {
      setActualTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopTimeTracking = useCallback(() => {
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }
  }, []);

  // Enhanced loading progress with more realistic timing
  const startLoadingProgress = useCallback((type) => {
    setLoadingProgress(0);
    setActiveStep(0);
    setAnalysisType(type);
    setCanCancel(true);
    setIsPaused(false);
      // More realistic time estimates based on analysis type (reasoning models take longer)
    const timeEstimates = {
      business: 900,      // 15 minutes for comprehensive business analysis
      comprehensive: 1200, // 20 minutes for full analysis
      performance: 480,    // 8 minutes for performance
      revenue: 720,        // 12 minutes for revenue
      occupancy: 360,      // 6 minutes for occupancy
      trends: 480,         // 8 minutes for trends
      recommendations: 600 // 10 minutes for recommendations
    };
    
    setEstimatedTime(timeEstimates[type] || 120);
      const stages = [
      { step: 0, progress: 3, stage: 'Menginisialisasi AI model DeepSeek R1...', duration: 5000 },
      { step: 1, progress: 10, stage: 'Mengumpulkan dan memvalidasi data analytics...', duration: 15000 },
      { step: 2, progress: 30, stage: 'Model reasoning sedang menganalisis pola kompleks (tahap terlama)...', duration: 180000 }, // 3 minutes
      { step: 3, progress: 60, stage: 'Mengidentifikasi tren dan anomali dalam data...', duration: 120000 }, // 2 minutes
      { step: 4, progress: 85, stage: 'Menyusun insight strategis dan rekomendasi actionable...', duration: 60000 }, // 1 minute
      { step: 5, progress: 98, stage: 'Finalisasi dan validasi hasil analisis...', duration: 15000 }
    ];

    let currentStage = 0;
    
    const updateProgress = () => {
      if (currentStage < stages.length && loading && !isPaused) {
        const stage = stages[currentStage];
        setLoadingProgress(stage.progress);
        setLoadingStage(stage.stage);
        setActiveStep(stage.step);
        setDetailedStatus({
          stage: stage.stage,
          step: currentStage + 1,
          totalSteps: stages.length,
          estimated: timeEstimates[type] || 120
        });
        
        currentStage++;
        
        if (currentStage < stages.length) {
          intervalRef.current = setTimeout(updateProgress, stage.duration);
        }
      }
    };
    
    updateProgress();
  }, [loading, isPaused]);

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    setLoading(false);
    setCanCancel(false);
    setLoadingProgress(0);
    setLoadingStage('');
    setActiveStep(0);
    setIsPaused(false);
    stopTimeTracking();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    toast({
      title: 'Analisis Dibatalkan',
      description: 'Proses analisis AI telah dihentikan',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
    
    onCancelDialogClose();
  }, [toast, onCancelDialogClose, stopTimeTracking]);

  // Pause/Resume analysis (UI only - backend can't actually pause)
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
    
    if (!isPaused) {
      // Pausing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      toast({
        title: 'Simulasi Pause',
        description: 'Progress UI dihentikan sementara (backend tetap berjalan)',
        status: 'info',
        duration: 2000,
      });
    } else {
      // Resuming
      toast({
        title: 'Progress Dilanjutkan',
        description: 'Progress UI kembali berjalan',
        status: 'success',
        duration: 2000,
      });
    }
  }, [isPaused, toast]);
  // Send browser notification when complete
  const sendNotification = useCallback((title, body) => {
    if (notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'ai-analytics'
      });
    }
  }, [notificationEnabled]);

  // Enhanced error handling for specific error types
  const handleAnalysisError = useCallback((error, type) => {
    console.error('AI Analysis error:', error);
    
    // Check for 429 rate limit error
    if (error.includes('status 429') || error.includes('429:') || error.includes('Too Many Requests')) {
      const rateLimitError = {
        title: '🚫 API Limit Tercapai',
        description: 'Model AI telah mencapai batas penggunaan (rate limit). Mohon tunggu beberapa saat atau coba lagi besok.',
        status: 'warning',
        type: 'rate_limit'
      };
      
      setError(rateLimitError.description);
      
      toast({
        title: rateLimitError.title,
        description: rateLimitError.description,
        status: rateLimitError.status,
        duration: 12000,
        isClosable: true,
        position: 'top'
      });
      
      sendNotification(rateLimitError.title, 'API mencapai batas. Coba lagi nanti.');
      return;
    }
    
    // Check for quota exhausted
    if (error.includes('quota') || error.includes('exceeded') || error.includes('limit')) {
      const quotaError = {
        title: '📊 Kuota Habis',
        description: 'Kuota AI analytics hari ini sudah habis. Silakan coba lagi besok atau hubungi admin untuk upgrade.',
        status: 'warning',
        type: 'quota_exhausted'
      };
      
      setError(quotaError.description);
      
      toast({
        title: quotaError.title,
        description: quotaError.description,
        status: quotaError.status,
        duration: 15000,
        isClosable: true,
        position: 'top'
      });
      
      sendNotification(quotaError.title, 'Kuota AI habis. Coba besok.');
      return;
    }
    
    // Check for model overload
    if (error.includes('overload') || error.includes('busy') || error.includes('unavailable')) {
      const overloadError = {
        title: '⚡ Model Sedang Sibuk',
        description: 'Server AI sedang overload. Mohon tunggu beberapa menit dan coba lagi.',
        status: 'info',
        type: 'model_overload'
      };
      
      setError(overloadError.description);
      
      toast({
        title: overloadError.title,
        description: overloadError.description,
        status: overloadError.status,
        duration: 10000,
        isClosable: true,
      });
      
      sendNotification(overloadError.title, 'Server AI sibuk. Coba lagi nanti.');
      return;
    }
    
    // Generic error fallback
    const genericError = `Terjadi kesalahan saat menghasilkan analisis ${type}. Silakan coba lagi.`;
    setError(error);
    
    toast({
      title: 'Error Analisis AI',
      description: genericError,
      status: 'error',
      duration: 8000,
      isClosable: true,
    });
    
    sendNotification('Error Analisis AI', genericError);
  }, [toast, sendNotification]);
  const generateAIAnalysis = async (type = 'business') => {
    try {
      setLoading(true);
      setError(null);
      setAnalysisData(null);

      console.log(`🤖 Generating AI analysis for: ${type}`);
      
      // Start progress simulation and time tracking
      startLoadingProgress(type);
      startTimeTracking();

      const startTime = Date.now();
      let result;
      
      switch (type) {
        case 'business':
        case 'overall':
          result = await aiAnalyticsService.getOverallAnalysis();
          break;
        case 'performance':
          result = await aiAnalyticsService.getPerformanceAnalysis();
          break;
        case 'revenue':
          result = await aiAnalyticsService.getRevenueAnalysis();
          break;
        case 'occupancy':
          result = await aiAnalyticsService.getOccupancyAnalysis();
          break;
        case 'trends':
          result = await aiAnalyticsService.getTrendAnalysis();
          break;
        case 'recommendations':
          result = await aiAnalyticsService.getRecommendations();
          break;
        case 'comprehensive':
          result = await aiAnalyticsService.getMultipleAnalysis(['business', 'performance', 'revenue', 'occupancy']);
          break;
        default:
          throw new Error(`Unknown analysis type: ${type}`);
      }

      const processingTime = Date.now() - startTime;

      if (result.success) {
        // Complete the progress
        setLoadingProgress(100);
        setLoadingStage('Analisis selesai! ✨');
        setActiveStep(processingSteps.length - 1);
        
        // Add processing time to metadata
        const enhancedData = {
          ...result.data,
          type,
          metadata: {
            ...result.data.metadata,
            actual_processing_time: `${Math.round(processingTime / 1000)}s`,
            analysis_type: type,
            timestamp: new Date().toISOString()
          }
        };
        
        setAnalysisData(enhancedData);
        setLastUpdate(new Date());
        
        // Success notification
        const notificationTitle = 'Analisis AI Selesai! 🎉';
        const notificationBody = `Insight ${type} berhasil dihasilkan dalam ${Math.round(processingTime / 1000)} detik`;
        
        toast({
          title: notificationTitle,
          description: notificationBody,
          status: 'success',
          duration: 8000,
          isClosable: true,
          position: 'top-right'
        });
        
        sendNotification(notificationTitle, notificationBody);
        
        // Auto-open result if not minimized
        if (!isMinimized) {
          setTimeout(() => onResultModalOpen(), 1000);
        }
          } else {
        // Use enhanced error handling
        handleAnalysisError(result.error, type);
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      // Use enhanced error handling
      handleAnalysisError(err.message, type);
    } finally {
      setLoading(false);
      setCanCancel(false);
      setLoadingProgress(0);
      setLoadingStage('');
      setActiveStep(0);
      setIsPaused(false);
      stopTimeTracking();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const formatMetadata = (metadata) => {
    if (!metadata) return null;
    
    const processingTime = metadata.processing_time || metadata.processingTime;
    const modelUsed = metadata.model_used || metadata.modelUsed;
    const confidence = metadata.confidence;
    
    return {
      processingTime: processingTime ? `${processingTime}ms` : 'N/A',
      modelUsed: modelUsed || 'Unknown',
      confidence: confidence ? `${Math.round(confidence * 100)}%` : 'N/A',
      generatedAt: metadata.generated_at || metadata.generatedAt || new Date().toISOString()
    };
  };

  const renderInsightsList = (insights, title, icon, colorScheme = 'blue') => {
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return null;
    }

    return (
      <Box>
        <HStack mb={3}>
          <Icon as={icon} color={`${colorScheme}.500`} />
          <Text fontWeight="semibold" color={`${colorScheme}.600`}>
            {title}
          </Text>
          <Badge colorScheme={colorScheme} size="sm">
            {insights.length}
          </Badge>
        </HStack>
        <List spacing={2}>
          {insights.map((insight, index) => (
            <ListItem key={index} pl={6}>
              <ListIcon as={FiCheckCircle} color={`${colorScheme}.400`} />
              <Text fontSize="sm" display="inline">
                {insight}
              </Text>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderPerformanceScores = (performance) => {
    if (!performance || !performance.category_scores) return null;

    const scores = performance.category_scores || performance.categoryScores || {};
    
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        {Object.entries(scores).map(([category, score]) => (
          <Stat key={category} p={4} bg={accentBg} borderRadius="md">
            <StatLabel textTransform="capitalize">{category}</StatLabel>
            <StatNumber>{Math.round(score)}</StatNumber>
            <StatHelpText>
              <StatArrow type={score >= 75 ? 'increase' : 'decrease'} />
              {score >= 85 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Improvement'}
            </StatHelpText>
            <Progress 
              value={score} 
              colorScheme={score >= 75 ? 'green' : score >= 60 ? 'yellow' : 'red'}
              size="sm"
              mt={2}
            />
          </Stat>
        ))}
      </SimpleGrid>
    );
  };

  const renderTrendsAnalysis = (trends) => {
    if (!trends || !Array.isArray(trends) || trends.length === 0) return null;

    return (
      <VStack align="stretch" spacing={3}>
        {trends.map((trend, index) => (
          <HStack key={index} p={3} bg={successBg} borderRadius="md" justify="space-between">
            <VStack align="flex-start" spacing={1}>
              <Text fontWeight="semibold" textTransform="capitalize">
                {trend.metric?.replace(/_/g, ' ')}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {trend.context}
              </Text>
            </VStack>
            <HStack>
              <Icon 
                as={trend.direction === 'increasing' ? FiTrendingUp : 
                    trend.direction === 'decreasing' ? FiTrendingDown : FiMinus}
                color={trend.direction === 'increasing' ? 'green.500' : 
                       trend.direction === 'decreasing' ? 'red.500' : 'gray.500'}
              />
              <VStack align="flex-end" spacing={0}>
                <Text fontWeight="bold">
                  {trend.percentage > 0 ? '+' : ''}{trend.percentage}%
                </Text>
                <Badge colorScheme={
                  trend.strength === 'strong' ? 'green' :
                  trend.strength === 'moderate' ? 'yellow' : 'gray'
                }>
                  {trend.strength}
                </Badge>
              </VStack>
            </HStack>
          </HStack>
        ))}
      </VStack>
    );
  };

  // Enhanced result rendering functions
  const renderDetailedInsights = (data) => {
    if (!data) return null;

    return (
      <VStack spacing={6} align="stretch">
        {/* Executive Summary */}
        {data.summary && (
          <Box p={4} bg={accentBg} borderRadius="md" borderLeft="4px" borderColor="blue.500">
            <HStack mb={3}>
              <Icon as={FiStar} color="blue.500" />
              <Text fontWeight="bold" color="blue.700">
                Ringkasan Eksekutif
              </Text>
              <Badge colorScheme="blue" size="sm">
                {data.type?.toUpperCase()}
              </Badge>
            </HStack>
            <Text fontSize="sm" lineHeight="1.6" whiteSpace="pre-wrap">
              {data.summary}
            </Text>
          </Box>
        )}

        {/* Type-specific details */}
        {data.type === 'business' && renderBusinessDetails(data)}
        {data.type === 'performance' && renderPerformanceDetails(data)}
        {data.type === 'revenue' && renderRevenueDetails(data)}
        {data.type === 'occupancy' && renderOccupancyDetails(data)}
        {data.type === 'trends' && renderTrendDetails(data)}
        {data.type === 'recommendations' && renderRecommendationDetails(data)}
      </VStack>
    );
  };

  const renderBusinessDetails = (data) => (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      {data.details?.revenueInsight && (
        <Card p={4} bg={successBg}>
          <VStack align="flex-start" spacing={2}>
            <HStack>
              <Icon as={FiPieChart} color="green.500" />
              <Text fontWeight="semibold">Revenue Insight</Text>
            </HStack>
            <Text fontSize="sm">{data.details.revenueInsight}</Text>
          </VStack>
        </Card>
      )}
      
      {data.details?.occupancyInsight && (
        <Card p={4} bg={warningBg}>
          <VStack align="flex-start" spacing={2}>
            <HStack>
              <Icon as={FiBarChart} color="orange.500" />
              <Text fontWeight="semibold">Occupancy Insight</Text>
            </HStack>
            <Text fontSize="sm">{data.details.occupancyInsight}</Text>
          </VStack>
        </Card>
      )}
      
      {data.details?.paymentInsight && (
        <Card p={4} bg={accentBg}>
          <VStack align="flex-start" spacing={2}>
            <HStack>
              <Icon as={FiCpu} color="blue.500" />
              <Text fontWeight="semibold">Payment Insight</Text>
            </HStack>
            <Text fontSize="sm">{data.details.paymentInsight}</Text>
          </VStack>
        </Card>
      )}
    </SimpleGrid>
  );

  const renderPerformanceDetails = (data) => (
    <VStack spacing={4} align="stretch">
      {data.details?.growthAnalysis && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiTrendingUp} color="purple.500" />
            <Text fontWeight="semibold">Growth Analysis</Text>
          </HStack>
          <Text fontSize="sm">{data.details.growthAnalysis}</Text>
        </Card>
      )}
      
      {data.details?.efficiencyMetrics && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiActivity} color="teal.500" />
            <Text fontWeight="semibold">Efficiency Metrics</Text>
          </HStack>
          <Text fontSize="sm">{data.details.efficiencyMetrics}</Text>
        </Card>
      )}
      
      {data.metrics && data.metrics.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={FiDatabase} color="cyan.500" />
            <Text fontWeight="semibold">Performance Metrics</Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
            {data.metrics.map((metric, index) => (
              <Stat key={index} p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                <StatLabel fontSize="xs" textTransform="capitalize">
                  {metric.metricName?.replace(/_/g, ' ')}
                </StatLabel>
                <StatNumber fontSize="lg">{metric.currentValue}</StatNumber>
                <StatHelpText>
                  <StatArrow type={metric.changePercentage > 0 ? 'increase' : 'decrease'} />
                  {metric.changePercentage}% {metric.trend}
                </StatHelpText>
              </Stat>
            ))}
          </SimpleGrid>
        </Card>
      )}
    </VStack>
  );

  const renderRevenueDetails = (data) => (
    <VStack spacing={4} align="stretch">
      {data.details?.paymentMethodAnalysis && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiCpu} color="green.500" />
            <Text fontWeight="semibold">Payment Method Analysis</Text>
          </HStack>
          <Text fontSize="sm">{data.details.paymentMethodAnalysis}</Text>
        </Card>
      )}
      
      {data.details?.insights && data.details.insights.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={MdInsights} color="purple.500" />
            <Text fontWeight="semibold">Revenue Insights</Text>
          </HStack>
          <VStack spacing={2} align="stretch">
            {data.details.insights.map((insight, index) => (
              <Box key={index} p={2} bg={accentBg} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" color="purple.700">
                  {insight.category?.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text fontSize="sm">{insight.description}</Text>
                <HStack mt={1}>
                  <Badge colorScheme="purple" size="xs">Impact: {insight.impactValue}</Badge>
                  <Badge colorScheme="orange" size="xs">{insight.priority}</Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Card>
      )}
    </VStack>
  );
  const renderRecommendationDetails = (data) => (
    <VStack spacing={4} align="stretch">
      {data.structured_recommendations && data.structured_recommendations.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={FiTarget} color="green.500" />
            <Text fontWeight="semibold">Structured Recommendations</Text>
          </HStack>
          <VStack spacing={3} align="stretch">
            {data.structured_recommendations.map((rec, index) => (
              <Box key={index} p={4} bg={successBg} borderRadius="md" borderLeft="4px" borderColor="green.500">
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="semibold" color="green.700">{rec.title}</Text>
                  <Text fontSize="sm">{rec.description}</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="green">Impact: {rec.impact}</Badge>
                    <Badge colorScheme="blue">Effort: {rec.effort}</Badge>
                    <Badge colorScheme="purple">Timeline: {rec.timeline}</Badge>
                    {rec.estimatedRoi && (
                      <Badge colorScheme="orange">ROI: {rec.estimatedRoi}%</Badge>
                    )}
                  </HStack>
                </VStack>
              </Box>
            ))}
          </VStack>
        </Card>
      )}
      
      {data.details?.riskAssessment && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiAlertCircle} color="red.500" />
            <Text fontWeight="semibold">Risk Assessment</Text>
          </HStack>
          <Text fontSize="sm">{data.details.riskAssessment}</Text>
        </Card>
      )}
      
      {data.details?.opportunityAnalysis && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiFlag} color="yellow.500" />
            <Text fontWeight="semibold">Opportunity Analysis</Text>
          </HStack>
          <Text fontSize="sm">{data.details.opportunityAnalysis}</Text>
        </Card>
      )}
    </VStack>
  );

  // Add missing detailed rendering functions for all endpoint types
  const renderOccupancyDetails = (data) => (
    <VStack spacing={4} align="stretch">
      {data.occupancySummary && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiBarChart} color="blue.500" />
            <Text fontWeight="semibold">Occupancy Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.occupancySummary}</Text>
        </Card>
      )}
      
      {data.utilizationAnalysis && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiActivity} color="orange.500" />
            <Text fontWeight="semibold">Utilization Analysis</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.utilizationAnalysis}</Text>
        </Card>
      )}
      
      {data.capacityInsights && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiDatabase} color="purple.500" />
            <Text fontWeight="semibold">Capacity Insights</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.capacityInsights}</Text>
        </Card>
      )}
      
      {data.optimizationSuggestions && data.optimizationSuggestions.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={MdAutoAwesome} color="green.500" />
            <Text fontWeight="semibold">Optimization Suggestions</Text>
          </HStack>
          <List spacing={2}>
            {data.optimizationSuggestions.map((suggestion, index) => (
              <ListItem key={index}>
                <ListIcon as={FiCheckCircle} color="green.400" />
                <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                  {suggestion}
                </Text>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </VStack>
  );

  const renderTrendDetails = (data) => (
    <VStack spacing={4} align="stretch">
      {data.trendSummary && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiTrendingUp} color="blue.500" />
            <Text fontWeight="semibold">Trend Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.trendSummary}</Text>
        </Card>
      )}
      
      {data.seasonalPatterns && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiClock} color="orange.500" />
            <Text fontWeight="semibold">Seasonal Patterns</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.seasonalPatterns}</Text>
        </Card>
      )}
      
      {data.forecastPrediction && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={MdScience} color="purple.500" />
            <Text fontWeight="semibold">Forecast Prediction</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.forecastPrediction}</Text>
        </Card>
      )}
      
      {data.strategicInsights && data.strategicInsights.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={MdInsights} color="teal.500" />
            <Text fontWeight="semibold">Strategic Insights</Text>
          </HStack>
          <List spacing={3}>
            {data.strategicInsights.map((insight, index) => (
              <ListItem key={index}>
                <ListIcon as={FiInfo} color="teal.400" />
                <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                  {insight}
                </Text>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </VStack>
  );

  // Enhanced rendering for real API response structures
  const renderEnhancedBusinessInsights = (data) => (
    <VStack spacing={4} align="stretch">
      {data.overallPerformance && (
        <Card p={4} bg={accentBg} borderLeft="4px" borderColor="blue.500">
          <HStack mb={2}>
            <Icon as={FiBarChart} color="blue.500" />
            <Text fontWeight="semibold">Overall Performance</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.overallPerformance}</Text>
        </Card>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {data.revenueInsight && (
          <Card p={4} bg={successBg}>
            <VStack align="flex-start" spacing={2}>
              <HStack>
                <Icon as={FiPieChart} color="green.500" />
                <Text fontWeight="semibold" fontSize="sm">Revenue Insight</Text>
              </HStack>
              <Text fontSize="sm" whiteSpace="pre-wrap">{data.revenueInsight}</Text>
            </VStack>
          </Card>
        )}
        
        {data.occupancyInsight && (
          <Card p={4} bg={warningBg}>
            <VStack align="flex-start" spacing={2}>
              <HStack>
                <Icon as={FiBarChart} color="orange.500" />
                <Text fontWeight="semibold" fontSize="sm">Occupancy Insight</Text>
              </HStack>
              <Text fontSize="sm" whiteSpace="pre-wrap">{data.occupancyInsight}</Text>
            </VStack>
          </Card>
        )}
        
        {data.paymentInsight && (
          <Card p={4} bg={accentBg}>
            <VStack align="flex-start" spacing={2}>
              <HStack>
                <Icon as={FiCpu} color="blue.500" />
                <Text fontWeight="semibold" fontSize="sm">Payment Insight</Text>
              </HStack>
              <Text fontSize="sm" whiteSpace="pre-wrap">{data.paymentInsight}</Text>
            </VStack>
          </Card>
        )}
      </SimpleGrid>
      
      {data.keyMetricsSummary && (
        <Card p={4}>
          <HStack mb={2}>
            <Icon as={FiDatabase} color="purple.500" />
            <Text fontWeight="semibold">Key Metrics Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.keyMetricsSummary}</Text>
        </Card>
      )}
    </VStack>
  );
  const renderEnhancedRevenueAnalysis = (data) => (
    <VStack spacing={4} align="stretch">
      {data.revenueSummary && (
        <Card p={4} bg={successBg} borderLeft="4px" borderColor="green.500">
          <HStack mb={2}>
            <Icon as={FiPieChart} color="green.500" />
            <Text fontWeight="semibold">Revenue Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.revenueSummary}</Text>
        </Card>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {data.paymentMethodAnalysis && (
          <Card p={4}>
            <HStack mb={2}>
              <Icon as={FiCpu} color="blue.500" />
              <Text fontWeight="semibold">Payment Method Analysis</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.paymentMethodAnalysis}</Text>
          </Card>
        )}
        
        {data.revenueTrends && (
          <Card p={4}>
            <HStack mb={2}>
              <Icon as={FiTrendingUp} color="purple.500" />
              <Text fontWeight="semibold">Revenue Trends</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.revenueTrends}</Text>
          </Card>
        )}
      </SimpleGrid>
      
      {data.insights && data.insights.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={MdInsights} color="teal.500" />
            <Text fontWeight="semibold">Revenue Insights</Text>
          </HStack>
          <VStack spacing={3} align="stretch">
            {data.insights.map((insight, index) => (
              <Box key={index} p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium" color="purple.700" textTransform="capitalize">
                    {insight.category?.replace(/_/g, ' ')}
                  </Text>
                  <HStack spacing={1}>
                    <Badge colorScheme="purple" size="xs">Impact: {insight.impactValue}</Badge>
                    <Badge colorScheme="orange" size="xs">{insight.priority}</Badge>
                  </HStack>
                </HStack>
                <Text fontSize="sm" whiteSpace="pre-wrap">{insight.description}</Text>
              </Box>
            ))}
          </VStack>
        </Card>
      )}
    </VStack>
  );

  const renderEnhancedPerformanceAnalysis = (data) => (
    <VStack spacing={4} align="stretch">
      {data.performanceSummary && (
        <Card p={4} bg={accentBg} borderLeft="4px" borderColor="blue.500">
          <HStack mb={2}>
            <Icon as={FiActivity} color="blue.500" />
            <Text fontWeight="semibold">Performance Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.performanceSummary}</Text>
        </Card>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {data.growthAnalysis && (
          <Card p={4}>
            <HStack mb={2}>
              <Icon as={FiTrendingUp} color="green.500" />
              <Text fontWeight="semibold">Growth Analysis</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.growthAnalysis}</Text>
          </Card>
        )}
        
        {data.efficiencyMetrics && (
          <Card p={4}>
            <HStack mb={2}>
              <Icon as={FiBarChart} color="purple.500" />
              <Text fontWeight="semibold">Efficiency Metrics</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.efficiencyMetrics}</Text>
          </Card>
        )}
      </SimpleGrid>
      
      {data.metrics && data.metrics.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={FiDatabase} color="teal.500" />
            <Text fontWeight="semibold">Performance Metrics</Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
            {data.metrics.map((metric, index) => (
              <Stat key={index} p={3} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                <StatLabel fontSize="xs" textTransform="capitalize">
                  {metric.metricName?.replace(/_/g, ' ')}
                </StatLabel>
                <StatNumber fontSize="lg">{metric.currentValue}</StatNumber>
                <StatHelpText>
                  <StatArrow type={metric.changePercentage > 0 ? 'increase' : 'decrease'} />
                  {metric.changePercentage}% {metric.trend}
                </StatHelpText>
              </Stat>
            ))}
          </SimpleGrid>
        </Card>
      )}
      
      {data.insights && data.insights.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={MdInsights} color="orange.500" />
            <Text fontWeight="semibold">Performance Insights</Text>
          </HStack>
          <List spacing={3}>
            {data.insights.map((insight, index) => (
              <ListItem key={index}>
                <ListIcon as={FiInfo} color="orange.400" />
                <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                  {insight}
                </Text>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </VStack>
  );

  const renderEnhancedRecommendations = (data) => (
    <VStack spacing={4} align="stretch">
      {data.executiveSummary && (
        <Card p={4} bg={successBg} borderLeft="4px" borderColor="green.500">
          <HStack mb={2}>
            <Icon as={FiStar} color="green.500" />
            <Text fontWeight="semibold">Executive Summary</Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.executiveSummary}</Text>
        </Card>
      )}
      
      {data.recommendations && data.recommendations.length > 0 && (
        <Card p={4}>
          <HStack mb={3}>
            <Icon as={FiTarget} color="blue.500" />
            <Text fontWeight="semibold">Strategic Recommendations</Text>
            <Badge colorScheme="blue">{data.recommendations.length} items</Badge>
          </HStack>
          <VStack spacing={3} align="stretch">
            {data.recommendations.map((rec, index) => (
              <Box key={index} p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="semibold" color="blue.700">{rec.title}</Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap">{rec.description}</Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="green">Impact: {rec.impact}</Badge>
                    <Badge colorScheme="blue">Effort: {rec.effort}</Badge>
                    <Badge colorScheme="purple">Timeline: {rec.timeline}</Badge>
                    {rec.estimatedRoi && (
                      <Badge colorScheme="orange">ROI: {rec.estimatedRoi}%</Badge>
                    )}
                  </HStack>
                  {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                    <Box w="full">
                      <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={1}>Implementation Steps:</Text>
                      <List spacing={1}>
                        {rec.implementationSteps.map((step, stepIndex) => (
                          <ListItem key={stepIndex} fontSize="xs">
                            <ListIcon as={FiCheckCircle} color="green.400" />
                            <Text display="inline" whiteSpace="pre-wrap">{step}</Text>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Card>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {data.riskAssessment && (
          <Card p={4} bg={warningBg}>
            <HStack mb={2}>
              <Icon as={FiAlertCircle} color="red.500" />
              <Text fontWeight="semibold">Risk Assessment</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.riskAssessment}</Text>
          </Card>
        )}
        
        {data.opportunityAnalysis && (
          <Card p={4} bg={accentBg}>
            <HStack mb={2}>
              <Icon as={FiFlag} color="yellow.500" />
              <Text fontWeight="semibold">Opportunity Analysis</Text>
            </HStack>
            <Text fontSize="sm" whiteSpace="pre-wrap">{data.opportunityAnalysis}</Text>
          </Card>
        )}
      </SimpleGrid>
    </VStack>
  );

  // State for floating menu
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);

  // Scroll handler to show/hide floating menu
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldShow = scrollPosition > 400 && analysisData && !loading;
      setShowFloatingMenu(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [analysisData, loading]);

  if (serviceAvailable === false) {
    return (
      <Card bg={cardBg}>
        <CardBody>
          <Alert status="warning">
            <AlertIcon />            <VStack align="flex-start" spacing={2}>
              <Text fontWeight="bold">AI Analytics Tidak Tersedia</Text>
              <Text fontSize="sm">
                Layanan AI analytics sedang tidak tersedia. Pastikan server dan API key sudah dikonfigurasi dengan benar.
              </Text>              <HStack spacing={2}>
                <Button size="sm" colorScheme="orange" variant="outline" onClick={handleManualServiceCheck}>
                  Coba Lagi
                </Button>
                <Button size="sm" colorScheme="blue" variant="outline" onClick={() => setServiceAvailable(true)}>
                  Paksa Aktifkan
                </Button>
              </HStack>              <Text fontSize="xs" color="gray.500">
                Health Endpoint: /v1/health
              </Text>
            </VStack>
          </Alert>        </CardBody>
      </Card>
    );
  }
  
  return (
    <>
      <Card bg={cardBg}>
        <CardHeader>
        <HStack justify="space-between" align="center">
          <HStack>
            <Icon as={MdPsychology} color="purple.500" boxSize={6} />
            <Heading size="md">AI Analytics</Heading>
            <Badge colorScheme="purple" variant="subtle">
              Powered by DeepSeek
            </Badge>
          </HStack>
          <HStack spacing={2}>
            {lastUpdate && (
              <Tooltip label={`Terakhir diperbarui: ${lastUpdate.toLocaleString('id-ID')}`}>
                <Badge colorScheme="green" variant="outline">
                  <Icon as={FiClock} mr={1} />
                  {lastUpdate.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Badge>
              </Tooltip>
            )}            <Button
              leftIcon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              colorScheme="purple"
              isLoading={loading}
              onClick={() => generateAIAnalysis('business')}
            >
              Generate Insights
            </Button>
          </HStack>
        </HStack>
      </CardHeader>

      <CardBody>        {error && (
          <Alert 
            status={
              error.includes('rate limit') || error.includes('limit tercapai') || error.includes('429') ? 'warning' :
              error.includes('kuota') || error.includes('quota') ? 'info' :
              error.includes('overload') || error.includes('sibuk') ? 'info' : 'error'
            } 
            mb={4}
            variant="left-accent"
          >
            <AlertIcon />
            <VStack align="flex-start" spacing={2} flex="1">
              <HStack justify="space-between" w="full">
                <Text fontWeight="bold">
                  {error.includes('rate limit') || error.includes('limit tercapai') || error.includes('429') ? 
                    '🚫 API Rate Limit' :
                   error.includes('kuota') || error.includes('quota') ? 
                    '📊 Kuota Exhausted' :
                   error.includes('overload') || error.includes('sibuk') ? 
                    '⚡ Server Overload' : 
                    'Error dalam analisis AI'
                  }
                </Text>
                <Badge 
                  colorScheme={
                    error.includes('429') || error.includes('rate limit') ? 'orange' :
                    error.includes('kuota') || error.includes('quota') ? 'purple' :
                    error.includes('overload') ? 'blue' : 'red'
                  }
                  size="sm"
                >
                  {error.includes('429') || error.includes('rate limit') ? 'HTTP 429' :
                   error.includes('kuota') ? 'QUOTA' :
                   error.includes('overload') ? 'BUSY' : 'ERROR'}
                </Badge>
              </HStack>
              <Text fontSize="sm">{error}</Text>
              
              {/* Additional helpful information */}
              {(error.includes('429') || error.includes('rate limit') || error.includes('limit tercapai')) && (
                <Box p={3} bg="orange.50" borderRadius="md" w="full" mt={2}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xs" fontWeight="semibold" color="orange.700">
                      💡 Apa itu Error 429?
                    </Text>
                    <Text fontSize="xs" color="orange.600">
                      Error 429 (Too Many Requests) berarti server AI membatasi jumlah permintaan untuk mencegah overload. 
                      Ini normal terjadi saat banyak user menggunakan AI secara bersamaan.
                    </Text>
                    <Text fontSize="xs" color="orange.600" mt={1}>
                      <strong>Solusi:</strong> Tunggu 5-15 menit sebelum mencoba lagi, atau coba lagi besok jika kuota harian habis.
                    </Text>
                  </VStack>
                </Box>
              )}
              
              {(error.includes('kuota') || error.includes('quota')) && (
                <Box p={3} bg="purple.50" borderRadius="md" w="full" mt={2}>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontSize="xs" fontWeight="semibold" color="purple.700">
                      📊 Kuota API Habis
                    </Text>
                    <Text fontSize="xs" color="purple.600">
                      Kuota penggunaan AI analytics untuk hari ini sudah habis. Kuota akan reset secara otomatis besok pagi.
                    </Text>
                    <Text fontSize="xs" color="purple.600" mt={1}>
                      <strong>Untuk upgrade kuota:</strong> Hubungi administrator sistem atau upgrade plan API.
                    </Text>
                  </VStack>
                </Box>
              )}

              <HStack mt={2} spacing={2}>
                <Button size="xs" variant="outline" onClick={() => setError(null)}>
                  <Icon as={FiX} mr={1} />
                  Tutup
                </Button>
                <Button 
                  size="xs" 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh Halaman
                </Button>
                {(error.includes('429') || error.includes('rate limit')) && (
                  <Button 
                    size="xs" 
                    colorScheme="orange" 
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setTimeout(() => {
                        toast({
                          title: '⏰ Mencoba Ulang...',
                          description: 'Menunggu 30 detik sebelum mencoba kembali',
                          status: 'info',
                          duration: 3000,
                        });
                        setTimeout(() => generateAIAnalysis('business'), 30000);
                      }, 1000);
                    }}
                    leftIcon={<FiClock />}
                  >
                    Auto Retry (30s)
                  </Button>
                )}
              </HStack>
            </VStack>
          </Alert>
        )}{loading && (
          <ScaleFade initialScale={0.9} in={loading}>
            <Card bg={loadingCardBg} borderColor="blue.200" borderWidth="2px">
              <CardHeader>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={MdPsychology} color="blue.500" boxSize={6} />
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="bold" color="blue.600">
                        AI Reasoning Model Sedang Bekerja
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="blue" variant="subtle">
                          DeepSeek R1
                        </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                          {analysisType?.toUpperCase()}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <HStack>
                    <Tooltip label={isPaused ? "Resume Progress" : "Pause Progress"}>
                      <IconButton
                        icon={isPaused ? <FiPlay /> : <FiPause />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={togglePause}
                        aria-label={isPaused ? "Resume" : "Pause"}
                      />
                    </Tooltip>
                    
                    <Tooltip label="Lihat Detail Status">
                      <IconButton
                        icon={<FiActivity />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => setShowStatusDrawer(true)}
                        aria-label="Detail Status"
                      />
                    </Tooltip>
                    
                    <Tooltip label={isMinimized ? "Maximize" : "Minimize"}>
                      <IconButton
                        icon={isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => setIsMinimized(!isMinimized)}
                        aria-label={isMinimized ? "Maximize" : "Minimize"}
                      />
                    </Tooltip>
                    
                    {canCancel && (
                      <Tooltip label="Batalkan Analisis">
                        <IconButton
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={onCancelDialogOpen}
                          aria-label="Cancel"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>
              </CardHeader>
              
              {!isMinimized && (
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <Center>
                      <VStack spacing={4}>                        <CircularProgress 
                          value={loadingProgress} 
                          size="140px" 
                          color="blue.400"
                          trackColor={progressTrackColor}
                          thickness="12px"
                        >
                          <CircularProgressLabel fontSize="xl" fontWeight="bold">
                            {loadingProgress}%
                          </CircularProgressLabel>
                        </CircularProgress>
                        
                        <VStack spacing={2} textAlign="center">
                          <Text fontSize="lg" fontWeight="medium" color="blue.600">
                            {isPaused ? '⏸️ Paused' : '🧠 Analyzing...'}
                          </Text>
                          <HStack>
                            <Icon as={FiClock} color="gray.500" />
                            <Text fontSize="sm" color="gray.600">
                              {actualTime}s / ~{estimatedTime}s
                            </Text>
                            {actualTime > estimatedTime && (
                              <Badge colorScheme="orange" size="sm">
                                Overtime
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </VStack>
                    </Center>                    
                    {/* Progress Stepper */}
                    <Box p={4} bg={stepperBg} borderRadius="md" border="1px" borderColor={stepperBorderColor}>
                      <Stepper index={activeStep} orientation="horizontal" size="sm">
                        {processingSteps.map((step, index) => (
                          <Step key={index}>
                            <StepIndicator>
                              <StepStatus
                                complete={<StepIcon />}
                                incomplete={<StepNumber />}
                                active={<StepNumber />}
                              />
                            </StepIndicator>
                            
                            <Box flexShrink="0">
                              <StepTitle fontSize="xs">{step.title}</StepTitle>
                              {index === activeStep && (
                                <StepDescription fontSize="xs">{step.description}</StepDescription>
                              )}
                            </Box>
                            
                            <StepSeparator />
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                      {/* Current Status */}
                    <Box p={4} bg={stepperBg} borderRadius="md" border="1px" borderColor={stepperBorderColor}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="medium">
                            {loadingStage || 'Memproses...'}
                          </Text>
                          <HStack spacing={2}>
                            {!isPaused && <Spinner size="xs" color="blue.400" />}
                            <Text fontSize="xs" color="gray.500">
                              {isPaused ? 'Paused' : 'Processing...'}
                            </Text>
                          </HStack>
                        </HStack>
                          <Progress 
                          value={loadingProgress} 
                          colorScheme="blue" 
                          size="md" 
                          borderRadius="full"
                          bg={progressBg}
                          isAnimated={!isPaused}
                        />
                      </VStack>
                    </Box>
                    
                    {/* Tips and Information */}
                    <Alert status="info" variant="left-accent">
                      <AlertIcon />
                      <VStack align="flex-start" spacing={1}>                        <Text fontSize="sm" fontWeight="medium">
                          🧠 DeepSeek R1 Reasoning Model sedang menganalisis
                        </Text>
                        <Text fontSize="xs">
                          Model AI reasoning canggih ini membutuhkan waktu 5-20 menit untuk menghasilkan insight mendalam 
                          dengan analisis multi-dimensi, pemikiran bertahap, dan rekomendasi strategis yang sangat actionable.
                          Harap bersabar untuk hasil analisis terbaik.
                        </Text>
                        <HStack mt={2} spacing={4} fontSize="xs" color="gray.600">
                          <HStack>
                            <Icon as={FiCpu} />
                            <Text>High-performance computing</Text>
                          </HStack>
                          <HStack>
                            <Icon as={MdScience} />
                            <Text>Advanced reasoning</Text>
                          </HStack>
                          <HStack>
                            <Icon as={MdInsights} />
                            <Text>Deep analytics</Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </Alert>
                  </VStack>
                </CardBody>
              )}
            </Card>
          </ScaleFade>
        )}        {!loading && !analysisData && !error && (
          <VStack spacing={6} align="center" py={8}>
            <Icon as={MdPsychology} boxSize={12} color="gray.400" />
            <VStack spacing={2} textAlign="center">
              <Text color="gray.500" fontSize="lg" fontWeight="medium">
                Dapatkan Insight AI Mendalam
              </Text>
              <Text color="gray.400" fontSize="sm" maxW="md">
                Gunakan teknologi AI reasoning terdepan untuk menganalisis performa rusunawa 
                dan mendapatkan rekomendasi strategis yang actionable
              </Text>
            </VStack>
            
            <VStack spacing={4} w="full" maxW="2xl">
              {/* Quick Actions */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                <Card p={4} textAlign="center" cursor="pointer" 
                      onClick={() => generateAIAnalysis('business')}
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      transition="all 0.2s">
                  <VStack spacing={2}>
                    <Icon as={MdAutoAwesome} boxSize={8} color="blue.500" />
                    <Text fontWeight="semibold">Business Insights</Text>
                    <Text fontSize="xs" color="gray.500">Analisis bisnis menyeluruh</Text>
                    <Badge colorScheme="blue">~15 menit</Badge>
                  </VStack>
                </Card>
                
                <Card p={4} textAlign="center" cursor="pointer"
                      onClick={() => generateAIAnalysis('performance')}
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      transition="all 0.2s">
                  <VStack spacing={2}>
                    <Icon as={FiBarChart} boxSize={8} color="green.500" />
                    <Text fontWeight="semibold">Performance</Text>
                    <Text fontSize="xs" color="gray.500">Analisis kinerja detail</Text>
                    <Badge colorScheme="green">~8 menit</Badge>
                  </VStack>
                </Card>
                
                <Card p={4} textAlign="center" cursor="pointer"
                      onClick={() => generateAIAnalysis('comprehensive')}
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      transition="all 0.2s">
                  <VStack spacing={2}>
                    <Icon as={MdInsights} boxSize={8} color="purple.500" />
                    <Text fontWeight="semibold">Comprehensive</Text>
                    <Text fontSize="xs" color="gray.500">Analisis lengkap semua aspek</Text>
                    <Badge colorScheme="purple">~20 menit</Badge>
                  </VStack>
                </Card>
              </SimpleGrid>
              
              {/* More Options */}
              <ButtonGroup spacing={3} variant="outline" size="sm">
                <Button leftIcon={<FiPieChart />} onClick={() => generateAIAnalysis('revenue')}>
                  Revenue Analysis
                </Button>
                <Button leftIcon={<FiTrendingUp />} onClick={() => generateAIAnalysis('trends')}>
                  Trend Analysis
                </Button>
                <Button leftIcon={<FiTarget />} onClick={() => generateAIAnalysis('recommendations')}>
                  Recommendations
                </Button>
              </ButtonGroup>
              
              {/* Settings */}
              <HStack>
                <Button leftIcon={<FiSettings />} variant="ghost" size="sm" onClick={onSettingsOpen}>
                  Settings
                </Button>
                <FormControl display="flex" alignItems="center" w="auto">
                  <FormLabel htmlFor="auto-refresh" fontSize="sm" mb="0">
                    Auto-refresh
                  </FormLabel>
                  <Switch 
                    id="auto-refresh" 
                    size="sm" 
                    isChecked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                </FormControl>
              </HStack>
            </VStack>
          </VStack>
        )}        {analysisData && !loading && (
          <VStack spacing={6} align="stretch">
            {/* Analysis Type Header */}
            <HStack justify="space-between" align="center">
              <HStack>
                <Icon as={MdAutoAwesome} color="blue.500" boxSize={6} />
                <VStack align="flex-start" spacing={0}>
                  <Text fontWeight="bold" fontSize="lg">
                    AI Analysis Results
                  </Text>
                  <HStack spacing={2}>
                    <Badge colorScheme="blue" textTransform="capitalize">
                      {analysisData.type || 'General'}
                    </Badge>
                    <Badge colorScheme="green" variant="outline">
                      {analysisData.status?.status || 'Completed'}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
              <HStack spacing={2}>
                <Tooltip label="Download Results">
                  <IconButton 
                    icon={<FiDownload />} 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      const dataStr = JSON.stringify(analysisData, null, 2);
                      const dataBlob = new Blob([dataStr], {type: 'application/json'});
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `ai-analysis-${analysisData.type || 'general'}-${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                    }}
                  />
                </Tooltip>
                <Tooltip label="View Full Results">
                  <IconButton 
                    icon={<FiMaximize2 />} 
                    size="sm" 
                    variant="outline"
                    onClick={onResultModalOpen}
                  />
                </Tooltip>
              </HStack>            </HStack>

            {/* Quick Analysis Switcher */}
            <Card bg={successBg} borderColor="green.200" borderWidth="1px">
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack>
                    <Icon as={FiZap} color="green.500" />
                    <Text fontWeight="semibold" color="green.700">
                      🎉 Analisis selesai! Pilih analisis lainnya:
                    </Text>
                  </HStack>
                  
                  {/* Quick Analysis Buttons */}
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={2}>
                    <Button 
                      size="sm" 
                      leftIcon={<MdAutoAwesome />}
                      colorScheme={analysisData.type === 'business' ? 'gray' : 'blue'}
                      variant={analysisData.type === 'business' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'business'}
                      onClick={() => generateAIAnalysis('business')}
                    >
                      Business
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiBarChart />}
                      colorScheme={analysisData.type === 'performance' ? 'gray' : 'green'}
                      variant={analysisData.type === 'performance' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'performance'}
                      onClick={() => generateAIAnalysis('performance')}
                    >
                      Performance
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiPieChart />}
                      colorScheme={analysisData.type === 'revenue' ? 'gray' : 'purple'}
                      variant={analysisData.type === 'revenue' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'revenue'}
                      onClick={() => generateAIAnalysis('revenue')}
                    >
                      Revenue
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiActivity />}
                      colorScheme={analysisData.type === 'occupancy' ? 'gray' : 'orange'}
                      variant={analysisData.type === 'occupancy' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'occupancy'}
                      onClick={() => generateAIAnalysis('occupancy')}
                    >
                      Occupancy
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiTrendingUp />}
                      colorScheme={analysisData.type === 'trends' ? 'gray' : 'teal'}
                      variant={analysisData.type === 'trends' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'trends'}
                      onClick={() => generateAIAnalysis('trends')}
                    >
                      Trends
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiTarget />}
                      colorScheme={analysisData.type === 'recommendations' ? 'gray' : 'cyan'}
                      variant={analysisData.type === 'recommendations' ? 'solid' : 'outline'}
                      isDisabled={analysisData.type === 'recommendations'}
                      onClick={() => generateAIAnalysis('recommendations')}
                    >
                      Recommendations
                    </Button>
                  </SimpleGrid>
                  
                  {/* Advanced Options */}
                  <HStack justify="center" spacing={4}>
                    <Button 
                      size="sm" 
                      leftIcon={<MdInsights />}
                      colorScheme="purple"
                      variant="ghost"
                      onClick={() => generateAIAnalysis('comprehensive')}
                    >
                      🚀 Comprehensive (20 menit)
                    </Button>
                    <Button 
                      size="sm" 
                      leftIcon={<FiRefreshCw />}
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => generateAIAnalysis(analysisData.type)}
                    >
                      🔄 Refresh Current
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Enhanced Display Based on Endpoint Type */}
            <Tabs variant="enclosed" colorScheme="blue" size="lg">
              <TabList>
                <Tab>📊 Overview</Tab>
                <Tab>💡 Insights</Tab>
                <Tab>🎯 Recommendations</Tab>
                <Tab>📈 Details</Tab>
                <Tab>🔧 Raw Data</Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {/* Status Summary */}
                    {analysisData.status?.message && (
                      <Alert status="success" variant="left-accent">
                        <AlertIcon />
                        <VStack align="flex-start" spacing={1}>
                          <Text fontWeight="bold">Analysis Status</Text>
                          <Text fontSize="sm">{analysisData.status.message}</Text>
                        </VStack>
                      </Alert>
                    )}

                    {/* Type-specific Overview */}
                    {analysisData.type === 'business' && analysisData.overallPerformance && (
                      <Card p={4} bg={accentBg} borderLeft="4px" borderColor="blue.500">
                        <HStack mb={2}>
                          <Icon as={FiBarChart} color="blue.500" />
                          <Text fontWeight="semibold">Overall Performance</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.overallPerformance}</Text>
                      </Card>
                    )}

                    {analysisData.type === 'revenue' && analysisData.revenueSummary && (
                      <Card p={4} bg={successBg} borderLeft="4px" borderColor="green.500">
                        <HStack mb={2}>
                          <Icon as={FiPieChart} color="green.500" />
                          <Text fontWeight="semibold">Revenue Summary</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.revenueSummary}</Text>
                      </Card>
                    )}

                    {analysisData.type === 'performance' && analysisData.performanceSummary && (
                      <Card p={4} bg={accentBg} borderLeft="4px" borderColor="purple.500">
                        <HStack mb={2}>
                          <Icon as={FiActivity} color="purple.500" />
                          <Text fontWeight="semibold">Performance Summary</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.performanceSummary}</Text>
                      </Card>
                    )}

                    {analysisData.type === 'occupancy' && analysisData.occupancySummary && (
                      <Card p={4} bg={warningBg} borderLeft="4px" borderColor="orange.500">
                        <HStack mb={2}>
                          <Icon as={FiBarChart} color="orange.500" />
                          <Text fontWeight="semibold">Occupancy Summary</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.occupancySummary}</Text>
                      </Card>
                    )}

                    {analysisData.type === 'trends' && analysisData.trendSummary && (
                      <Card p={4} bg={accentBg} borderLeft="4px" borderColor="teal.500">
                        <HStack mb={2}>
                          <Icon as={FiTrendingUp} color="teal.500" />
                          <Text fontWeight="semibold">Trend Summary</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.trendSummary}</Text>
                      </Card>
                    )}

                    {analysisData.type === 'recommendations' && analysisData.executiveSummary && (
                      <Card p={4} bg={successBg} borderLeft="4px" borderColor="green.500">
                        <HStack mb={2}>
                          <Icon as={FiTarget} color="green.500" />
                          <Text fontWeight="semibold">Executive Summary</Text>
                        </HStack>
                        <Text fontSize="sm" whiteSpace="pre-wrap">{analysisData.executiveSummary}</Text>
                      </Card>
                    )}

                    {/* Quick Metrics */}
                    {analysisData.metrics && analysisData.metrics.length > 0 && (
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        {analysisData.metrics.slice(0, 3).map((metric, index) => (
                          <Stat key={index} p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
                            <StatLabel fontSize="xs" textTransform="capitalize">
                              {metric.metricName?.replace(/_/g, ' ')}
                            </StatLabel>
                            <StatNumber fontSize="lg">{metric.currentValue}</StatNumber>
                            <StatHelpText>
                              <StatArrow type={metric.changePercentage > 0 ? 'increase' : 'decrease'} />
                              {metric.changePercentage}% {metric.trend}
                            </StatHelpText>
                          </Stat>
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </TabPanel>

                {/* Insights Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {/* Type-specific insights rendering */}
                    {analysisData.type === 'business' && renderEnhancedBusinessInsights(analysisData)}
                    {analysisData.type === 'revenue' && renderEnhancedRevenueAnalysis(analysisData)}
                    {analysisData.type === 'performance' && renderEnhancedPerformanceAnalysis(analysisData)}
                    {analysisData.type === 'occupancy' && renderOccupancyDetails(analysisData)}
                    {analysisData.type === 'trends' && renderTrendDetails(analysisData)}
                    
                    {/* Generic insights fallback */}
                    {(!analysisData.type || !['business', 'revenue', 'performance', 'occupancy', 'trends'].includes(analysisData.type)) && (
                      renderInsightsList(
                        analysisData.key_insights || analysisData.keyInsights || [],
                        'Key Insights',
                        FiInfo,
                        'blue'
                      )
                    )}
                  </VStack>
                </TabPanel>

                {/* Recommendations Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {analysisData.type === 'recommendations' && renderEnhancedRecommendations(analysisData)}
                    
                    {/* Business insights recommendations */}
                    {analysisData.type === 'business' && analysisData.recommendations && (
                      <Card p={4}>
                        <HStack mb={3}>
                          <Icon as={FiTarget} color="green.500" />
                          <Text fontWeight="semibold">Business Recommendations</Text>
                          <Badge colorScheme="green">{analysisData.recommendations.length} items</Badge>
                        </HStack>
                        <List spacing={3}>
                          {analysisData.recommendations.map((rec, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FiCheckCircle} color="green.400" />
                              <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                                {rec}
                              </Text>
                            </ListItem>
                          ))}
                        </List>
                      </Card>
                    )}

                    {/* Revenue recommendations */}
                    {analysisData.type === 'revenue' && analysisData.recommendations && (
                      <Card p={4}>
                        <HStack mb={3}>
                          <Icon as={FiPieChart} color="purple.500" />
                          <Text fontWeight="semibold">Revenue Optimization</Text>
                        </HStack>
                        <List spacing={3}>
                          {analysisData.recommendations.map((rec, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FiCheckCircle} color="purple.400" />
                              <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                                {rec}
                              </Text>
                            </ListItem>
                          ))}
                        </List>
                      </Card>
                    )}

                    {/* Occupancy optimization suggestions */}
                    {analysisData.type === 'occupancy' && analysisData.optimizationSuggestions && (
                      <Card p={4}>
                        <HStack mb={3}>
                          <Icon as={MdAutoAwesome} color="orange.500" />
                          <Text fontWeight="semibold">Occupancy Optimization</Text>
                        </HStack>
                        <List spacing={3}>
                          {analysisData.optimizationSuggestions.map((suggestion, index) => (
                            <ListItem key={index}>
                              <ListIcon as={FiCheckCircle} color="orange.400" />
                              <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                                {suggestion}
                              </Text>
                            </ListItem>
                          ))}
                        </List>
                      </Card>
                    )}

                    {/* Generic recommendations fallback */}
                    {(!analysisData.recommendations && !analysisData.optimizationSuggestions) && (
                      <Alert status="info">
                        <AlertIcon />
                        <Text>No specific recommendations available for this analysis type.</Text>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>

                {/* Details Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {/* All detailed fields based on endpoint type */}
                    {Object.entries(analysisData)
                      .filter(([key, value]) => 
                        !['type', 'status', 'metadata'].includes(key) && 
                        value && 
                        typeof value === 'string' && 
                        value.length > 50
                      )
                      .map(([key, value]) => (
                        <Card key={key} p={4}>
                          <HStack mb={2}>
                            <Icon as={FiInfo} color="blue.500" />
                            <Text fontWeight="semibold" textTransform="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" whiteSpace="pre-wrap">{value}</Text>
                        </Card>
                      ))}

                    {/* Array fields */}
                    {Object.entries(analysisData)
                      .filter(([key, value]) => 
                        Array.isArray(value) && 
                        value.length > 0 && 
                        !['recommendations', 'optimizationSuggestions'].includes(key)
                      )
                      .map(([key, value]) => (
                        <Card key={key} p={4}>
                          <HStack mb={3}>
                            <Icon as={FiDatabase} color="purple.500" />
                            <Text fontWeight="semibold" textTransform="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Text>
                            <Badge colorScheme="purple">{value.length} items</Badge>
                          </HStack>
                          <List spacing={2}>
                            {value.map((item, index) => (
                              <ListItem key={index}>
                                <ListIcon as={FiInfo} color="purple.400" />
                                <Text fontSize="sm" display="inline" whiteSpace="pre-wrap">
                                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                                </Text>
                              </ListItem>
                            ))}
                          </List>
                        </Card>
                      ))}

                    {/* Metadata */}
                    {analysisData.metadata && (
                      <Accordion allowToggle>
                        <AccordionItem>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack>
                                <Icon as={FiFlag} />
                                <Text fontWeight="semibold">Analysis Metadata</Text>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            {(() => {
                              const metadata = formatMetadata(analysisData.metadata);
                              return metadata ? (
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold">Model Used</Text>
                                    <Text fontSize="sm">{metadata.modelUsed}</Text>
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold">Processing Time</Text>
                                    <Text fontSize="sm">{metadata.processingTime}</Text>
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold">Confidence</Text>
                                    <Text fontSize="sm">{metadata.confidence}</Text>
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm" fontWeight="semibold">Generated At</Text>
                                    <Text fontSize="sm">
                                      {new Date(metadata.generatedAt).toLocaleString('id-ID')}
                                    </Text>
                                  </Box>
                                </SimpleGrid>
                              ) : (
                                <Text fontSize="sm" color="gray.500">No metadata available</Text>
                              );
                            })()}
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </VStack>
                </TabPanel>

                {/* Raw Data Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Raw API Response</Text>
                      <Button 
                        size="sm" 
                        leftIcon={<FiEye />}
                        onClick={() => {
                          const dataStr = JSON.stringify(analysisData, null, 2);
                          navigator.clipboard.writeText(dataStr);
                          toast({
                            title: 'Copied to Clipboard',
                            description: 'Raw data copied to clipboard',
                            status: 'success',
                            duration: 2000,
                          });
                        }}
                      >
                        Copy Raw Data
                      </Button>
                    </HStack>
                    <Card p={4} maxH="400px" overflowY="auto">
                      <Code fontSize="xs" whiteSpace="pre-wrap" display="block" p={4}>
                        {JSON.stringify(analysisData, null, 2)}
                      </Code>
                    </Card>
                  </VStack>
                </TabPanel>              </TabPanels>
            </Tabs>
            
            {/* Bottom Analysis Switcher */}
            <Card bg={accentBg} borderColor="blue.200" borderWidth="1px">
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between" align="center">
                    <HStack>
                      <Icon as={FiZap} color="blue.500" />
                      <Text fontWeight="semibold" color="blue.700">
                        🚀 Lanjutkan dengan analisis lainnya?
                      </Text>
                    </HStack>
                    <Badge colorScheme="blue" variant="outline">
                      Analisis Current: {analysisData.type?.toUpperCase()}
                    </Badge>
                  </HStack>
                  
                  {/* Analysis Suggestion Grid */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                    {analysisData.type !== 'business' && (
                      <Button 
                        leftIcon={<MdAutoAwesome />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('business')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Business Insights
                        <Badge ml={2} colorScheme="blue" size="sm">~15m</Badge>
                      </Button>
                    )}
                    
                    {analysisData.type !== 'performance' && (
                      <Button 
                        leftIcon={<FiBarChart />}
                        colorScheme="green"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('performance')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Performance Analysis
                        <Badge ml={2} colorScheme="green" size="sm">~8m</Badge>
                      </Button>
                    )}
                    
                    {analysisData.type !== 'revenue' && (
                      <Button 
                        leftIcon={<FiPieChart />}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('revenue')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Revenue Analysis
                        <Badge ml={2} colorScheme="purple" size="sm">~12m</Badge>
                      </Button>
                    )}
                    
                    {analysisData.type !== 'occupancy' && (
                      <Button 
                        leftIcon={<FiActivity />}
                        colorScheme="orange"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('occupancy')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Occupancy Analysis
                        <Badge ml={2} colorScheme="orange" size="sm">~6m</Badge>
                      </Button>
                    )}
                    
                    {analysisData.type !== 'trends' && (
                      <Button 
                        leftIcon={<FiTrendingUp />}
                        colorScheme="teal"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('trends')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Trend Analysis
                        <Badge ml={2} colorScheme="teal" size="sm">~8m</Badge>
                      </Button>
                    )}
                    
                    {analysisData.type !== 'recommendations' && (
                      <Button 
                        leftIcon={<FiTarget />}
                        colorScheme="cyan"
                        variant="outline"
                        size="sm"
                        onClick={() => generateAIAnalysis('recommendations')}
                        _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                      >
                        Recommendations
                        <Badge ml={2} colorScheme="cyan" size="sm">~10m</Badge>
                      </Button>
                    )}
                  </SimpleGrid>
                  
                  {/* Special Options */}
                  <Divider />
                  <HStack justify="center" spacing={4}>
                    <Button 
                      leftIcon={<MdInsights />}
                      colorScheme="purple"
                      variant="solid"
                      size="sm"
                      onClick={() => generateAIAnalysis('comprehensive')}
                      _hover={{ transform: 'translateY(-1px)', shadow: 'lg' }}
                    >
                      🎯 Comprehensive Analysis
                      <Badge ml={2} colorScheme="white" color="purple.500" size="sm">All-in-One</Badge>
                    </Button>
                    <Button 
                      leftIcon={<FiRefreshCw />}
                      colorScheme="gray"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAIAnalysis(analysisData.type)}
                    >
                      🔄 Refresh Current Analysis
                    </Button>
                  </HStack>
                  
                  <Alert status="info" variant="left-accent" size="sm">
                    <AlertIcon />
                    <Text fontSize="xs">
                      💡 Tips: Kombinasikan beberapa analisis untuk mendapatkan insight yang lebih komprehensif tentang operasional rusunawa Anda.
                    </Text>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )}
      </CardBody>
    </Card>

    {/* Cancel Confirmation Dialog */}
    <AlertDialog
      isOpen={isCancelDialogOpen}
      leastDestructiveRef={cancelRef}
      onClose={onCancelDialogClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Batalkan Analisis AI?
          </AlertDialogHeader>

          <AlertDialogBody>
            Proses analisis akan dihentikan dan progress akan hilang. 
            Anda perlu memulai ulang analisis dari awal.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onCancelDialogClose}>
              Lanjutkan Analisis
            </Button>
            <Button colorScheme="red" onClick={cancelAnalysis} ml={3}>
              Ya, Batalkan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>

    {/* Settings Modal */}
    <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>AI Analytics Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notifications">Browser Notifications</FormLabel>
              <Spacer />
              <Switch 
                id="notifications" 
                isChecked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
              />
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="auto-refresh">Auto Refresh Results</FormLabel>
              <Spacer />
              <Switch 
                id="auto-refresh" 
                isChecked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            </FormControl>
            
            <Divider />
            
            <Box>
              <Text fontWeight="semibold" mb={2}>Service Status</Text>
              <HStack>
                <Badge colorScheme={serviceAvailable ? "green" : "red"}>
                  {serviceAvailable ? "Online" : "Offline"}
                </Badge>                <Button size="xs" onClick={handleManualServiceCheck}>
                  Refresh
                </Button>
              </HStack>
            </Box>
            
            {lastUpdate && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Last Analysis</Text>
                <Text fontSize="sm" color="gray.600">
                  {lastUpdate.toLocaleString('id-ID')}
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>

    {/* Results Modal */}
    <Modal isOpen={isResultModalOpen} onClose={onResultModalClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <Icon as={MdAutoAwesome} color="blue.500" />
            <Text>AI Analysis Results</Text>
            {analysisData?.type && (
              <Badge colorScheme="blue" textTransform="capitalize">
                {analysisData.type}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          {analysisData && (
            <VStack spacing={4} align="stretch">
              {/* Quick Summary */}
              {analysisData.summary && (
                <Alert status="success" variant="left-accent">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Executive Summary</Text>
                    <Text fontSize="sm" mt={1}>{analysisData.summary}</Text>
                  </Box>
                </Alert>
              )}
              
              {/* Key Metrics in Modal */}
              {analysisData.performance?.overall_score && (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Stat p={4} bg={successBg} borderRadius="md">
                    <StatLabel>Overall Score</StatLabel>
                    <StatNumber>{Math.round(analysisData.performance.overall_score)}</StatNumber>
                    <StatHelpText>
                      <StatArrow type="increase" />
                      Excellent Performance
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              )}
              
              {/* Insights Preview */}
              {analysisData.key_insights?.slice(0, 3).map((insight, index) => (
                <Box key={index} p={3} bg={accentBg} borderRadius="md" borderLeft="4px" borderColor="blue.500">
                  <Text fontSize="sm">{insight}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>

    {/* Status Detail Drawer */}
    <Drawer
      isOpen={showStatusDrawer}
      placement="right"
      onClose={() => setShowStatusDrawer(false)}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <HStack>
            <Icon as={FiActivity} />
            <Text>Analysis Status</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {loading && detailedStatus && (
              <>
                <Box>
                  <Text fontWeight="semibold" mb={2}>Current Progress</Text>
                  <Progress value={loadingProgress} colorScheme="blue" size="lg" />
                  <HStack justify="space-between" mt={1} fontSize="sm">
                    <Text>{loadingProgress}%</Text>
                    <Text>{actualTime}s / {detailedStatus.estimated}s</Text>
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontWeight="semibold" mb={2}>Current Stage</Text>
                  <Text fontSize="sm">{loadingStage}</Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Step {detailedStatus.step} of {detailedStatus.totalSteps}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="semibold" mb={2}>Analysis Type</Text>
                  <Badge colorScheme="blue" textTransform="capitalize">
                    {analysisType}
                  </Badge>
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="semibold" mb={2}>Processing Steps</Text>
                  <List spacing={2}>
                    {processingSteps.map((step, index) => (
                      <ListItem key={index} fontSize="sm">
                        <ListIcon 
                          as={index < activeStep ? FiCheckCircle : index === activeStep ? FiActivity : FiClock} 
                          color={index < activeStep ? "green.500" : index === activeStep ? "blue.500" : "gray.400"} 
                        />
                        {step.title}
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}
            
            {!loading && (
              <Center py={8}>
                <VStack>
                  <Icon as={FiClock} boxSize={8} color="gray.400" />
                  <Text color="gray.500">No active analysis</Text>
                </VStack>
              </Center>
            )}
          </VStack>
        </DrawerBody>        {loading && (
          <DrawerFooter>
            <ButtonGroup spacing={2}>
              <Button 
                leftIcon={isPaused ? <FiPlay /> : <FiPause />}
                size="sm" 
                onClick={togglePause}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                colorScheme="red" 
                size="sm" 
                leftIcon={<FiSquare />}
                onClick={onCancelDialogOpen}
              >
                Cancel
              </Button>
            </ButtonGroup>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>

    {/* Floating Quick Analysis Menu */}
    {showFloatingMenu && (
      <Fade in={showFloatingMenu}>
        <Box
          position="fixed"
          bottom="6"
          right="6"
          zIndex="1000"
        >
          {isFloatingOpen && (
            <VStack spacing={2} mb={4} align="stretch">
              <Card bg={cardBg} shadow="xl" borderWidth="1px" borderColor={borderColor}>
                <CardBody p={3}>
                  <VStack spacing={2} align="stretch" maxW="200px">
                    <Text fontSize="xs" fontWeight="bold" color="gray.600" textAlign="center">
                      Pilih Analisis Lain:
                    </Text>
                    {analysisData?.type !== 'business' && (
                      <Button size="xs" leftIcon={<MdAutoAwesome />} colorScheme="blue" variant="ghost"
                              onClick={() => {generateAIAnalysis('business'); setIsFloatingOpen(false);}}>
                        Business
                      </Button>
                    )}
                    {analysisData?.type !== 'performance' && (
                      <Button size="xs" leftIcon={<FiBarChart />} colorScheme="green" variant="ghost"
                              onClick={() => {generateAIAnalysis('performance'); setIsFloatingOpen(false);}}>
                        Performance
                      </Button>
                    )}
                    {analysisData?.type !== 'revenue' && (
                      <Button size="xs" leftIcon={<FiPieChart />} colorScheme="purple" variant="ghost"
                              onClick={() => {generateAIAnalysis('revenue'); setIsFloatingOpen(false);}}>
                        Revenue
                      </Button>
                    )}
                    {analysisData?.type !== 'occupancy' && (
                      <Button size="xs" leftIcon={<FiActivity />} colorScheme="orange" variant="ghost"
                              onClick={() => {generateAIAnalysis('occupancy'); setIsFloatingOpen(false);}}>
                        Occupancy
                      </Button>
                    )}
                    {analysisData?.type !== 'trends' && (
                      <Button size="xs" leftIcon={<FiTrendingUp />} colorScheme="teal" variant="ghost"
                              onClick={() => {generateAIAnalysis('trends'); setIsFloatingOpen(false);}}>
                        Trends
                      </Button>
                    )}
                    {analysisData?.type !== 'recommendations' && (
                      <Button size="xs" leftIcon={<FiTarget />} colorScheme="cyan" variant="ghost"
                              onClick={() => {generateAIAnalysis('recommendations'); setIsFloatingOpen(false);}}>
                        Recommendations
                      </Button>
                    )}
                    
                    <Divider />
                    <Button size="xs" leftIcon={<MdInsights />} colorScheme="purple" variant="solid"
                            onClick={() => {generateAIAnalysis('comprehensive'); setIsFloatingOpen(false);}}>
                      🎯 Comprehensive Analysis
                      <Badge ml={2} colorScheme="white" color="purple.500" size="sm">All-in-One</Badge>
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          )}
          <Button
            colorScheme="blue"
            borderRadius="full"
            size="lg"
            height="60px"
            width="60px"
            boxShadow="xl"
            onClick={() => setIsFloatingOpen(!isFloatingOpen)}
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          >
            <Icon as={isFloatingOpen ? FiX : FiZap} boxSize={6} />
          </Button>
        </Box>
      </Fade>
    )}
    </>
  );
};

export default AIAnalytics;
