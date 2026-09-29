import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { captureError } from '../../lib/monitoring/posthog';
import { dataCache } from '../../lib/cache';
import Elysia from 'elysia';

/**
 * One student, read a tab at a time.
 *
 * The header (identity card + tab badges) is the only always-on call; each tab
 * then fetches just its own rows. Cache keys start with `students:` on purpose —
 * the student write paths already purge `*students*<tenantId>*`, so an edit
 * clears a profile tab without any extra invalidation here.
 */

// Tabs with nothing behind them (bank details, documents, requests, UDISE+) are
// never named here: the client renders their "not collected yet" frame without a request.
const LIVE_TABS = ['summary', 'family', 'academic', 'addresses'] as const;
type LiveTab = (typeof LIVE_TABS)[number];

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

const nameOf = (parts: (string | null | undefined)[]): string | null => {
  const joined = parts.map((p) => (p ?? '').trim()).filter(Boolean).join(' ');
  return joined || null;
};

export const isTab = (v: unknown): v is LiveTab => typeof v === 'string' && (LIVE_TABS as readonly string[]).includes(v);

// The family's own login, joined a second time off Parent.userId.
const parentUser = alias(schema.users, 'parent_user');

const selectShape = () => ({
  id: schema.students.id,
  userId: schema.students.userId,
  parentId: schema.students.parentId,
  classId: schema.students.classId,
  academicYear: schema.students.academicYear,
  rollNumber: schema.students.rollNumber,
  admissionNo: schema.students.admissionNo,
  admissionDate: schema.students.admissionDate,
  joiningDate: schema.students.joiningDate,
  registrationNo: schema.students.registrationNo,
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

  name: schema.users.name,
  username: schema.users.username,
  email: schema.users.email,
  phone: schema.users.phone,
  avatar: schema.users.avatar,
  address: schema.users.address,
  tenantId: schema.users.tenantId,

  className: schema.classes.name,
  classSection: schema.classes.section,
  classGrade: schema.classes.grade,

  parentUserId: schema.parents.userId,
  parentOccupation: schema.parents.occupation,
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
  parentAccountName: parentUser.name,

  transportId: schema.transportAssignments.id,
  transportRouteId: schema.transportAssignments.routeId,
  transportPickupPoint: schema.transportAssignments.pickupPoint,
  transportStatus: schema.transportAssignments.status,
  transportStartDate: schema.transportAssignments.startDate,
  transportRouteName: schema.transportRoutes.name,
});

/**
 * `:ref` accepts the three spellings a school actually uses: the student ID on
 * the profile card, the roll number on the roster, and the internal id every
 * deep link was built from before the id moved into the path.
 *
 * Both the read and the parent guard resolve the student with these conditions,
 * so a record the guard cannot see is a record the route must not serve. The
 * tenant and `deletedAt` conditions are here for the same reason: forgetting
 * either one in a second copy is how a school ends up reading another school's
 * student or a withdrawn one.
 */
export const refConditions = (ref: string, tenantId: string) => [
  eq(schema.users.tenantId, tenantId),
  isNull(schema.students.deletedAt),
  or(
    eq(schema.users.username, ref),
    eq(schema.students.rollNumber, ref),
    eq(schema.students.id, ref),
  ),
];

const loadStudent = async (ref: string, tenantId: string) => {
  const rows = await db
    .select(selectShape())
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .leftJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
    // The parent's own login: whoever it names is the contact the school writes to.
    .leftJoin(parentUser, eq(schema.parents.userId, parentUser.id))
    .leftJoin(schema.transportAssignments, eq(schema.transportAssignments.studentId, schema.students.id))
    .leftJoin(schema.transportRoutes, eq(schema.transportAssignments.routeId, schema.transportRoutes.id))
    .where(and(...refConditions(ref, tenantId)))
    .limit(1);
  return rows[0] ?? null;
};

