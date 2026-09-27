import { Elysia } from 'elysia';
import { db } from '../lib/db';
import { hashPassword } from '../lib/passwords';
import * as schema from '../db/schema';
import { eq, and, desc, sql, inArray, ilike } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { invalidateUserPermissions, requirePermission } from '../lib/permissions';
import { posthog, captureError } from '../lib/monitoring/posthog';

export const staffRoutes = new Elysia({ prefix: '/staff' })
  .use(requireAuth)
  .use(requirePermission('staff'))
  .get('/', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }

      const requestedRole = query.role === 'teacher' ? 'teacher' : 'staff';
      const mode = query.mode;



      if (requestedRole === 'teacher') {
        if (mode === 'min') {
          const teachersList = await db.select({
            id: schema.users.id,
            name: schema.users.name,
            role: schema.users.role,
          })
          .from(schema.teachers)
          .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
          .where(eq(schema.users.tenantId, tenantId!))
          .orderBy(desc(schema.users.createdAt));

          return teachersList;
        }

        const teachersList = await db.select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          phone: schema.users.phone,
          address: schema.users.address,
          isActive: schema.users.isActive,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          customRole: {
            id: schema.customRoles.id,
            name: schema.customRoles.name,
            color: schema.customRoles.color,
            permissions: schema.customRoles.permissions,
          }
        })
        .from(schema.teachers)
        .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
        .leftJoin(schema.customRoles, eq(schema.users.customRoleId, schema.customRoles.id))
        .where(eq(schema.users.tenantId, tenantId!))
        .orderBy(desc(schema.users.createdAt));
        


        return teachersList.map(t => ({
          ...t,
          customRole: t.customRole?.id ? { ...t.customRole, permissions: JSON.parse(t.customRole.permissions || '{}') } : null,
        }));
      }

      if (mode === 'min') {
        const conditions = [
          eq(schema.users.tenantId, tenantId!),
          eq(schema.users.role, 'staff'),
        ];
        if (query.search?.trim()) {
          conditions.push(ilike(schema.users.name, `%${query.search.trim()}%`));
        }

        const staffList = await db.select({
          id: schema.users.id,
          name: schema.users.name,
          role: schema.users.role,
        })
        .from(schema.users)
        .where(and(...conditions))
        .orderBy(desc(schema.users.createdAt))
        .limit(200);

        return staffList;
      }

      const staffList = await db.query.users.findMany({
        where: and(eq(schema.users.tenantId, tenantId!), eq(schema.users.role, 'staff')),
        with: { customRole: true },
        orderBy: [desc(schema.users.createdAt)],
      });

      return staffList.map(s => ({
        id: s.id, name: s.name, email: s.email, phone: s.phone, address: s.address, isActive: s.isActive,
        role: s.role,
        customRole: s.customRole ? { ...s.customRole, permissions: JSON.parse(s.customRole.permissions || '{}') } : null,
        createdAt: s.createdAt,
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/staff', tenantId });
      set.status = 500;
      return { error: 'Failed to load staff' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: Administrator privileges required' };
      }
      const b = body as any;
      if (!b.name || !b.email) { set.status = 400; return { error: 'name and email are required' }; }

      const existingUser = await db.query.users.findFirst({ where: eq(schema.users.email, b.email.trim()) });
      if (existingUser) { set.status = 409; return { error: 'A user with this email already exists' }; }

      if (b.customRoleId) {
        const role = await db.query.customRoles.findFirst({ where: and(eq(schema.customRoles.id, b.customRoleId), eq(schema.customRoles.tenantId, tenantId)) });
        if (!role) { set.status = 404; return { error: 'Selected role not found' }; }
      }

      const [userRecord] = await db.insert(schema.users).values({
        tenantId, 
        name: b.name.trim(), 
        email: b.email.trim().toLowerCase(),
        password: await hashPassword(b.password?.trim() || 'changeme123'),
        phone: b.phone?.trim() || null, 
        address: b.address?.trim() || null,
        role: 'staff', 
        customRoleId: b.customRoleId || null, 
        isActive: b.isActive !== false,
      }).returning();

      if (!userRecord) throw new Error('Failed to create staff');

      const fullUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userRecord.id),
        with: { customRole: true }
      });

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'staff_created',
        properties: {
          tenantId,
          userId: userRecord.id,
          email: userRecord.email,
          role: userRecord.role,
          customRole: fullUser?.customRole?.name
        }
      });

      return { success: true, staff: { ...fullUser, customRole: fullUser?.customRole ? { ...fullUser.customRole, permissions: JSON.parse(fullUser.customRole.permissions || '{}') } : null } };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/staff', tenantId });
      set.status = 500;
      return { error: 'Failed to save staff' };
    }
  })
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: Administrator privileges required' };
      }
      const b = body as any;
      if (!b.id) { set.status = 400; return { error: 'Staff ID is required' }; }

      const existing = await db.query.users.findFirst({ where: and(eq(schema.users.id, b.id), eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'staff')) });
      if (!existing) { set.status = 404; return { error: 'Staff member not found or access denied' }; }

      const updateData: any = {};
      if (b.name !== undefined) updateData.name = b.name.trim();
      if (b.password !== undefined && b.password.trim() !== '') updateData.password = await hashPassword(b.password.trim());
      if (b.phone !== undefined) updateData.phone = b.phone?.trim() || null;
      if (b.address !== undefined) updateData.address = b.address?.trim() || null;
      if (b.customRoleId !== undefined) {
        updateData.customRoleId = b.customRoleId || null;
      }
      if (b.isActive !== undefined) updateData.isActive = b.isActive;

      const [updated] = await db.update(schema.users).set(updateData).where(eq(schema.users.id, b.id)).returning();
      if (!updated) throw new Error('Failed to update staff');
      if (b.customRoleId !== undefined) await invalidateUserPermissions([b.id]);
      const fullUpdated = await db.query.users.findFirst({
        where: eq(schema.users.id, updated.id),
        with: { customRole: true }
      });

      return { success: true, staff: fullUpdated };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/staff', tenantId });
      set.status = 500;
      return { error: 'Failed to update staff' };
    }
  })
  .delete('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: Administrator privileges required' };
      }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'Staff ID is required' }; }

      const existing = await db.query.users.findFirst({ where: and(eq(schema.users.id, id), eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'staff')) });
      if (!existing) { set.status = 404; return { error: 'Staff member not found or access denied' }; }

      await db.transaction(async (tx) => {
        await tx.delete(schema.notices).where(eq(schema.notices.authorId, id));
        await tx.delete(schema.users).where(eq(schema.users.id, id));
      });
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/staff', tenantId });
      set.status = 500;
      return { error: 'Failed to delete staff' };
    }
  });

