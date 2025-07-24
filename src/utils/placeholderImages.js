/**
 * Default placeholder images for the Rusunawa application
 * Using data URLs for maximum reliability
 */

// Simple colored rectangles as data URLs - guaranteed to work offline
export const placeholderImages = {
  // Generic rusunawa building exterior (blue rectangle)
  building: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%230088cc'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='white' text-anchor='middle' dominant-baseline='middle'%3ERusunawa Building%3C/text%3E%3C/svg%3E",
  
  // Banner for registration and promotional sections (dark blue rectangle)
  banner: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'%3E%3Crect width='1200' height='400' fill='%230066aa'/%3E%3Ctext x='600' y='200' font-family='Arial' font-size='48' fill='white' text-anchor='middle' dominant-baseline='middle'%3ERusunawa Banner%3C/text%3E%3C/svg%3E",
  
  // Email verification success/confirmation image (green circle with checkmark)
  emailVerification: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'%3E%3Ccircle cx='256' cy='256' r='256' fill='%234CAF50'/%3E%3Cpath d='M186.301 339.893L96 249.461l-32 30.507L186.301 402 448 140.506 416 110z' fill='white'/%3E%3C/svg%3E",
  
  // Logo image (simple colored text)
  logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect width='200' height='80' fill='%230088cc'/%3E%3Ctext x='100' y='40' font-family='Arial' font-size='24' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='middle'%3ERusunawa%3C/text%3E%3C/svg%3E",
  
  // Room images by classification
  rooms: {
    perempuan: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23FF69B4'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='white' text-anchor='middle' dominant-baseline='middle'%3EFemale Dorm%3C/text%3E%3C/svg%3E",
    laki_laki: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%230088cc'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='white' text-anchor='middle' dominant-baseline='middle'%3EMale Dorm%3C/text%3E%3C/svg%3E",
    VIP: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23FFD700'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='black' text-anchor='middle' dominant-baseline='middle'%3EVIP Room%3C/text%3E%3C/svg%3E",
    ruang_rapat: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23228B22'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='white' text-anchor='middle' dominant-baseline='middle'%3EMeeting Room%3C/text%3E%3C/svg%3E",
    default: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23cccccc'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='32' fill='%23333333' text-anchor='middle' dominant-baseline='middle'%3ERoom%3C/text%3E%3C/svg%3E"
  }
};

export default placeholderImages;
