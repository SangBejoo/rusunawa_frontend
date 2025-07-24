import femaleRoomImage from '../../assets/images/female-room.jpg';
import maleRoomImage from '../../assets/images/male-room.jpg';
import meetingRoomImage from '../../assets/images/Ruang_rapat.jpg';

/**
 * Default room images to use when room images are not available
 */
export const defaultImages = {
  // Image for female dormitory rooms
  perempuan: femaleRoomImage,
  
  // Image for male dormitory rooms
  laki_laki: maleRoomImage,
  
  // Image for VIP rooms (using male room as fallback)
  VIP: maleRoomImage,
  
  // Image for meeting rooms
  ruang_rapat: meetingRoomImage,
  
  // Default image for any other room type
  default: maleRoomImage
};

/**
 * Get an appropriate default image URL based on room classification
 * @param {Object} room - The room object
 * @returns {string} The default image URL
 */
export const getDefaultRoomImage = (room) => {
  if (!room || !room.classification || !room.classification.name) {
    return defaultImages.default;
  }
  
  const classificationName = room.classification.name.toLowerCase();
  
  return defaultImages[classificationName] || defaultImages.default;
};
