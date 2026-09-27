import * as Sentry from '@sentry/bun';

// Call sites use the pino argument order: logger.info({ bindings }, 'message').
const LEVELS = { silent: 10, error: 10, warn: 20, info: 30, debug: 40, trace: 50 } as const;

// 'silent' still lets error/fatal through: the ~96 raw console.error() call sites bypass
// this module anyway, so a truly quiet mode was never achievable, and swallowing the
// logger's own error reports would hide real failures in dev.
const configured = (process.env.LOG_LEVEL ?? 'info').trim().toLowerCase();
const threshold = LEVELS[configured as keyof typeof LEVELS] ?? LEVELS.info;

if (configured !== 'silent' && !(configured in LEVELS)) {
  console.warn(`[LOGGER] Unknown LOG_LEVEL "${configured}" — using "info". Valid: silent, error, warn, info, debug, trace`);
}

const emit = (rank: number, prefix: string, write: (...a: any[]) => void, msg: any, args: any[]) => {
  if (rank <= threshold) write(prefix, msg, ...args);
};

export const logger = {
  info: (msg: any, ...args: any[]) => emit(LEVELS.info, '[INFO]', console.log, msg, args),
  debug: (msg: any, ...args: any[]) => emit(LEVELS.debug, '[DEBUG]', console.debug, msg, args),
  error: (msg: any, ...args: any[]) => emit(LEVELS.error, '[ERROR]', console.error, msg, args),
  warn: (msg: any, ...args: any[]) => emit(LEVELS.warn, '[WARN]', console.warn, msg, args),
  trace: (msg: any, ...args: any[]) => emit(LEVELS.trace, '[TRACE]', console.debug, msg, args),
  fatal: (msg: any, ...args: any[]) => emit(LEVELS.error, '[FATAL]', console.error, msg, args),
  child: (bindings?: any) => logger, // Maintain compatibility with pino child calls
};

/**
 * Production-grade helper that logs an error to both Pino and Sentry.
 */
export const logError = (error: Error | string, context: Record<string, any> = {}) => {
  const message = error instanceof Error ? error.message : error;
  logger.error({ ...context, error: message }, `❌ ${message}`);

  Sentry.captureException(error, {
    extra: context
  });
};

export default logger;
