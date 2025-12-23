/**
 * Logger utility for development and production
 * Automatically disables console.log and console.warn in production
 * console.error is always enabled for critical errors
 */

const isDev = import.meta.env.DEV;

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

