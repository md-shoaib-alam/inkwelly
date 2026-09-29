import { Elysia } from 'elysia';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { captureError } from '../../lib/monitoring/posthog';

/**
 * A rule as it is stored: the sequence width is a real integer and a blank start is
 * `null`, which means "continue the current series" rather than "start at nothing".
 */
interface RuleColumns {
  enabled: boolean;
  prefix: string;
  numberLength: number;
  format: string;
  resetEveryYear: boolean;
  startFrom: number | null;
}

const DEFAULT_WIDTH = 4;

const DEFAULTS = {
  schoolCode: '',
  studentId: { enabled: false, prefix: 'STU', numberLength: '4', format: '{PREFIX}{YEAR}{SEQ}', resetEveryYear: true, startFrom: '' },
  admissionNo: { enabled: false, prefix: 'ADM', numberLength: '4', format: '{PREFIX}{YEAR}{SEQ}', resetEveryYear: true, startFrom: '' },
  rollNumber: { enabled: false, startingNumber: '1' },
};

class Reject extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Admins only, matching the nav: the screen is named in `STAFF_FORBIDDEN_SCREENS`, so a
 * staff grant on `students` must not let a hand-typed request rewrite how the school
 * mints every identifier. Checked per handler the way the rest of the API does it — the
 * shared `requireAdmin` plugin's hooks do not reach these routes when mounted with
 * `.use()`, which was proven by letting a staff token through.
 */
const isAdmin = (user: { role?: string } | undefined) =>
  user?.role === 'admin' || user?.role === 'super_admin';

const MAX_WIDTH = 10;

const DEFAULT_FORMAT = '{PREFIX}{YEAR}{SEQ}';

function digits(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/\D/g, '').slice(0, MAX_WIDTH + 2);
}

/**
 * A width the sequence can actually be padded to. The screen leaves the field on its
 * placeholder until the admin types, so an absent value is not an error — it is 4.
 */
function widthOf(value: unknown): number {
  const digitsOnly = digits(value);
  if (!digitsOnly) return DEFAULT_WIDTH;
  const n = Number(digitsOnly);
  if (n < 1 || n > MAX_WIDTH) throw new Reject('Number length must be between 1 and 10.');
  return n;
}

/** The next number of the series, or null to let the series continue where it is. */
function startOf(value: unknown): number | null {
  const digitsOnly = digits(value);
  if (!digitsOnly) return null;
  const n = Number(digitsOnly);
  if (n > 9_999_999_999) throw new Reject('Start number is too large.');
  return n;
}

