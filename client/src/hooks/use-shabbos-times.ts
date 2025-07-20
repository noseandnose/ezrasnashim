import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "./use-jewish-times";

// This function is no longer used - location names come from API

interface ShabbosTimesResponse {
  title: string;
  date: string;
  items: Array<{
    title: string;
    hebrew?: string;
    category: string;
    date: string;
    time?: string;
  }>;
}

interface ShabbosInfo {
  candleLighting?: string;
  havdalah?: string;
  parsha?: string;
  location: string;
}

export function useShabbosTime() {
  const { coordinates } = useLocationStore();

  console.log('useShabbosTime hook - coordinates:', coordinates);

  return useQuery({
    queryKey: ['shabbos-times', coordinates?.lat, coordinates?.lng],
    queryFn: async () => {
      if (!coordinates) {
        console.log('useShabbosTime: No coordinates, returning null');
        // Return null instead of throwing error - matches useJewishTimes behavior
        return null;
      }

      console.log('useShabbosTime: Fetching for coordinates:', coordinates);
      
      // Use our backend proxy instead of direct Hebcal call to avoid CORS issues
      const response = await fetch(`/api/shabbos/${coordinates.lat}/${coordinates.lng}`);
      
      if (!response.ok) {
        console.error('useShabbosTime: API error:', response.status, response.statusText);
        throw new Error('Failed to fetch Shabbos times');
      }
      
      const data = await response.json();
      console.log('useShabbosTime: Received data:', data);
      
      return data;
    },
    enabled: !!coordinates, // Only fetch when coordinates are available
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });
}

function parseShabbosData(data: ShabbosTimesResponse, location: string): ShabbosInfo {
  const result: ShabbosInfo = {
    location
  };

  data.items.forEach(item => {
    if (item.title.includes("Candle lighting:") && item.date) {
      result.candleLighting = formatTime(item.date);
    } else if (item.title.includes("Havdalah:") && item.date) {
      result.havdalah = formatTime(item.date);
    } else if (item.title.startsWith("Parashat ") || item.title.startsWith("Parashah ")) {
      result.parsha = item.title;
    }
  });

  return result;
}

function formatTime(timeStr: string): string {
  // Parse the time string and convert to 12-hour format
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}