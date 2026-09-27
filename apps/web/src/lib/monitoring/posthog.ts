import posthog from 'posthog-js';

import { env } from '../env';

if (typeof window !== 'undefined') {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_performance: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
      },
    },
  });
}

/**
 * Syncs user identity with PostHog.
 */
export const identifyInPostHog = (user: {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string | null;
}) => {
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  });
};

/**
 * Resets PostHog identity on logout.
 */
export const resetPostHog = () => {
  posthog.reset();
};

export default posthog;

