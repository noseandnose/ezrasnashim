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
  const today = '2024-12-08';

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
      } catch (error) {
        console.error('Error fetching Hebrew date:', error);
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