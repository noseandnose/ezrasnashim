import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/hooks/use-jewish-times";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
}

const weatherCodeToEmoji: Record<number, string> = {
  0: "☀️",   // Clear sky
  1: "🌤️",   // Mainly clear
  2: "⛅",   // Partly cloudy
  3: "☁️",   // Overcast
  45: "🌫️",  // Fog
  48: "🌫️",  // Depositing rime fog
  51: "🌧️",  // Light drizzle
  53: "🌧️",  // Moderate drizzle
  55: "🌧️",  // Dense drizzle
  56: "🌧️",  // Light freezing drizzle
  57: "🌧️",  // Dense freezing drizzle
  61: "🌧️",  // Slight rain
  63: "🌧️",  // Moderate rain
  65: "🌧️",  // Heavy rain
  66: "🌧️",  // Light freezing rain
  67: "🌧️",  // Heavy freezing rain
  71: "🌨️",  // Slight snow
  73: "🌨️",  // Moderate snow
  75: "🌨️",  // Heavy snow
  77: "🌨️",  // Snow grains
  80: "🌦️",  // Slight rain showers
  81: "🌦️",  // Moderate rain showers
  82: "🌦️",  // Violent rain showers
  85: "🌨️",  // Slight snow showers
  86: "🌨️",  // Heavy snow showers
  95: "⛈️",  // Thunderstorm
  96: "⛈️",  // Thunderstorm with slight hail
  99: "⛈️",  // Thunderstorm with heavy hail
};

export function getWeatherEmoji(code: number): string {
  return weatherCodeToEmoji[code] || "🌡️";
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&temperature_unit=celsius`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    };
  } catch {
    return null;
  }
}

export function useWeather() {
  const { coordinates } = useGeolocation();
  
  return useQuery({
    queryKey: ['/weather', coordinates?.lat, coordinates?.lng],
    queryFn: () => fetchWeather(coordinates!.lat, coordinates!.lng),
    enabled: !!coordinates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
