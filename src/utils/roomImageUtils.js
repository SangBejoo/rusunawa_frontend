// Room image utility functions
import femaleRoomImage from '../assets/images/female-room.jpg';
import maleRoomImage from '../assets/images/male-room.jpg';
import meetingRoomImage from '../assets/images/Ruang_rapat.jpg';

/**
 * Get room image based on room type or classification
 * @param {Object} room - Room object
 * @param {string} room.type - Room type (e.g., 'female', 'male', 'meeting')
 * @param {string} room.classification - Room classification (e.g., 'perempuan', 'laki-laki', 'ruang_rapat')
 * @param {string} room.gender - Room gender restriction (e.g., 'L', 'P')
 * @returns {string} Image path
 */
export const getRoomImage = (room) => {
  if (!room) return maleRoomImage; // Default fallback
    // Check type field first
  if (room.type) {
    // Handle both string and object type
    let typeText = '';
    if (typeof room.type === 'string') {
      typeText = room.type.toLowerCase();
    } else if (room.type.name) {
      typeText = room.type.name.toLowerCase();
    } else if (room.type.display_name) {
      typeText = room.type.display_name.toLowerCase();
    }
    
    if (typeText) {
      if (typeText.includes('female') || typeText.includes('perempuan') || typeText.includes('wanita')) {
        return femaleRoomImage;
      }
      if (typeText.includes('male') || typeText.includes('laki') || typeText.includes('pria')) {
        return maleRoomImage;
      }
      if (typeText.includes('meeting') || typeText.includes('rapat') || typeText.includes('conference')) {
        return meetingRoomImage;
      }
    }
  }
    // Check classification field
  if (room.classification) {
    // Handle both string and object classification
    let classificationText = '';
    if (typeof room.classification === 'string') {
      classificationText = room.classification.toLowerCase();
    } else if (room.classification.name) {
      classificationText = room.classification.name.toLowerCase();
    } else if (room.classification.display_name) {
      classificationText = room.classification.display_name.toLowerCase();
    }
    
    if (classificationText) {
      if (classificationText.includes('female') || classificationText.includes('perempuan') || classificationText.includes('wanita')) {
        return femaleRoomImage;
      }
      if (classificationText.includes('male') || classificationText.includes('laki') || classificationText.includes('pria')) {
        return maleRoomImage;
      }
      if (classificationText.includes('meeting') || classificationText.includes('rapat') || classificationText.includes('conference')) {
        return meetingRoomImage;
      }
    }
  }
  
  // Check gender field (L = Laki-laki, P = Perempuan)
  if (room.gender) {
    if (room.gender === 'P' || room.gender === 'F') {
      return femaleRoomImage;
    }
    if (room.gender === 'L' || room.gender === 'M') {
      return maleRoomImage;
    }
  }
    // Check room name for keywords
  if (room.name || room.roomName) {
    const nameText = room.name || room.roomName;
    if (typeof nameText === 'string') {
      const name = nameText.toLowerCase();
      if (name.includes('female') || name.includes('perempuan') || name.includes('wanita') || name.includes('putri')) {
        return femaleRoomImage;
      }
      if (name.includes('male') || name.includes('laki') || name.includes('pria') || name.includes('putra')) {
        return maleRoomImage;
      }
      if (name.includes('meeting') || name.includes('rapat') || name.includes('conference') || name.includes('ruang rapat')) {
        return meetingRoomImage;
      }
    }
  }
  
  // Default fallback based on common patterns
  return maleRoomImage;
};

/**
 * Get room image by type string directly
 * @param {string} type - Room type ('female', 'male', 'meeting')
 * @returns {string} Image path
 */
export const getRoomImageByType = (type) => {
  if (!type) return maleRoomImage;
  
  // Handle both string and object type
  let typeText = '';
  if (typeof type === 'string') {
    typeText = type.toLowerCase();
  } else if (type.name) {
    typeText = type.name.toLowerCase();
  } else if (type.display_name) {
    typeText = type.display_name.toLowerCase();
  } else {
    return maleRoomImage; // fallback if type is not string or object with name
  }
  
  if (typeText.includes('female') || typeText.includes('perempuan')) {
    return femaleRoomImage;
  }
  if (typeText.includes('male') || typeText.includes('laki')) {
    return maleRoomImage;
  }
  if (typeText.includes('meeting') || typeText.includes('rapat')) {
    return meetingRoomImage;
  }
  
  return maleRoomImage;
};
