/**
 * Production-safe logging utility
 * Only logs in development mode, provides clean production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(context = 'App', logLevel = LOG_LEVELS.INFO) {
    this.context = context;
    this.logLevel = logLevel;
  }

  // Error logging (always shown)
  error(message, ...args) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      console.error(`[${this.context}] ERROR:`, message, ...args);
    }
  }

  // Warning logging (shown in development and when explicitly enabled)
  warn(message, ...args) {
    if (isDevelopment && this.logLevel >= LOG_LEVELS.WARN) {
      console.warn(`[${this.context}] WARN:`, message, ...args);
    }
  }

  // Info logging (development only)
  info(message, ...args) {
    if (isDevelopment && this.logLevel >= LOG_LEVELS.INFO) {
      console.info(`[${this.context}] INFO:`, message, ...args);
    }
  }

  // Debug logging (development only)
  debug(message, ...args) {
    if (isDevelopment && this.logLevel >= LOG_LEVELS.DEBUG) {
      console.log(`[${this.context}] DEBUG:`, message, ...args);
    }
  }

  // API call logging
  apiCall(method, url, data) {
    if (isDevelopment) {
      console.log(`[${this.context}] API ${method.toUpperCase()}:`, url, data ? { data } : '');
    }
  }

  // API response logging
  apiResponse(method, url, status, data) {
    if (isDevelopment) {
      console.log(`[${this.context}] API ${method.toUpperCase()} ${status}:`, url, data);
    }
  }

  // Performance logging
  time(label) {
    if (isDevelopment) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }
}

// Create context-specific loggers
export const serviceLogger = new Logger('Service');
export const componentLogger = new Logger('Component');
export const apiLogger = new Logger('API');
export const performanceLogger = new Logger('Performance');

// Default logger
export const logger = new Logger();

// Utility function to create context-specific logger
export const createLogger = (context, logLevel = LOG_LEVELS.INFO) => {
  return new Logger(context, logLevel);
};

export { LOG_LEVELS };
export default Logger;
