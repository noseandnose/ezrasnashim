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
  const { geonameid } = useLocationStore();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [`/api/zmanim`, geonameid, today],
    queryFn: async () => {
      if (!geonameid) return null;
      
      try {
        const response = await fetch(
          `https://www.hebcal.com/zmanim?cfg=json&geonameid=${geonameid}&date=${today}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        const data = await response.json();
        // Remove debug logs for production
        
        // Get timezone from the response
        const timezone = data.location?.tzid || 'America/New_York';
        
        // Format times to 12-hour format - properly handle timezone
        const formatTime = (timeStr: string) => {
          if (!timeStr) return '';
          try {
            // Parse the full ISO 8601 datetime string with timezone
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return '';
            
            // Format using the location's timezone
            return date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true,
              timeZone: timezone
            });
          } catch (error) {
            console.error('Time formatting error for', timeStr, ':', error);
            return '';
          }
        };

        const formattedTimes = {
          sunrise: formatTime(data.times?.sunrise),
          sunset: formatTime(data.times?.sunset),
          candleLighting: formatTime(data.times?.candleLighting),
          havdalah: formatTime(data.times?.havdalah),
          minchaGedolah: formatTime(data.times?.minchaGedola),
          minchaKetana: formatTime(data.times?.minchaKetana),
          hebrewDate: data.date?.hebrew || '',
          location: data.location?.title || 'Current Location',
        };
        
        // Times formatted successfully
        return formattedTimes;
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
