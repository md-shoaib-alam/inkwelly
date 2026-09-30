import { Elysia } from 'elysia';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { captureError } from '../../lib/monitoring/posthog';

/**
 * What the attendance dashboard measures against. A tenant that never opened the screen
 * has no row, and the dashboard still has to render, so these are the values the screen
 * was built around.
 */
const DEFAULTS = { cutoffTime: '09:00', targetRate: 92 };

class Reject extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Admins only. The nav keeps the settings screen out of staff, so a staff grant on
 * `attendance` must not let a hand-typed request rewrite when the whole school counts a
 * student late. Checked per handler — the shared `requireAdmin` plugin's hooks do not
 * reach these routes when mounted with `.use()`.
 */
const isAdmin = (user: { role?: string } | undefined) =>
  user?.role === 'admin' || user?.role === 'super_admin';

/**
 * A wall clock the register can compare against, stored zero-padded so the dashboard can
 * sort and display it without reparsing. Accepts `9:00` and `09:00`, refuses anything
 * outside a day.
 */
function cutoffOf(value: unknown): string {
  if (typeof value !== 'string') throw new Reject('Cutoff time is required.');
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Reject('Cutoff time must look like 09:00.');
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Reject('Cutoff time must be a real clock time.');
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** A percentage, because every band on the dashboard is written as one. */
function targetOf(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isInteger(n)) throw new Reject('Target attendance rate must be a whole number.');
  if (n < 0 || n > 100) throw new Reject('Target attendance rate must be between 0 and 100.');
  return n;
}

export const attendanceSettingsRoutes = new Elysia({ prefix: '/attendance-settings' })
  .use(requireAuth)
  .use(requirePermission('attendance'))
  .get('/', async ({ tenantId, user, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!isAdmin(user)) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }

      const [row] = await db
        .select({ cutoffTime: schema.attendanceSettings.cutoffTime, targetRate: schema.attendanceSettings.targetRate })
        .from(schema.attendanceSettings)
        .where(eq(schema.attendanceSettings.tenantId, tenantId))
        .limit(1);

      return row ?? DEFAULTS;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/attendance-settings', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch attendance settings' };
    }
  })
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!isAdmin(user)) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }

      const b = (body ?? {}) as Record<string, unknown>;
      const values = {
        cutoffTime: cutoffOf(b.cutoffTime),
        targetRate: targetOf(b.targetRate),
      };

      const [saved] = await db
        .insert(schema.attendanceSettings)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({
          target: [schema.attendanceSettings.tenantId],
          set: { ...values, updatedAt: sql`now()` },
        })
        .returning({ cutoffTime: schema.attendanceSettings.cutoffTime, targetRate: schema.attendanceSettings.targetRate });

      if (!saved) {
        set.status = 500;
        return { error: 'Failed to save attendance settings' };
      }

      return saved;
    } catch (error) {
      if (error instanceof Reject) {
        set.status = 400;
        return { error: error.message };
      }
      captureError(error, { method: 'PUT', path: '/attendance-settings', tenantId });
      set.status = 500;
      return { error: 'Failed to save attendance settings' };
    }
  });
