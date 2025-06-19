import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "./use-jewish-times";

// Helper function to get location name from coordinates
function getLocationName(lat: number, lng: number): string {
  // Map coordinates to nearest major city
  const cities = [
    { name: "New York City, NY", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
    { name: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
    { name: "Miami, FL", lat: 25.7617, lng: -80.1918 },
    { name: "Boston, MA", lat: 42.3601, lng: -71.0589 },
    { name: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
    { name: "Brooklyn, NY", lat: 40.6782, lng: -73.9442 },
    { name: "Jerusalem, Israel", lat: 31.7683, lng: 35.2137 },
    { name: "Tel Aviv, Israel", lat: 32.0853, lng: 34.7818 },
    { name: "London, UK", lat: 51.5074, lng: -0.1278 },
    { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832 }
  ];
  
  let closestCity = cities[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }
  
  return closestCity.name;
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
        // Use default Jerusalem coordinates as fallback
        const lat = 31.7683;
        const lng = 35.2137;
        
        const response = await fetch(
          `https://www.hebcal.com/shabbat/?cfg=json&latitude=${lat}&longitude=${lng}&M=on`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch Shabbos times');
        }
        
        const data: ShabbosTimesResponse = await response.json();
        return parseShabbosData(data, "Jerusalem");
      }

      const response = await fetch(
        `https://www.hebcal.com/shabbat/?cfg=json&latitude=${coordinates.lat}&longitude=${coordinates.lng}&M=on`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Shabbos times');
      }
      
      const data: ShabbosTimesResponse = await response.json();
      // Extract location from API response or determine from coordinates
      let locationName = "Your Location";
      if (data.title) {
        locationName = data.title.replace(/^Shabbat times for /, '');
      } else {
        locationName = getLocationName(coordinates.lat, coordinates.lng);
      }
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