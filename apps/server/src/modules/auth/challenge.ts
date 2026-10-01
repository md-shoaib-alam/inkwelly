// apps/server/src/modules/auth/challenge.ts
import { Elysia, t } from 'elysia';
import { redis } from '../../lib/redis';
import { getClientIp } from '../../lib/ip';
import { hitLimit } from '../../lib/ratelimit';
import { parseUserAgent } from '../../lib/user-agent';
import { requireRoles } from '../../lib/auth';
import { db } from '../../lib/db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { issueSession, type LoginUserRecord } from './session';
import logger from '../../lib/logger';

const CHALLENGE_TTL_SEC = 90;
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 5;
const MAX_WRONG_ATTEMPTS = 5;
const CREATE_MAX_PER_IP = 30;
const CREATE_WINDOW_SEC = 15 * 60;
const APPROVE_MAX_PER_USER = 10;
const APPROVE_WINDOW_SEC = 60;

/** Widening sign-in approval past tenant admins is this one list's business. */
export const APPROVE_ROLES = ['admin'] as const;

const challengeKey = (id: string) => `login_challenge:${id}`;
const codeKey = (code: string) => `login_challenge:code:${code}`;

interface ChallengeState {
  code: string;
  status: 'pending' | 'approved' | 'consumed';
  shared: boolean;
  ua: string;
  ip: string;
  createdAt: string;
  /** Absolute deadline; writes reuse the *remaining* life so polling cannot extend the TTL. */
  expiresAt: number;
  wrongAttempts: number;
  token?: string;
  refreshToken?: string;
  user?: unknown;
}

/**
 * Process-local fallback, deliberately module-level: a Map built per call would forget
 * the challenge between the create and the next poll.
 */
const localChallenges = new Map<string, { value: string; expiry: number }>();

async function readState<T>(key: string): Promise<T | null> {
  if (redis.status === 'ready') {
    try {
      const raw = await redis.get(key);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Redis read failed; the local map is the only remaining truth.
    }
  }
  const entry = localChallenges.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    localChallenges.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

async function writeState(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value);
  const ttl = Math.max(1, Math.ceil(ttlSeconds));
  if (redis.status === 'ready') {
    try {
      await redis.setex(key, ttl, raw);
      return;
    } catch {
      // fall through to local
    }
  }
  localChallenges.set(key, { value: raw, expiry: Date.now() + ttl * 1000 });
}

function remainingTtl(challenge: ChallengeState): number {
  return (challenge.expiresAt - Date.now()) / 1000;
}

function newChallengeId(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString('base64url').slice(0, 24);
}

function newCode(): string {
  const chars = Array.from(
    crypto.getRandomValues(new Uint8Array(CODE_LENGTH)),
    (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
  );
  return `${chars.slice(0, 2).join('')}-${chars.slice(2).join('')}`;
}

/** Codes are typed and read aloud: compare on the alphabet, ignoring layout and case. */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/-/g, '');
}

function noStore(set: any) {
  set.headers['Cache-Control'] = 'no-store';
}

export const challengePublicRoutes = new Elysia()
  .post('/login-challenge', async ({ body, request, server, set }) => {
    const ip = getClientIp(request, server);
    if (await hitLimit(`challenge:create:${ip}`, CREATE_WINDOW_SEC) > CREATE_MAX_PER_IP) {
      set.status = 429;
      return { error: 'Too many sign-in requests from this network. Try again in a few minutes.' };
    }

    const challengeId = newChallengeId();
    const code = newCode();
    const now = Date.now();
    const state: ChallengeState = {
      code,
      status: 'pending',
      shared: body.shared ?? false,
      ua: request.headers.get('user-agent') || '',
      ip,
      createdAt: new Date(now).toISOString(),
      expiresAt: now + CHALLENGE_TTL_SEC * 1000,
      wrongAttempts: 0,
    };

    await writeState(challengeKey(challengeId), state, CHALLENGE_TTL_SEC);
    // The code-only route resolves the same challenge through this index.
    await writeState(codeKey(normalizeCode(code)), challengeId, CHALLENGE_TTL_SEC);

    noStore(set);
    return { challengeId, code, expiresAt: new Date(state.expiresAt).toISOString() };
  }, { body: t.Object({ shared: t.Optional(t.Boolean()) }) })

  .get('/login-challenge/:id', async ({ params, set }) => {
    noStore(set);
    const challenge = await readState<ChallengeState>(challengeKey(params.id));

    if (!challenge || Date.now() > challenge.expiresAt) {
      set.status = 410;
      return { status: 'expired' };
    }

    if (challenge.status === 'approved') {
      const session = {
        status: 'approved',
        token: challenge.token,
        refreshToken: challenge.refreshToken,
        user: challenge.user,
      };
      // Single delivery: burn it now, so the next poll of the same id is a consumed 410
      // rather than a second copy of a live session.
      challenge.status = 'consumed';
      await writeState(challengeKey(params.id), challenge, remainingTtl(challenge));
      return session;
    }

    if (challenge.status === 'consumed') {
      set.status = 410;
      return { status: 'consumed' };
    }

    const { device, browser } = parseUserAgent(challenge.ua);
    return {
      status: 'pending',
      request: { device, browser, ip: challenge.ip, createdAt: challenge.createdAt },
    };
  }, { params: t.Object({ id: t.String({ minLength: 1, maxLength: 64 }) }) });