export type StudentRow = NonNullable<Awaited<ReturnType<typeof loadStudent>>>;

const classNameOf = (r: StudentRow) =>
  r.className ? [r.className, r.classSection].filter(Boolean).join(' - ') : null;

/** A guardian card only exists if that parent has any field filled in. */
export const guardiansOf = (r: StudentRow) => {
  const account = (r.parentAccountName ?? '').trim().toLowerCase();
  const build = (
    relation: 'father' | 'mother',
    parts: (string | null)[],
    mobile: string | null,
    occupation: string | null,
    education: string | null,
    workAddress: string | null,
  ) => {
    const name = nameOf(parts);
    if (!name && !mobile && !occupation && !education && !workAddress) return null;
    return {
      relation,
      name,
      mobile,
      occupation,
      education,
      workAddress,
      isPrimary: !!name && !!account && name.trim().toLowerCase() === account,
    };
  };
  return [
    build(
      'father',
      [r.fatherTitle, r.fatherFirstName, r.fatherMiddleName, r.fatherLastName],
      r.fatherMobile,
      r.parentOccupation,
      r.fatherEducation,
      r.fatherWorkAddress,
    ),
    build(
      'mother',
      [r.motherTitle, r.motherFirstName, r.motherMiddleName, r.motherLastName],
      r.motherMobile,
      r.motherOccupation,
      r.motherEducation,
      r.motherWorkAddress,
    ),
  ].filter((g): g is NonNullable<typeof g> => !!g);
};

const siblingsOf = async (r: StudentRow, tenantId: string) => {
  if (!r.parentId) return [];
  const rows = await db
    .select({
      id: schema.students.id,
      name: schema.users.name,
      username: schema.users.username,
      rollNumber: schema.students.rollNumber,
      className: schema.classes.name,
      classSection: schema.classes.section,
    })
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(
      and(
        eq(schema.students.parentId, r.parentId),
        eq(schema.users.tenantId, tenantId),
        isNull(schema.students.deletedAt),
      ),
    );
  return rows
    .filter((s) => s.id !== r.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      // The path segment the profile is addressed by, same rule as the roster.
      ref: s.username || s.rollNumber || s.id,
      className: s.className ? [s.className, s.classSection].filter(Boolean).join(' - ') : null,
    }));
};

const headerOf = (r: StudentRow) => ({
  id: r.id,
  name: r.name,
  avatar: r.avatar,
  status: r.status,
  studentId: r.username,
  rollNumber: r.rollNumber,
  admissionNo: r.admissionNo,
  className: classNameOf(r),
  academicYear: r.academicYear,
  admissionDate: r.admissionDate,
  joiningDate: r.joiningDate,
});

export const countsOf = (r: StudentRow, guardians: unknown[], siblings: unknown[]) => ({
  family: guardians.length + siblings.length,
  // One enrolment record exists while the student sits in a class; there is no
  // history table, so this can never claim to count more than that.
  academic: r.classId && r.className ? 1 : 0,
  addresses: r.address?.trim() ? 1 : 0,
});

export const summaryOf = (r: StudentRow) => ({
  personal: {
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    bloodGroup: r.bloodGroup,
    religion: r.religion,
    nationality: r.nationality,
    motherTongue: r.motherTongue,
    category: r.casteCategory,
    admissionDate: r.admissionDate,
  },
  contact: {
    mobile: r.phone,
    email: r.email,
    address: r.address,
  },
  identifiers: {
    studentId: r.username,
    admissionNo: r.admissionNo,
    registrationNo: r.registrationNo,
    aadhaarNo: r.aadhaarNo,
    peNumber: r.peNumber,
    apaarId: r.apaarId,
    abcId: r.abcId,
  },
  compliance: {
    isRte: r.isRte,
    status: r.status,
  },
  transport: r.transportId
    ? {
        routeName: r.transportRouteName,
        pickupPoint: r.transportPickupPoint,
        status: r.transportStatus,
        startDate: r.transportStartDate,
      }
    : null,
});

