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

  return useQuery({
    queryKey: ['shabbos-times-v3', coordinates?.lat, coordinates?.lng], // Changed key to force cache refresh
    queryFn: async () => {
      if (!coordinates) {
        // Return null instead of throwing error - matches useJewishTimes behavior
        return null;
      }

      try {
        // Use axios like other hooks for consistency
        const url = `/api/shabbos/${coordinates.lat}/${coordinates.lng}`;
        console.log('Fetching Shabbos times from:', url);
        const response = await axiosClient.get(url);
        console.log('Shabbos API Response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching Shabbos times:', error);
        throw error;
      }
    },
    enabled: !!coordinates, // Only fetch when coordinates are available
    staleTime: 0, // Always fetch fresh data for debugging
    refetchInterval: 1000 * 60 * 60 * 6, // Refetch every 6 hours
    cacheTime: 0 // Don't cache for debugging
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