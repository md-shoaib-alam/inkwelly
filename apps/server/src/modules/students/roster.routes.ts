import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, isNull, like, or, count, desc, asc, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { captureError } from '../../lib/monitoring/posthog';
import Elysia from 'elysia';

// ─── Sort whitelist ───────────────────────────────────────────────────────────
// The roster sorts server-side, so every sortable column is named here and
// anything else falls back to the default. Never interpolate client sort text.
const SORTS: Record<string, AnyPgColumn> = {
  name: schema.users.name,
  firstName: schema.students.firstName,
  lastName: schema.students.lastName,
  rollNumber: schema.students.rollNumber,
  admissionNo: schema.students.admissionNo,
  dateOfBirth: schema.students.dateOfBirth,
  admissionDate: schema.students.admissionDate,
  className: schema.classes.name,
  createdAt: schema.students.createdAt,
};

const joinWhere = (tenantId: string, query: any): SQL[] => {
  const conds: SQL[] = [
    eq(schema.users.tenantId, tenantId),
    isNull(schema.students.deletedAt),
  ];
  const gender = typeof query.gender === 'string' && query.gender !== 'all' ? query.gender : null;
  if (gender) conds.push(eq(schema.students.gender, gender));
  const status = typeof query.status === 'string' && query.status !== 'all' ? query.status : null;
  if (status) conds.push(eq(schema.students.status, status));
  const category = typeof query.category === 'string' && query.category !== 'all' ? query.category : null;
  if (category) conds.push(sql`lower(${schema.students.casteCategory}) = lower(${category})`);
  const bloodGroup = typeof query.bloodGroup === 'string' && query.bloodGroup !== 'all' ? query.bloodGroup : null;
  if (bloodGroup) conds.push(eq(schema.students.bloodGroup, bloodGroup));
  const classId = typeof query.classId === 'string' && query.classId !== 'all' && query.classId ? query.classId : null;
  if (classId) conds.push(eq(schema.students.classId, classId));
  if (query.rte === 'yes') conds.push(eq(schema.students.isRte, true));
  if (query.rte === 'no') conds.push(eq(schema.students.isRte, false));
  const search = typeof query.search === 'string' && query.search.trim() ? `%${query.search.trim()}%` : null;
  if (search) {
    conds.push(
      or(
        like(schema.users.name, search),
        like(schema.students.firstName, search),
        like(schema.students.lastName, search),
        like(schema.students.admissionNo, search),
        like(schema.students.rollNumber, search),
        like(schema.users.username, search),
      )!,
    );
  }
  return conds;
};

const nameOf = (parts: (string | null | undefined)[]): string | null => {
  const joined = parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' ');
  return joined || null;
};

// Sixteen profile checks; the ring shows how full a student's record is.
const PROFILE_CHECKS: ((r: Record<string, any>) => boolean)[] = [
  (r) => !!r.name,
  (r) => !!r.dateOfBirth,
  (r) => !!r.gender,
  (r) => !!r.classId,
  (r) => !!r.rollNumber,
  (r) => !!r.admissionNo,
  (r) => !!r.phone,
  (r) => !!r.email,
  (r) => !!r.bloodGroup,
  (r) => !!r.religion,
  (r) => !!r.nationality,
  (r) => !!r.motherTongue,
  (r) => !!r.casteCategory,
  (r) => !!r.address,
  (r) => !!r.parentId,
  (r) => !!(r.peNumber || r.abcId || r.apaarId || r.aadhaarNo),
];

const handleList = async (query: any, tenantId: string) => {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '25', 10) || 25));
  const where = joinWhere(tenantId, query);
  const col: AnyPgColumn =
    (typeof query.sort === 'string' ? SORTS[query.sort] : undefined) ?? SORTS.name ?? schema.users.name;
  const ordered = query.dir === 'desc' ? desc(col) : asc(col);

  const [rows, total] = await Promise.all([
    db
      .select({
        id: schema.students.id,
        userId: schema.students.userId,
        parentId: schema.students.parentId,
        name: schema.users.name,
        username: schema.users.username,
        email: schema.users.email,
        phone: schema.users.phone,
        avatar: schema.users.avatar,
        address: schema.users.address,
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
        isRte: schema.students.isRte,
        status: schema.students.status,
        createdAt: schema.students.createdAt,
        occupation: schema.parents.occupation,
        fatherTitle: schema.parents.fatherTitle,
        fatherFirstName: schema.parents.fatherFirstName,
        fatherMiddleName: schema.parents.fatherMiddleName,
        fatherLastName: schema.parents.fatherLastName,
        fatherMobile: schema.parents.fatherMobile,
        motherTitle: schema.parents.motherTitle,
        motherFirstName: schema.parents.motherFirstName,
        motherMiddleName: schema.parents.motherMiddleName,
        motherLastName: schema.parents.motherLastName,
        motherMobile: schema.parents.motherMobile,
        motherOccupation: schema.parents.motherOccupation,
        taId: schema.transportAssignments.id,
        taRouteId: schema.transportAssignments.routeId,
        taPickupPoint: schema.transportAssignments.pickupPoint,
        taStatus: schema.transportAssignments.status,
        taStartDate: schema.transportAssignments.startDate,
      })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .leftJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
      .leftJoin(schema.transportAssignments, eq(schema.transportAssignments.studentId, schema.students.id))
      .where(and(...where))
      .orderBy(ordered as any)
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: count() })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .where(and(...where)),
  ]);

  const items = rows.map(({ taId, taRouteId, taPickupPoint, taStatus, taStartDate, ...r }) => ({
    ...r,
    transport: taId
      ? { id: taId, routeId: taRouteId, pickupPoint: taPickupPoint, status: taStatus, startDate: taStartDate }
      : null,
    fatherName: nameOf([r.fatherTitle, r.fatherFirstName, r.fatherMiddleName, r.fatherLastName]),
    motherName: nameOf([r.motherTitle, r.motherFirstName, r.motherMiddleName, r.motherLastName]),
    fatherOccupation: r.occupation,
    profileScore: Math.round(
      (PROFILE_CHECKS.filter((f) => f(r as Record<string, any>)).length / PROFILE_CHECKS.length) * 100,
    ),
  }));

  return { items, page, limit, totalItems: total[0]?.total ?? 0 };
};

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

export const rosterRoutes = new Elysia({ prefix: '/student-roster' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      return await handleList(query, tenantId);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/student-roster', tenantId });
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  });
