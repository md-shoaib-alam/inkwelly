import { db } from '../../lib/db';
import { hashPassword } from '../../lib/passwords';
import * as schema from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { loadCachedYearRows } from '../../lib/dashboardCache';
import { captureError } from '../../lib/monitoring/posthog';
import { createAuditLog } from '../../lib/audit-helper';
import Elysia, { t } from 'elysia';
import { formatDate } from '../../lib/date-utils';
import { academicYearIsKnown } from './student.create.guards';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

const admissionBodySchema = t.Object({
  firstName: t.String({ minLength: 1, maxLength: 120 }),
  middleName: t.Optional(t.String()),
  lastName: t.Optional(t.String()),
  title: t.Optional(t.String()),
  classId: t.String({ minLength: 1 }),
  studentId: t.Optional(t.String()),
  admissionNo: t.Optional(t.String()),
  admissionDate: t.Optional(t.String()),
  peNumber: t.Optional(t.String()),
  abcId: t.Optional(t.String()),
  apaarId: t.Optional(t.String()),
  aadhaarNo: t.Optional(t.String()),
  dateOfBirth: t.Optional(t.String()),
  gender: t.Optional(t.String()),
  bloodGroup: t.Optional(t.String()),
  religion: t.Optional(t.String()),
  nationality: t.Optional(t.String()),
  motherTongue: t.Optional(t.String()),
  casteCategory: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  academicYear: t.Optional(t.String({ maxLength: 64 })),
  rollNumber: t.Optional(t.String({ maxLength: 64 })),
  registrationNo: t.Optional(t.String()),
  joiningDate: t.Optional(t.String()),
  remarks: t.Optional(t.String()),
  password: t.Optional(t.String())
});

class AdmissionRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

const mapAdmissionError = (error: unknown) => {
  if (error instanceof AdmissionRouteError) return error;
  if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
    return new AdmissionRouteError(409, 'DUPLICATE_RESOURCE', 'A record with the same unique value already exists');
  }
  return new AdmissionRouteError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
};

const clean = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const formatShortSchoolYear = (name: string | null | undefined): string => {
  const m = /^(\d{4})-(\d{4})$/.exec(name ?? '');
  if (!m || !m[1] || !m[2]) return name ?? '';
  return `${m[1]}-${m[2].slice(2)}`;
};

