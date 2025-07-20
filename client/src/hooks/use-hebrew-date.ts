import { useQuery } from "@tanstack/react-query";
import { create } from 'zustand';

interface HebrewDateState {
  hebrewDate: string;
  setHebrewDate: (date: string) => void;
}

export const useHebrewDateStore = create<HebrewDateState>((set) => ({
  hebrewDate: '',
  setHebrewDate: (hebrewDate: string) => set({ hebrewDate }),
}));

export function useHebrewDate() {
  const { hebrewDate, setHebrewDate } = useHebrewDateStore();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [`/api/hebrew-date`, today],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://www.hebcal.com/converter?cfg=json&date=${today}&g2h=1&strict=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch Hebrew date');
        }
        
        const data = await response.json();
        const hebrewDateStr = data.hebrew || '';
        
        // Store in zustand for persistence
        setHebrewDate(hebrewDateStr);
        
        return hebrewDateStr;
      } catch (error: unknown) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error fetching Hebrew date:', error);
        }
        return hebrewDate; // Return stored value if fetch fails
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Only fetch once per day
    initialData: hebrewDate || undefined,
  });
}

// Enhanced Hebrew date that respects shkia timing
export function useHebrewDateWithShkia(shkiaTime?: string) {
  // Parse shkia time and determine if we should use next day
  const getDateToUse = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (shkiaTime) {
      try {
        const [time, period] = shkiaTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let shkiaHours = hours;
        if (period === 'PM' && hours !== 12) shkiaHours += 12;
        if (period === 'AM' && hours === 12) shkiaHours = 0;
        
        // Create shkia date for today
        const shkiaDate = new Date(now);
        shkiaDate.setHours(shkiaHours, minutes, 0, 0);
        
        // If current time is after shkia, use tomorrow's date
        if (now > shkiaDate) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toISOString().split('T')[0];
        }
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error parsing shkia time:', error);
        }
      }
    }
    
    return today;
  };
  
  const dateToUse = getDateToUse();

  return useQuery({
    queryKey: [`/api/hebrew-date-shkia`, dateToUse],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://www.hebcal.com/converter?cfg=json&date=${dateToUse}&g2h=1&strict=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch Hebrew date');
        }
        
        const data = await response.json();
        return data.hebrew || '';
      } catch (error: unknown) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error fetching Hebrew date:', error);
        }
        return '';
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    enabled: !!shkiaTime, // Only fetch when we have shkia time
  });
}