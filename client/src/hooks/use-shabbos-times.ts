import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "./use-jewish-times";
import axiosClient from "../lib/axiosClient";

export function useShabbosTime() {
  const { coordinates } = useLocationStore();

  return useQuery({
    queryKey: ['shabbos-times-v2', coordinates?.lat, coordinates?.lng], // Changed key to force cache refresh
    queryFn: async () => {
      if (!coordinates) {
        // Return null instead of throwing error - matches useJewishTimes behavior
        return null;
      }

      try {
        // Use axios like other hooks for consistency
        const url = `/api/shabbos/${coordinates.lat}/${coordinates.lng}`;
        const response = await axiosClient.get(url);
        return response.data;
      } catch (error) {

        throw error;
      }
    },
    enabled: !!coordinates, // Only fetch when coordinates are available
    staleTime: 1000 * 60 * 60 * 6, // 6 hours
    refetchInterval: 1000 * 60 * 60 * 6, // Refetch every 6 hours
  });
}