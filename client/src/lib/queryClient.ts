import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axiosClient from "./axiosClient";
import { AxiosResponse } from "axios";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<AxiosResponse> {
  const response = await axiosClient({
    method,
    url,
    data,
  });

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      let url = queryKey[0] as string;
      
      // If there are additional parameters in the queryKey, append them to the URL
      if (queryKey.length > 1) {
        const params = queryKey.slice(1);
        if (params.length > 0) {
          url = `${url}/${params.join('/')}`;
        }
      }
      
      // Check if URL already includes full baseURL to avoid doubling
      const isFullUrl = url.startsWith('http');
      const requestConfig = isFullUrl ? { baseURL: '' } : {};
      
      const response = await axiosClient.get(url, requestConfig);
      return response.data;
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 5 * 60 * 1000, // 5 minutes default cache
      gcTime: 15 * 60 * 1000, // 15 minutes in memory
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Optimized: Only refetch when stale or invalidated
      staleTime: 15 * 60 * 1000, // Increased to 15 minutes for better performance
      gcTime: 60 * 60 * 1000, // 1 hour (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 404s, 401s, or any 4xx client errors
        if (error && typeof error === 'object' && 'response' in error) {
          const status = (error as any).response?.status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 1; // Reduced to 1 retry for faster failure
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retries
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors (4xx)
        if (error && typeof error === 'object' && 'response' in error) {
          const status = (error as any).response?.status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 1; // Retry max 1 time for mutations
      },
      networkMode: 'online',
    },
  },
});
