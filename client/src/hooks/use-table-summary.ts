import { useQuery } from "@tanstack/react-query";
import type { LifeClass } from "@shared/schema";

interface GiftOfChatzos {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  contentEnglish?: string;
  contentHebrew?: string;
  linkTitle?: string;
  url?: string;
  thankYouMessage?: string;
}

interface TableSummary {
  giftOfChatzos: GiftOfChatzos | null;
  lifeClasses: LifeClass[];
  inspiration: Record<string, any> | null;
  recipe: Record<string, any> | null;
  shopItems: Record<string, any>[];
  errors?: Record<string, boolean>;
  fetchedAt: string;
}

function getLocalDateString(): string {
  const now = new Date();
  const hours = now.getHours();
  if (hours < 2) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().split('T')[0];
}

export function useTableSummary() {
  const today = getLocalDateString();
  const dayOfWeek = new Date().getDay();

  return useQuery<TableSummary>({
    queryKey: ['/api/table-summary', today, dayOfWeek],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/table-summary?date=${today}&dayOfWeek=${dayOfWeek}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch table summary');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
