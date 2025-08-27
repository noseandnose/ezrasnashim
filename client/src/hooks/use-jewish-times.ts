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
      set({ 
        coordinates: response.data.coordinates,
        location: response.data.location,
        permissionDenied: false 
      });
      return response.data;
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        // Failed to get IP-based location
      }
      throw error;
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
      // If coordinates are already set (manually), don't override with browser permission check
      if (coordinates) {
        return;
      }

      // Check if browser supports permissions API
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            setPermissionDenied(true);
            setLocationRequested(true);
            return;
          }
        } catch (err) {
          // Could not check permission
        }
      }

      if (!locationRequested && !coordinates && !permissionDenied) {
        setLocationRequested(true);

        if (!navigator.geolocation) {
          setPermissionDenied(true);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoordinates({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              // User denied location permission
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              // Location unavailable
            } else if (error.code === error.TIMEOUT) {
              // Location request timeout
            }
            setPermissionDenied(true);
            // Don't set fallback coordinates - require accurate location
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0, // Always get fresh location
          },
        );
      }
    };

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
    enabled: !!coordinates, // Only fetch when we have coordinates
    staleTime: 1000 * 60 * 60, // Increased to 1 hour (zmanim don't change frequently)
    refetchInterval: false,
    refetchOnWindowFocus: false, // Optimized: Avoid excessive refetches
    refetchOnMount: false, // Optimized: Use cached data when fresh
  });
}
