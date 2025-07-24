import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { usePaymentStatusTracking } from '../../hooks/useEnhancedPayments';
import { format } from 'date-fns';

const PaymentStatusTracker = ({ 
  paymentId, 
  invoiceId, 
  autoRefresh = true,
  showTimeline = true,
  compact = false,
  onStatusChange,
  allowRetry = true
}) => {
  const {
    paymentStatus,
    statusHistory,
    loading,
    error,
    lastUpdated,
    refreshStatus,
    retryPayment
  } = usePaymentStatusTracking(paymentId, {
    autoRefresh,
    onStatusChange
  });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Payment status configurations
  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'warning',
      icon: <PendingIcon />,
      description: 'Payment is being processed'
    },
    processing: {
      label: 'Processing',
      color: 'info',
      icon: <CircularProgress size={20} />,
      description: 'Payment is currently being verified'
    },
    success: {
      label: 'Success',
      color: 'success',
      icon: <CheckCircleIcon />,
      description: 'Payment completed successfully'
    },
    failed: {
      label: 'Failed',
      color: 'error',
      icon: <ErrorIcon />,
      description: 'Payment failed to process'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'error',
      icon: <CancelIcon />,
      description: 'Payment was cancelled'
    },
    expired: {
      label: 'Expired',
      color: 'error',
      icon: <ScheduleIcon />,
      description: 'Payment link has expired'
    },
    refunded: {
      label: 'Refunded',
      color: 'info',
      icon: <RefreshIcon />,
      description: 'Payment has been refunded'
    }
  };

  // Get status configuration
  const currentStatusConfig = statusConfig[paymentStatus?.status] || statusConfig.pending;

  // Payment steps for stepper
  const getPaymentSteps = () => {
    const baseSteps = [
      {
        label: 'Payment Initiated',
        description: 'Payment request created',
        completed: !!paymentStatus,
        active: !paymentStatus
      },
      {
        label: 'Processing Payment',
        description: 'Verifying payment details',
        completed: paymentStatus?.status === 'success' || paymentStatus?.status === 'failed',
        active: paymentStatus?.status === 'processing'
      },
      {
        label: 'Payment Confirmation',
        description: 'Payment result confirmed',
        completed: paymentStatus?.status === 'success',
        active: false,
        error: paymentStatus?.status === 'failed'
      }
    ];

    if (paymentStatus?.status === 'success') {
      baseSteps.push({
        label: 'Invoice Updated',
        description: 'Invoice marked as paid',
        completed: true,
        active: false
      });
    }

    return baseSteps;
  };

  const steps = getPaymentSteps();
  const activeStep = steps.findIndex(step => step.active);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
  };

  // Handle retry payment
  const handleRetryPayment = async () => {
    try {
      await retryPayment();
    } catch (error) {
      console.error('Failed to retry payment:', error);
    }
  };

  // Render compact view
  if (compact) {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              {currentStatusConfig.icon}
              <Typography variant="subtitle2">
                Payment Status: 
                <Chip 
                  label={currentStatusConfig.label}
                  color={currentStatusConfig.color}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Status">
                <IconButton size="small" onClick={refreshStatus} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {loading && <LinearProgress sx={{ mt: 1 }} />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h2">
              Payment Status
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh Status">
                <IconButton onClick={refreshStatus} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {allowRetry && paymentStatus?.status === 'failed' && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRetryPayment}
                  startIcon={<RefreshIcon />}
                >
                  Retry Payment
                </Button>
              )}
            </Box>
          </Box>

          {/* Current Status */}
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            {currentStatusConfig.icon}
            <Box>
              <Typography variant="h6" color={`${currentStatusConfig.color}.main`}>
                {currentStatusConfig.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentStatusConfig.description}
              </Typography>
            </Box>
            <Box ml="auto">
              <Chip 
                label={currentStatusConfig.label}
                color={currentStatusConfig.color}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Loading indicator */}
          {loading && (
            <Box mb={2}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Refreshing payment status...
              </Typography>
            </Box>
          )}

          {/* Error alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message || 'Failed to fetch payment status'}
            </Alert>
          )}

          {/* Payment Details */}
          {paymentStatus && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Payment Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><PaymentIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Payment ID" 
                    secondary={paymentStatus.paymentId || paymentId}
                  />
                </ListItem>
                {paymentStatus.amount && (
                  <ListItem>
                    <ListItemIcon><ReceiptIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Amount" 
                      secondary={`Rp ${paymentStatus.amount.toLocaleString('id-ID')}`}
                    />
                  </ListItem>
                )}
                {paymentStatus.paymentMethod && (
                  <ListItem>
                    <ListItemIcon><InfoIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Payment Method" 
                      secondary={paymentStatus.paymentMethod}
                    />
                  </ListItem>
                )}
                {lastUpdated && (
                  <ListItem>
                    <ListItemIcon><ScheduleIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={formatTimestamp(lastUpdated)}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}

          {/* Progress Stepper */}
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel 
                  error={step.error}
                  StepIconComponent={({ active, completed, error }) => {
                    if (error) return <ErrorIcon color="error" />;
                    if (completed) return <CheckCircleIcon color="success" />;
                    if (active) return <CircularProgress size={20} />;
                    return <PendingIcon color="disabled" />;
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {/* Timeline View */}
          {showTimeline && statusHistory && statusHistory.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Status History
              </Typography>
              <Timeline>
                {statusHistory.slice(0, 5).map((item, index) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent sx={{ flex: 0.3 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(item.timestamp)}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={statusConfig[item.status]?.color || 'grey'}>
                        {statusConfig[item.status]?.icon || <InfoIcon />}
                      </TimelineDot>
                      {index < statusHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" fontWeight="medium">
                        {statusConfig[item.status]?.label || item.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.message || statusConfig[item.status]?.description}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
              {statusHistory.length > 5 && (
                <Button
                  size="small"
                  onClick={() => setDetailsOpen(true)}
                  sx={{ mt: 1 }}
                >
                  View Full History ({statusHistory.length} items)
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Payment Status Details
        </DialogTitle>
        <DialogContent>
          {paymentStatus && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Current Status: {currentStatusConfig.label}
              </Typography>
              
              {/* Full status history */}
              {statusHistory && statusHistory.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Complete Status History
                  </Typography>
                  <Timeline>
                    {statusHistory.map((item, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent sx={{ flex: 0.4 }}>
                          <Typography variant="body2">
                            {formatTimestamp(item.timestamp)}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={statusConfig[item.status]?.color || 'grey'}>
                            {statusConfig[item.status]?.icon || <InfoIcon />}
                          </TimelineDot>
                          {index < statusHistory.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Paper elevation={1} sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {statusConfig[item.status]?.label || item.status}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.message || statusConfig[item.status]?.description}
                            </Typography>
                            {item.details && (
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                {JSON.stringify(item.details, null, 2)}
                              </Typography>
                            )}
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentStatusTracker;
