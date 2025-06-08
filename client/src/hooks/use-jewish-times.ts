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
        console.log('Hebcal API response:', data); // Debug log
        console.log('Available times in response:', Object.keys(data.times || {}));
        console.log('MinchaGedolah value:', data.times?.minchaGedolah);
        console.log('All mincha times:', {
          minchaGedola: data.times?.minchaGedola,
          minchaGedolah: data.times?.minchaGedolah,
          minchaKetana: data.times?.minchaKetana
        });
        
        // Get timezone from the response
        const timezone = data.location?.tzid || 'America/New_York';
        
        // Format times to 12-hour format
        const formatTime = (timeStr: string) => {
          if (!timeStr) return '';
          try {
            // Extract time portion from ISO string (e.g., "2025-06-08T20:26:00-04:00")
            const timePart = timeStr.split('T')[1]?.split('-')[0] || '';
            if (!timePart) return '';
            
            const [hours, minutes] = timePart.split(':');
            const hour24 = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);
            
            // Convert to 12-hour format
            const isPM = hour24 >= 12;
            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
            const minuteStr = minute.toString().padStart(2, '0');
            
            return `${hour12}:${minuteStr} ${isPM ? 'PM' : 'AM'}`;
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
        
        console.log('Final formatted times:', formattedTimes);
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
