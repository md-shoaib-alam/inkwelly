import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { dataCache } from '../lib/cache';
import { formatDate } from '../lib/date-utils';
import { invalidateFeeCaches } from '../lib/fees-cache';
import {
  CreateTransportAssignmentSchema,
  formatZodError,
} from '../lib/validation/fees';

export const transportRoutes = new Elysia()
  .use(requireAuth)

  // ── Transport Routes ─────────────────────────────────────────────────────
  .group('/transport-routes', (app) =>
    app
      .get('/', async ({ query, tenantId }) => {
        if ((query as any).mode === 'min') {
          return await db.query.transportRoutes.findMany({
            where: eq(schema.transportRoutes.tenantId, tenantId as string),
            columns: { id: true, name: true, stops: true },
            orderBy: [schema.transportRoutes.name],
          });
        }
        return await db.query.transportRoutes.findMany({
          where: eq(schema.transportRoutes.tenantId, tenantId as string),
          with: {
            vehicle: true,
            students: { columns: { id: true } },
          },
          orderBy: [schema.transportRoutes.name],
        });
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { name, fee, vehicleId, stops } = body as { name: string; fee: number; vehicleId?: string; stops?: unknown[] };
        const [result] = await db.insert(schema.transportRoutes).values({
          tenantId: tenantId as string,
          name,
          fee: Number(fee) || 0,
          vehicleId,
          stops: JSON.stringify(stops || []),
        }).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .put('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id, ...data } = body as { id: string; fee?: number | string; stops?: unknown; [key: string]: unknown };
        const route = await db.query.transportRoutes.findFirst({ where: and(eq(schema.transportRoutes.id, id), eq(schema.transportRoutes.tenantId, tenantId!)) });
        if (!route) { set.status = 404; return { error: 'Not found' }; }

        const updateData: Record<string, any> = { ...data };
        if (data.fee !== undefined) updateData.fee = Number(data.fee);
        if (data.stops !== undefined) updateData.stops = typeof data.stops === 'string' ? data.stops : JSON.stringify(data.stops);
        const [result] = await db.update(schema.transportRoutes).set(updateData).where(eq(schema.transportRoutes.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };
        const route = await db.query.transportRoutes.findFirst({ where: and(eq(schema.transportRoutes.id, id), eq(schema.transportRoutes.tenantId, tenantId!)) });
        if (!route) { set.status = 404; return { error: 'Not found' }; }
        const [result] = await db.delete(schema.transportRoutes).where(eq(schema.transportRoutes.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
  )

  // ── Vehicles ─────────────────────────────────────────────────────────────
  .group('/vehicles', (app) =>
    app
      .get('/', async ({ query, tenantId }) => {
        if ((query as any).mode === 'min') {
          return await db.query.vehicles.findMany({
            where: eq(schema.vehicles.tenantId, tenantId as string),
            columns: { id: true, number: true },
            orderBy: [schema.vehicles.number],
          });
        }
        return await db.query.vehicles.findMany({
          where: eq(schema.vehicles.tenantId, tenantId as string),
          with: { routes: true },
          orderBy: [schema.vehicles.number],
        });
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const data = body as any;
        const [result] = await db.insert(schema.vehicles).values({
          ...data,
          tenantId: tenantId as string,
          capacity: Number(data.capacity || 40),
        }).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .put('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id, ...data } = body as { id: string; capacity?: unknown; [key: string]: unknown };
        const vehicle = await db.query.vehicles.findFirst({ where: and(eq(schema.vehicles.id, id), eq(schema.vehicles.tenantId, tenantId!)) });
        if (!vehicle) { set.status = 404; return { error: 'Not found' }; }

        const updateData: Record<string, any> = { ...data };
        if (data.capacity !== undefined) updateData.capacity = Number(data.capacity);
        const [result] = await db.update(schema.vehicles).set(updateData).where(eq(schema.vehicles.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };
        const vehicle = await db.query.vehicles.findFirst({ where: and(eq(schema.vehicles.id, id), eq(schema.vehicles.tenantId, tenantId!)) });
        if (!vehicle) { set.status = 404; return { error: 'Not found' }; }
        const [result] = await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id)).returning();
        await dataCache.deleteMatch(`dashboard:${tenantId}:*`);
        return result;
      })
  )

  // ── Transport Assignments ────────────────────────────────────────────────
  .group('/transport-assignments', (app) =>
    app
      .get('/', async ({ query, tenantId }) => {
        const { routeId, studentId } = query as { routeId?: string; studentId?: string };
        const transportAssignments = await db.query.transportAssignments.findMany({
          where: (ta, { and, eq }) => {
            const conditions = [sql`EXISTS (
              SELECT 1 FROM ${schema.students} s
              JOIN ${schema.users} u ON s."userId" = u.id
              WHERE s.id = ${ta.studentId} AND u."tenantId" = ${tenantId!}
            )`];
            if (routeId) conditions.push(eq(ta.routeId, routeId));
            if (studentId) conditions.push(eq(ta.studentId, studentId));
            return and(...conditions);
          },
          with: {
            student: {
              with: {
                user: { columns: { name: true } },
                class: { columns: { name: true, section: true } },
              },
            },
            route: true,
          },
        });
        return transportAssignments;
      })
      .post('/', async ({ body, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || !['admin', 'super_admin', 'staff'].includes(user.role)) {
          set.status = 403;
          return { error: 'Access denied: staff or administrator privileges required' };
        }
        const parsed = CreateTransportAssignmentSchema.safeParse(body);
        if (!parsed.success) {
          set.status = 400;
          return { error: formatZodError(parsed.error) };
        }
        const { studentId, routeId, startDate, pickupPoint, newPickupPointFee } = parsed.data;

        // 🛡️ SECURITY: Verify student belongs to tenant
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, studentId),
          with: { user: { columns: { tenantId: true } } },
        });
        if (!student || student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Access denied: student does not belong to your school' };
        }

        // 🛡️ SECURITY: Verify transport route belongs to tenant
        const route = await db.query.transportRoutes.findFirst({
          where: and(eq(schema.transportRoutes.id, routeId), eq(schema.transportRoutes.tenantId, tenantId!)),
        });
        if (!route) {
          set.status = 403;
          return { error: 'Access denied: route not found' };
        }

        // Handle stop creation on the fly
        let parsedStops: Array<{ name: string; fee: number }> = [];
        try {
          const rawStops = typeof route.stops === 'string' ? JSON.parse(route.stops) : (route.stops || []);
          parsedStops = Array.isArray(rawStops) ? rawStops.map((s: any) => typeof s === 'string' ? { name: s, fee: route.fee } : s) : [];
        } catch {
          parsedStops = [];
        }

        if (pickupPoint) {
          const stopExists = parsedStops.some(s => s && s.name && s.name.toLowerCase() === pickupPoint.toLowerCase());
          if (!stopExists) {
            const stopFee = Number(newPickupPointFee) || route.fee;
            parsedStops.push({ name: pickupPoint, fee: stopFee });
            await db.update(schema.transportRoutes)
              .set({ stops: JSON.stringify(parsedStops) })
              .where(eq(schema.transportRoutes.id, routeId));
          }
        }

        // Automatically fetch or create TRANSPORT category
        let category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.tenantId, tenantId!), eq(schema.feeCategories.code, 'TRANSPORT')),
        });

        if (!category) {
          const [newCat] = await db.insert(schema.feeCategories).values({
            tenantId: tenantId!,
            name: 'Transport Fee',
            code: 'TRANSPORT',
            description: 'Automatically created transport fee category',
            frequency: 'monthly',
            status: 'active',
          }).returning();
          category = newCat;
        }

        if (!category) {
          set.status = 500;
          return { error: 'Failed to initialize transport fee category' };
        }

        const [result] = await db.insert(schema.transportAssignments).values({
          studentId,
          routeId,
          pickupPoint: pickupPoint || null,
          startDate,
        }).onConflictDoUpdate({
          target: [schema.transportAssignments.studentId],
          set: { routeId, pickupPoint: pickupPoint || null, startDate },
        }).returning();

        // Calculate specific fee for stop/pickup point
        let targetFee = route.fee;
        if (pickupPoint) {
          const matchedStop = parsedStops.find(s => s && s.name && s.name.toLowerCase() === pickupPoint.toLowerCase());
          if (matchedStop && matchedStop.fee !== undefined) {
            targetFee = Number(matchedStop.fee);
          }
        }

        // Check for existing pending transport fee
        const existingPendingFee = await db.query.fees.findFirst({
          where: and(
            eq(schema.fees.studentId, studentId),
            eq(schema.fees.feeCategoryId, category.id),
            eq(schema.fees.status, 'pending'),
          ),
        });

        const typeStr = pickupPoint ? `${route.name} (${pickupPoint}) Transport Fee` : `${route.name} Transport Fee`;

        if (existingPendingFee) {
          await db.update(schema.fees).set({
            amount: targetFee,
            type: typeStr,
            dueDate: startDate || formatDate(),
          }).where(eq(schema.fees.id, existingPendingFee.id));
        } else {
          await db.insert(schema.fees).values({
            tenantId: tenantId!,
            studentId,
            feeCategoryId: category.id,
            amount: targetFee,
            type: typeStr,
            dueDate: startDate || formatDate(),
            status: 'pending',
          });
        }

        await invalidateFeeCaches(tenantId!);
        return result;
      })
      .delete('/', async ({ query, tenantId, user, set }) => {
        if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
          set.status = 403;
          return { error: 'Access denied: administrator privileges required' };
        }
        const { id } = query as { id: string };

        // 🛡️ SECURITY: Verify transport assignment belongs to tenant
        const assignment = await db.query.transportAssignments.findFirst({
          where: eq(schema.transportAssignments.id, id),
          with: { student: { with: { user: { columns: { tenantId: true } } } } },
        });
        if (!assignment || assignment.student.user.tenantId !== tenantId) {
          set.status = 403;
          return { error: 'Access denied: transport assignment not found' };
        }

        const category = await db.query.feeCategories.findFirst({
          where: and(eq(schema.feeCategories.tenantId, tenantId!), eq(schema.feeCategories.code, 'TRANSPORT')),
        });

        if (category) {
          await db.delete(schema.fees).where(and(
            eq(schema.fees.studentId, assignment.studentId),
            eq(schema.fees.feeCategoryId, category.id),
            eq(schema.fees.status, 'pending'),
          ));
        }

        const [result] = await db.delete(schema.transportAssignments).where(eq(schema.transportAssignments.id, id)).returning();
        await invalidateFeeCaches(tenantId!);
        return result;
      })
  );


