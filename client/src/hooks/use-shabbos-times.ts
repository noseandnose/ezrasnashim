import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "./use-jewish-times";
import axiosClient from "../lib/axiosClient";

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
      
      try {
        // Use axios like other hooks for consistency
        const url = `/api/shabbos/${coordinates.lat}/${coordinates.lng}`;
        console.log('useShabbosTime: Making request to:', url);
        
        const response = await axiosClient.get(url);
        console.log('useShabbosTime: Received data:', response.data);
        
        return response.data;
      } catch (error) {
        console.error('useShabbosTime: Error in axios request:', error);
        // Log response data if available
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          console.error('useShabbosTime: Error response status:', axiosError.response?.status);
          console.error('useShabbosTime: Error response data:', axiosError.response?.data);
        }
        throw error;
      }
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