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
      // Only use default queryFn for API endpoints
      queryFn: async (context) => {
        const key = context.queryKey[0] as string;
        // Skip non-API keys - these should have their own queryFn
        if (!key.startsWith('/api/') && !key.startsWith('http')) {
          // Return empty data for non-API keys to prevent errors
          // The actual query should have its own queryFn that will override this
          return null;
        }
        
        try {
          return await getQueryFn({ on401: "throw" })(context);
        } catch (error: any) {
          // Log error for debugging but let components handle display
          const status = error?.response?.status;
          if (status >= 500) {
            console.error(`Server error fetching ${key}:`, error);
          } else if (status === 404) {
            console.warn(`Content not found at ${key}`);
          } else if (status === 429) {
            console.warn(`Rate limited at ${key}`);
          }
          throw error;
        }
      },
      staleTime: 15 * 60 * 1000, // 15 minutes for better performance
      gcTime: 60 * 60 * 1000, // 1 hour in memory
      refetchOnMount: false, // Only refetch when stale or invalidated
      refetchOnWindowFocus: true, // Refetch when app resumes to prevent stale state
      retry: (failureCount, error) => {
        // Don't retry on 404s, 401s, or any 4xx client errors
        if (error && typeof error === 'object' && 'response' in error) {
          const status = (error as any).response?.status;
          if (status >= 400 && status < 500) return false;
        }
        // Increase retries to 3 for better reliability with database connections
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff: 1s, 2s, 4s...
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
      onError: (error: any) => {
        // Show toast for mutation errors (user-initiated actions)
        console.error('Mutation error:', error);
        // Dynamically import toast to avoid circular dependency
        import('@/hooks/use-toast').then(({ toast }) => {
          const status = error?.response?.status;
          let message = "Please check your connection and try again.";
          
          if (status === 500 || status === 502 || status === 503) {
            message = "Server is temporarily unavailable. Please try again later.";
          } else if (status === 429) {
            message = "Too many requests. Please wait a moment and try again.";
          } else if (status === 404) {
            message = "The requested content could not be found.";
          }
          
          toast({
            title: "Action failed",
            description: message,
            variant: "destructive",
          });
        });
      },
    },
  },
});