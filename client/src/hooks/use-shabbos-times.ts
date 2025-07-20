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

  return useQuery({
    queryKey: ['shabbos-times', coordinates?.lat, coordinates?.lng],
    queryFn: async () => {
      if (!coordinates) {
        // No location available, throw error to show loading state
        throw new Error('Location required');
      }

      // Use the same zmanim API for consistent location names
      const zmanimResponse = await fetch(`/api/zmanim/${coordinates.lat}/${coordinates.lng}`);
      const zmanimData = await zmanimResponse.json();
      
      const response = await fetch(
        `https://www.hebcal.com/shabbat/?cfg=json&latitude=${coordinates.lat}&longitude=${coordinates.lng}&M=on`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Shabbos times');
      }
      
      const data: ShabbosTimesResponse = await response.json();
      // Use the location name from our zmanim API - no fallbacks
      if (!zmanimData.location) {
        throw new Error('Location data unavailable');
      }
      return parseShabbosData(data, zmanimData.location);
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