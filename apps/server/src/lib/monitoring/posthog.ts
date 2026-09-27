import { PostHog } from 'posthog-node';
import { env } from '../env';

export const posthog = new PostHog(
    env.POSTHOG_API_KEY,
    {
        host: env.POSTHOG_HOST
    }
);

/**
 * Captures an error event in PostHog
 */
export const captureError = (error: any, context: { method?: string; path?: string; tenantId?: string | null; reqId?: string }) => {
    posthog.capture({
        distinctId: context.tenantId || context.reqId || 'system',
        event: 'server_error',
        properties: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ...context
        }
    });
};

// Graceful shutdown
process.on('SIGTERM', async () => await posthog.shutdown());
process.on('SIGINT', async () => await posthog.shutdown());

export default posthog;
