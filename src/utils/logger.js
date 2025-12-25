/**
 * Logger utility for development and production
 * Automatically disables console.log and console.warn in production
 * console.error is always enabled for critical errors
 * 
 * Note: In usePortfolioDocument.js, we use a logOnce function for listener
 * start/cleanup messages to reduce console spam in development.
 */

const isDev = import.meta.env.DEV;

// Cache for throttling repeated log messages (optional, can be used if needed)
const logCache = new Map();
const LOG_THROTTLE_MS = 1000; // Throttle duplicate messages within 1 second

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always enabled)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

export default logger;

