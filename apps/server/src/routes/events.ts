import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, or, gte, lte, lt, gt, asc } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { dataCache } from '../lib/cache';

export const eventsRoutes = new Elysia({ prefix: '/events' })
  .use(requireAuth)
  .get('/', async ({ query, tenantId, set }) => {
    try {
      const monthQuery = query.month as string;
      const typeQuery = query.type as string;
      const targetRoleQuery = query.targetRole as string;

      const eventsList = await db.query.events.findMany({
        where: (events, { eq, and, or, gte, lte, lt, gt }) => {
          const conditions = [eq(events.tenantId, tenantId!)];

          if (monthQuery && monthQuery.includes('-')) {
            const [yearStr, monthStr] = monthQuery.split('-') as [string, string];
            const year = parseInt(yearStr, 10);
            const monthNum = parseInt(monthStr, 10);
            const daysInMonth = new Date(year, monthNum, 0).getDate();
            const monthStart = `${monthQuery}-01`;
            const monthEnd = `${monthQuery}-${String(daysInMonth).padStart(2, '0')}`;
            
            conditions.push(or(
              and(gte(events.date, monthStart), lte(events.date, monthEnd))!,
              and(gte(events.endDate, monthStart), lte(events.endDate, monthEnd))!,
              and(lt(events.date, monthStart), gt(events.endDate, monthEnd))!
            )!);
          }

          if (typeQuery) conditions.push(eq(events.type, typeQuery));
          if (targetRoleQuery) conditions.push(eq(events.targetRole, targetRoleQuery));

          return and(...conditions);
        },
        orderBy: [asc(schema.events.date)],
      });

      return { success: true, data: eventsList };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/events', tenantId });
      set.status = 500;
      return { success: false, message: 'Failed to fetch events' };
    }
  })
  .post('/', async ({ body, tenantId, set }) => {
    try {
      const b = body as any;
      if (!b.title || !b.date) { set.status = 400; return { success: false, message: 'Missing required fields' }; }

      const [event] = await db.insert(schema.events).values({
        tenantId: tenantId!,
        title: b.title.trim(),
        description: b.description?.trim() || null,
        date: b.date.trim(),
        endDate: b.endDate?.trim() || null,
        type: b.type || 'general',
        targetRole: b.targetRole || 'all',
        color: b.color || '#10b981',
        allDay: Boolean(b.allDay),
        location: b.location?.trim() || null,
      }).returning();

      if (!event) throw new Error('Failed to create event');

      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);

      set.status = 201;

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'event_created',
        properties: {
          tenantId,
          eventId: event.id,
          title: event.title,
          type: event.type
        }
      });

      return { success: true, data: event };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/events', tenantId });
      set.status = 500;
      return { success: false, message: 'Internal error' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      const b = body as any;
      const existing = await db.query.events.findFirst({ where: and(eq(schema.events.id, b.id?.trim()), eq(schema.events.tenantId, tenantId!)) });
      if (!existing) { set.status = 404; return { success: false, message: 'Event not found' }; }

      const data: any = {};
      if (b.title !== undefined) data.title = b.title;
      if (b.description !== undefined) data.description = b.description;
      if (b.date !== undefined) data.date = b.date;
      if (b.endDate !== undefined) data.endDate = b.endDate;
      if (b.type !== undefined) data.type = b.type;
      if (b.targetRole !== undefined) data.targetRole = b.targetRole;
      if (b.color !== undefined) data.color = b.color;
      if (b.allDay !== undefined) data.allDay = b.allDay;
      if (b.location !== undefined) data.location = b.location;

      const [event] = await db.update(schema.events).set(data).where(eq(schema.events.id, b.id.trim())).returning();
      if (!event) throw new Error('Event not found');
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      return { success: true, data: event };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/events', tenantId });
      set.status = 500;
      return { success: false, message: 'Internal error' };
    }
  })
  .delete('/', async ({ query, tenantId, set }) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { success: false, message: 'ID required' }; }

      const existing = await db.query.events.findFirst({ where: and(eq(schema.events.id, id), eq(schema.events.tenantId, tenantId!)) });
      if (!existing) { set.status = 404; return { success: false, message: 'Event not found' }; }

      await db.delete(schema.events).where(eq(schema.events.id, id));
      await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
      return { success: true, message: 'Event deleted' };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/events', tenantId });
      set.status = 500;
      return { success: false, message: 'Internal error' };
    }
  });

