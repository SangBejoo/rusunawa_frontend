import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Box, Text, Spinner, HStack, useToast } from '@chakra-ui/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Campus location coordinates (should match your database)
const CAMPUS_LOCATION = {
  lat: -6.371355292523935,
  lng: 106.82418567314572
};

// Initialize default icon for markers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Different marker colors
const CampusIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HomeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map click events
const MapClickHandler = ({ onMapClick }) => {
  useMapEvent('click', onMapClick);
  return null;
};

// Component to handle map initialization and size invalidation
const MapInitHandler = ({ mapRef }) => {
  const map = useMapEvent('click', () => {
    // This component will have access to the map instance
  });
  
  useEffect(() => {
    if (map && mapRef) {
      mapRef.current = map;
      // Invalidate size after a small delay to ensure container is rendered
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map, mapRef]);
  
  return null;
};

// Calculate Haversine distance between two points (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c;
  return d.toFixed(2);
};

const LocationPicker = memo(({ value, onChange, addressValue, onAddressChange, triggerGeocode }) => {
  const [position, setPosition] = useState(value?.lat && value?.lng ? value : null);
  const [distance, setDistance] = useState(null);
  const [mapCenter, setMapCenter] = useState(CAMPUS_LOCATION);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingCoordinates, setIsLoadingCoordinates] = useState(false);
  const [isUpdatingFromCoordinates, setIsUpdatingFromCoordinates] = useState(false);
  const [lastGeocodingTime, setLastGeocodingTime] = useState(0); // Add rate limiting
  const [lastProcessedTrigger, setLastProcessedTrigger] = useState(0); // Track processed triggers
  const currentAddressRef = useRef(addressValue); // Track current address
  const onChangeRef = useRef(onChange); // Track onChange function
  const mapRef = useRef(null); // Add ref for map instance
  const toast = useToast();

  // Update refs whenever props change
  useEffect(() => {
    currentAddressRef.current = addressValue;
    onChangeRef.current = onChange;
  }, [addressValue, onChange]);

  // Debounce function to prevent too many API calls
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };  // Forward geocoding function with retry mechanism
  const forwardGeocode = async (address, retryCount = 0) => {
    const maxRetries = 2;
    const timeoutDuration = 15000 + (retryCount * 5000); // Increase timeout with retries: 15s, 20s, 25s
    
    try {
      console.log(`Forward geocoding address (attempt ${retryCount + 1}): ${address}`);
      
      // Add delay between retries to respect rate limits
      if (retryCount > 0) {
        console.log(`Waiting ${2 * retryCount} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // 2s, 4s delay
      }
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}, Indonesia&format=json&addressdetails=1&limit=1&countrycodes=id`,
        {
          headers: {
            'User-Agent': 'RusunawaApp/1.0 (contact@rusunawa.com)' // Required by Nominatim
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < maxRetries) {
          console.log('Rate limited (429), retrying...');
          return await forwardGeocode(address, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        console.log('Forward geocoded coordinates:', coordinates);
        return coordinates;
      }
      
      // If no results and we can retry, try again
      if (retryCount < maxRetries) {
        console.log('No results found, retrying...');
        return await forwardGeocode(address, retryCount + 1);
      }
      
      throw new Error('No coordinates found for this address');
    } catch (error) {
      console.error('Forward geocoding error:', error);
      
      // Retry on timeout or network errors
      if ((error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('Failed to fetch')) && retryCount < maxRetries) {
        console.log(`Retrying due to ${error.name || 'network error'}...`);
        return await forwardGeocode(address, retryCount + 1);
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Address lookup timed out after multiple attempts - please try again later');
      }
      if (error.message.includes('HTTP')) {
        throw new Error('Address lookup service is temporarily unavailable - please try again later');
      }
      throw new Error('Could not find coordinates for this address - please try a more specific address');
    }
  };
  // Note: Debounced geocoding is disabled to prevent infinite loops.
  // Only manual triggering via triggerGeocode prop is supported.// Note: Automatic geocoding is disabled to prevent infinite loops.
  // Geocoding is only triggered manually via the triggerGeocode prop.
  // Effect to handle manual geocoding trigger
  useEffect(() => {
    // Only proceed if we have a new trigger value that we haven't processed yet
    if (triggerGeocode && triggerGeocode !== lastProcessedTrigger) {
      const currentAddress = currentAddressRef.current;
      if (currentAddress && currentAddress.trim().length > 10 && !isUpdatingFromCoordinates) {
        // Rate limiting: prevent more than one geocoding request per 2 seconds
        const now = Date.now();
        if (now - lastGeocodingTime < 2000) {
          toast({
            title: 'Please Wait',
            description: 'Please wait a moment before making another address lookup request.',
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
          return;
        }
        
        // Mark this trigger as processed
        setLastProcessedTrigger(triggerGeocode);
        setLastGeocodingTime(now);
        setIsLoadingCoordinates(true);
        
        const geocodeAddress = async () => {
          try {
            const coordinates = await forwardGeocode(currentAddress.trim());
            
            // Update position
            setPosition(coordinates);
            
            // Calculate distance
            const dist = calculateDistance(
              CAMPUS_LOCATION.lat,
              CAMPUS_LOCATION.lng,
              coordinates.lat,
              coordinates.lng
            );
            setDistance(dist);
            
            // Update map center to the new location
            setMapCenter(coordinates);
            
            // Notify parent with coordinates
            if (onChangeRef.current) {
              console.log("Sending geocoded coordinates to parent:", coordinates);
              onChangeRef.current(coordinates);
            }
            
            // Show success message
            toast({
              title: 'Location Found',
              description: `Address geocoded successfully. Distance to campus: ${dist} km`,
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Failed to geocode address:', error);
            // Show user-friendly error message
            let title = 'Address Lookup Failed';
            let description = error.message || 'Could not find coordinates for this address.';
            
            // Provide specific messages for common issues
            if (error.message.includes('timed out after multiple attempts')) {
              title = 'Service Temporarily Busy';
              description = 'The address lookup service is experiencing high traffic. Please wait a moment and try again, or select your location on the map instead.';
            } else if (error.message.includes('temporarily unavailable')) {
              title = 'Service Unavailable';
              description = 'The address lookup service is currently unavailable. Please try again later or select your location on the map.';
            } else if (error.message.includes('more specific address')) {
              title = 'Address Not Found';
              description = 'Could not find coordinates for this address. Try entering a more detailed address (include city/district) or select the location on the map.';
            }
            
            toast({
              title,
              description,
              status: 'warning',
              duration: 6000,
              isClosable: true,
            });
          } finally {
            setIsLoadingCoordinates(false);
          }
        };
        
        geocodeAddress();
      } else if (triggerGeocode !== lastProcessedTrigger) {
        // Mark trigger as processed even if we can't geocode
        setLastProcessedTrigger(triggerGeocode);
      }
    }
  }, [triggerGeocode, isUpdatingFromCoordinates, toast, lastGeocodingTime, lastProcessedTrigger]);

  useEffect(() => {
    // If user provided coordinates initially, set those
    if (value?.lat && value?.lng) {
      setPosition({ lat: value.lat, lng: value.lng });
      
      // Calculate distance
      const dist = calculateDistance(
        CAMPUS_LOCATION.lat,
        CAMPUS_LOCATION.lng,
        value.lat,
        value.lng
      );
      setDistance(dist);
      
      // Update map center to show the location
      setMapCenter({ lat: value.lat, lng: value.lng });
    } else {
      // Try to get current location for initial map center
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // If geolocation fails, use campus as default center
          setMapCenter(CAMPUS_LOCATION);
        }
      );
    }
  }, [value]);

  // Effect to handle map resizing when component becomes visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Effect to handle tab changes or container visibility changes
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also trigger resize when component mounts or updates
    const observer = new MutationObserver(() => {
      handleResize();
    });
    
    const mapElement = document.querySelector('.leaflet-container');
    if (mapElement) {
      observer.observe(mapElement.parentElement, { 
        attributes: true, 
        attributeFilter: ['style', 'class'] 
      });
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);  // Update the handleMapClick function to include reverse geocoding
  const handleMapClick = useCallback(async (e) => {
    const newPos = {
      lat: e.latlng.lat,
      lng: e.latlng.lng
    };
    
    setPosition(newPos);
    
    // Calculate distance
    const dist = calculateDistance(
      CAMPUS_LOCATION.lat,
      CAMPUS_LOCATION.lng,
      newPos.lat,
      newPos.lng
    );
    setDistance(dist);
    
    // Set flag to prevent geocoding loop when we update address from coordinates
    setIsUpdatingFromCoordinates(true);
    
    // Show loading state for address lookup
    setIsLoadingAddress(true);
      // Perform reverse geocoding to get address
    try {
      const address = await reverseGeocode(newPos.lat, newPos.lng);
      
      // Notify parent with full position object and address
      if (onChangeRef.current) {
        console.log("Sending location and address to parent:", { position: newPos, address });
        onChangeRef.current(newPos, address);
      }
      
      // Also notify address change if callback provided
      if (onAddressChange) {
        onAddressChange(address);
      }    } catch (error) {
      console.error('Failed to get address:', error);
      // Show user-friendly message for address lookup failure
      toast({
        title: 'Address Lookup Failed',
        description: 'Could not determine the address for this location, but coordinates were saved successfully.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      
      // Still notify parent with coordinates even if address lookup fails
      if (onChangeRef.current) {
        console.log("Sending location to parent (no address):", newPos);
        onChangeRef.current(newPos);
      }
    } finally {
      setIsLoadingAddress(false);
      // Reset flag after a delay to allow for address update to complete
      setTimeout(() => {
        setIsUpdatingFromCoordinates(false);
      }, 100);
    }
  }, [onAddressChange, toast]);  // Reverse geocoding function using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat, lng) => {
    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'RusunawaApp/1.0 (contact@rusunawa.com)' // Required by Nominatim
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Format the address nicely for Indonesian locations
        let formattedAddress = data.display_name;
        
        // Try to create a cleaner address for Indonesian locations
        if (data.address) {
          const parts = [];
          if (data.address.road) parts.push(data.address.road);
          if (data.address.house_number) parts.push(data.address.house_number);
          if (data.address.suburb || data.address.neighbourhood) {
            parts.push(data.address.suburb || data.address.neighbourhood);
          }
          if (data.address.city || data.address.town || data.address.village) {
            parts.push(data.address.city || data.address.town || data.address.village);
          }
          if (data.address.state) parts.push(data.address.state);
          if (data.address.postcode) parts.push(data.address.postcode);
          
          if (parts.length > 0) {
            formattedAddress = parts.join(', ');
          }
        }
        
        console.log('Reverse geocoded address:', formattedAddress);
        return formattedAddress;
      }
        throw new Error('No address found for this location');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Address lookup timed out - please try again');
      }
      if (error.message.includes('HTTP')) {
        throw new Error('Address lookup service is temporarily unavailable');
      }
      throw new Error('Could not determine address for this location');
    }
  };

  return (
    <Box>
      <Box 
        height="400px" 
        width="100%" 
        borderRadius="md" 
        overflow="hidden"
        border="1px solid #e2e8f0"
        position="relative"
        bg="white"
      >
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ 
            height: '100%', 
            width: '100%',
            minHeight: '400px'
          }}
          whenCreated={mapInstance => {
            if (mapRef.current !== mapInstance) {
              mapRef.current = mapInstance;
              // Invalidate size after container is fully rendered
              setTimeout(() => {
                mapInstance.invalidateSize();
              }, 200);
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Campus marker */}
          <Marker position={CAMPUS_LOCATION} icon={CampusIcon}>
            <Popup>
              <Text fontWeight="bold">Campus Location</Text>
            </Popup>
          </Marker>
          
          {/* Selected location marker */}
          {position && (
            <Marker position={position} icon={HomeIcon}>
              <Popup>
                <Text fontWeight="bold">Your Home Location</Text>
                <Text>Latitude: {position.lat.toFixed(6)}</Text>
                <Text>Longitude: {position.lng.toFixed(6)}</Text>
                <Text>Distance to campus: {distance} km</Text>
              </Popup>
            </Marker>
          )}
          
          {/* Line showing distance */}
          {position && (
            <Polyline 
              positions={[CAMPUS_LOCATION, position]}
              color="#0088FF"
              weight={3}
              opacity={0.7}
              dashArray="5, 5"
            />
          )}
          
          {/* Map click handler */}
          <MapClickHandler onMapClick={handleMapClick} />
          
          {/* Map initialization handler */}
          <MapInitHandler mapRef={mapRef} />
        </MapContainer>
      </Box>
        {distance && (
        <Text mt={2} fontWeight="semibold" color="blue.600">
          Distance to campus: {distance} km
        </Text>
      )}
        {isLoadingAddress && (
        <HStack mt={2} spacing={2}>
          <Spinner size="sm" color="blue.500" />
          <Text fontSize="sm" color="blue.600">
            Getting address information...
          </Text>
        </HStack>
      )}
      
      {isLoadingCoordinates && (
        <HStack mt={2} spacing={2}>
          <Spinner size="sm" color="green.500" />
          <Text fontSize="sm" color="green.600">
            Finding coordinates for address...
          </Text>
        </HStack>
      )}      <Text mt={1} fontSize="sm" color="gray.600">
        Click on the map to select your home location or type an address and click the search button. 
        For best results, include city/district in your address (e.g., "Tambun Selatan, Bekasi, West Java").
        If address lookup is slow or fails, you can directly click on the map to set your location.
      </Text>
    </Box>
  );
});

export default LocationPicker;
