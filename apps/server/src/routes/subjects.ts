import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { requirePermission } from '../lib/permissions';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { dataCache } from '../lib/cache';
import { SubjectService } from '../services/subject.service';

export const subjectsRoutes = new Elysia({ prefix: '/subjects' })
  .use(requireAuth)
  .use(requirePermission('subjects'))
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      if (query.mode === 'min') {
        return await SubjectService.listMin(tenantId!);
      }

      const result = await SubjectService.list({
        tenantId: tenantId!,
        classId: query.classId || undefined,
        search: query.search || undefined,
        mineOnly: query.mine === 'true',
        callerUserId: user.id,
      });
      return result.items;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/subjects', tenantId });
      set.status = 500;
      return { error: 'Failed to load subjects' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      const targetClass = await db.query.classes.findFirst({ where: and(eq(schema.classes.id, data.classId), eq(schema.classes.tenantId, tenantId!)) });
      if (!targetClass) { set.status = 400; return { error: 'Invalid class ID' }; }

      const [subject] = await db.insert(schema.subjects).values({ 
        name: data.name, 
        code: data.code, 
        classId: data.classId, 
        teacherId: data.teacherId || null,
        tenantId: tenantId!
      }).returning();

      if (!subject) throw new Error('Failed to create subject');

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'subject_created',
        properties: {
          tenantId,
          subjectId: subject.id,
          name: subject.name,
          classId: subject.classId
        }
      });

      await dataCache.deleteMatch(`subjects:${tenantId}:*`);

      return { id: subject.id };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/subjects', tenantId });
      set.status = 500;
      return { error: 'Failed to save subjects' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      const data = body as any;
      const { id, name, code, classId, teacherId } = data;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const existing = await db.query.subjects.findFirst({ 
        where: eq(schema.subjects.id, id), 
        with: { class: { columns: { tenantId: true } } } 
      });
      if (!existing || existing.class.tenantId !== tenantId) { set.status = 404; return { error: 'Subject not found or access denied' }; }

      await db.update(schema.subjects).set({ name, code, classId, teacherId: teacherId || null }).where(eq(schema.subjects.id, id));
      
      await dataCache.deleteMatch(`subjects:${tenantId}:*`);
      
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/subjects', tenantId });
      set.status = 500;
      return { error: 'Failed to update subjects' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }

      const existing = await db.query.subjects.findFirst({ 
        where: eq(schema.subjects.id, id), 
        with: { class: { columns: { tenantId: true } } } 
      });
      if (!existing || existing.class.tenantId !== tenantId) { 
        set.status = 404; 
        return { error: 'Subject not found or access denied' }; 
      }

      await db.transaction(async (tx) => {
        // 1. Clean up assignments and submissions
        const assignments = await tx.query.assignments.findMany({ 
          where: eq(schema.assignments.subjectId, id), 
          columns: { id: true } 
        });
        const assignmentIds = assignments.map(a => a.id);
        if (assignmentIds.length > 0) {
          await tx.delete(schema.submissions).where(inArray(schema.submissions.assignmentId, assignmentIds));
          await tx.delete(schema.assignments).where(eq(schema.assignments.subjectId, id));
        }

        // 2. Clean up other records
        await tx.delete(schema.grades).where(eq(schema.grades.subjectId, id));
        await tx.delete(schema.timetables).where(eq(schema.timetables.subjectId, id));

        // 3. Finally delete the subject
        await tx.delete(schema.subjects).where(eq(schema.subjects.id, id));
      });

      await dataCache.deleteMatch(`subjects:${tenantId}:*`);

      return { success: true };
    } catch (error: any) {
      captureError(error, { method: 'DELETE', path: '/subjects', tenantId });
      console.error('[SUBJECTS_DELETE_ERROR]', error);
      set.status = error.code === '23503' ? 400 : 500;
      return {
        error: error.code === '23503'
          ? 'Cannot delete this subject: other records still reference it.'
          : 'Failed to delete subject'
      };
    }
  });