function textOf(value: unknown, max: number, field: string): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Reject(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

/**
 * An enabled rule has to produce a different ID per student. A format without `{SEQ}`
 * would hand every admission the same identifier, so it is refused here rather than
 * discovered when two students share a number.
 */
function formatOf(value: unknown, enabled: boolean): string {
  const format = textOf(value, 64, 'Format');
  if (!format) {
    if (enabled) throw new Reject('Format is required when auto-generation is on.');
    return DEFAULT_FORMAT;
  }
  if (enabled && !format.includes('{SEQ}')) {
    throw new Reject('Format must include the Number part — without it every ID is the same.');
  }
  return format;
}

function ruleOf(raw: unknown, defaultPrefix: string): RuleColumns {
  const r = (raw ?? {}) as Record<string, unknown>;
  const enabled = r.enabled === true;
  return {
    enabled,
    prefix: textOf(r.prefix, 12, 'Prefix') || defaultPrefix,
    numberLength: widthOf(r.numberLength),
    format: formatOf(r.format, enabled),
    resetEveryYear: r.resetEveryYear !== false,
    startFrom: startOf(r.startFrom),
  };
}

/** One row writes all three rules, so the screen can save the whole form in one request. */
const columnsFor = (schoolCode: string, studentId: RuleColumns, admissionNo: RuleColumns, roll: { enabled: boolean; startingNumber: number }) => ({
  schoolCode,
  studentIdEnabled: studentId.enabled,
  studentIdPrefix: studentId.prefix,
  studentIdNumberLength: studentId.numberLength,
  studentIdFormat: studentId.format,
  studentIdResetEveryYear: studentId.resetEveryYear,
  studentIdStartFrom: studentId.startFrom,
  admissionNoEnabled: admissionNo.enabled,
  admissionNoPrefix: admissionNo.prefix,
  admissionNoNumberLength: admissionNo.numberLength,
  admissionNoFormat: admissionNo.format,
  admissionNoResetEveryYear: admissionNo.resetEveryYear,
  admissionNoStartFrom: admissionNo.startFrom,
  rollNumberEnabled: roll.enabled,
  rollNumberStartingNumber: roll.startingNumber,
});

const asString = (n: number | null): string => (n === null ? '' : String(n));

/** Widths and starts travel as strings because the screen binds them to text inputs. */
const responseOf = (row: typeof schema.studentIdSettings.$inferSelect) => ({
  schoolCode: row.schoolCode,
  studentId: {
    enabled: row.studentIdEnabled,
    prefix: row.studentIdPrefix,
    numberLength: String(row.studentIdNumberLength),
    format: row.studentIdFormat,
    resetEveryYear: row.studentIdResetEveryYear,
    startFrom: asString(row.studentIdStartFrom),
  },
  admissionNo: {
    enabled: row.admissionNoEnabled,
    prefix: row.admissionNoPrefix,
    numberLength: String(row.admissionNoNumberLength),
    format: row.admissionNoFormat,
    resetEveryYear: row.admissionNoResetEveryYear,
    startFrom: asString(row.admissionNoStartFrom),
  },
  rollNumber: { enabled: row.rollNumberEnabled, startingNumber: String(row.rollNumberStartingNumber) },
});

/**
 * The students module's own settings surface. It is a table rather than keys inside
 * `Tenant.settings` because that column is one JSON blob which `PUT /tenant-settings`
 * replaces wholesale, so a save from any other settings screen silently drops these.
 */
export const studentSettingsRoutes = new Elysia({ prefix: '/student-settings' })
  .use(requireAuth)
  .use(requirePermission('students'))
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

      const row = await db.query.studentIdSettings.findFirst({
        where: eq(schema.studentIdSettings.tenantId, tenantId),
      });

      // A tenant that never opened the screen has no row, and the form still has to
      // render, so the defaults are returned rather than an empty 404.
      return row ? responseOf(row) : DEFAULTS;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/student-settings', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch student settings' };
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
      const schoolCode = textOf(b.schoolCode, 24, 'School code');
      if (!schoolCode) throw new Reject('School code is required — it is part of the IDs you generate.');

      const studentId = ruleOf(b.studentId, 'STU');
      const admissionNo = ruleOf(b.admissionNo, 'ADM');

      const rollRaw = (b.rollNumber ?? {}) as Record<string, unknown>;
      const rollStart = startOf(rollRaw.startingNumber) ?? 1;
      if (rollStart < 1) throw new Reject('Starting roll number must be 1 or more.');
      const roll = { enabled: rollRaw.enabled === true, startingNumber: rollStart };

      const columns = columnsFor(schoolCode, studentId, admissionNo, roll);

      const [saved] = await db
        .insert(schema.studentIdSettings)
        .values({ tenantId, ...columns })
        .onConflictDoUpdate({
          target: [schema.studentIdSettings.tenantId],
          set: { ...columns, updatedAt: sql`now()` },
        })
        .returning();

      if (!saved) {
        set.status = 500;
        return { error: 'Failed to save student settings' };
      }

      return responseOf(saved);
    } catch (error) {
      if (error instanceof Reject) {
        set.status = 400;
        return { error: error.message };
      }
      captureError(error, { method: 'PUT', path: '/student-settings', tenantId });
      set.status = 500;
      return { error: 'Failed to save student settings' };
    }
  });
