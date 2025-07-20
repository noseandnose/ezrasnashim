// Production-safe logging utilities

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// For server-side logging
export const serverLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, but format differently for production
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    } else {
      // In production, log errors more concisely
      console.error('Error:', args[0]);
    }
  }
};