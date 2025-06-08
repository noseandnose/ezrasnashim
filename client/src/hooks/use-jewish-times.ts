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
  // Use actual current date (December 8, 2024)
  const today = '2024-12-08';

  return useQuery({
    queryKey: [`/api/zmanim`, geonameid, today],
    queryFn: async () => {
      if (!geonameid) return null;
      
      try {
        // Use coordinates for sunset API, fallback to NYC if not available
        const lat = coordinates?.lat || 40.7128;
        const lng = coordinates?.lng || -74.0060;
        
        // Fetch both Hebcal halachic times and astronomical sunset
        const [hebcalResponse, sunsetResponse] = await Promise.all([
          fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${geonameid}&date=${today}`),
          fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${today}&formatted=0`)
        ]);
        
        if (!hebcalResponse.ok || !sunsetResponse.ok) {
          throw new Error('Failed to fetch zmanim data');
        }
        
        const hebcalData = await hebcalResponse.json();
        const sunsetData = await sunsetResponse.json();
        
        // Get timezone from the response
        const timezone = hebcalData.location?.tzid || 'America/New_York';
        
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
          sunrise: formatTime(hebcalData.times?.sunrise),
          sunset: formatTime(sunsetData.results?.sunset), // Use astronomical sunset for Shkia
          candleLighting: formatTime(hebcalData.times?.candleLighting),
          havdalah: formatTime(hebcalData.times?.havdalah),
          minchaGedolah: formatTime(hebcalData.times?.minchaGedola),
          minchaKetana: formatTime(hebcalData.times?.minchaKetana),
          tzaitHakochavim: formatTime(hebcalData.times?.sunset), // Keep this as stars out
          hebrewDate: hebcalData.date?.hebrew || '',
          location: hebcalData.location?.title || 'Current Location',
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
