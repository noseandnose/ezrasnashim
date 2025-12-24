import { useQuery } from "@tanstack/react-query";
import type { Campaign } from "@shared/schema";

interface CommunityImpact {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

interface TzedakaSummary {
  campaign: Campaign | null;
  communityImpact: CommunityImpact | null;
  errors?: Record<string, boolean>;
  fetchedAt: string;
}

function getLocalDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function useTzedakaSummary() {
  const today = getLocalDateString();

  return useQuery<TzedakaSummary>({
    queryKey: ['/api/tzedaka-summary', today],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tzedaka-summary?date=${today}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tzedaka summary');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
