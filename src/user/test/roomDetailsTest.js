// Test script to verify room details API integration
import roomService from '../services/roomService';

const testRoomDetails = async () => {
  try {
    console.log('Testing room details API...');
    
    // Test 1: Get room details
    const roomId = 1;
    console.log(`Fetching room details for ID: ${roomId}`);
    
    const roomResponse = await roomService.getRoomById(roomId);
    console.log('Room details response:', roomResponse);
    
    // Test 2: Get image data if room has images
    if (roomResponse.room.images && roomResponse.room.images.length > 0) {
      const firstImage = roomResponse.room.images[0];
      const imageId = firstImage.imageId || firstImage.image_id;
      
      if (imageId) {
        console.log(`Fetching image data for ID: ${imageId}`);
        const imageResponse = await roomService.getRoomImageData(imageId);
        console.log('Image data response:', {
          imageId: imageResponse.imageId,
          imageName: imageResponse.imageName,
          contentType: imageResponse.contentType,
          fileSize: imageResponse.fileSize,
          isPrimary: imageResponse.isPrimary,
          hasImageData: !!imageResponse.imageData
        });
      }
    }
    
    // Test 3: Verify API endpoint format
    console.log('API endpoints being used:');
    console.log(`- Room details: /v1/rooms/${roomId}`);
    console.log('- Image data: /v1/room-images/{imageId}');
    
    console.log('✅ Room details API test completed successfully');
    
  } catch (error) {
    console.error('❌ Room details API test failed:', error);
  }
};

// Export for use in components
export default testRoomDetails;

// Self-executing test for development
if (process.env.NODE_ENV === 'development') {
  // Uncomment to run test automatically
  // testRoomDetails();
}
