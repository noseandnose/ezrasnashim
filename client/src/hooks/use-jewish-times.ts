import { useQuery } from "@tanstack/react-query";
import { create } from 'zustand';
import { useEffect } from 'react';

interface LocationState {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  locationRequested: boolean;
  permissionDenied: boolean;
  setLocation: (location: string) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  setLocationRequested: (requested: boolean) => void;
  setPermissionDenied: (denied: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: '',
  coordinates: null,
  locationRequested: false,
  permissionDenied: false,
  setLocation: (location: string) => set({ location }),
  setCoordinates: (coordinates: { lat: number; lng: number }) => set({ coordinates }),
  setLocationRequested: (locationRequested: boolean) => set({ locationRequested }),
  setPermissionDenied: (permissionDenied: boolean) => set({ permissionDenied }),
}));

// Hook to get user's location
export function useGeolocation() {
  const { 
    coordinates, locationRequested, permissionDenied,
    setCoordinates, setLocationRequested, setPermissionDenied 
  } = useLocationStore();

  useEffect(() => {
    if (!locationRequested && !coordinates && !permissionDenied) {
      setLocationRequested(true);
      
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        setPermissionDenied(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setPermissionDenied(true);
          // Fall back to NYC coordinates
          setCoordinates({ lat: 40.7128, lng: -74.0060 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, [locationRequested, coordinates, permissionDenied, setCoordinates, setLocationRequested, setPermissionDenied]);

  return { coordinates, permissionDenied };
}

export function useJewishTimes() {
  const { coordinates } = useGeolocation();
  const today = new Date().toISOString().split('T')[0];
  
  // Use NYC as fallback coordinates
  const effectiveCoords = coordinates || { lat: 40.7128, lng: -74.0060 };

  return useQuery({
    queryKey: ['zmanim', effectiveCoords.lat, effectiveCoords.lng, today],
    queryFn: async () => {
      try {
        // Call our backend proxy route to avoid CORS issues
        const url = `/api/zmanim/${effectiveCoords.lat}/${effectiveCoords.lng}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching zmanim:', error);
        return null;
      }
    },
    enabled: !!effectiveCoords, // Only fetch when we have coordinates
    staleTime: 1000 * 60 * 60 * 6, // 6 hours - refresh twice daily
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