export const academicOf = (r: StudentRow) => ({
  enrolment: {
    className: classNameOf(r),
    grade: r.classGrade,
    rollNumber: r.rollNumber,
    academicYear: r.academicYear,
    admissionNo: r.admissionNo,
    admissionDate: r.admissionDate,
    joiningDate: r.joiningDate,
    status: r.status,
  },
});

export const addressesOf = (r: StudentRow) => ({
  entries: r.address?.trim() ? [{ label: 'Current address', value: r.address.trim() }] : [],
});

const handleProfile = async (ref: string, tenantId: string, tab: unknown) => {
  const student = await loadStudent(ref, tenantId);
  if (!student) return { kind: 'not-found' as const };

  if (!isTab(tab)) {
    const guardians = guardiansOf(student);
    const siblings = await siblingsOf(student, tenantId);
    return { kind: 'header' as const, header: headerOf(student), counts: countsOf(student, guardians, siblings) };
  }

  switch (tab) {
    case 'summary':
      return { kind: 'tab' as const, tab, payload: summaryOf(student) };
    case 'family': {
      const guardians = guardiansOf(student);
      const siblings = await siblingsOf(student, tenantId);
      return { kind: 'tab' as const, tab, payload: { guardians, siblings } };
    }
    case 'academic':
      return { kind: 'tab' as const, tab, payload: academicOf(student) };
    case 'addresses':
      return { kind: 'tab' as const, tab, payload: addressesOf(student) };
  }
};

/**
 * A parent may read their own child and nobody else's. This runs *before* the
 * cache read: a denial is a fact about the caller, so caching it under a key that
 * does not name the caller would either hand a parent someone else's profile or
 * hand an admin a cached denial.
 */
const assertReadable = async (ref: string, tenantId: string, user: { role?: string; id?: string } | undefined) => {
  if (user?.role !== 'parent' || !user.id) return true;
  const rows = await db
    .select({ parentUserId: schema.parents.userId })
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .innerJoin(schema.parents, eq(schema.students.parentId, schema.parents.id))
    .where(and(...refConditions(ref, tenantId)))
    .limit(1);
  return rows[0]?.parentUserId === user.id;
};

// Redis keys are glob-matched by the write purges, so an unvalidated `:ref`
// segment must not carry `*` or `:`.
export const keySafeRef = (ref: string) => ref.replace(/[^A-Za-z0-9._@-]/g, '_').slice(0, 128);

export const studentProfileRoutes = new Elysia({ prefix: '/student-profile' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .get('/:ref', async ({ params: { ref }, query, tenantId, user, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!(await assertReadable(ref, tenantId, user))) {
        return errorResponse(set, 403, 'Access denied', 'STUDENT_ACCESS_DENIED');
      }

      const tab = typeof query.tab === 'string' ? query.tab : '';
      // Refused before the cache read. A tab outside the vocabulary has no key of its
      // own, so leaving it to fall through would answer the same URL with 400 or 200
      // depending on whether the header happened to be warm.
      if (tab && !isTab(tab)) return errorResponse(set, 400, 'Unknown profile tab', 'UNKNOWN_TAB');

      // Namespaced `students:` so the existing write purge clears these.
      const cacheKey = `students:profile:v1:${tenantId}:${keySafeRef(ref)}:${isTab(tab) ? tab : 'header'}`;
      const result = await dataCache.getOrSet(cacheKey, () => handleProfile(ref, tenantId, tab), 300_000);

      if (result.kind === 'not-found') return errorResponse(set, 404, 'Student profile not found', 'STUDENT_NOT_FOUND');
      if (result.kind === 'header') return { header: result.header, counts: result.counts };
      return { tab: result.tab, ...result.payload };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/student-profile/:ref', tenantId });
      return errorResponse(set, 500, 'Internal server error', 'INTERNAL_SERVER_ERROR');
    }
  });