const generateUniqueStudentId = async (
  tx: any,
  provided: string | undefined,
  tenantId: string,
  academicYear: string,
  settings: typeof schema.studentIdSettings.$inferSelect | undefined
): Promise<string> => {
  const studentId = clean(provided);
  if (studentId) {
    const existing = await tx.query.users.findFirst({
      where: and(eq(schema.users.username, studentId), eq(schema.users.tenantId, tenantId))
    });
    if (existing) {
      throw new AdmissionRouteError(409, 'DUPLICATE_USERNAME', `The Student ID "${studentId}" is already taken.`);
    }
    return studentId;
  }

  const currentYear = String(new Date().getFullYear());
  const schoolYr = formatShortSchoolYear(academicYear);
  const schoolCode = settings?.schoolCode || '';

  if (settings?.studentIdEnabled) {
    const prefix = settings.studentIdPrefix || 'STU';
    const width = Math.min(10, Math.max(1, settings.studentIdNumberLength || 4));
    const format = settings.studentIdFormat || '{PREFIX}{YEAR}{SEQ}';
    const startFrom = settings.studentIdStartFrom ?? 1;

    // Count existing students in tenant to determine sequence
    const [countResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(
        settings.studentIdResetEveryYear
          ? and(eq(schema.users.tenantId, tenantId), eq(schema.students.academicYear, academicYear))
          : eq(schema.users.tenantId, tenantId)
      );

    const baseSeq = Math.max(startFrom, (countResult?.count ?? 0) + 1);

    for (let attempt = 0; attempt < 50; attempt++) {
      const seqStr = String(baseSeq + attempt).padStart(width, '0');
      const candidate = format
        .split('{PREFIX}').join(prefix)
        .split('{SCHOOL_CODE}').join(schoolCode)
        .split('{YEAR}').join(currentYear)
        .split('{SCHOOL_YEAR}').join(schoolYr)
        .split('{SEQ}').join(seqStr);

      const existing = await tx.query.users.findFirst({
        where: and(eq(schema.users.username, candidate), eq(schema.users.tenantId, tenantId))
      });
      if (!existing) return candidate;
    }
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `STU${currentYear}${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await tx.query.users.findFirst({
      where: and(eq(schema.users.username, candidate), eq(schema.users.tenantId, tenantId))
    });
    if (!existing) return candidate;
  }
  return `STU${currentYear}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
};

const generateUniqueAdmissionNo = async (
  tx: any,
  provided: string | undefined,
  tenantId: string,
  academicYear: string,
  settings: typeof schema.studentIdSettings.$inferSelect | undefined
): Promise<string> => {
  const admissionNo = clean(provided);
  if (admissionNo) {
    const existing = await tx.query.students.findFirst({
      where: eq(schema.students.admissionNo, admissionNo)
    });
    if (existing) {
      throw new AdmissionRouteError(409, 'DUPLICATE_ADMISSION_NO', `The Admission No. "${admissionNo}" is already used.`);
    }
    return admissionNo;
  }

  const currentYear = String(new Date().getFullYear());
  const schoolYr = formatShortSchoolYear(academicYear);
  const schoolCode = settings?.schoolCode || '';

  if (settings?.admissionNoEnabled) {
    const prefix = settings.admissionNoPrefix || 'ADM';
    const width = Math.min(10, Math.max(1, settings.admissionNoNumberLength || 4));
    const format = settings.admissionNoFormat || '{PREFIX}{YEAR}{SEQ}';
    const startFrom = settings.admissionNoStartFrom ?? 1;

    const [countResult] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.students)
      .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
      .where(
        settings.admissionNoResetEveryYear
          ? and(eq(schema.users.tenantId, tenantId), eq(schema.students.academicYear, academicYear))
          : eq(schema.users.tenantId, tenantId)
      );

    const baseSeq = Math.max(startFrom, (countResult?.count ?? 0) + 1);

    for (let attempt = 0; attempt < 50; attempt++) {
      const seqStr = String(baseSeq + attempt).padStart(width, '0');
      const candidate = format
        .split('{PREFIX}').join(prefix)
        .split('{SCHOOL_CODE}').join(schoolCode)
        .split('{YEAR}').join(currentYear)
        .split('{SCHOOL_YEAR}').join(schoolYr)
        .split('{SEQ}').join(seqStr);

      const existing = await tx.query.students.findFirst({
        where: eq(schema.students.admissionNo, candidate)
      });
      if (!existing) return candidate;
    }
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `ADM${currentYear}${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await tx.query.students.findFirst({
      where: eq(schema.students.admissionNo, candidate)
    });
    if (!existing) return candidate;
  }
  return `ADM${currentYear}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
};

const handleCreateAdmission = async (body: any, tenantId: string, user: any, request: any) => {
  const rawPassword = typeof body.password === 'string' ? body.password.trim() : '';
  if (rawPassword && !PASSWORD_STRENGTH_REGEX.test(rawPassword)) {
    throw new AdmissionRouteError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters and include letters and numbers');
  }

  const ownedYears = await loadCachedYearRows(tenantId);
  let academicYear: string;
  try {
    academicYear = academicYearIsKnown(
      body.academicYear,
      ownedYears.map((y) => y.name),
      ownedYears.find((y) => y.isCurrent)?.name,
    );
  } catch (err) {
    throw new AdmissionRouteError(400, 'INVALID_ACADEMIC_YEAR', (err as Error).message);
  }

  const fullName = [clean(body.firstName), clean(body.middleName), clean(body.lastName)].filter(Boolean).join(' ');
  if (!fullName) throw new AdmissionRouteError(400, 'NAME_REQUIRED', 'First name is required');

  const hashedPassword = await hashPassword(rawPassword || 'Student@123');

  const settings = await db.query.studentIdSettings.findFirst({
    where: eq(schema.studentIdSettings.tenantId, tenantId),
  });

  const result = await db.transaction(async (tx) => {
    const cls = await tx.query.classes.findFirst({
      where: and(eq(schema.classes.id, body.classId), eq(schema.classes.tenantId, tenantId))
    });
    if (!cls) throw new AdmissionRouteError(400, 'INVALID_CLASS', 'Invalid class for this tenant');

    const studentId = await generateUniqueStudentId(tx, body.studentId, tenantId, academicYear, settings);
    const admissionNo = await generateUniqueAdmissionNo(tx, body.admissionNo, tenantId, academicYear, settings);

    const studentEmail = clean(body.email) ?? `${studentId.toLowerCase()}@school.com`;
    const gender = ['male', 'female', 'other'].includes(body.gender) ? body.gender : 'male';

    const [newUser] = await tx.insert(schema.users).values({
      email: studentEmail,
      name: fullName,
      role: 'student',
      phone: clean(body.phone),
      username: studentId,
      password: hashedPassword,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    if (!newUser) throw new AdmissionRouteError(500, 'USER_CREATE_FAILED', 'Failed to create student user');

    const [student] = await tx.insert(schema.students).values({
      userId: newUser.id,
      rollNumber: clean(body.rollNumber) ?? studentId,
      classId: body.classId,
      academicYear,
      gender,
      dateOfBirth: clean(body.dateOfBirth),
      bloodGroup: clean(body.bloodGroup),
      admissionDate: clean(body.admissionDate) ?? formatDate(),
      admissionNo,
      title: clean(body.title),
      firstName: clean(body.firstName),
      middleName: clean(body.middleName),
      lastName: clean(body.lastName),
      peNumber: clean(body.peNumber),
      abcId: clean(body.abcId),
      apaarId: clean(body.apaarId),
      aadhaarNo: clean(body.aadhaarNo),
      religion: clean(body.religion),
      nationality: clean(body.nationality),
      motherTongue: clean(body.motherTongue),
      casteCategory: clean(body.casteCategory),
      registrationNo: clean(body.registrationNo),
      joiningDate: clean(body.joiningDate),
      remarks: clean(body.remarks),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    if (!student) throw new AdmissionRouteError(500, 'STUDENT_CREATE_FAILED', 'Failed to create student profile');

    return { id: student.id, name: newUser.name, username: newUser.username, admissionNo };
  });

  await createAuditLog({
    action: 'CREATE_ADMISSION',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id: result.id,
      name: result.name,
      admissionNo: result.admissionNo,
      classId: body.classId
    }
  });

  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  return result;
};

export const admissionsRoutes = new Elysia({ prefix: '/admissions' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .post('/', async ({ body, tenantId, user, request, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        return errorResponse(set, 403, 'Access denied: staff or administrator privileges required', 'FORBIDDEN');
      }
      return await handleCreateAdmission(body, tenantId, user, request);
    } catch (error) {
      captureError(error, { method: 'POST', path: '/admissions', tenantId });
      const mapped = mapAdmissionError(error);
      return errorResponse(set, mapped.status, mapped.message, mapped.code);
    }
  }, {
    body: admissionBodySchema
  });
