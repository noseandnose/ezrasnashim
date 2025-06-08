import { useQuery } from "@tanstack/react-query";

export function useJewishTimes() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: [`/api/times/${today}`],
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
  });
}
