import { calculateRoomOccupancy } from './roomUtils';

/**
 * Data adapter functions to normalize API responses to component-friendly formats
 */

/**
 * Adapts a room object from the API format to the component format
 * @param {Object} apiRoom - Room data from API
 * @returns {Object} Room data in component-friendly format
 */
export const adaptRoom = (apiRoom) => {
  if (!apiRoom) return null;
  
  const adapted = {
    id: apiRoom.roomId,
    room_id: apiRoom.roomId, // Keep both formats for backward compatibility
    name: apiRoom.name,
    classification: apiRoom.classification,  // Keep the whole object
    classificationName: apiRoom.classification?.name || 'Unknown',
    rentalType: apiRoom.rentalType?.name || 'Unknown',
    rate: apiRoom.rate || 0,
    capacity: apiRoom.capacity || 1,
    description: apiRoom.description || '',
    amenities: apiRoom.amenities || [],
    occupants: apiRoom.occupants || [],
    // Generate a placeholder image URL if not provided
    imageUrl: apiRoom.imageUrl || `https://source.unsplash.com/random/300x200/?room,${apiRoom.classification?.name || 'hotel'}`
  };
  
  // Add occupancy information
  adapted.occupancy = calculateRoomOccupancy(adapted);
  
  return adapted;
};

/**
 * Adapts a list of room objects from the API format to the component format
 * @param {Array} apiRooms - Room data list from API
 * @returns {Array} Room data list in component-friendly format
 */
export const adaptRooms = (apiRooms) => {
  if (!apiRooms || !Array.isArray(apiRooms)) return [];
  return apiRooms.map(adaptRoom);
};

export default {
  adaptRoom,
  adaptRooms
};
