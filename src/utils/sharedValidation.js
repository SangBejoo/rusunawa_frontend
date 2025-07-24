/**
 * Shared validation utilities for both tenant and admin applications
 */

// Enhanced email validation with detailed error messages
export const validateEmailWithDetails = (email) => {
  if (!email) return "Email is required";
  if (email.length > 254) return "Email address is too long";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  
  // Check for common typos
  const commonTypos = {
    'gamil.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outloook.com': 'outlook.com'
  };
  
  const domain = email.split('@')[1];
  if (domain && commonTypos[domain.toLowerCase()]) {
    return `Did you mean ${email.split('@')[0]}@${commonTypos[domain.toLowerCase()]}?`;
  }
  
  if (email.includes('..')) return "Email address cannot contain consecutive dots";
  if (email.startsWith('.') || email.endsWith('.')) return "Email address cannot start or end with a dot";
  
  return "";
};

// Enhanced password validation with strength checking
export const validatePasswordWithStrength = (password) => {
  if (!password) return "Password is required";
  
  const minLength = 8;
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
  
  // Check for common weak patterns
  const weakPatterns = [
    /^password/i,
    /123456/,
    /qwerty/i,
    /^admin/i,
    /^user/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return "Password contains common patterns. Please choose a stronger password";
    }
  }
  
  return "";
};

// Real-time password strength indicator
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'gray' };
  
  let score = 0;
  let feedback = [];
  
  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');
  
  // Character diversity
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Lowercase letter');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Uppercase letter');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Number');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Special character');
  
  // Bonus for longer passwords
  if (password.length >= 12) score += 1;
  
  const strength = {
    0: { label: 'Very Weak', color: 'red' },
    1: { label: 'Weak', color: 'red' },
    2: { label: 'Fair', color: 'orange' },
    3: { label: 'Good', color: 'yellow' },
    4: { label: 'Strong', color: 'green' },
    5: { label: 'Very Strong', color: 'green' },
    6: { label: 'Excellent', color: 'green' }
  };
  
  return {
    score,
    ...strength[score],
    feedback,
    percentage: Math.min((score / 5) * 100, 100)
  };
};

// Backend error message parser
export const parseBackendError = (error, context = 'general') => {
  let message = 'An unexpected error occurred. Please try again.';
  
  if (!error) return message;
  
  // Extract message from different error structures
  let errorMessage = '';
  if (error.response && error.response.data) {
    errorMessage = error.response.data.message || error.response.data.error || '';
  } else if (error.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  // Context-specific error handling
  if (context === 'login') {
    if (errorMessage.includes('invalid email or password') || 
        errorMessage.includes('Login failed')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (errorMessage.includes('not verified') || 
        errorMessage.includes('verification')) {
      return 'Please verify your email address before logging in.';
    }
    if (errorMessage.includes('account locked') || 
        errorMessage.includes('blocked')) {
      return 'Your account has been temporarily locked. Please contact support.';
    }
  }
  
  if (context === 'register') {
    if (errorMessage.includes('duplicate key value') || 
        errorMessage.includes('already exists') ||
        errorMessage.includes('email sudah terdaftar')) {
      return 'This email address is already registered. Please use a different email or try logging in.';
    }
    if (errorMessage.includes('nim') && 
        (errorMessage.includes('duplicate') || errorMessage.includes('already exists'))) {
      return 'This Student ID (NIM) is already registered. Please check your NIM or contact support.';
    }
    if (errorMessage.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (errorMessage.includes('password')) {
      return 'Password does not meet security requirements. Please ensure it has at least 8 characters with numbers and special characters.';
    }
  }
  
  // Return the original message if it's user-friendly, otherwise return generic message
  if (errorMessage && errorMessage.length > 0 && errorMessage.length < 200) {
    return errorMessage;
  }
  
  return message;
};

// Form validation helpers
export const createFormValidator = (rules) => {
  return (formData) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = formData[field];
      
      for (const rule of fieldRules) {
        const error = rule(value, formData);
        if (error) {
          errors[field] = error;
          break; // Stop at first error for this field
        }
      }
    });
    
    return errors;
  };
};

// Common validation rules
export const validationRules = {
  required: (fieldName) => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return '';
  },
  
  email: (value) => validateEmailWithDetails(value),
  
  password: (value) => validatePasswordWithStrength(value),
  
  confirmPassword: (value, formData) => {
    if (!value) return 'Please confirm your password';
    if (value !== formData.password) return 'Passwords do not match';
    return '';
  },
  
  minLength: (min) => (value) => {
    if (value && value.length < min) return `Must be at least ${min} characters`;
    return '';
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) return `Cannot exceed ${max} characters`;
    return '';
  }
};
