import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { useEffect } from "react";
import axiosClient from "../lib/axiosClient";

interface LocationState {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  locationRequested: boolean;
  permissionDenied: boolean;
  setLocation: (location: string) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  setLocationRequested: (requested: boolean) => void;
  setPermissionDenied: (denied: boolean) => void;
  resetLocation: () => void;
  useIPLocation: () => Promise<any>;
  initializeFromCache: () => boolean;
  refreshLocationIfStale: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: "",
  coordinates: null,
  locationRequested: false,
  permissionDenied: false,
  setLocation: (location: string) => set({ location }),
  setCoordinates: (coordinates: { lat: number; lng: number }) =>
    set({ coordinates, permissionDenied: false }),
  setLocationRequested: (locationRequested: boolean) =>
    set({ locationRequested }),
  setPermissionDenied: (permissionDenied: boolean) => set({ permissionDenied }),
  resetLocation: () => set({ coordinates: null, locationRequested: false, permissionDenied: false }),
  useIPLocation: async () => {
    try {
      const response = await axiosClient.get('/api/location/ip');
      const data = response.data;
      set({ 
        coordinates: data.coordinates,
        location: data.location,
        permissionDenied: false 
      });
      
      // Cache IP-based location with shorter expiry
      localStorage.setItem('user-location-fallback', JSON.stringify(data.coordinates));
      localStorage.setItem('user-location-fallback-time', Date.now().toString());
      
      return data;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        // Failed to get IP-based location
      }
      throw error;
    }
  },
  
  // Initialize location from cache synchronously for instant startup
  initializeFromCache: () => {
    // FIRST: Check for user's preferred location (saved in profile settings)
    // This takes priority over device location
    const preferredLocation = localStorage.getItem('user-preferred-location');
    const preferredLocationName = localStorage.getItem('user-preferred-location-name');
    
    if (preferredLocation) {
      try {
        const parsed = JSON.parse(preferredLocation);
        // Using user's preferred location from settings
        set({ coordinates: parsed, location: preferredLocationName || '', permissionDenied: false });
        return true;
      } catch (e) {
        localStorage.removeItem('user-preferred-location');
        localStorage.removeItem('user-preferred-location-name');
      }
    }
    
    // SECOND: Check cached device location
    const cachedLocation = localStorage.getItem('user-location');
    const cacheTimestamp = localStorage.getItem('user-location-time');
    
    if (cachedLocation && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      // Use shorter cache time for more accurate location
      if (age < 4 * 60 * 60 * 1000) { // 4 hour cache instead of 24
        try {
          const parsed = JSON.parse(cachedLocation);
          // Using cached location
          set({ coordinates: parsed, location: '', permissionDenied: false });
          return true;
        } catch (e) {
          // Clear invalid cache
          localStorage.removeItem('user-location');
          localStorage.removeItem('user-location-time');
        }
      } else {
        // Cache is stale, clear it
        localStorage.removeItem('user-location');
        localStorage.removeItem('user-location-time');
      }
    }
    
    // THIRD: Try fallback cache (IP location)
    const fallbackLocation = localStorage.getItem('user-location-fallback');
    const fallbackTimestamp = localStorage.getItem('user-location-fallback-time');
    
    if (fallbackLocation && fallbackTimestamp) {
      const age = Date.now() - parseInt(fallbackTimestamp);
      if (age < 24 * 60 * 60 * 1000) { // 24 hour cache for IP location
        try {
          const parsed = JSON.parse(fallbackLocation);
          // Using IP fallback location
          set({ coordinates: parsed, location: '', permissionDenied: false });
          return true;
        } catch (e) {
          localStorage.removeItem('user-location-fallback');
          localStorage.removeItem('user-location-fallback-time');
        }
      }
    }
    
    return false;
  },
  
  // Refresh location if the cache is getting stale (for travel scenarios)
  refreshLocationIfStale: () => {
    const cacheTimestamp = localStorage.getItem('user-location-time');
    if (cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp);
      // If cache is older than 4 hours, force a refresh
      if (age > 4 * 60 * 60 * 1000) {
        // Location cache is stale, refreshing
        localStorage.removeItem('user-location');
        localStorage.removeItem('user-location-time');
        set({ coordinates: null, locationRequested: false });
      }
    }
  },
}));


// Hook to get user's location
export function useGeolocation() {
  const {
    coordinates,
    locationRequested,
    permissionDenied,
    setCoordinates,
    setLocationRequested,
    setPermissionDenied,
  } = useLocationStore();

  useEffect(() => {
    const checkLocationPermission = async () => {
      // If coordinates are already set, periodically check for location changes
      if (coordinates) {
        // Check for location changes every 30 minutes
        const lastCheck = localStorage.getItem('location-change-check');
        const now = Date.now();
        
        if (!lastCheck || now - parseInt(lastCheck) > 2 * 60 * 60 * 1000) {
          localStorage.setItem('location-change-check', now.toString());
          // Check if location cache is stale and refresh if needed
          const { refreshLocationIfStale } = useLocationStore.getState();
          refreshLocationIfStale();
        }
        return;
      }
      
      // Try to initialize from cache first (synchronous)
      const store = useLocationStore.getState();
      if (store.initializeFromCache()) {
        return; // Successfully loaded from cache
      }

      // Skip permission check for faster startup - just try to get location

      if (!locationRequested && !coordinates && !permissionDenied) {
        setLocationRequested(true);

        if (!navigator.geolocation) {
          setPermissionDenied(true);
          return;
        }
        // Get location with optimized settings
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            // Got accurate location
            setCoordinates(coords);
            
            // Cache the location
            localStorage.setItem('user-location', JSON.stringify(coords));
            localStorage.setItem('user-location-time', Date.now().toString());
          },
          async () => {
            // Location error, trying IP fallback
            setPermissionDenied(true);
            // Try IP-based location as fallback
            try {
              const store = useLocationStore.getState();
              await store.useIPLocation();
            } catch (ipError) {
              // IP location also failed
            }
          },
          {
            enableHighAccuracy: false, // Use cached location for performance
            timeout: 3000, // Even faster timeout to get to IP fallback quicker
            maximumAge: 10 * 60 * 1000, // Use fresher cache (10 minutes)
          },
        );
      }
    };

    // Execute immediately for fastest location detection
    checkLocationPermission();
  }, [
    locationRequested,
    coordinates,
    permissionDenied,
    setCoordinates,
    setLocationRequested,
    setPermissionDenied,
  ]);

  return { coordinates, permissionDenied };
}

export function useJewishTimes() {
  const { coordinates } = useGeolocation();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["zmanim", coordinates?.lat, coordinates?.lng, today],
    enabled: !!coordinates, // Only fetch when we have coordinates
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours in memory
    queryFn: async () => {
      if (!coordinates) {
        return null;
      }
      try {
        // Call our backend proxy route - axiosClient has base URL configured
        const url = `/api/zmanim/${coordinates.lat}/${coordinates.lng}`;
        const response = await axiosClient.get(url);
        return response.data;
      } catch (error) {
        // Error fetching zmanim
        return null;
      }
    },
    refetchInterval: false,
    refetchOnWindowFocus: false, // Optimized: Avoid excessive refetches
    refetchOnMount: false, // Optimized: Use cached data when fresh
  });
}
