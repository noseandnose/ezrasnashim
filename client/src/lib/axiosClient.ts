import axios, { AxiosResponse, AxiosError } from 'axios';
// import { console } from './production-logger';

// Determine the correct base URL for API calls
function getBaseURL() {
  // Always use VITE_API_URL if it's set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback for Replit environment if VITE_API_URL is not set
  if (window.location.hostname.includes('replit.dev')) {
    // In Replit, the backend runs on port 5000 with the same domain
    const hostname = window.location.hostname;
    return `https://${hostname}:5000`;
  }
  
  // Default for local development
  return 'http://localhost:5000';
}

// Create axios instance with default config
const axiosClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
axiosClient.interceptors.request.use(
  (config) => {
    const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log(`[API Request] ${config.method?.toUpperCase()} ${url}`);
    
    if (config.data) {
      console.log(`[API Request Data]`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    if (response.data) {
      console.log(`[API Response Data]`, response.data);
    }
    
    return response;
  },
  (error: AxiosError) => {
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    const status = error.response?.status;
    
    // Don't log 404 errors for messages endpoint as this is expected when no message exists
    const isMessageEndpoint = url?.includes('/api/messages/');
    const is404Error = status === 404;
    
    if (isMessageEndpoint && is404Error) {
      // Silently handle expected 404s for missing messages
      return Promise.reject(error);
    }
    
    console.error(`[API Error] ${status || 'Unknown'} ${method} ${url}`);
    console.error('Error details:', error.toJSON ? error.toJSON() : error);
    
    return Promise.reject(error);
  }
);

export default axiosClient;