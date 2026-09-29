import { db } from '../../lib/db';
import { hashPassword } from '../../lib/passwords';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, ilike, inArray, isNull, isNotNull } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { dataCache } from '../../lib/cache';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { createAuditLog } from '../../lib/audit-helper';
import Elysia, { t } from 'elysia';
import { formatDate } from '../../lib/date-utils';
import { StudentService } from './student.service';
import { academicYearIsKnown } from './student.create.guards';
import { StudentUpdateAuditError, studentUpdateAuditDetails } from './student-update.audit';

const PHONE_PATTERN = '^\\+?[0-9\\-()\\s]{7,20}$';
const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$';
const USERNAME_PATTERN = '^[a-zA-Z0-9._-]{3,32}$';
const PASSWORD_STRENGTH_PATTERN = '^(?=.*[A-Za-z])(?=.*\\d).{8,128}$';
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

const studentCreateBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 120 }),
  classId: t.String({ minLength: 1 }),
  rollNumber: t.String({ minLength: 1, maxLength: 64 }),
  password: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  username: t.Optional(t.String()),
  gender: t.Optional(t.String()),
  dateOfBirth: t.Optional(t.String()),
  admissionDate: t.Optional(t.String()),
  bloodGroup: t.Optional(t.String()),
  parentId: t.Optional(t.String()),
  transportEnabled: t.Optional(t.Boolean()),
  routeId: t.Optional(t.String()),
  pickupPoint: t.Optional(t.String()),
  newPickupPointFee: t.Optional(t.Union([
    t.Number(),
    t.String()
  ])),
  academicYear: t.Optional(t.String({ maxLength: 64 }))
});

const studentUpdateBodySchema = t.Object({
  id: t.String({ minLength: 1 }),
  name: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  rollNumber: t.Optional(t.String()),
  classId: t.Optional(t.String()),
  gender: t.Optional(t.String()),
  dateOfBirth: t.Optional(t.String()),
  bloodGroup: t.Optional(t.String()),
  status: t.Optional(t.String()),
  transportEnabled: t.Optional(t.Boolean()),
  routeId: t.Optional(t.String()),
  pickupPoint: t.Optional(t.String()),
  newPickupPointFee: t.Optional(t.Union([
    t.Number(),
    t.String()
  ])),
  // Shape and length rules for these three live in student-update.audit.ts so a
  // bad value reports the code the screen can show, not Elysia's generic error.
  effectiveDate: t.Optional(t.String()),
  reason: t.Optional(t.String()),
  remarks: t.Optional(t.String())
});

class StudentRouteError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type TransportSyncInput = {
  tenantId: string;
  studentId: string;
  transportEnabled?: boolean;
  routeId?: string;
  pickupPoint?: string;
  newPickupPointFee?: number | string;
};

interface StopObject {
  name: string;
  fee?: unknown;
}

const errorResponse = (set: { status?: number | string }, status: number, message: string, code: string) => {
  set.status = status;
  return { success: false, error: message, code };
};

const isDuplicateKeyError = (error: unknown): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
};

