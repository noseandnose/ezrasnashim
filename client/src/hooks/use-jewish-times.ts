import { useQuery } from "@tanstack/react-query";
import { create } from 'zustand';

interface LocationState {
  location: string;
  coordinates: { lat: number; lng: number } | null;
  setLocation: (location: string) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: '',
  coordinates: null,
  setLocation: (location: string) => set({ location }),
  setCoordinates: (coordinates: { lat: number; lng: number }) => set({ coordinates }),
}));

export function useJewishTimes() {
  const { coordinates } = useLocationStore();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [`/api/zmanim`, coordinates?.lat, coordinates?.lng, today],
    queryFn: async () => {
      if (!coordinates) return null;
      
      try {
        const response = await fetch(
          `https://www.hebcal.com/zmanim?cfg=json&lat=${coordinates.lat}&lng=${coordinates.lng}&date=${today}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        const data = await response.json();
        
        // Format times to 12-hour format
        const formatTime = (timeStr: string) => {
          if (!timeStr) return '';
          const date = new Date(timeStr);
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        };

        return {
          sunrise: formatTime(data.times?.sunrise),
          sunset: formatTime(data.times?.sunset),
          candleLighting: formatTime(data.times?.candleLighting),
          havdalah: formatTime(data.times?.havdalah),
          minchaGedolah: formatTime(data.times?.minchaGedolah),
          minchaKetana: formatTime(data.times?.minchaKetana),
          hebrewDate: data.date?.hebrew || '',
          location: data.location?.name || 'Current Location',
        };
      } catch (error) {
        console.error('Error fetching zmanim:', error);
        return null;
      }
    },
    enabled: !!coordinates,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours - more stable
    refetchInterval: false, // Don't auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount after first load
  });
}
