import { useQuery } from "@tanstack/react-query";
import { getLocalDateString } from "@/lib/dateUtils";
import type { 
  TorahClass, 
  DailyHalacha, 
  DailyChizuk, 
  DailyEmuna, 
  FeaturedContent, 
  ParshaVort 
} from "@shared/schema";

interface PirkeiAvotFormatted {
  text: string;
  chapter: number;
  source: string;
}

interface TorahSummaryErrors {
  halacha?: boolean;
  chizuk?: boolean;
  emuna?: boolean;
  featured?: boolean;
  pirkeiAvot?: boolean;
  parshaVorts?: boolean;
  torahClasses?: boolean;
}

interface TorahSummary {
  halacha: DailyHalacha | null;
  chizuk: DailyChizuk | null;
  emuna: DailyEmuna | null;
  featured: FeaturedContent | null;
  pirkeiAvot: PirkeiAvotFormatted | null;
  parshaVorts: ParshaVort[];
  torahClasses: TorahClass[];
  errors?: TorahSummaryErrors;
  fetchedAt: string;
}

export function useTorahSummary() {
  const today = getLocalDateString();

  return useQuery<TorahSummary>({
    queryKey: ['/api/torah-summary', today],
    queryFn: async () => {
      const response = await fetch(`/api/torah-summary?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch torah summary');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
