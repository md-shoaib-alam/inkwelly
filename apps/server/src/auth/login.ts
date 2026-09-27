import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import { users, refreshTokens } from '../db/schema';
import { or, eq, and } from 'drizzle-orm';
import { signAccessToken, signRefreshToken, hashToken } from '../lib/jwt';
import { getLoginAttempts, getAccountLoginAttempts, registerFailedLogin, clearLoginAttempts, LOGIN_MAX_ATTEMPTS, LOGIN_IP_MAX_ATTEMPTS } from '../lib/ratelimit';
import { posthog, captureError } from '../lib/monitoring/posthog';
import logger from '../lib/logger';
import { getClientIp } from '../lib/ip';
import { hashPassword, verifyPassword } from '../lib/passwords';

import { v4 as uuidv4 } from 'uuid';

export const loginRoute = new Elysia()
  .derive(({ request }) => {
    const reqId = uuidv4();
    const reqLogger = logger.child({ reqId });
    return { reqId, log: reqLogger };
  })
  .post('/login', async ({ body, request, server, set, log }) => {
    // Without `server`, a request with no x-forwarded-for resolves to the key
    // 'anonymous' and LOGIN_MAX_ATTEMPTS failures lock out the whole deployment.
    const ip = getClientIp(request, server);
    // A school's whole user base shares one NAT address, so the IP budget is
    // deliberately loose and the account budget is what stops stuffing.
    const account = String((body as any)?.email ?? '').trim().toLowerCase();

    const [ipAttempts, accountAttempts] = await Promise.all([
      getLoginAttempts(ip),
      account ? getAccountLoginAttempts(account) : Promise.resolve({ count: 0, retryMinutes: 0 }),
    ]);
    if (ipAttempts.count >= LOGIN_IP_MAX_ATTEMPTS || accountAttempts.count >= LOGIN_MAX_ATTEMPTS) {
      const retryMinutes = Math.max(ipAttempts.retryMinutes, accountAttempts.retryMinutes);
      set.status = 429;
      return { error: `Too many failed attempts. Please try again in ${retryMinutes} minutes.` };
    }

    try {
      const { email, password } = body;
      if (!email || !password) {
        set.status = 400;
        return { error: 'Email and password are required' };
      }

      const identifier = email.trim();
      const requestTenantId = request.headers.get('x-tenant-id');

      const isEmail = identifier.includes('@');
      const user = await db.query.users.findFirst({
        where: isEmail
          ? eq(users.email, identifier.toLowerCase())
          : or(
              eq(users.phone, identifier),
              eq(users.id, identifier),
              requestTenantId
                ? and(eq(users.username, identifier), eq(users.tenantId, requestTenantId))
                : eq(users.username, identifier)
            ),
        with: {
          tenant: { columns: { id: true, name: true, slug: true, logo: true } },
          customRole: { columns: { id: true, name: true, color: true, permissions: true } },
        },
      });

      if (!user) {
        await registerFailedLogin(ip, account);
        log.warn({ ip, email }, 'Login attempt: User not found');
        set.status = 401;
        return { error: 'User not found with this email, phone, or School ID' };
      }

      if (!user.isActive) {
        set.status = 403;
        return { error: 'Your account has been deactivated. Please contact the administrator.' };
      }

      // Security: Only accept bcrypt/argon2 hashed passwords (start with '$').
      // Reject plaintext passwords — they should never be stored unencrypted.
      if (!user.password.startsWith('$')) {
        log.warn({ userId: user.id }, 'Security: User has a plaintext (unhashed) password in DB — rejecting login');
        set.status = 401;
        return { error: 'Account configuration error. Please contact the administrator.' };
      }
      const { valid: isValid, needsRehash } = await verifyPassword(password, user.password);

      if (!isValid) {
        await registerFailedLogin(ip, account);
        log.warn({ userId: user.id }, 'Login attempt: Invalid password');
        set.status = 401;
        return { error: 'Incorrect password. Please try again.' };
      }

      await clearLoginAttempts(ip, account);

      // Silent upgrade of legacy hashes (Bun defaults / bcrypt) to the tuned
      // argon2id params. Fire-and-forget: a rehash failure must never fail the login.
      if (needsRehash) {
        hashPassword(password)
          .then((fresh) => db.update(users).set({ password: fresh }).where(eq(users.id, user.id)))
          .catch((err) => log.warn({ err, userId: user.id }, 'password rehash failed — login unaffected'));
      }

      const token = await signAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant?.id || null,
      });

      // Issue refresh token and store in DB
      const { token: refreshTokenRaw, jti: refreshJti } = await signRefreshToken({
        userId: user.id,
        tenantId: user.tenant?.id || null,
      });

      const hashedJti = hashToken(refreshJti);

      await db.insert(refreshTokens).values({
        token: hashedJti,
        userId: user.id,
        tenantId: user.tenant?.id || null,
        userAgent: request.headers.get('user-agent') || null,
        ipAddress: ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      log.info({ userId: user.id, email: user.email }, 'User logged in');

      posthog.capture({
        distinctId: user.id,
        event: 'user_logged_in',
        properties: {
          email: user.email,
          role: user.role,
          tenantId: user.tenant?.id || null,
          tenantName: user.tenant?.name || null
        }
      });

      return {
        success: true,
        token,
        refreshToken: refreshTokenRaw,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          tenantId: user.tenant?.id || null,
          tenantSlug: user.tenant?.slug || null,
          tenantName: user.tenant?.name || null,
          tenantLogo: user.tenant?.logo || null,
          phone: user.phone,
          address: user.address,
          customRole: user.customRole ? {
            id: user.customRole.id,
            name: user.customRole.name,
            color: user.customRole.color,
            permissions: JSON.parse(user.customRole.permissions || '{}'),
          } : null,
        },
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/auth/login' });
      logger.error({ error }, 'Auth login error');
      set.status = 500;
      return { error: 'Login failed. Please try again.' };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  });
