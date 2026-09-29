import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, isNull, like, or, count, desc } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { captureError } from '../../lib/monitoring/posthog';
import { createAuditLog } from '../../lib/audit-helper';
import Elysia, { t } from 'elysia';

// ─── Field whitelist ──────────────────────────────────────────────────────────
// Every editable column of the Bulk Update screen, mapped to its table. A key
// outside these maps is a client bug, so the whole request is rejected rather
// than silently dropped.
const STUDENT_FIELDS = new Set([
  'title', 'firstName', 'middleName', 'lastName', 'admissionDate', 'dateOfBirth',
  'gender', 'bloodGroup', 'religion', 'nationality', 'motherTongue', 'casteCategory',
  'peNumber', 'abcId', 'apaarId', 'aadhaarNo', 'rollNumber', 'registrationNo',
  'joiningDate', 'remarks', 'classId', 'status',
]);
const USER_FIELDS = new Set(['email', 'phone']);
const PARENT_FIELDS: Record<string, string> = {
  fatherTitle: 'fatherTitle',
  fatherFirstName: 'fatherFirstName',
  fatherMiddleName: 'fatherMiddleName',
  fatherLastName: 'fatherLastName',
  fatherMobile: 'fatherMobile',
  fatherOccupation: 'occupation',
  fatherEducation: 'fatherEducation',
  fatherWorkAddress: 'fatherWorkAddress',
  motherTitle: 'motherTitle',
  motherFirstName: 'motherFirstName',
  motherMiddleName: 'motherMiddleName',
  motherLastName: 'motherLastName',
  motherMobile: 'motherMobile',
  motherOccupation: 'motherOccupation',
  motherEducation: 'motherEducation',
  motherWorkAddress: 'motherWorkAddress',
};
const BOOLEAN_STUDENT_FIELDS = new Set(['isRte']);

class BulkRouteError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, 500) : null;

// ─── GET /bulk-update/students ───────────────────────────────────────────────
const handleList = async (query: any, tenantId: string) => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit ?? '100', 10) || 100));
  const search = str(query.search);
  const classId = str(query.classId);
  const gender = str(query.gender);

  const where = and(
    eq(schema.users.tenantId, tenantId),
    isNull(schema.students.deletedAt),
    classId ? eq(schema.students.classId, classId) : undefined,
    gender && gender !== 'all' ? eq(schema.students.gender, gender) : undefined,
    search
      ? or(
          like(schema.users.name, `%${search}%`),
          like(schema.students.firstName, `%${search}%`),
          like(schema.students.lastName, `%${search}%`),
          like(schema.students.admissionNo, `%${search}%`),
          like(schema.students.rollNumber, `%${search}%`),
        )
      : undefined,
  );

  const [rows, total] = await Promise.all([
    db
      .select({
        id: schema.students.id,
        userId: schema.students.userId,
        parentId: schema.students.parentId,
        name: schema.users.name,
        email: schema.users.email,
        phone: schema.users.phone,
        avatar: schema.users.avatar,
        classId: schema.students.classId,
        className: schema.classes.name,
        rollNumber: schema.students.rollNumber,
        admissionNo: schema.students.admissionNo,
        admissionDate: schema.students.admissionDate,
        title: schema.students.title,
        firstName: schema.students.firstName,
        middleName: schema.students.middleName,
        lastName: schema.students.lastName,
        dateOfBirth: schema.students.dateOfBirth,
        gender: schema.students.gender,
        bloodGroup: schema.students.bloodGroup,
        religion: schema.students.religion,
        nationality: schema.students.nationality,
        motherTongue: schema.students.motherTongue,
        casteCategory: schema.students.casteCategory,
        peNumber: schema.students.peNumber,
        abcId: schema.students.abcId,
        apaarId: schema.students.apaarId,
        aadhaarNo: schema.students.aadhaarNo,
        registrationNo: schema.students.registrationNo,
        joiningDate: schema.students.joiningDate,
        remarks: schema.students.remarks,
        isRte: schema.students.isRte,
        status: schema.students.status,
        occupation: schema.parents.occupation,
        fatherTitle: schema.parents.fatherTitle,
        fatherFirstName: schema.parents.fatherFirstName,
        fatherMiddleName: schema.parents.fatherMiddleName,
        fatherLastName: schema.parents.fatherLastName,
        fatherMobile: schema.parents.fatherMobile,
        fatherEducation: schema.parents.fatherEducation,
        fatherWorkAddress: schema.parents.fatherWorkAddress,
        motherTitle: schema.parents.motherTitle,
        motherFirstName: schema.parents.motherFirstName,
        motherMiddleName: schema.parents.motherMiddleName,
        motherLastName: schema.parents.motherLastName,
        motherMobile: schema.parents.motherMobile,
        motherOccupation: schema.parents.motherOccupation,
        motherEducation: schema.parents.motherEducation,
        motherWorkAddress: schema.parents.motherWorkAddress,
      })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .leftJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
      .where(where)
      .orderBy(desc(schema.students.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(where),
  ]);

  return { items: rows, page, limit, totalItems: total[0]?.total ?? 0 };
};

// ─── POST /bulk-update ───────────────────────────────────────────────────────
const applyOne = async (id: string, fields: Record<string, unknown>, tenantId: string) => {
  const studentPatch: Record<string, unknown> = {};
  const userPatch: Record<string, unknown> = {};
  const parentPatch: Record<string, unknown> = {};
  let wantsNameParts = false;

  for (const [key, value] of Object.entries(fields)) {
    if (STUDENT_FIELDS.has(key)) {
      if (key === 'gender') {
        const g = str(value);
        if (g && !['male', 'female', 'other'].includes(g)) {
          throw new BulkRouteError(400, 'INVALID_GENDER', `Unknown gender "${g}"`);
        }
        studentPatch[key] = g;
      } else {
        studentPatch[key] = str(value);
      }
      if (['firstName', 'middleName', 'lastName'].includes(key)) wantsNameParts = true;
    } else if (BOOLEAN_STUDENT_FIELDS.has(key)) {
      studentPatch[key] = Boolean(value);
    } else if (USER_FIELDS.has(key)) {
      userPatch[key] = str(value);
    } else if (PARENT_FIELDS[key]) {
      parentPatch[PARENT_FIELDS[key]] = str(value);
    }
  }

  return await db.transaction(async (tx) => {
    const student = await tx.query.students.findFirst({ where: eq(schema.students.id, id) });
    if (!student || student.deletedAt) {
      throw new BulkRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found in this school');
    }
    const user = await tx.query.users.findFirst({ where: eq(schema.users.id, student.userId) });
    if (!user || user.tenantId !== tenantId) {
      throw new BulkRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found in this school');
    }

    if (studentPatch.classId) {
      const classId = String(studentPatch.classId);
      const cls = await tx.query.classes.findFirst({
        where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId)),
      });
      if (!cls) throw new BulkRouteError(400, 'INVALID_CLASS', 'Invalid class for this school');
    }

    if (Object.keys(parentPatch).length > 0) {
      if (!student.parentId) {
        throw new BulkRouteError(400, 'NO_PARENT', 'This student has no parent record to update');
      }
      await tx
        .update(schema.parents)
        .set({ ...parentPatch, updatedAt: new Date() })
        .where(eq(schema.parents.id, student.parentId));
    }

    if (Object.keys(studentPatch).length > 0) {
      await tx
        .update(schema.students)
        .set({ ...studentPatch, updatedAt: new Date() })
        .where(eq(schema.students.id, id));
    }

    if (Object.keys(userPatch).length > 0 || wantsNameParts) {
      const merged = wantsNameParts
        ? [
            str(studentPatch.firstName ?? student.firstName),
            str(studentPatch.middleName ?? student.middleName),
            str(studentPatch.lastName ?? student.lastName),
          ]
            .filter(Boolean)
            .join(' ')
        : null;
      if (merged) userPatch.name = merged;
      await tx
        .update(schema.users)
        .set({ ...userPatch, updatedAt: new Date() })
        .where(eq(schema.users.id, user.id));
    }

    return { id, name: (userPatch.name as string) ?? user.name };
  });
};

