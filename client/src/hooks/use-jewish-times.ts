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
  const { geonameid, coordinates } = useLocationStore();
  // Use actual current date
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [`/api/zmanim`, geonameid, today],
    queryFn: async () => {
      if (!geonameid) return null;
      
      try {
        // Use our backend API that returns adjusted halachic times
        const response = await fetch(`/api/zmanim/${geonameid}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching zmanim:', error);
        return null;
      }
    },
    enabled: !!geonameid,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours - more stable
    refetchInterval: false, // Don't auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount after first load
  });
}