const mapStudentRouteError = (error: unknown) => {
  if (error instanceof StudentRouteError) return error;
  if (error instanceof StudentUpdateAuditError) {
    return new StudentRouteError(400, error.code, error.message);
  }
  if (isDuplicateKeyError(error)) {
    return new StudentRouteError(409, 'DUPLICATE_RESOURCE', 'A record with the same unique value already exists');
  }
  return new StudentRouteError(500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
};

const isValidStopObject = (stop: unknown): stop is StopObject => {
  return typeof stop === 'object' && stop !== null && 'name' in stop && typeof (stop as { name?: unknown }).name === 'string';
};

const parseRouteStops = (stops: string | null, defaultFee: number) => {
  try {
    const rawStops = typeof stops === 'string' ? JSON.parse(stops) : [];
    if (!Array.isArray(rawStops)) return [] as Array<{ name: string; fee: number }>;
    return rawStops
      .map((stop) => {
        if (typeof stop === 'string') return { name: stop, fee: defaultFee };
        if (isValidStopObject(stop)) {
          return {
            name: stop.name,
            fee: Number(stop.fee ?? defaultFee)
          };
        }
        return null;
      })
      .filter((stop): stop is { name: string; fee: number } => stop !== null);
  } catch {
    return [] as Array<{ name: string; fee: number }>;
  }
};

const disableStudentTransport = async (tx: DbTx, tenantId: string, studentId: string) => {
  await tx.delete(schema.transportAssignments).where(eq(schema.transportAssignments.studentId, studentId));
  const category = await tx.query.feeCategories.findFirst({
    where: and(eq(schema.feeCategories.tenantId, tenantId), eq(schema.feeCategories.code, 'TRANSPORT'))
  });
  if (category) {
    await tx.delete(schema.fees).where(and(
      eq(schema.fees.studentId, studentId),
      eq(schema.fees.feeCategoryId, category.id),
      eq(schema.fees.status, 'pending')
    ));
  }
};

const enableStudentTransport = async (tx: DbTx, input: TransportSyncInput) => {
  const { tenantId, studentId, routeId, pickupPoint } = input;
  const normalizedRouteId = typeof routeId === 'string' ? routeId.trim() : '';
  const normalizedPickupPoint = typeof pickupPoint === 'string' ? pickupPoint.trim() : '';

  if (!normalizedRouteId) {
    throw new StudentRouteError(400, 'INVALID_TRANSPORT_ROUTE', 'Route ID is required when transport is enabled');
  }

  const route = await tx.query.transportRoutes.findFirst({
    where: and(eq(schema.transportRoutes.id, normalizedRouteId), eq(schema.transportRoutes.tenantId, tenantId))
  });
  if (!route) {
    throw new StudentRouteError(400, 'INVALID_TRANSPORT_ROUTE', 'Invalid transport route for this tenant');
  }

  const parsedStops = parseRouteStops(route.stops, route.fee);
  if (normalizedPickupPoint) {
    const stopExists = parsedStops.some((stop) => stop.name.toLowerCase() === normalizedPickupPoint.toLowerCase());
    if (!stopExists) {
      const stopFee = Number(input.newPickupPointFee) || route.fee;
      parsedStops.push({ name: normalizedPickupPoint, fee: stopFee });
      await tx.update(schema.transportRoutes)
        .set({ stops: JSON.stringify(parsedStops), updatedAt: new Date() })
        .where(eq(schema.transportRoutes.id, normalizedRouteId));
    }
  }

  await tx.insert(schema.transportAssignments).values({
    studentId,
    routeId: normalizedRouteId,
    pickupPoint: normalizedPickupPoint || null,
    startDate: formatDate()
  }).onConflictDoUpdate({
    target: schema.transportAssignments.studentId,
    set: {
      routeId: normalizedRouteId,
      pickupPoint: normalizedPickupPoint || null,
      updatedAt: new Date()
    }
  });

  let category = await tx.query.feeCategories.findFirst({
    where: and(eq(schema.feeCategories.tenantId, tenantId), eq(schema.feeCategories.code, 'TRANSPORT'))
  });
  if (!category) {
    const [newCategory] = await tx.insert(schema.feeCategories).values({
      tenantId,
      name: 'Transport Fee',
      code: 'TRANSPORT',
      description: 'Automatically created transport fee category',
      frequency: 'monthly',
      status: 'active'
    }).returning();
    category = newCategory;
  }
  if (!category) return;

  let targetFee = route.fee;
  if (normalizedPickupPoint) {
    const matchedStop = parsedStops.find((stop) => stop.name.toLowerCase() === normalizedPickupPoint.toLowerCase());
    if (matchedStop && Number.isFinite(matchedStop.fee)) targetFee = Number(matchedStop.fee);
  }

  const feeType = normalizedPickupPoint ? `${route.name} (${normalizedPickupPoint}) Transport Fee` : `${route.name} Transport Fee`;
  const existingPendingFee = await tx.query.fees.findFirst({
    where: and(
      eq(schema.fees.studentId, studentId),
      eq(schema.fees.feeCategoryId, category.id),
      eq(schema.fees.status, 'pending')
    )
  });

  if (existingPendingFee) {
    await tx.update(schema.fees).set({
      amount: targetFee,
      type: feeType,
      dueDate: formatDate(),
      updatedAt: new Date()
    }).where(eq(schema.fees.id, existingPendingFee.id));
  } else {
    await tx.insert(schema.fees).values({
      tenantId,
      studentId,
      feeCategoryId: category.id,
      amount: targetFee,
      type: feeType,
      dueDate: formatDate(),
      status: 'pending'
    });
  }
};

const syncStudentTransportAndFees = async (tx: DbTx, input: TransportSyncInput) => {
  const transportEnabled = Boolean(input.transportEnabled);
  if (!transportEnabled) {
    await disableStudentTransport(tx, input.tenantId, input.studentId);
  } else {
    await enableStudentTransport(tx, input);
  }
};

const generateUniqueUsername = async (tx: DbTx, username: string | undefined, tenantId: string): Promise<string> => {
  let studentUsername = typeof username === 'string' ? username.trim() : '';
  if (studentUsername) {
    const existingUser = await tx.query.users.findFirst({
      where: and(eq(schema.users.username, studentUsername), eq(schema.users.tenantId, tenantId))
    });
    if (existingUser) {
      throw new StudentRouteError(409, 'DUPLICATE_USERNAME', `The School ID "${studentUsername}" is already taken.`);
    }
    return studentUsername;
  }

  const currentYear = new Date().getFullYear();
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    studentUsername = `STU${currentYear}${randomNum}`;
    const existingUser = await tx.query.users.findFirst({
      where: and(eq(schema.users.username, studentUsername), eq(schema.users.tenantId, tenantId))
    });
    if (!existingUser) isUnique = true;
    attempts++;
  }
  // Fallback: use UUID slice — guaranteed unique, no collision risk
  if (!isUnique) studentUsername = `STU${currentYear}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  return studentUsername;
};

const handleGetStudents = async (query: any, tenantId: string, user: any) => {
  // 🚀 LIGHTWEIGHT MODE: For dropdowns and linking
  if (query.mode === 'min') {
    return await StudentService.listMin({
      tenantId,
      classId: query.classId && query.classId !== 'all' ? query.classId : undefined,
      search: query.search || undefined,
      status: query.status || 'active',
      unlinkedOnly: query.unlinkedOnly === 'true',
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 50,
      callerUserId: user.id,
      callerRole: user.role,
    });
  }

  // FULL MODE: paginated list with all fields
  const { page = 1, limit = 50, search, classId, status = 'active', gender } = query;
  return await StudentService.list({
    tenantId,
    classId,
    search,
    status,
    gender,
    page: Number(page),
    limit: Number(limit),
    callerUserId: user.id,
    callerRole: user.role,
  });
};

const handleCreateStudent = async (body: any, tenantId: string, user: any, request: any) => {
  const data = body;
  const rawPassword = typeof data.password === 'string' ? data.password.trim() : '';
  if (rawPassword && !PASSWORD_STRENGTH_REGEX.test(rawPassword)) {
    throw new StudentRouteError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters and include letters and numbers');
  }
  if (data.transportEnabled && !data.routeId) {
    throw new StudentRouteError(400, 'INVALID_TRANSPORT_ROUTE', 'Route ID is required when transport is enabled');
  }

  // Resolve the partition key before anything is written, so a student never
  // lands under the schema's literal default year.
  const ownedYears = await db.query.academicYears.findMany({
    where: eq(schema.academicYears.tenantId, tenantId),
    columns: { name: true, isCurrent: true },
  });
  let academicYear: string;
  try {
    academicYear = academicYearIsKnown(
      data.academicYear,
      ownedYears.map((y) => y.name),
      ownedYears.find((y) => y.isCurrent)?.name,
    );
  } catch (err) {
    throw new StudentRouteError(400, 'INVALID_ACADEMIC_YEAR', (err as Error).message);
  }

  const hashedPassword = await hashPassword(rawPassword || 'Student@123');
  const result = await db.transaction(async (tx) => {
    const cls = await tx.query.classes.findFirst({
      where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId))
    });
    if (!cls) throw new StudentRouteError(400, 'INVALID_CLASS', 'Invalid class for this tenant');

    const cleanParentId = data.parentId && data.parentId.trim() ? data.parentId.trim() : null;
    if (cleanParentId) {
      const parent = await tx.query.parents.findFirst({
        where: eq(schema.parents.id, cleanParentId),
        with: { user: { columns: { tenantId: true } } }
      });
      if (!parent) throw new StudentRouteError(404, 'PARENT_NOT_FOUND', 'Parent not found');
      if (parent.user.tenantId !== tenantId) {
        throw new StudentRouteError(403, 'PARENT_ACCESS_DENIED', 'Parent does not belong to this tenant');
      }
    }

    const studentUsername = await generateUniqueUsername(tx, data.username, tenantId);
    const studentEmail = data.email && data.email.trim() ? data.email.trim() : `${studentUsername.toLowerCase()}@school.com`;
    const cleanPhone = data.phone && data.phone.trim() ? data.phone.trim() : null;
    const cleanDob = data.dateOfBirth && data.dateOfBirth.trim() ? data.dateOfBirth.trim() : null;
    const cleanBloodGroup = data.bloodGroup && data.bloodGroup.trim() ? data.bloodGroup.trim() : null;
    const cleanAdmissionDate = data.admissionDate && data.admissionDate.trim() ? data.admissionDate.trim() : formatDate();
    const cleanGender = data.gender && ['male', 'female', 'other'].includes(data.gender) ? data.gender : 'male';
    const cleanRouteId = data.transportEnabled && data.routeId && data.routeId.trim() ? data.routeId.trim() : undefined;
    const cleanPickupPoint = data.transportEnabled && data.pickupPoint && data.pickupPoint.trim() ? data.pickupPoint.trim() : undefined;

    const [newUser] = await tx.insert(schema.users).values({
      email: studentEmail,
      name: data.name.trim(),
      role: 'student',
      phone: cleanPhone,
      username: studentUsername,
      password: hashedPassword,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    if (!newUser) throw new StudentRouteError(500, 'USER_CREATE_FAILED', 'Failed to create student user');

    const [student] = await tx.insert(schema.students).values({
      userId: newUser.id,
      rollNumber: data.rollNumber.trim(),
      classId: data.classId,
      academicYear,
      parentId: cleanParentId,
      gender: cleanGender,
      dateOfBirth: cleanDob,
      bloodGroup: cleanBloodGroup,
      admissionDate: cleanAdmissionDate,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    if (!student) throw new StudentRouteError(500, 'STUDENT_CREATE_FAILED', 'Failed to create student profile');

    await syncStudentTransportAndFees(tx, {
      tenantId,
      studentId: student.id,
      transportEnabled: Boolean(data.transportEnabled),
      routeId: cleanRouteId,
      pickupPoint: cleanPickupPoint,
      newPickupPointFee: data.newPickupPointFee
    });

    return { id: student.id, name: newUser.name, username: newUser.username };
  });

  posthog.capture({
    distinctId: tenantId || 'system',
    event: 'student_created',
    properties: {
      tenantId,
      studentName: data.name,
      classId: data.classId
    }
  });

  await createAuditLog({
    action: 'CREATE_STUDENT',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id: result.id,
      name: result.name,
      classId: data.classId
    }
  });

  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  return result;
};

const handleUpdateStudent = async (body: any, tenantId: string, user: any, request: any) => {
  const data = body;
  if (data.transportEnabled && !data.routeId) {
    throw new StudentRouteError(400, 'INVALID_TRANSPORT_ROUTE', 'Route ID is required when transport is enabled');
  }

  // Read before the write so a bad effective date fails the request instead of
  // leaving a class move on record that the audit trail cannot show.
  const changeDetails = studentUpdateAuditDetails(data);

  const student = await db.query.students.findFirst({
    where: eq(schema.students.id, data.id),
    with: { user: true }
  });
  if (!student) throw new StudentRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  if (student.user.tenantId !== tenantId) throw new StudentRouteError(403, 'STUDENT_ACCESS_DENIED', 'Access denied');

  await db.transaction(async (tx) => {
    if (data.classId) {
      const cls = await tx.query.classes.findFirst({
        where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId))
      });
      if (!cls) throw new StudentRouteError(400, 'INVALID_CLASS', 'Invalid class for this tenant');
    }

    const userUpdate: Record<string, unknown> = {};
    if (typeof data.name === 'string') userUpdate.name = data.name.trim();
    if (typeof data.phone === 'string') userUpdate.phone = data.phone.trim() || null;
    if (typeof data.email === 'string') {
      const trimmedEmail = data.email.trim();
      userUpdate.email = trimmedEmail || (student.user.email || `${student.user.username?.toLowerCase() || 'stu'}@school.com`);
    }
    if (Object.keys(userUpdate).length > 0) {
      userUpdate.updatedAt = new Date();
      await tx.update(schema.users).set(userUpdate).where(eq(schema.users.id, student.userId));
    }

    const studentUpdate: Record<string, unknown> = {};
    if (typeof data.rollNumber === 'string') studentUpdate.rollNumber = data.rollNumber.trim();
    if (typeof data.classId === 'string') studentUpdate.classId = data.classId;
    if (typeof data.gender === 'string') studentUpdate.gender = data.gender || 'male';
    if (typeof data.dateOfBirth === 'string') studentUpdate.dateOfBirth = data.dateOfBirth.trim() || null;
    if (typeof data.bloodGroup === 'string') studentUpdate.bloodGroup = data.bloodGroup.trim() || null;
    if (typeof data.status === 'string') studentUpdate.status = data.status;
    if (Object.keys(studentUpdate).length > 0) {
      studentUpdate.updatedAt = new Date();
      await tx.update(schema.students).set(studentUpdate).where(eq(schema.students.id, data.id));
    }

    await syncStudentTransportAndFees(tx, {
      tenantId,
      studentId: data.id,
      transportEnabled: data.transportEnabled,
      routeId: data.routeId,
      pickupPoint: data.pickupPoint,
      newPickupPointFee: data.newPickupPointFee
    });
  });

  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  posthog.capture({
    distinctId: tenantId || 'system',
    event: 'student_updated',
    properties: {
      tenantId,
      studentId: data.id,
      updatedFields: Object.keys(data).filter(k => k !== 'id')
    }
  });

  await createAuditLog({
    action: 'UPDATE_STUDENT',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id: data.id,
      oldData: {
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        rollNumber: student.rollNumber,
        classId: student.classId
      },
      newData: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        rollNumber: data.rollNumber,
        classId: data.classId,
        transportEnabled: data.transportEnabled,
        routeId: data.routeId,
        pickupPoint: data.pickupPoint,
        // Inside newData, not beside it: audit-helper reads only `id`, `oldData`
        // and `newData` out of these details before the queue serialises the job,
        // so anything else here is dropped before it can reach the audit row.
        ...changeDetails
      }
    }
  });

  return { success: true };
};

const handleDeleteStudent = async (id: string, tenantId: string, user: any, request: any, reason?: string) => {
  const student = await db.query.students.findFirst({ 
    where: eq(schema.students.id, id), 
    with: { user: true } 
  });

  if (!student) throw new StudentRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  if (student.user.tenantId !== tenantId) throw new StudentRouteError(403, 'STUDENT_ACCESS_DENIED', 'Access denied');
  if (student.deletedAt) throw new StudentRouteError(409, 'STUDENT_ALREADY_DELETED', 'Student is already in the trash');

  const deletedAt = new Date();
  await db.update(schema.students).set({
    deletedAt,
    deletedBy: user.id,
    deletionReason: reason?.trim() ? reason.trim().slice(0, 500) : null,
    updatedAt: deletedAt,
  }).where(eq(schema.students.id, id));

  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  posthog.capture({
    distinctId: tenantId || 'system',
    event: 'student_deleted',
    properties: {
      tenantId,
      studentId: id,
      studentName: student.user.name
    }
  });

  await createAuditLog({
    action: 'DELETE_STUDENT',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      classId: student.classId,
      reason: reason?.trim() || null,
      deletedAt: deletedAt.toISOString()
    }
  });

  return { success: true };
};

const handlePermanentDeleteStudent = async (id: string, tenantId: string, user: any, request: any) => {
  const student = await db.query.students.findFirst({ 
    where: eq(schema.students.id, id), 
    with: { user: true } 
  });

  if (!student) throw new StudentRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  if (student.user.tenantId !== tenantId) throw new StudentRouteError(403, 'STUDENT_ACCESS_DENIED', 'Access denied');

  await db.transaction(async (tx) => {
    // 1. Remove Student-specific relationships
    await tx.delete(schema.attendance).where(eq(schema.attendance.studentId, id));
    await tx.delete(schema.grades).where(eq(schema.grades.studentId, id));
    await tx.delete(schema.submissions).where(eq(schema.submissions.studentId, id));
    await tx.delete(schema.fees).where(eq(schema.fees.studentId, id));
    await tx.delete(schema.promotions).where(eq(schema.promotions.studentId, id));
    await tx.delete(schema.certificates).where(eq(schema.certificates.studentId, id));

    // 2. Remove User-level relationships (system activity)
    await tx.delete(schema.ticketMessages).where(eq(schema.ticketMessages.userId, student.userId));
    await tx.delete(schema.tickets).where(eq(schema.tickets.createdBy, student.userId));
    await tx.delete(schema.staffAttendance).where(eq(schema.staffAttendance.userId, student.userId));
    await tx.delete(schema.leaves).where(eq(schema.leaves.userId, student.userId));
    
    // 3. Delete core records
    await tx.delete(schema.students).where(eq(schema.students.id, id));
    await tx.delete(schema.users).where(eq(schema.users.id, student.userId));
  });

  // BROAD PURGE
  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  posthog.capture({
    distinctId: tenantId || 'system',
    event: 'student_deleted',
    properties: {
      tenantId,
      studentId: id,
      studentName: student.user.name,
      permanent: true
    }
  });

  await createAuditLog({
    action: 'PERMANENT_DELETE_STUDENT',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      classId: student.classId,
      deletedAt: student.deletedAt?.toISOString() || null
    }
  });

  return { success: true };
};

const handleRestoreStudent = async (id: string, tenantId: string, user: any, request: any) => {
  const student = await db.query.students.findFirst({
    where: eq(schema.students.id, id),
    with: { user: true }
  });

  if (!student) throw new StudentRouteError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  if (student.user.tenantId !== tenantId) throw new StudentRouteError(403, 'STUDENT_ACCESS_DENIED', 'Access denied');
  if (!student.deletedAt) throw new StudentRouteError(409, 'STUDENT_NOT_IN_TRASH', 'Student is not in the trash');

  await db.update(schema.students).set({
    deletedAt: null,
    deletedBy: null,
    deletionReason: null,
    updatedAt: new Date(),
  }).where(eq(schema.students.id, id));

  await dataCache.deleteMatch([
    `*students*${tenantId}*`,
    `dashboard:${tenantId}:*`
  ]);

  await createAuditLog({
    action: 'RESTORE_STUDENT',
    resource: 'student',
    userId: user.id,
    userRole: user.role,
    tenantId,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
    details: {
      id,
      name: student.user.name,
      rollNumber: student.rollNumber,
      classId: student.classId
    }
  });

  return { success: true };
};

const handleGetDeletedStudents = async (search: string | undefined, tenantId: string) => {
  const conditions: any[] = [
    isNotNull(schema.students.deletedAt),
    sql`EXISTS (
      SELECT 1 FROM ${schema.users} u
      WHERE u.id = ${schema.students.userId} AND u."tenantId" = ${tenantId}
    )`
  ];

  if (search?.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      or(
        sql`EXISTS (
          SELECT 1 FROM ${schema.users} u
          WHERE u.id = ${schema.students.userId}
            AND (u.name ILIKE ${pattern} OR u.username ILIKE ${pattern})
        )`,
        ilike(schema.students.rollNumber, pattern),
      )!
    );
  }

  const rows = await db.query.students.findMany({
    where: and(...conditions),
    with: {
      user: { columns: { name: true, username: true, email: true, avatar: true } },
      class: { columns: { name: true, section: true } },
    },
    orderBy: desc(schema.students.deletedAt),
    limit: 500,
  });

  return {
    items: rows.map((s: any) => ({
      id: s.id,
      name: s.user?.name || 'Unknown',
      username: s.user?.username || '',
      avatar: s.user?.avatar || null,
      rollNumber: s.rollNumber,
      className: s.class ? `${s.class.name} - ${s.class.section}` : 'Unassigned',
      deletedAt: s.deletedAt,
      deletionReason: s.deletionReason,
    })),
    total: rows.length,
  };
};

// --- ROUTES ---

export const studentsRoutes = new Elysia({ prefix: '/students' })
  .use(requireAuth)
  .use(requirePermission('students'))
  .get('/', async ({ query, tenantId, set, user }) => {
    try {
      console.log("[INFO] Students GET Route Hit:", { tenantId, userRole: user?.role, userId: user?.id, query });
      if (!tenantId) { 
        console.log("[WARN] 403: Tenant ID is missing!");
        set.status = 403; 
        return { error: 'Tenant ID is required' }; 
      }
      return await handleGetStudents(query, tenantId, user);
    } catch (error) {
      console.error("[ERROR] GET /students Error:", error);
      captureError(error, { method: 'GET', path: '/students', tenantId });
      set.status = 500;
      return { error: 'Failed to load students' };
    }
  })
  .get('/me', async ({ tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      
      const student = await db.query.students.findFirst({
        where: and(
          eq(schema.students.userId, user.id),
          isNull(schema.students.deletedAt)
        ),
        with: {
          user: { columns: { name: true, email: true, phone: true, avatar: true } },
          class: { columns: { name: true, section: true } },
          parent: { with: { user: { columns: { name: true, email: true } } } },
          transport: true
        }
      });

      if (!student) {
        set.status = 404;
        return { error: 'Student profile not found' };
      }

      return {
        id: student.id,
        userId: student.userId,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        avatar: student.user.avatar,
        rollNumber: student.rollNumber,
        className: student.class ? `${student.class.name}-${student.class.section}` : 'Unassigned',
        classId: student.classId,
        parentId: student.parentId,
        parentName: student.parent?.user.name,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        admissionDate: student.admissionDate,
        transport: student.transport
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/students/me', tenantId });
      set.status = 500;
      return { error: 'Failed to load profile' };
    }
  })
  .get('/trash', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      return await handleGetDeletedStudents(query.search as string | undefined, tenantId);
    } catch (error) {
      captureError(error, { method: 'GET', path: '/students/trash', tenantId });
      set.status = 500;
      return { error: 'Failed to load trash' };
    }
  })
  .get('/:id', async ({ params: { id }, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      
      const student = await db.query.students.findFirst({
        where: eq(schema.students.id, id),
        with: {
          user: { columns: { name: true, email: true, phone: true, username: true, avatar: true, tenantId: true } },
          class: { columns: { name: true, section: true } },
          parent: { with: { user: { columns: { name: true, email: true } } } },
          transport: true
        }
      });

      if (!student) {
        set.status = 404;
        return { error: 'Student profile not found' };
      }

      // SECURITY: Check tenant
      if (student.user.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Access denied' };
      }

      // SECURITY: If parent, check if it's their child
      if (user.role === 'parent') {
        const isChild = await db.query.parents.findFirst({
          where: and(eq(schema.parents.id, student.parentId || ''), eq(schema.parents.userId, user.id))
        });
        if (!isChild) {
          set.status = 403;
          return { error: 'Access denied' };
        }
      }

      // Fetch siblings (other students sharing the same parentId, same tenant)
      let siblings: Array<{ id: string; name: string; className: string }> = [];
      if (student.parentId) {
        const siblingRecords = await db.query.students.findMany({
          where: and(
            eq(schema.students.parentId, student.parentId),
            // 🛡️ SECURITY: Ensure siblings are from the same tenant
            sql`EXISTS (
              SELECT 1 FROM ${schema.users} u
              WHERE u.id = ${schema.students.userId} AND u."tenantId" = ${tenantId!}
            )`
          ),
          with: {
            user: { columns: { name: true } },
            class: { columns: { name: true, section: true } }
          }
        });
        siblings = siblingRecords
          .filter(sib => sib.id !== id)
          .map(sib => ({
            id: sib.id,
            name: sib.user.name,
            className: sib.class ? `${sib.class.name}-${sib.class.section}` : 'Unassigned'
          }));
      }

      return {
        id: student.id,
        userId: student.userId,
        name: student.user.name,
        email: student.user.email,
        username: student.user.username,
        phone: student.user.phone,
        avatar: student.user.avatar,
        rollNumber: student.rollNumber,
        className: student.class ? `${student.class.name}-${student.class.section}` : 'Unassigned',
        classId: student.classId,
        parentId: student.parentId,
        parentName: student.parent?.user.name,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        bloodGroup: student.bloodGroup,
        admissionDate: student.admissionDate,
        transport: student.transport,
        status: student.status,
        siblings
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/students/:id', tenantId });
      set.status = 500;
      return { error: 'Failed to load student profile' };
    }
  })
  .post('/', async ({ body, tenantId, user, request, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        return errorResponse(set, 403, 'Access denied: staff or administrator privileges required', 'FORBIDDEN');
      }
      return await handleCreateStudent(body, tenantId, user, request);
    } catch (error) {
      captureError(error, { method: 'POST', path: '/students', tenantId });
      const mapped = mapStudentRouteError(error);
      return errorResponse(set, mapped.status, mapped.message, mapped.code);
    }
  }, {
    body: studentCreateBodySchema
  })
  .put('/', async ({ body, tenantId, user, request, set }) => {
    try {
      if (!tenantId) return errorResponse(set, 403, 'Tenant ID is required', 'TENANT_REQUIRED');
      if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
        return errorResponse(set, 403, 'Access denied: staff or administrator privileges required', 'FORBIDDEN');
      }
      return await handleUpdateStudent(body, tenantId, user, request);
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/students', tenantId });
      const mapped = mapStudentRouteError(error);
      return errorResponse(set, mapped.status, mapped.message, mapped.code);
    }
  }, {
    body: studentUpdateBodySchema
  })
  .delete('/', async ({ query, tenantId, user, request, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }
      return await handleDeleteStudent(id, tenantId, user, request, query.reason as string | undefined);
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/students', tenantId });
      // handleDeleteStudent reports expected failures as StudentRouteError with
      // an authored message; this catch used to flatten them all to 500.
      if (error instanceof StudentRouteError) {
        set.status = error.status;
        return { error: error.message, code: error.code };
      }
      set.status = 500;
      return { error: 'Failed to delete student' };
    }
  })
  .post('/restore', async ({ body, tenantId, user, request, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const id = (body as any)?.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }
      return await handleRestoreStudent(id, tenantId, user, request);
    } catch (error: any) {
      captureError(error, { method: 'POST', path: '/students/restore', tenantId });
      if (error instanceof StudentRouteError) {
        set.status = error.status;
        return { error: error.message, code: error.code };
      }
      set.status = 500;
      return { error: 'Failed to restore student' };
    }
  }, {
    body: t.Object({ id: t.String({ minLength: 1 }) })
  })
  .delete('/permanent', async ({ query, tenantId, user, request, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant ID is required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }
      return await handlePermanentDeleteStudent(id, tenantId, user, request);
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/students/permanent', tenantId });
      if (error instanceof StudentRouteError) {
        set.status = error.status;
        return { error: error.message, code: error.code };
      }
      set.status = 500;
      return { error: 'Failed to delete student permanently' };
    }
  });