const bulkBodySchema = t.Object({
  updates: t.Array(
    t.Object({
      id: t.String({ minLength: 1 }),
      fields: t.Record(t.String(), t.Union([t.String(), t.Boolean()])),
    }),
    { minItems: 1, maxItems: 500 },
  ),
});

const validateKeys = (updates: { id: string; fields: Record<string, unknown> }[]) => {
  for (const u of updates) {
    for (const key of Object.keys(u.fields)) {
      if (!STUDENT_FIELDS.has(key) && !USER_FIELDS.has(key) && !BOOLEAN_STUDENT_FIELDS.has(key) && !PARENT_FIELDS[key]) {
        throw new BulkRouteError(400, 'INVALID_FIELD', `Field "${key}" cannot be bulk-updated`);
      }
    }
  }
};

const handleBulkUpdate = async (body: any, tenantId: string, user: any, request: any) => {
  validateKeys(body.updates);
  const updated: { id: string; name: string }[] = [];
  const failed: { id: string; error: string; code: string }[] = [];

  for (const entry of body.updates) {
    try {
      updated.push(await applyOne(entry.id, entry.fields, tenantId));
    } catch (err) {
      const e =
        err instanceof BulkRouteError
          ? err
          : typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505'
            ? new BulkRouteError(409, 'DUPLICATE_EMAIL', 'That email is already used by another account')
            : null;
      if (!e) throw err;
      failed.push({ id: entry.id, error: e.message, code: e.code });
    }
  }

  await createAuditLog({
    action: 'BULK_UPDATE_STUDENTS',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      updated: updated.length,
      failed: failed.length,
      ids: updated.map((u) => u.id).slice(0, 100),
    },
  });

  await dataCache.deleteMatch([`*students*${tenantId}*`, `dashboard:${tenantId}:*`]);

  return { updated: updated.length, failed };
};

export const bulkUpdateRoutes = new Elysia({ prefix: '/bulk-update' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .get('/students', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      return await handleList(query, tenantId);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/bulk-update/students', tenantId });
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  })
  .post('/', async ({ body, tenantId, user, request, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        return errorResponse(set, 403, 'Access denied: staff or administrator privileges required', 'FORBIDDEN');
      }
      return await handleBulkUpdate(body, tenantId, user, request);
    } catch (error) {
      captureError(error, { method: 'POST', path: '/bulk-update', tenantId });
      if (error instanceof BulkRouteError) {
        return errorResponse(set, error.status, error.message, error.code);
      }
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  }, {
    body: bulkBodySchema,
  });
