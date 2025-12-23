import { useQuery } from "@tanstack/react-query";
import { getLocalDateString } from "@/lib/dateUtils";

interface Message {
  id: number;
  date: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface Sponsor {
  id: number;
  name: string;
  hebrewName: string | null;
  sponsorshipDate: string;
  inHonorMemoryOf: string | null;
  message: string | null;
  isActive: boolean | null;
  createdAt: string;
}

interface TodaysSpecial {
  id: number;
  fromDate: string;
  untilDate: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  contentEnglish?: string | null;
  contentHebrew?: string | null;
  linkTitle?: string | null;
  url?: string | null;
  createdAt?: string | null;
}

interface HomeSummary {
  message: Message | null;
  sponsor: Sponsor | null;
  todaysSpecial: TodaysSpecial | null;
  errors?: { field: string; error: string }[];
  fetchedAt: string;
}

export function useHomeSummary() {
  const today = getLocalDateString();

  return useQuery<HomeSummary>({
    queryKey: ['/api/home-summary', today],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/home-summary?date=${today}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch home summary');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });
}
