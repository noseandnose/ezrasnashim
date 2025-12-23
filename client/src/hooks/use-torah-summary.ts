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

  const query = useQuery<TorahSummary>({
    queryKey: ['/api/torah-summary', today],
    queryFn: async () => {
      console.log('[useTorahSummary] Fetching torah summary for date:', today);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/torah-summary?date=${today}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch torah summary');
      }
      const data = await response.json();
      console.log('[useTorahSummary] Received data:', { 
        hasHalacha: !!data.halacha, 
        hasChizuk: !!data.chizuk,
        hasEmuna: !!data.emuna,
        hasPirkeiAvot: !!data.pirkeiAvot,
        pirkeiAvotText: data.pirkeiAvot?.text?.substring(0, 50)
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  console.log('[useTorahSummary] Query state:', { 
    isLoading: query.isLoading, 
    isError: query.isError,
    hasData: !!query.data,
    pirkeiAvot: query.data?.pirkeiAvot?.text?.substring(0, 30)
  });

  return query;
}
