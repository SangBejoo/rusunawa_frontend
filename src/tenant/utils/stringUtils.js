/**
 * String utility functions for the Rusunawa tenant application
 */

/**
 * Safely convert a value to string
 * @param {any} value - The value to convert to string
 * @returns {string} The string value or empty string if null/undefined
 */
export const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export const capitalize = (str) => {
  const safeStr = safeString(str);
  if (!safeStr) return '';
  return safeStr.charAt(0).toUpperCase() + safeStr.slice(1).toLowerCase();
};

/**
 * Capitalize each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export const capitalizeEachWord = (str) => {
  const safeStr = safeString(str);
  if (!safeStr) return '';
  return safeStr.replace(/\w\S*/g, (word) => {
    return capitalize(word);
  });
};

/**
 * Format room classification for display
 * @param {Object|string} classification - Room classification object or string
 * @returns {string} Formatted classification name
 */
export const formatRoomClassification = (classification) => {
  // Handle different input formats
  let classificationName = '';
  
  if (!classification) {
    return 'Unknown';
  }
  
  // If it's an object with a name property
  if (typeof classification === 'object' && classification !== null) {
    classificationName = classification.name || '';
  } 
  // If it's a string
  else if (typeof classification === 'string') {
    classificationName = classification;
  }
  
  // Replace underscores with spaces and capitalize each word
  return capitalizeEachWord(classificationName.replace(/_/g, ' '));
};

/**
 * Format amenity name for display
 * @param {string} amenityName - Raw amenity name
 * @returns {string} Formatted amenity name
 */
export const formatAmenityName = (amenityName) => {
  const safeStr = safeString(amenityName);
  if (!safeStr) return '';
  return capitalizeEachWord(safeStr.replace(/_/g, ' '));
};

export default {
  safeString,
  capitalize,
  capitalizeEachWord,
  formatRoomClassification,
  formatAmenityName
};
