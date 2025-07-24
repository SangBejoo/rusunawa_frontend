/**
 * Validation utility functions for the Rusunawa tenant application
 */

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  
  // Additional validation for common email formats
  if (email.length > 254) return "Email address is too long";
  if (email.includes('..')) return "Email address cannot contain consecutive dots";
  if (email.startsWith('.') || email.endsWith('.')) return "Email address cannot start or end with a dot";
  
  return "";
};

// Password validation - at least 8 chars with one number and one special char
export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return "Password must contain at least one special character";
  return "";
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};

// Name validation
export const validateName = (name) => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  return "";
};

// Phone number validation (Indonesian format)
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  if (!phone) return "Phone number is required";
  if (!phoneRegex.test(phone)) return "Invalid Indonesian phone number";
  return "";
};

// NIM (Nomor Induk Mahasiswa) validation
export const validateNIM = (nim) => {
  if (!nim) return "NIM is required";
  if (nim.length < 5) return "NIM must be at least 5 characters";
  if (nim.length > 20) return "NIM cannot exceed 20 characters";
  
  // Check if NIM contains only alphanumeric characters
  const nimRegex = /^[a-zA-Z0-9]+$/;
  if (!nimRegex.test(nim)) return "NIM can only contain letters and numbers";
  
  // Check if NIM is not just numbers (some institutions use alphanumeric)
  if (nim.length > 0 && nim.trim() === '') return "NIM cannot be empty or just spaces";
  
  return "";
};

// Address validation
export const validateAddress = (address) => {
  if (!address) return "Address is required";
  if (address.length < 10) return "Address must be at least 10 characters";
  return "";
};

// Date validation
export const validateDate = (date) => {
  if (!date) return "Date is required";
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(selectedDate.getTime())) return "Invalid date format";
  return "";
};

// Date range validation for booking
export const validateDateRange = (startDate, endDate) => {
  const errors = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!startDate) {
    errors.startDate = "Check-in date is required";
  } else if (isNaN(start.getTime())) {
    errors.startDate = "Invalid check-in date";
  } else if (start < today) {
    errors.startDate = "Check-in date cannot be in the past";
  }

  if (!endDate) {
    errors.endDate = "Check-out date is required";
  } else if (isNaN(end.getTime())) {
    errors.endDate = "Invalid check-out date";
  } else if (endDate && startDate && end <= start) {
    errors.endDate = "Check-out date must be after check-in date";
  }

  return errors;
};

// Form validation helper
export const validateForm = (form, validationRules) => {
  const errors = {};
  Object.keys(validationRules).forEach(field => {
    const value = form[field];
    const validationFn = validationRules[field];
    const error = validationFn(value);
    if (error) errors[field] = error;
  });
  return errors;
};

// Tenant type ID mapping
export const getTenantTypeId = (type) => {
  const typeMap = {
    'mahasiswa': 1,
    'non_mahasiswa': 2,
    'student': 1,
    'non-student': 2
  };
  
  return typeMap[type?.toLowerCase()] || 1; // Default to student/mahasiswa
};

// Check for common email domains that might be typos
export const validateEmailDomain = (email) => {
  if (!email) return "";
  
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
  
  return "";
};

// Validate NIM uniqueness format (PNJ specific)
export const validateNIMFormat = (nim, isPNJStudent = true) => {
  if (!nim) return "NIM is required";
  
  if (isPNJStudent) {
    // More flexible PNJ NIM format: starts with 20xx, 21xx, 22xx, 23xx, 24xx etc.
    const pnjRegex = /^2[0-9]\d{2}[0-9A-Z]{4,8}$/i;
    if (!pnjRegex.test(nim)) {
      return "NIM format tidak valid. NIM PNJ harus dimulai dengan 2 angka tahun (contoh: 2021, 2024) diikuti kode program.";
    }
  }
  
  const basicValidation = validateNIM(nim);
  return basicValidation;
};

// Additional email validation for academic institutions
export const validateAcademicEmail = (email, requireAcademic = false) => {
  const basicValidation = validateEmail(email);
  if (basicValidation) return basicValidation;
  
  if (requireAcademic) {
    const academicDomains = ['ac.id', 'edu', 'ac.uk', 'edu.au'];
    const domain = email.split('@')[1]?.toLowerCase();
    const isAcademic = academicDomains.some(acadDomain => domain?.endsWith(acadDomain));
    
    if (!isAcademic) {
      return "Please use an academic email address for student registration";
    }
  }
  
  return "";
};

export default {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhone,
  validateNIM,
  validateAddress,
  validateDate,
  validateDateRange,
  validateForm,
  getTenantTypeId,
  validateEmailDomain,
  validateNIMFormat,
  validateAcademicEmail
};
