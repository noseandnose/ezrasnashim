/**
 * Deferred location hooks for progressive loading
 * These wrap the original hooks but allow conditional loading
 */

import { useLocationStore } from "./use-jewish-times";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../lib/axiosClient";
import { useEffect } from "react";
import { PermissionManager } from "@/lib/permission-manager";

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

      // Check permission state from PermissionManager
      const locationState = PermissionManager.getLocationState();
      
      // Only set denied if actually denied, not just in cooldown
      if (locationState.state === 'denied') {
        setPermissionDenied(true);
        setLocationRequested(true);
        return;
      }

      // If in cooldown or dismissed, don't prompt but don't mark as denied
      if (!PermissionManager.shouldPromptForLocation()) {
        setLocationRequested(true);
        return;
      }

      if (!locationRequested && !coordinates && !permissionDenied) {
        setLocationRequested(true);

        if (!navigator.geolocation) {
          setPermissionDenied(true);
          PermissionManager.markLocationDismissed();
          return;
        }
        
        // Use PermissionManager to request location
        const result = await PermissionManager.requestLocationPermission();
        
        if (result.success && result.coordinates) {
          setCoordinates(result.coordinates);
          
          // Cache the location
          localStorage.setItem('user-location', JSON.stringify(result.coordinates));
          localStorage.setItem('user-location-time', Date.now().toString());
        } else {
          setPermissionDenied(true);
        }
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