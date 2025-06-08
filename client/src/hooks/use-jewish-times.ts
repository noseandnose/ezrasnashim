import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface GeolocationData {
  latitude: number;
  longitude: number;
}

export function useJewishTimes() {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
          // Fallback to New York coordinates
          setLocation({
            latitude: 40.7128,
            longitude: -74.0060,
          });
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      // Fallback to New York coordinates
      setLocation({
        latitude: 40.7128,
        longitude: -74.0060,
      });
    }
  }, []);

  return useQuery({
    queryKey: [`/api/zmanim`, location?.latitude, location?.longitude, today],
    queryFn: async () => {
      if (!location) return null;
      
      const response = await fetch(
        `https://www.hebcal.com/zmanim?cfg=json&lat=${location.latitude}&lng=${location.longitude}&date=${today}`
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
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });
}
