import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "./use-jewish-times";

// Helper function to get location name from coordinates
function getLocationName(lat: number, lng: number): string {
  // Use intelligent coordinate-based location names
  if (lat >= 31.7 && lat <= 31.8 && lng >= 35.0 && lng <= 35.1) {
    return 'Bet Shemesh, Israel';
  } else if (lat >= 31.7 && lat <= 31.8 && lng >= 35.1 && lng <= 35.3) {
    return 'Jerusalem, Israel';
  } else if (lat >= 32.0 && lat <= 32.1 && lng >= 34.7 && lng <= 34.8) {
    return 'Tel Aviv, Israel';
  } else if (lat >= 40.7 && lat <= 40.8 && lng >= -74.1 && lng <= -74.0) {
    return 'New York City, NY';
  } else if (lat >= 34.0 && lat <= 34.1 && lng >= -118.3 && lng <= -118.2) {
    return 'Los Angeles, CA';
  } else {
    // General region-based fallback
    if (lat >= 29 && lat <= 33.5 && lng >= 34 && lng <= 36) {
      return 'Israel';
    } else if (lng >= -125 && lng <= -66) {
      return 'United States';
    } else if (lng >= -10 && lng <= 30) {
      return 'Europe';
    } else {
      return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
    }
  }
}

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
        // No location available, return null to show location prompt
        return null;
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
      // Use the location name from our zmanim API for consistency
      const locationName = zmanimData.location || getLocationName(coordinates.lat, coordinates.lng);
      return parseShabbosData(data, locationName);
    },
    enabled: true, // Always fetch, even without coordinates
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