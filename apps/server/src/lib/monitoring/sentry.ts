import * as Sentry from "@sentry/bun";
import { env } from '../env';

/**
 * Initializes Sentry for the Bun server.
 */
export const initSentry = () => {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: env.NODE_ENV,
  });
};

/**
 * Captures an exception with additional context.
 */
export const captureException = (error: any, context?: any) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Adds a breadcrumb for future error reports.
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

export default Sentry;
