import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Alert,
  Divider,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  QrCode as QrCodeIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Calculate as CalculateIcon,
  Receipt as ReceiptIcon,
  Discount as DiscountIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useEnhancedPayments } from '../../hooks/useEnhancedPayments';
import { paymentErrorHandler } from '../../utils/paymentErrorHandler';

const EnhancedPaymentForm = ({
  invoiceData,
  onPaymentInitiated,
  onPaymentCompleted,
  allowedMethods = ['credit_card', 'bank_transfer', 'e_wallet', 'qris'],
  showCalculator = true,
  showDiscounts = true,
  enableInstallments = false,
  redirectAfterSuccess = true
}) => {
  const {
    paymentMethods,
    calculatePaymentFees,
    applyDiscount,
    validatePaymentData,
    initiatePayment,
    loading
  } = useEnhancedPayments();

  const [activeStep, setActiveStep] = useState(0);
  const [calculatedFees, setCalculatedFees] = useState(null);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [installmentOptions, setInstallmentOptions] = useState([]);

  // Payment method configurations
  const paymentMethodConfig = {
    credit_card: {
      label: 'Credit/Debit Card',
      icon: <CreditCardIcon />,
      description: 'Pay using Visa, Mastercard, or other cards',
      fee: 2.9,
      processingTime: 'Instant'
    },
    bank_transfer: {
      label: 'Bank Transfer',
      icon: <BankIcon />,
      description: 'Transfer via internet banking or ATM',
      fee: 0,
      processingTime: '1-3 business days'
    },
    e_wallet: {
      label: 'E-Wallet',
      icon: <PhoneIcon />,
      description: 'GoPay, OVO, DANA, LinkAja',
      fee: 0.7,
      processingTime: 'Instant'
    },
    qris: {
      label: 'QRIS',
      icon: <QrCodeIcon />,
      description: 'Scan QR code with any banking app',
      fee: 0.7,
      processingTime: 'Instant'
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    paymentMethod: Yup.string().required('Payment method is required'),
    amount: Yup.number()
      .required('Amount is required')
      .min(1000, 'Minimum amount is Rp 1,000')
      .max(50000000, 'Maximum amount is Rp 50,000,000'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    phone: Yup.string()
      .matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, 'Invalid Indonesian phone number')
      .required('Phone number is required'),
    customerName: Yup.string()
      .min(2, 'Name must be at least 2 characters')
      .required('Customer name is required'),
    agreeToTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions'),
    // Conditional validations for credit card
    cardNumber: Yup.string().when('paymentMethod', {
      is: 'credit_card',
      then: Yup.string()
        .matches(/^[0-9]{13,19}$/, 'Invalid card number')
        .required('Card number is required')
    }),
    cardExpiry: Yup.string().when('paymentMethod', {
      is: 'credit_card',
      then: Yup.string()
        .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Invalid expiry date (MM/YY)')
        .required('Expiry date is required')
    }),
    cardCvv: Yup.string().when('paymentMethod', {
      is: 'credit_card',
      then: Yup.string()
        .matches(/^[0-9]{3,4}$/, 'Invalid CVV')
        .required('CVV is required')
    })
  });

  // Form handling
  const formik = useFormik({
    initialValues: {
      paymentMethod: '',
      amount: invoiceData?.amount || 0,
      email: invoiceData?.customerEmail || '',
      phone: invoiceData?.customerPhone || '',
      customerName: invoiceData?.customerName || '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      bankCode: '',
      eWalletProvider: '',
      installmentPeriod: 0,
      discountCode: '',
      agreeToTerms: false,
      notes: ''
    },
    validationSchema,
    onSubmit: handlePaymentSubmit
  });

  // Calculate fees and total when amount or payment method changes
  useEffect(() => {
    if (formik.values.amount && formik.values.paymentMethod) {
      calculateFees();
    }
  }, [formik.values.amount, formik.values.paymentMethod, formik.values.installmentPeriod]);

  // Load available discounts
  useEffect(() => {
    loadAvailableDiscounts();
  }, [formik.values.amount]);

  // Calculate payment fees
  const calculateFees = async () => {
    try {
      const fees = await calculatePaymentFees({
        amount: formik.values.amount,
        paymentMethod: formik.values.paymentMethod,
        installmentPeriod: formik.values.installmentPeriod
      });
      setCalculatedFees(fees);
    } catch (error) {
      console.error('Failed to calculate fees:', error);
    }
  };

  // Load available discounts
  const loadAvailableDiscounts = async () => {
    try {
      // Mock discount data - replace with actual API call
      const discounts = [
        {
          code: 'FIRST10',
          description: '10% off for first-time users',
          discount: 0.1,
          minAmount: 100000,
          applicable: formik.values.amount >= 100000
        },
        {
          code: 'STUDENT20',
          description: '20% student discount',
          discount: 0.2,
          minAmount: 50000,
          applicable: formik.values.amount >= 50000
        }
      ];
      setAvailableDiscounts(discounts);
    } catch (error) {
      console.error('Failed to load discounts:', error);
    }
  };

  // Apply discount
  const handleApplyDiscount = async (discountCode) => {
    try {
      const result = await applyDiscount({
        code: discountCode,
        amount: formik.values.amount
      });
      setSelectedDiscount(result);
      formik.setFieldValue('discountCode', discountCode);
    } catch (error) {
      setPaymentError(paymentErrorHandler.getErrorMessage(error));
    }
  };

  // Handle payment submission
  async function handlePaymentSubmit(values) {
    try {
      setPaymentError(null);
      
      // Validate payment data
      const validation = await validatePaymentData(values);
      if (!validation.valid) {
        setPaymentError(validation.message);
        return;
      }

      // Calculate final amount
      const baseAmount = values.amount;
      const fees = calculatedFees?.processingFee || 0;
      const discount = selectedDiscount?.amount || 0;
      const finalAmount = baseAmount + fees - discount;

      // Prepare payment data
      const paymentData = {
        ...values,
        originalAmount: baseAmount,
        processingFee: fees,
        discountAmount: discount,
        finalAmount,
        invoiceId: invoiceData?.id,
        metadata: {
          source: 'enhanced_payment_form',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      // Initiate payment
      const result = await initiatePayment(paymentData);
      
      if (onPaymentInitiated) {
        onPaymentInitiated(result);
      }

      // Handle redirect or success callback
      if (result.redirectUrl && redirectAfterSuccess) {
        window.location.href = result.redirectUrl;
      } else if (onPaymentCompleted) {
        onPaymentCompleted(result);
      }

    } catch (error) {
      const errorMessage = paymentErrorHandler.handleError(error);
      setPaymentError(errorMessage.message);
    }
  }

  // Get filtered payment methods
  const getAvailablePaymentMethods = () => {
    return Object.entries(paymentMethodConfig)
      .filter(([key]) => allowedMethods.includes(key))
      .map(([key, config]) => ({ key, ...config }));
  };

  // Get installment options for credit card
  const getInstallmentOptions = () => {
    if (formik.values.paymentMethod !== 'credit_card' || !enableInstallments) {
      return [];
    }
    return [
      { period: 0, label: 'Full Payment', fee: 0 },
      { period: 3, label: '3 Months', fee: 0.02 },
      { period: 6, label: '6 Months', fee: 0.04 },
      { period: 12, label: '12 Months', fee: 0.08 }
    ];
  };

  // Calculate total amount
  const calculateTotal = () => {
    const baseAmount = formik.values.amount;
    const fees = calculatedFees?.processingFee || 0;
    const discount = selectedDiscount?.amount || 0;
    return baseAmount + fees - discount;
  };

  const steps = [
    'Payment Method',
    'Payment Details',
    'Review & Confirm'
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Payment Form
          </Typography>

          {/* Error Alert */}
          {paymentError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {paymentError}
            </Alert>
          )}

          {/* Payment Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={formik.handleSubmit}>
            {/* Step 1: Payment Method Selection */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Payment Method
                </Typography>
                
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={formik.values.paymentMethod}
                    onChange={(e) => formik.setFieldValue('paymentMethod', e.target.value)}
                  >
                    {getAvailablePaymentMethods().map((method) => (
                      <Paper 
                        key={method.key} 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mb: 1,
                          border: formik.values.paymentMethod === method.key ? 2 : 1,
                          borderColor: formik.values.paymentMethod === method.key ? 'primary.main' : 'divider'
                        }}
                      >
                        <FormControlLabel
                          value={method.key}
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" width="100%">
                              <Box mr={2}>{method.icon}</Box>
                              <Box flexGrow={1}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {method.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {method.description}
                                </Typography>
                                <Box display="flex" gap={1} mt={1}>
                                  <Chip 
                                    label={`Fee: ${method.fee}%`} 
                                    size="small" 
                                    color={method.fee === 0 ? 'success' : 'default'}
                                  />
                                  <Chip 
                                    label={method.processingTime} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </Paper>
                    ))}
                  </RadioGroup>
                </FormControl>

                {formik.touched.paymentMethod && formik.errors.paymentMethod && (
                  <Typography color="error" variant="caption" display="block" sx={{ mt: 1 }}>
                    {formik.errors.paymentMethod}
                  </Typography>
                )}

                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    disabled={!formik.values.paymentMethod}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 2: Payment Details */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Payment Details
                </Typography>

                <Grid container spacing={3}>
                  {/* Basic Information */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      name="customerName"
                      value={formik.values.customerName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.customerName && Boolean(formik.errors.customerName)}
                      helperText={formik.touched.customerName && formik.errors.customerName}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.phone && Boolean(formik.errors.phone)}
                      helperText={formik.touched.phone && formik.errors.phone}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">+62</InputAdornment>
                      }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      name="amount"
                      type="number"
                      value={formik.values.amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.amount && Boolean(formik.errors.amount)}
                      helperText={formik.touched.amount && formik.errors.amount}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rp</InputAdornment>
                      }}
                      required
                    />
                  </Grid>

                  {/* Credit Card Fields */}
                  {formik.values.paymentMethod === 'credit_card' && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Credit Card Information
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Card Number"
                          name="cardNumber"
                          value={formik.values.cardNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.cardNumber && Boolean(formik.errors.cardNumber)}
                          helperText={formik.touched.cardNumber && formik.errors.cardNumber}
                          placeholder="1234 5678 9012 3456"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Expiry Date"
                          name="cardExpiry"
                          value={formik.values.cardExpiry}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.cardExpiry && Boolean(formik.errors.cardExpiry)}
                          helperText={formik.touched.cardExpiry && formik.errors.cardExpiry}
                          placeholder="MM/YY"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="CVV"
                          name="cardCvv"
                          value={formik.values.cardCvv}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.cardCvv && Boolean(formik.errors.cardCvv)}
                          helperText={formik.touched.cardCvv && formik.errors.cardCvv}
                          placeholder="123"
                        />
                      </Grid>

                      {/* Installment Options */}
                      {enableInstallments && (
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <Typography variant="subtitle2" gutterBottom>
                              Installment Options
                            </Typography>
                            <Autocomplete
                              options={getInstallmentOptions()}
                              getOptionLabel={(option) => option.label}
                              value={getInstallmentOptions().find(opt => opt.period === formik.values.installmentPeriod) || null}
                              onChange={(_, value) => formik.setFieldValue('installmentPeriod', value?.period || 0)}
                              renderInput={(params) => (
                                <TextField {...params} label="Installment Period" />
                              )}
                            />
                          </FormControl>
                        </Grid>
                      )}
                    </>
                  )}

                  {/* E-Wallet Provider */}
                  {formik.values.paymentMethod === 'e_wallet' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Typography variant="subtitle2" gutterBottom>
                          E-Wallet Provider
                        </Typography>
                        <RadioGroup
                          value={formik.values.eWalletProvider}
                          onChange={(e) => formik.setFieldValue('eWalletProvider', e.target.value)}
                          row
                        >
                          {['gopay', 'ovo', 'dana', 'linkaja'].map((provider) => (
                            <FormControlLabel
                              key={provider}
                              value={provider}
                              control={<Radio />}
                              label={provider.toUpperCase()}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Discount Section */}
                  {showDiscounts && (
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <DiscountIcon />
                            <Typography>Discount Codes</Typography>
                            {selectedDiscount && (
                              <Chip label={`-Rp ${selectedDiscount.amount.toLocaleString('id-ID')}`} color="success" size="small" />
                            )}
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TextField
                            fullWidth
                            label="Discount Code"
                            name="discountCode"
                            value={formik.values.discountCode}
                            onChange={formik.handleChange}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button
                                    onClick={() => handleApplyDiscount(formik.values.discountCode)}
                                    disabled={!formik.values.discountCode}
                                  >
                                    Apply
                                  </Button>
                                </InputAdornment>
                              )
                            }}
                          />
                          
                          {availableDiscounts.length > 0 && (
                            <Box mt={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Available Discounts:
                              </Typography>
                              {availableDiscounts.map((discount) => (
                                <Chip
                                  key={discount.code}
                                  label={`${discount.code} - ${discount.description}`}
                                  onClick={() => handleApplyDiscount(discount.code)}
                                  disabled={!discount.applicable}
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}
                </Grid>

                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                  >
                    Review
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Review & Confirm */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Review & Confirm Payment
                </Typography>

                {/* Payment Summary */}
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Payment Summary
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemText primary="Base Amount" />
                      <Typography>Rp {formik.values.amount.toLocaleString('id-ID')}</Typography>
                    </ListItem>
                    {calculatedFees?.processingFee > 0 && (
                      <ListItem>
                        <ListItemText primary="Processing Fee" />
                        <Typography>Rp {calculatedFees.processingFee.toLocaleString('id-ID')}</Typography>
                      </ListItem>
                    )}
                    {selectedDiscount && (
                      <ListItem>
                        <ListItemText primary={`Discount (${selectedDiscount.code})`} />
                        <Typography color="success.main">
                          -Rp {selectedDiscount.amount.toLocaleString('id-ID')}
                        </Typography>
                      </ListItem>
                    )}
                    <Divider />
                    <ListItem>
                      <ListItemText 
                        primary="Total Amount" 
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                      />
                      <Typography variant="h6" fontWeight="bold">
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </Typography>
                    </ListItem>
                  </List>
                </Paper>

                {/* Terms and Conditions */}
                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeToTerms"
                      checked={formik.values.agreeToTerms}
                      onChange={formik.handleChange}
                    />
                  }
                  label={
                    <Box>
                      I agree to the{' '}
                      <Button
                        color="primary"
                        size="small"
                        onClick={() => setShowTerms(true)}
                      >
                        Terms and Conditions
                      </Button>
                    </Box>
                  }
                />
                {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                  <Typography color="error" variant="caption" display="block">
                    {formik.errors.agreeToTerms}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button onClick={() => setActiveStep(1)}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !formik.values.agreeToTerms}
                    startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                  >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </Button>
                </Box>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTerms} onClose={() => setShowTerms(false)} maxWidth="md" fullWidth>
        <DialogTitle>Terms and Conditions</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            By proceeding with this payment, you agree to the following terms and conditions:
          </Typography>
          <Typography paragraph>
            1. All payments are processed securely through our certified payment partners.
          </Typography>
          <Typography paragraph>
            2. Processing fees are non-refundable and may vary based on the selected payment method.
          </Typography>
          <Typography paragraph>
            3. Refunds, if applicable, will be processed within 7-14 business days.
          </Typography>
          <Typography paragraph>
            4. You are responsible for ensuring the accuracy of payment information provided.
          </Typography>
          <Typography paragraph>
            5. We reserve the right to decline payments that do not meet our security requirements.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTerms(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedPaymentForm;
