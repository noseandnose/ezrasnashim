/**
 * Production-safe logger utility (Issue 19)
 * Only logs in development mode to prevent information leakage
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) console.log(...args);
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args);
  },
  
  error: (...args: unknown[]) => {
    // Always log errors (useful for debugging production issues)
    console.error(...args);
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.debug(...args);
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) console.info(...args);
  }
};

export default logger;
