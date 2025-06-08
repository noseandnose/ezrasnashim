import { useQuery } from "@tanstack/react-query";
import { create } from 'zustand';

interface LocationState {
  location: string;
  geonameid: string | null;
  coordinates: { lat: number; lng: number } | null;
  setLocation: (location: string) => void;
  setGeonameid: (id: string) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: '',
  geonameid: null,
  coordinates: null,
  setLocation: (location: string) => set({ location }),
  setGeonameid: (geonameid: string) => set({ geonameid }),
  setCoordinates: (coordinates: { lat: number; lng: number }) => set({ coordinates }),
}));

export function useJewishTimes() {
  const { geonameid, setGeonameid } = useLocationStore();
  const today = new Date().toISOString().split('T')[0];
  
  // Set default location if none exists
  const effectiveGeonameid = geonameid || "5128581"; // Default to NYC
  
  // Set the default location in store if it's not set
  if (!geonameid && effectiveGeonameid) {
    setGeonameid(effectiveGeonameid);
  }

  return useQuery({
    queryKey: [`/api/zmanim`, effectiveGeonameid, today],
    queryFn: async () => {
      try {
        // Always use effective geonameid (with fallback)
        const response = await fetch(`/api/zmanim/${effectiveGeonameid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching zmanim:', error);
        return null;
      }
    },
    enabled: true, // Always enabled with default location
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
