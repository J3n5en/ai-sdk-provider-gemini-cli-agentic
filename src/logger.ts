import type { Logger } from './types.js';

/**
 * Default logger that uses console with level tags.
 */
const defaultLogger: Logger = {
  debug: (message: string) => console.debug(`[DEBUG] ${message}`),
  info: (message: string) => console.info(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
};

/**
 * No-op logger that discards all messages.
 */
const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * Gets the appropriate logger based on configuration.
 */
export function getLogger(logger: Logger | false | undefined): Logger {
  if (logger === false) {
    return noopLogger;
  }
  if (logger === undefined) {
    return defaultLogger;
  }
  return logger;
}

/**
 * Creates a verbose-aware logger that only logs debug/info when verbose is enabled.
 */
export function createVerboseLogger(logger: Logger, verbose: boolean = false): Logger {
  if (verbose) {
    return logger;
  }
  return {
    debug: () => {},
    info: () => {},
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
  };
}
