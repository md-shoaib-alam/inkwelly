import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { requirePermission } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';
import { dataCache } from '../../lib/cache';

export const timetableRoutes = new Elysia({ prefix: '/timetable' })
  .use(requireAuth)
  .use(requirePermission('timetable'))
  .get('/', async ({ query, tenantId, set, user }) => {
    try {
      let classIdFilter = query.classId as string;

      // Automatically resolve classId for student and parent if not provided
      if (!classIdFilter && user?.id) {
        if (user.role === 'student') {
          const student = await db.query.students.findFirst({
            where: eq(schema.students.userId, user.id),
            columns: { classId: true }
          });
          if (student) classIdFilter = student.classId;
        } else if (user.role === 'parent') {
          const parent = await db.query.parents.findFirst({
            where: eq(schema.parents.userId, user.id),
            columns: { id: true }
          });
          if (parent) {
            const firstChild = await db.query.students.findFirst({
              where: eq(schema.students.parentId, parent.id),
              columns: { classId: true }
            });
            if (firstChild) classIdFilter = firstChild.classId;
          }
        }
      }

      const cacheKey = `timetable:${tenantId}:${user.id}:${classIdFilter || ''}:${query.teacherId || ''}:${query.mine || ''}`;
      const cached = await dataCache.get<any[]>(cacheKey);
      if (cached) return cached;

      let targetTeacherId = query.teacherId as string;

      // If ?mine=true, resolve current user's teacherId automatically
      if (query.mine === 'true' && user?.id) {
        const teacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.userId, user.id),
          columns: { id: true }
        });
        if (teacher) targetTeacherId = teacher.id;
      }

      const timetableList = await db.query.timetables.findMany({
        where: (timetables: any, { eq, and }: any) => {
          const conditions = [sql`EXISTS (
            SELECT 1 FROM "Class"
            WHERE "Class"."id" = ${timetables.classId} AND "Class"."tenantId" = ${tenantId!}
          )`];
          if (classIdFilter) conditions.push(eq(timetables.classId, classIdFilter));
          if (targetTeacherId) conditions.push(eq(timetables.teacherId, targetTeacherId));
          return and(...conditions);
        },
        with: {
          subject: { columns: { name: true } },
          teacher: { with: { user: { columns: { name: true } } } },
          class: { columns: { name: true, section: true } }
        },
        orderBy: [schema.timetables.day, schema.timetables.startTime]
      });

      const output = timetableList.map(t => ({
        id: t.id, day: t.day, startTime: t.startTime, endTime: t.endTime,
        subjectId: t.subjectId, teacherId: t.teacherId, classId: t.classId,
        label: t.label,
        subjectName: t.subject?.name || '',
        teacherName: t.teacher?.user?.name || '',
        className: `${t.class.name}-${t.class.section}`,
      }));

      await dataCache.set(cacheKey, output, 5 * 60 * 1000); // 5 minutes
      return output;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/timetable', tenantId });

      set.status = 500;
      return { error: 'Failed to load timetable' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const { slots, classId } = body as any;
      if (!slots || !Array.isArray(slots)) {
        set.status = 400;
        return { error: 'slots array is required' };
      }

      // â”€â”€ Process & Filter Slots â”€â”€
      const validSlots = slots.filter(slot => {
        const hasAcademic = slot.subjectId && slot.teacherId;
        const hasBreak = !!slot.label;
        return slot.classId && (hasAcademic || hasBreak) && slot.day && slot.startTime && slot.endTime;
      });

      // â”€â”€ Database Sync â”€â”€
      const result = await db.transaction(async (tx) => {
        if (classId) {
          // Verify class belongs to tenant
          const classExists = await tx.query.classes.findFirst({
            where: and(eq(schema.classes.id, classId), eq(schema.classes.tenantId, tenantId!))
          });
          
          if (!classExists) throw new Error('Class not found or access denied');

          // Delete existing slots for this class
          await tx.delete(schema.timetables).where(eq(schema.timetables.classId, classId));
        }

        if (validSlots.length > 0) {
          // Bulk create new slots
          const insertData = validSlots
            .filter(slot => slot.classId === classId)
            .map(slot => ({
              classId: classId,
              subjectId: slot.subjectId || null,
              teacherId: slot.teacherId || null,
              label: slot.label || null,
              day: slot.day,
              startTime: slot.startTime,
              endTime: slot.endTime,
            }));
          
          if (insertData.length > 0) {
            await tx.insert(schema.timetables).values(insertData);
          }
        }
        
        return { count: validSlots.length };
      });

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'timetable_updated',
        properties: {
          tenantId,
          classId: (body as any).classId,
          slotCount: (body as any).slots?.length
        }
      });
      
      await dataCache.deleteMatch(`timetable:${tenantId}:*`);

      return { success: true, ...result };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/timetable', tenantId });

      set.status = 500;
      return { error: 'Failed to save timetable' };
    }
  })
  .put('/', async ({ body, query, tenantId, set }) => {
    try {
      const data = body as any;
      const id = (data.id || query.id) as string;
      const { subjectId, teacherId, label, day, startTime, endTime } = data;
      if (!id) { set.status = 400; return { error: 'ID is required' }; }

      const existing = await db.query.timetables.findFirst({ 
        where: eq(schema.timetables.id, id),
        with: { class: { columns: { tenantId: true } } }
      });
      if (!existing || existing.class.tenantId !== tenantId) { set.status = 404; return { error: 'Entry not found or access denied' }; }

      const updateData: any = {};
      if (subjectId !== undefined) updateData.subjectId = subjectId || null;
      if (teacherId !== undefined) updateData.teacherId = teacherId || null;
      if (label !== undefined) updateData.label = label || null;
      if (day !== undefined) updateData.day = day;
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;

      const [updated] = await db.update(schema.timetables).set(updateData).where(eq(schema.timetables.id, id)).returning();
      if (!updated) throw new Error('Failed to update timetable');
      
      const fullUpdated = await db.query.timetables.findFirst({
        where: eq(schema.timetables.id, updated.id),
        with: { 
          subject: { columns: { name: true } }, 
          teacher: { with: { user: { columns: { name: true } } } }, 
          class: { columns: { name: true, section: true } } 
        },
      });

      if (!fullUpdated) throw new Error('Update verification failed');

      await dataCache.deleteMatch(`timetable:${tenantId}:*`);

      return {
        id: fullUpdated.id, day: fullUpdated.day, startTime: fullUpdated.startTime, endTime: fullUpdated.endTime,
        subjectId: fullUpdated.subjectId, teacherId: fullUpdated.teacherId,
        label: fullUpdated.label,
        subjectName: fullUpdated.subject?.name || '',
        teacherName: fullUpdated.teacher?.user?.name || '',
        className: `${fullUpdated.class.name}-${fullUpdated.class.section}`,
      };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/timetable', tenantId });

      set.status = 500;
      return { error: 'Failed to update timetable' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const id = query.id;
      if (!id) { set.status = 400; return { error: 'ID required' }; }


      const existing = await db.query.timetables.findFirst({ 
        where: eq(schema.timetables.id, id as string),
        with: { class: { columns: { tenantId: true } } }
      });
      


      if (!existing || existing.class.tenantId !== tenantId) { 

        set.status = 404; 
        return { error: 'Entry not found or access denied' }; 
      }

      await db.delete(schema.timetables).where(eq(schema.timetables.id, id as string));

      
      await dataCache.deleteMatch(`timetable:${tenantId}:*`);
      
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/timetable', tenantId });

      set.status = 500;
      return { error: 'Failed to delete timetable' };
    }
  });

