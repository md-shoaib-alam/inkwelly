import * as Sentry from "@sentry/nextjs";

/**
 * Initializes Sentry user identity.
 * Call this whenever the user logs in or the app hydrates with a user.
 */
export const identifyUser = (user: { id: string; email?: string; name?: string; role?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    role: user.role,
  });
};

/**
 * Clears Sentry user identity on logout.
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

