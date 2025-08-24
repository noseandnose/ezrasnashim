// Production-safe logging utility
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      logger.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      logger.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      logger.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      logger.debug(...args);
    }
  }
};

// Export as default for easier imports
export default logger;