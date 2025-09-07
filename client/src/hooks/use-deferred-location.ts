/**
 * Deferred location hooks for progressive loading
 * These wrap the original hooks but allow conditional loading
 */

import { useLocationStore } from "./use-jewish-times";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../lib/axiosClient";
import { useEffect } from "react";

// Deferred version of useGeolocation that can be conditionally enabled
export function useDeferredGeolocation(enabled: boolean = true) {
  const {
    coordinates,
    locationRequested,
    permissionDenied,
    setCoordinates,
    setLocationRequested,
    setPermissionDenied,
  } = useLocationStore();

  useEffect(() => {
    if (!enabled) return;

    const checkLocationPermission = async () => {
      // If coordinates are already set, we're done
      if (coordinates) return;
      
      // Try to initialize from cache first
      const store = useLocationStore.getState();
      if (store.initializeFromCache()) {
        return; // Successfully loaded from cache
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
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCoordinates(coords);
            
            // Cache the location
            localStorage.setItem('user-location', JSON.stringify(coords));
            localStorage.setItem('user-location-time', Date.now().toString());
          },
          (error) => {
            setPermissionDenied(true);
          },
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60 * 60 * 1000, // 1-hour cache
          },
        );
      }
    };

    // Delay check if not critical
    const timeoutId = setTimeout(checkLocationPermission, enabled ? 100 : 2000);
    return () => clearTimeout(timeoutId);
  }, [
    enabled,
    locationRequested,
    coordinates,
    permissionDenied,
    setCoordinates,
    setLocationRequested,
    setPermissionDenied,
  ]);

  return { coordinates, permissionDenied };
}

// Deferred version of useJewishTimes
export function useDeferredJewishTimes(enabled: boolean = true) {
  const { coordinates } = useDeferredGeolocation(enabled);
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["zmanim", coordinates?.lat, coordinates?.lng, today],
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours in memory
    queryFn: async () => {
      if (!coordinates) {
        return null;
      }
      try {
        const url = `/api/zmanim/${coordinates.lat}/${coordinates.lng}`;
        const response = await axiosClient.get(url);
        return response.data;
      } catch (error) {
        return null;
      }
    },
    enabled: enabled && !!coordinates, // Only fetch when enabled and have coordinates
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}