/**
 * Approve is the only privileged step, and both of its shapes — by id from the QR, by
 * code when the camera will not focus — run through this body, so neither path can drift
 * past the role gate or the wrong-code budget.
 */
async function approveChallenge(
  challenge: ChallengeState | null,
  presentedCode: string,
  approverId: string,
  keyId: string,
) {
  if (!challenge || Date.now() > challenge.expiresAt) {
    return { status: 410 as const, body: { status: 'expired' as const } };
  }
  if (challenge.status !== 'pending') {
    return { status: 410 as const, body: { status: challenge.status as 'approved' | 'consumed' } };
  }

  if (challenge.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
    challenge.status = 'consumed';
    await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
    return { status: 410 as const, body: { status: 'consumed' as const, error: 'Too many failed attempts' } };
  }

  if (normalizeCode(presentedCode) !== normalizeCode(challenge.code)) {
    challenge.wrongAttempts += 1;
    if (challenge.wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      challenge.status = 'consumed';
      await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
      return { status: 410 as const, body: { status: 'consumed' as const, error: 'Too many failed attempts' } };
    }
    await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
    return {
      status: 400 as const,
      body: { error: 'Invalid code', remainingAttempts: MAX_WRONG_ATTEMPTS - challenge.wrongAttempts },
    };
  }

  // The session is minted for the approver, never for whoever created the challenge —
  // creating one is anonymous by design.
  const approver = await db.query.users.findFirst({
    where: eq(users.id, approverId),
    with: {
      tenant: { columns: { id: true, name: true, slug: true, logo: true } },
      customRole: { columns: { id: true, name: true, color: true, permissions: true } },
    },
  });
  if (!approver) return { status: 404 as const, body: { error: 'Approver not found' } };

  const session = await issueSession(approver as unknown as LoginUserRecord, {
    // The browser keeps the session, so the row must describe the browser, not the phone
    // that tapped Approve.
    ip: challenge.ip,
    userAgent: challenge.ua,
    shared: challenge.shared,
  });

  challenge.status = 'approved';
  challenge.token = session.token;
  challenge.refreshToken = session.refreshToken;
  challenge.user = session.user;
  await writeState(challengeKey(keyId), challenge, remainingTtl(challenge));
  await writeState(codeKey(normalizeCode(challenge.code)), '', 1);

  logger.info({ userId: approver.id, shared: challenge.shared }, 'Login challenge approved');

  return {
    status: 200 as const,
    body: { status: 'approved' as const, user: { name: approver.name, email: approver.email } },
  };
}

async function approveFromContext(keyId: string, presentedCode: string, userId: string, set: any) {
  if (await hitLimit(`challenge:approve:${userId}`, APPROVE_WINDOW_SEC) > APPROVE_MAX_PER_USER) {
    set.status = 429;
    return { error: 'Too many approval attempts. Try again in a minute.' };
  }
  const challenge = await readState<ChallengeState>(challengeKey(keyId));
  const result = await approveChallenge(challenge, presentedCode, userId, keyId);
  set.status = result.status;
  return result.body;
}

export const challengeApproveRoutes = new Elysia()
  .use(requireRoles([...APPROVE_ROLES]))

  .post('/login-challenge/approve', async ({ body, user, set }) => {
    const keyId = await readState<string>(codeKey(normalizeCode(body.code)));
    if (!keyId) {
      set.status = 410;
      return { status: 'expired' };
    }
    return approveFromContext(keyId, body.code, user.id, set);
  }, { body: t.Object({ code: t.String({ minLength: 3, maxLength: 12 }) }) })

  .post('/login-challenge/:id/approve', async ({ params, body, user, set }) =>
    approveFromContext(params.id, body.code, user.id, set), {
    params: t.Object({ id: t.String({ minLength: 1, maxLength: 64 }) }),
    body: t.Object({ code: t.String({ minLength: 3, maxLength: 12 }) }),
  });
