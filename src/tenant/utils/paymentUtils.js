import { format, isAfter, isBefore, addDays, addMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/**
 * Payment utility functions for the tenant application
 */

// Currency formatting
export const formatCurrency = (amount, options = {}) => {
  const defaultOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  };

  try {
    return new Intl.NumberFormat('id-ID', defaultOptions).format(amount);
  } catch (error) {
    // Fallback formatting
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
};

// Simple currency formatting without symbol
export const formatAmount = (amount) => {
  return amount.toLocaleString('id-ID');
};

// Payment method validation
export const validatePaymentMethod = (method, data) => {
  const validators = {
    credit_card: validateCreditCard,
    bank_transfer: validateBankTransfer,
    e_wallet: validateEWallet,
    qris: validateQRIS
  };

  const validator = validators[method];
  if (!validator) {
    return { valid: false, errors: ['Invalid payment method'] };
  }

  return validator(data);
};

// Credit card validation
export const validateCreditCard = (data) => {
  const errors = [];

  // Card number validation (Luhn algorithm)
  if (!data.cardNumber || !isValidCardNumber(data.cardNumber)) {
    errors.push('Invalid card number');
  }

  // Expiry date validation
  if (!data.cardExpiry || !isValidExpiryDate(data.cardExpiry)) {
    errors.push('Invalid or expired card');
  }

  // CVV validation
  if (!data.cardCvv || !/^[0-9]{3,4}$/.test(data.cardCvv)) {
    errors.push('Invalid CVV');
  }

  // Card holder name
  if (!data.cardHolderName || data.cardHolderName.length < 2) {
    errors.push('Invalid card holder name');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Bank transfer validation
export const validateBankTransfer = (data) => {
  const errors = [];

  if (!data.bankCode) {
    errors.push('Please select a bank');
  }

  if (!data.customerName || data.customerName.length < 2) {
    errors.push('Customer name is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// E-wallet validation
export const validateEWallet = (data) => {
  const errors = [];

  if (!data.eWalletProvider) {
    errors.push('Please select an e-wallet provider');
  }

  if (!data.phone || !isValidIndonesianPhone(data.phone)) {
    errors.push('Valid Indonesian phone number is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// QRIS validation
export const validateQRIS = (data) => {
  const errors = [];

  if (!data.customerName || data.customerName.length < 2) {
    errors.push('Customer name is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Card number validation using Luhn algorithm
export const isValidCardNumber = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit = digit % 10 + 1;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Expiry date validation
export const isValidExpiryDate = (expiry) => {
  const match = expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(`20${match[2]}`, 10);
  const expiryDate = new Date(year, month - 1);
  const now = new Date();

  return isAfter(expiryDate, now);
};

// Indonesian phone number validation
export const isValidIndonesianPhone = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  return /^(62|0)8[1-9][0-9]{6,9}$/.test(cleanPhone);
};

// Format phone number for display
export const formatPhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('62')) {
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith('0')) {
    return `+62${cleanPhone.substring(1)}`;
  }
  
  return `+62${cleanPhone}`;
};

// Payment status utilities
export const getPaymentStatusColor = (status) => {
  const statusColors = {
    pending: 'warning',
    processing: 'info',
    success: 'success',
    failed: 'error',
    cancelled: 'error',
    expired: 'error',
    refunded: 'info'
  };

  return statusColors[status] || 'default';
};

export const getPaymentStatusLabel = (status) => {
  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    success: 'Success',
    failed: 'Failed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    refunded: 'Refunded'
  };

  return statusLabels[status] || 'Unknown';
};

// Payment method utilities
export const getPaymentMethodIcon = (method) => {
  const icons = {
    credit_card: '💳',
    bank_transfer: '🏦',
    e_wallet: '📱',
    qris: '📱',
    cash: '💵'
  };

  return icons[method] || '💳';
};

export const getPaymentMethodLabel = (method) => {
  const labels = {
    credit_card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    e_wallet: 'E-Wallet',
    qris: 'QRIS',
    cash: 'Cash'
  };

  return labels[method] || 'Unknown';
};

// Fee calculation utilities
export const calculateProcessingFee = (amount, method, options = {}) => {
  const feeRates = {
    credit_card: 0.029, // 2.9%
    bank_transfer: 0, // Free
    e_wallet: 0.007, // 0.7%
    qris: 0.007, // 0.7%
    ...options.customRates
  };

  const rate = feeRates[method] || 0;
  const fee = amount * rate;

  // Apply minimum and maximum fee limits
  const minFee = options.minFee || 0;
  const maxFee = options.maxFee || Infinity;

  return Math.max(minFee, Math.min(maxFee, fee));
};

// Installment utilities
export const calculateInstallmentAmount = (principal, periods, annualRate = 0.12) => {
  if (periods <= 1) return principal;

  const monthlyRate = annualRate / 12;
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, periods)) / 
                        (Math.pow(1 + monthlyRate, periods) - 1);

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalAmount: Math.round(monthlyPayment * periods),
    totalInterest: Math.round((monthlyPayment * periods) - principal)
  };
};

// Invoice utilities
export const generateInvoiceNumber = (prefix = 'INV') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const isInvoiceOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate));
};

export const getInvoiceStatus = (invoice) => {
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'cancelled') return 'cancelled';
  if (isInvoiceOverdue(invoice.dueDate)) return 'overdue';
  return 'pending';
};

export const calculateInvoiceDueDate = (createdDate, dueDays = 7) => {
  return addDays(new Date(createdDate), dueDays);
};

// Date formatting utilities
export const formatPaymentDate = (date, formatString = 'dd MMM yyyy HH:mm') => {
  return format(new Date(date), formatString, { locale: idLocale });
};

export const getRelativePaymentTime = (date) => {
  const now = new Date();
  const paymentDate = new Date(date);
  const diffInHours = (now - paymentDate) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)} days ago`;
  } else {
    return formatPaymentDate(date, 'dd MMM yyyy');
  }
};

// Payment URL utilities
export const buildPaymentRedirectUrl = (baseUrl, paymentData) => {
  const params = new URLSearchParams({
    payment_id: paymentData.paymentId,
    invoice_id: paymentData.invoiceId,
    amount: paymentData.amount,
    return_url: paymentData.returnUrl || window.location.href
  });

  return `${baseUrl}?${params.toString()}`;
};

export const parsePaymentCallbackUrl = (url) => {
  const urlObj = new URL(url);
  const params = Object.fromEntries(urlObj.searchParams);
  
  return {
    paymentId: params.payment_id,
    invoiceId: params.invoice_id,
    status: params.status,
    transactionId: params.transaction_id,
    message: params.message
  };
};

// Security utilities
export const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return cleaned;
  
  const first4 = cleaned.substring(0, 4);
  const last4 = cleaned.substring(cleaned.length - 4);
  const middle = '*'.repeat(cleaned.length - 8);
  
  return `${first4}${middle}${last4}`;
};

export const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
};

export const maskPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  
  const first2 = cleaned.substring(0, 2);
  const last2 = cleaned.substring(cleaned.length - 2);
  const middle = '*'.repeat(cleaned.length - 4);
  
  return `${first2}${middle}${last2}`;
};

// Validation utilities
export const validateAmount = (amount, min = 1000, max = 50000000) => {
  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { valid: false, message: 'Amount must be a valid number' };
  }
  
  if (numAmount < min) {
    return { valid: false, message: `Minimum amount is ${formatCurrency(min)}` };
  }
  
  if (numAmount > max) {
    return { valid: false, message: `Maximum amount is ${formatCurrency(max)}` };
  }
  
  return { valid: true };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Export utilities
export const exportPaymentData = (payments, format = 'csv') => {
  if (format === 'csv') {
    return exportPaymentDataAsCSV(payments);
  } else if (format === 'json') {
    return exportPaymentDataAsJSON(payments);
  }
  
  throw new Error(`Unsupported export format: ${format}`);
};

const exportPaymentDataAsCSV = (payments) => {
  const headers = [
    'Payment ID',
    'Invoice ID',
    'Amount',
    'Method',
    'Status',
    'Created Date',
    'Customer Name',
    'Customer Email'
  ];

  const rows = payments.map(payment => [
    payment.paymentId,
    payment.invoiceId,
    payment.amount,
    payment.method,
    payment.status,
    formatPaymentDate(payment.createdAt),
    payment.customerName,
    payment.customerEmail
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

const exportPaymentDataAsJSON = (payments) => {
  return JSON.stringify(payments, null, 2);
};

// Download utilities
export const downloadFile = (content, filename, contentType = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Payment analytics utilities
export const calculatePaymentMetrics = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      totalAmount: 0,
      totalCount: 0,
      successRate: 0,
      averageAmount: 0,
      topMethod: null
    };
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalCount = payments.length;
  const successfulPayments = payments.filter(p => p.status === 'success');
  const successRate = (successfulPayments.length / totalCount) * 100;
  const averageAmount = totalAmount / totalCount;

  // Find most used payment method
  const methodCounts = payments.reduce((acc, payment) => {
    acc[payment.method] = (acc[payment.method] || 0) + 1;
    return acc;
  }, {});

  const topMethod = Object.entries(methodCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  return {
    totalAmount,
    totalCount,
    successRate: Math.round(successRate * 100) / 100,
    averageAmount: Math.round(averageAmount),
    topMethod
  };
};

// Cache utilities for payment data
export const createPaymentCache = (ttl = 5 * 60 * 1000) => {
  const cache = new Map();

  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },

    set: (key, data) => {
      cache.set(key, {
        data,
        expiry: Date.now() + ttl
      });
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: () => {
      cache.clear();
    },

    size: () => cache.size
  };
};

// Default export
const paymentUtils = {
  formatCurrency,
  formatAmount,
  validatePaymentMethod,
  validateCreditCard,
  validateBankTransfer,
  validateEWallet,
  validateQRIS,
  isValidCardNumber,
  isValidExpiryDate,
  isValidIndonesianPhone,
  formatPhoneNumber,
  getPaymentStatusColor,
  getPaymentStatusLabel,
  getPaymentMethodIcon,
  getPaymentMethodLabel,
  calculateProcessingFee,
  calculateInstallmentAmount,
  generateInvoiceNumber,
  isInvoiceOverdue,
  getInvoiceStatus,
  calculateInvoiceDueDate,
  formatPaymentDate,
  getRelativePaymentTime,
  buildPaymentRedirectUrl,
  parsePaymentCallbackUrl,
  maskCardNumber,
  maskEmail,
  maskPhoneNumber,
  validateAmount,
  validateEmail,
  exportPaymentData,
  downloadFile,
  calculatePaymentMetrics,
  createPaymentCache
};

export default paymentUtils;
