import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance for server-side API calls
const serverAxiosClient = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Ezras-Nashim/1.0'
  },
});

// Request interceptor for logging
serverAxiosClient.interceptors.request.use(
  (config) => {
    const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    console.log(`[Server API Request] ${config.method?.toUpperCase()} ${url}`);
    return config;
  },
  (error) => {
    console.error('[Server API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
serverAxiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[Server API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();
    
    console.error(`[Server API Error] ${error.response?.status || 'Unknown'} ${method} ${url}`);
    console.error('Server API Error details:', error.message);
    
    return Promise.reject(error);
  }
);

export default serverAxiosClient;