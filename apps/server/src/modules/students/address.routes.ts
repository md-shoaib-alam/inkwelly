import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, asc, ne, sql, or } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { captureError } from '../../lib/monitoring/posthog';
import { createAuditLog } from '../../lib/audit-helper';
import Elysia, { t } from 'elysia';

/**
 * A student's addresses as records a school can add to, correct and remove.
 *
 * Before this table existed, the Students module read the single free-text `User.address`
 * and labelled it "Current address" — which meant the tab could show one address, could
 * not show a permanent and a current one, and had no way to gain either, because nothing
 * in the admin ever wrote that column.
 */

// The vocabulary the form's Address type select offers. Anything else is a client bug or
// a hand-built request, and storing it would put a type in the data that no screen can
// render a label for.
export const ADDRESS_TYPES = ['current', 'permanent', 'other'] as const;
type AddressType = (typeof ADDRESS_TYPES)[number];

const isAddressType = (v: unknown): v is AddressType =>
  typeof v === 'string' && (ADDRESS_TYPES as readonly string[]).includes(v);

class AddressRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

// Trim, drop empties to null, and cap at the width a school can actually print on a form.
const text = (v: unknown, max = 200): string | null => {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

/**
 * The form marks these required, so the route requires them too. A client that skips
 * validation must not be able to file an address with no city on it — an address is only
 * useful to a school if it can be mailed.
 */
const REQUIRED = [
  ['line1', 'Address line 1'],
  ['city', 'City'],
  ['state', 'State'],
  ['country', 'Country'],
  ['postalCode', 'Postal code'],
] as const;

const addressBody = t.Object({
  studentId: t.Optional(t.String()),
  addressType: t.Optional(t.String()),
  line1: t.Optional(t.String()),
  line2: t.Optional(t.String()),
  city: t.Optional(t.String()),
  state: t.Optional(t.String()),
  country: t.Optional(t.String()),
  postalCode: t.Optional(t.String()),
  landmark: t.Optional(t.String()),
  isPrimary: t.Optional(t.Boolean()),
});

const shape = (row: typeof schema.studentAddresses.$inferSelect) => ({
  id: row.id,
  addressType: row.addressType,
  line1: row.line1,
  line2: row.line2,
  city: row.city,
  state: row.state,
  country: row.country,
  postalCode: row.postalCode,
  landmark: row.landmark,
  isPrimary: row.isPrimary,
});

/**
 * One line for the places that need prose rather than a card: the summary tab's contact
 * block and any export. Built here so two server readers cannot disagree about what a
 * student's address reads as.
 */
export const addressOneLiner = (a: Partial<typeof schema.studentAddresses.$inferSelect>) =>
  [a.line1, a.line2, a.landmark, [a.city, a.state].filter(Boolean).join(', '), [a.country, a.postalCode].filter(Boolean).join(' ')]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(', ');

/** Resolve a student inside the calling school by id, rollNumber, or username, or refuse. */
const ownedStudent = async (studentRef: string, tenantId: string) => {
  const rows = await db
    .select({ id: schema.students.id })
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .where(
      and(
        eq(schema.users.tenantId, tenantId),
        sql`${schema.students.deletedAt} is null`,
        or(
          eq(schema.students.id, studentRef),
          eq(schema.students.rollNumber, studentRef),
          eq(schema.users.username, studentRef),
        ),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
};

export const cleanBody = (body: Record<string, unknown>) => {
  for (const [key, label] of REQUIRED) {
    if (!text(body[key])) throw new AddressRouteError(400, 'ADDRESS_FIELD_REQUIRED', `${label} is required`);
  }
  if (!isAddressType(body.addressType)) {
    throw new AddressRouteError(400, 'INVALID_ADDRESS_TYPE', 'Address type must be current, permanent or other');
  }
  return {
    addressType: body.addressType as AddressType,
    line1: text(body.line1)!,
    line2: text(body.line2),
    city: text(body.city),
    state: text(body.state),
    country: text(body.country),
    postalCode: text(body.postalCode),
    landmark: text(body.landmark, 300),
    isPrimary: body.isPrimary === true,
  };
};

const purge = (tenantId: string) =>
  dataCache.deleteMatch([`*students*${tenantId}*`, `dashboard:${tenantId}:*`]);

/**
 * Make this row the only primary one for the student.
 *
 * A second primary is not merely untidy: the summary tab and the roster both read "the"
 * primary address, so two of them silently pick whichever the planner returned first.
 */
const applyPrimary = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  studentId: string,
  keepId: string,
  want: boolean,
) => {
  await tx
    .update(schema.studentAddresses)
    .set({ isPrimary: false })
    .where(
      and(
        eq(schema.studentAddresses.studentId, studentId),
        ne(schema.studentAddresses.id, keepId),
      ),
    );
  if (want) {
    await tx
      .update(schema.studentAddresses)
      .set({ isPrimary: true })
      .where(eq(schema.studentAddresses.id, keepId));
    return;
  }
  // Un-checking the only primary would leave the student with no address to read, so the
  // oldest other record takes the badge — and if there is no other record, the box snaps
  // back on: a student with one address has that address be the primary one.
  const survivor = await tx
    .select({ id: schema.studentAddresses.id })
    .from(schema.studentAddresses)
    .where(
      and(
        eq(schema.studentAddresses.studentId, studentId),
        ne(schema.studentAddresses.id, keepId),
      ),
    )
    .orderBy(asc(schema.studentAddresses.createdAt))
    .limit(1);
  await tx
    .update(schema.studentAddresses)
    .set({ isPrimary: true })
    .where(eq(schema.studentAddresses.id, survivor[0]?.id ?? keepId));
};

const audit = (
  action: string,
  user: { id?: string; role?: string },
  tenantId: string,
  request: Request,
  details: Record<string, unknown>,
) =>
  createAuditLog({
    action,
    resource: 'student-address',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details,
  });

// Only a school's own staff may file an address about a child.
const WRITE_ROLES = ['admin', 'super_admin', 'staff'];

export const studentAddressRoutes = new Elysia({ prefix: '/student-address' })
  .use(requireAuth)
  .use(requirePermission('students'))

  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      const studentId = typeof query.student === 'string' ? query.student : '';
      if (!studentId) return errorResponse(set, 400, 'A student is required', 'STUDENT_REQUIRED');
      const student = await ownedStudent(studentId, tenantId);
      if (!student) {
        return errorResponse(set, 404, 'Student not found', 'STUDENT_NOT_FOUND');
      }
      const rows = await db
        .select()
        .from(schema.studentAddresses)
        .where(
          and(
            eq(schema.studentAddresses.studentId, student.id),
            eq(schema.studentAddresses.tenantId, tenantId),
          ),
        )
        .orderBy(asc(schema.studentAddresses.createdAt));
      return { items: rows.map(shape) };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/student-address', tenantId });
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  })

  .post(
    '/',
    async ({ body, tenantId, user, request, set }) => {
      try {
        if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
        if (!user || !WRITE_ROLES.includes(user.role)) {
          return errorResponse(set, 403, 'Access denied: administrator privileges required', 'FORBIDDEN');
        }
        const studentRef = typeof body.studentId === 'string' ? body.studentId : '';
        if (!studentRef) throw new AddressRouteError(400, 'STUDENT_REQUIRED', 'A student is required');
        const student = await ownedStudent(studentRef, tenantId);
        if (!student) {
          throw new AddressRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found');
        }
        const studentId = student.id;
        const fields = cleanBody(body as Record<string, unknown>);

        // The first address a student has is the one the school writes to, whether or not
        // whoever typed it remembered to tick the box.
        const countRow = await db
          .select({ n: sql<number>`count(*)::int` })
          .from(schema.studentAddresses)
          .where(eq(schema.studentAddresses.studentId, studentId));
        const isFirst = (countRow[0]?.n ?? 0) === 0;

        const created = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(schema.studentAddresses)
            .values({ ...fields, isPrimary: isFirst || fields.isPrimary, studentId, tenantId })
            .returning();
          if (row && fields.isPrimary && !isFirst) await applyPrimary(tx, studentId, row.id, true);
          return row ?? null;
        });
        if (!created) throw new AddressRouteError(500, 'INTERNAL_SERVER_ERROR', 'Could not save the address');

        await audit('CREATE_STUDENT_ADDRESS', user, tenantId, request, { studentId, addressId: created.id });
        await purge(tenantId);
        return { item: shape(created) };
      } catch (error) {
        if (error instanceof AddressRouteError) {
          return errorResponse(set, error.status, error.message, error.code);
        }
        captureError(error, { method: 'POST', path: '/student-address', tenantId });
        return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
      }
    },
    { body: addressBody },
  )

  .put(
    '/',
    async ({ body, tenantId, user, request, set }) => {
      try {
        if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
        if (!user || !WRITE_ROLES.includes(user.role)) {
          return errorResponse(set, 403, 'Access denied: administrator privileges required', 'FORBIDDEN');
        }
        const id = typeof (body as { id?: unknown }).id === 'string' ? (body as { id: string }).id : '';
        if (!id) throw new AddressRouteError(400, 'ADDRESS_REQUIRED', 'An address is required');

        const existing = await db
          .select()
          .from(schema.studentAddresses)
          .where(and(eq(schema.studentAddresses.id, id), eq(schema.studentAddresses.tenantId, tenantId)))
          .limit(1);
        const before = existing[0] ?? null;
        if (!before) return errorResponse(set, 404, 'Address not found', 'ADDRESS_NOT_FOUND');

        const fields = cleanBody(body as Record<string, unknown>);
        const updated = await db.transaction(async (tx) => {
          const [row] = await tx
            .update(schema.studentAddresses)
            .set({ ...fields, updatedAt: new Date() })
            .where(eq(schema.studentAddresses.id, id))
            .returning();
          if (row) await applyPrimary(tx, before.studentId, id, fields.isPrimary);
          return row ?? null;
        });
        if (!updated) throw new AddressRouteError(500, 'INTERNAL_SERVER_ERROR', 'Could not save the address');

        await audit('UPDATE_STUDENT_ADDRESS', user, tenantId, request, {
          studentId: before.studentId,
          addressId: id,
        });
        await purge(tenantId);
        return { item: shape(updated) };
      } catch (error) {
        if (error instanceof AddressRouteError) {
          return errorResponse(set, error.status, error.message, error.code);
        }
        captureError(error, { method: 'PUT', path: '/student-address', tenantId });
        return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
      }
    },
    { body: addressBody },
  )

  .delete('/', async ({ query, tenantId, user, request, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!user || !WRITE_ROLES.includes(user.role)) {
        return errorResponse(set, 403, 'Access denied: administrator privileges required', 'FORBIDDEN');
      }
      const id = typeof query.id === 'string' ? query.id : '';
      if (!id) return errorResponse(set, 400, 'An address is required', 'ADDRESS_REQUIRED');

      const existing = await db
        .select()
        .from(schema.studentAddresses)
        .where(and(eq(schema.studentAddresses.id, id), eq(schema.studentAddresses.tenantId, tenantId)))
        .limit(1);
      const row = existing[0] ?? null;
      if (!row) return errorResponse(set, 404, 'Address not found', 'ADDRESS_NOT_FOUND');

      await db.transaction(async (tx) => {
        await tx.delete(schema.studentAddresses).where(eq(schema.studentAddresses.id, id));
        // Deleting the primary leaves the tab with no address to show, so the next oldest
        // takes the badge. The last one is simply allowed to go: an address, unlike a
        // guardian, is not something a student must always have.
        if (row.isPrimary) {
          const next = await tx
            .select({ id: schema.studentAddresses.id })
            .from(schema.studentAddresses)
            .where(eq(schema.studentAddresses.studentId, row.studentId))
            .orderBy(asc(schema.studentAddresses.createdAt))
            .limit(1);
          if (next[0]) {
            await tx
              .update(schema.studentAddresses)
              .set({ isPrimary: true })
              .where(eq(schema.studentAddresses.id, next[0].id));
          }
        }
      });

      await audit('DELETE_STUDENT_ADDRESS', user, tenantId, request, {
        studentId: row.studentId,
        addressId: id,
      });
      await purge(tenantId);
      return { deleted: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/student-address', tenantId });
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  });
