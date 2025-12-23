import { useQuery } from "@tanstack/react-query";

interface GlobalStats {
  totalRead: number;
  booksCompleted: number;
  uniqueReaders: number;
}

interface TefillaStats {
  total: number;
  globalStats: GlobalStats | null;
  errors?: Record<string, boolean>;
  fetchedAt: string;
}

export function useTefillaStats() {
  return useQuery<TefillaStats>({
    queryKey: ['/api/tefilla-stats'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tefilla-stats`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch tefilla stats');
      }
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });
}
