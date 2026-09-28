import { Elysia, t } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, count, like } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const certificatesRoutes = new Elysia({ prefix: '/certificates' })
  .use(requireAuth)
  .use(requirePermission('certificates'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const page = parseInt((query as any).page || '1');
      const limit = parseInt((query as any).limit || '50');
      const offset = (page - 1) * limit;

      const [records, totalResult] = await Promise.all([
        db.query.certificates.findMany({
          where: eq(schema.certificates.tenantId, tenantId as string),
          with: {
            student: {
              with: {
                user: true,
                class: true,
                parent: { with: { user: true } },
              },
            },
          },
          orderBy: [desc(schema.certificates.createdAt)],
          offset,
          limit
        }),
        db.select({ count: count() }).from(schema.certificates).where(eq(schema.certificates.tenantId, tenantId as string))
      ]);

      const total = Number(totalResult[0]?.count || 0);

      return {
        items: records.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          certificateType: r.certificateType,
          certificateNo: r.certificateNo,
          issueDate: r.issueDate,
          content: JSON.parse(r.content || '{}'),
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          student: {
            id: r.student.id,
            rollNumber: r.student.rollNumber,
            dateOfBirth: r.student.dateOfBirth,
            gender: r.student.gender,
            bloodGroup: r.student.bloodGroup,
            admissionDate: r.student.admissionDate,
            user: {
              id: r.student.user.id,
              name: r.student.user.name,
              email: r.student.user.email,
            },
            class: r.student.class ? {
              id: r.student.class.id,
              name: r.student.class.name,
              section: r.student.class.section,
              grade: r.student.class.grade,
            } : null,
          },
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/certificates', tenantId });
      set.status = 500;
      return { error: 'Failed to load certificates' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { studentId, certificateType, issueDate, content } = body as any;

      // 1. Get current student data for snapshot
      const student = await db.query.students.findFirst({
        where: eq(schema.students.id, studentId),
        with: { user: true, class: true, parent: { with: { user: true } } },
      });

      // Student tenancy lives on the joined User row, so cross-tenant ids have
      // to be rejected here rather than in the WHERE clause.
      if (!student || student.user?.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Student not found' };
      }

      // 2. Generate Certificate Number, sequential within this school's register
      const year = new Date().getFullYear();
      const prefix = `CERT/${year}/`;
      const [highest] = await db.query.certificates.findMany({
        columns: { certificateNo: true },
        where: and(
          eq(schema.certificates.tenantId, tenantId as string),
          like(schema.certificates.certificateNo, `${prefix}%`),
        ),
        orderBy: [desc(schema.certificates.certificateNo)],
        limit: 1,
      });
      // The number only has to be unique per tenant (Certificate_tenantId_certificateNo_unique).
      // It used to be derived from a per-tenant COUNT against a platform-wide UNIQUE
      // constraint, so the second school's first certificate collided with the
      // first school's and every insert after that returned 500.
      let seq = parseInt((highest?.certificateNo || `${prefix}0`).slice(prefix.length), 10);
      if (!Number.isFinite(seq)) seq = 0;

      // 3. Prepare snapshot content
      const snapshot = {
        studentName: student.user.name,
        studentEmail: student.user.email,
        rollNumber: student.rollNumber,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        bloodGroup: student.bloodGroup,
        admissionDate: student.admissionDate,
        parentName: student.parent?.user?.name || '',
        class: student.class ? {
          id: student.class.id,
          name: student.class.name,
          section: student.class.section,
          grade: student.class.grade,
        } : null,
        ...content, // include extra notes
      };

      // 4. Create record — retry only on number collision (concurrent requests
      // in the same tenant can read the same `seq`).
      let record: typeof schema.certificates.$inferSelect | undefined;
      for (let attempt = 1; attempt <= 5 && !record; attempt++) {
        const certNo = `${prefix}${(++seq).toString().padStart(4, '0')}`;
        try {
          [record] = await db.insert(schema.certificates).values({
            tenantId: tenantId as string,
            studentId,
            certificateType,
            certificateNo: certNo,
            issueDate,
            content: JSON.stringify(snapshot),
            status: 'active',
          }).returning();
        } catch (error: any) {
          if ((error?.code || error?.cause?.code) !== '23505') throw error;
        }
      }

      if (!record) throw new Error('Failed to allocate a unique certificate number');

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'certificate_created',
        properties: {
          tenantId,
          certificateId: record.id,
          type: record.certificateType
        }
      });

      return record;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/certificates', tenantId });
      set.status = 500;
      return { error: 'Failed to save certificates' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { id, status } = body as any;
      if (!id || typeof status !== 'string' || !['active', 'revoked'].includes(status)) {
        set.status = 400;
        return { error: 'A valid certificate id and status are required' };
      }

      // Scope the update to the caller's tenant so certificates belonging to
      // other schools cannot be modified.
      const [updated] = await db.update(schema.certificates)
        .set({ status })
        .where(and(eq(schema.certificates.id, id), eq(schema.certificates.tenantId, tenantId)))
        .returning();

      if (!updated) {
        set.status = 404;
        return { error: 'Certificate not found' };
      }

      return updated;
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/certificates', tenantId });
      set.status = 500;
      return { error: 'Failed to update certificates' };
    }
  });

