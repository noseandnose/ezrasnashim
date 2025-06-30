import axios, { AxiosResponse, AxiosError } from 'axios';

// Determine the correct base URL for API calls
function getBaseURL() {
  // For Replit environment, construct the backend URL using the domain with port 5000
  if (window.location.hostname.includes('replit.dev')) {
    // In Replit, the backend runs on port 5000 with the same domain
    const hostname = window.location.hostname;
    return `https://${hostname}:5000`;
  }
  
  // For local development, use environment variable or default to localhost:5000
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
    
    console.error(`[API Error] ${error.response?.status || 'Unknown'} ${method} ${url}`);
    console.error('Error details:', error.toJSON ? error.toJSON() : error);
    
    return Promise.reject(error);
  }
);

export default axiosClient;