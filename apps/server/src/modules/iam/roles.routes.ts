import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, ne, count, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { invalidateRolePermissions, invalidateUserPermissions } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';

export const rolesRoutes = new Elysia({ prefix: '/roles' })
  .use(requireAuth)
  // GET /roles — list custom roles for a tenant
  .get('/', async ({ tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }

      const roles = await db.query.customRoles.findMany({
        where: eq(schema.customRoles.tenantId, tenantId),
        with: { users: { columns: { id: true } } },
        orderBy: [desc(schema.customRoles.createdAt)],
      });

      return roles.map(r => {
        let perms = {};
        try {
          if (r.permissions) perms = JSON.parse(r.permissions);
        } catch (e) {
          console.error(`[ROLES_PARSE_ERROR] Skipping bad JSON for role ${r.id}`);
        }
        
        return {
          ...r,
          permissions: perms,
          userCount: r.users.length,
        };
      });
    } catch (error) {
      captureError(error, { method: 'GET', path: '/roles', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch roles' };
    }
  })
  // POST /roles
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const b = body as any;
      if (!b.name || typeof b.name !== 'string' || b.name.trim().length === 0) { set.status = 400; return { error: 'name is required' }; }

      const existing = await db.query.customRoles.findFirst({ 
        where: and(eq(schema.customRoles.tenantId, tenantId), eq(schema.customRoles.name, b.name.trim())) 
      });
      if (existing) { set.status = 409; return { error: 'A role with this name already exists in this tenant' }; }

      const [role] = await db.insert(schema.customRoles).values({ 
        tenantId, 
        name: b.name.trim(), 
        description: b.description?.trim() || null, 
        color: b.color || '#e11d48', 
        permissions: JSON.stringify(b.permissions || {}) 
      }).returning();

      if (!role) throw new Error('Failed to create role');

      set.status = 201;

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'role_created',
        properties: {
          tenantId,
          roleId: role.id,
          name: role.name
        }
      });

      return { ...role, permissions: JSON.parse(role.permissions || '{}') };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/roles', tenantId });
      set.status = 500;
      return { error: 'Failed to create role' };
    }
  })
  // PUT /roles
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const b = body as any;
      if (!b.id) { set.status = 400; return { error: 'Role ID is required' }; }

      const existing = await db.query.customRoles.findFirst({ 
        where: and(eq(schema.customRoles.id, b.id), eq(schema.customRoles.tenantId, tenantId)) 
      });
      if (!existing) { set.status = 404; return { error: 'Role not found' }; }

      if (b.name && b.name.trim() !== existing.name) {
        const dup = await db.query.customRoles.findFirst({ 
          where: and(
            eq(schema.customRoles.tenantId, tenantId), 
            eq(schema.customRoles.name, b.name.trim()), 
            ne(schema.customRoles.id, b.id)
          ) 
        });
        if (dup) { set.status = 409; return { error: 'A role with this name already exists' }; }
      }

      const updateData: any = {};
      if (b.name) updateData.name = b.name.trim();
      if (b.description !== undefined) updateData.description = b.description?.trim() || null;
      if (b.color) updateData.color = b.color;
      if (b.permissions) updateData.permissions = JSON.stringify(b.permissions);

      const [role] = await db.update(schema.customRoles)
        .set(updateData)
        .where(and(eq(schema.customRoles.id, b.id), eq(schema.customRoles.tenantId, tenantId)))
        .returning();
      if (!role) throw new Error('Failed to update role');

      await invalidateRolePermissions(role.id);

      return { ...role, permissions: JSON.parse(role.permissions || '{}') };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/roles', tenantId });
      set.status = 500;
      return { error: 'Failed to update role' };
    }
  })
  // DELETE /roles
  .delete('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'Role ID is required' }; }

      const existing = await db.query.customRoles.findFirst({ 
        where: and(eq(schema.customRoles.id, id), eq(schema.customRoles.tenantId, tenantId)) 
      });
      if (!existing) { set.status = 404; return { error: 'Role not found' }; }

      const userCountResult = await db.select({ value: count() })
        .from(schema.users)
        .where(and(eq(schema.users.customRoleId, id), eq(schema.users.tenantId, tenantId)));
      const userCount = userCountResult[0]?.value || 0;
      if (userCount > 0) { set.status = 400; return { error: `Cannot delete: ${userCount} user(s) assigned` }; }

      const members = await db.select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.customRoleId, id));

      await db.transaction(async (tx) => {
        await tx.update(schema.users)
          .set({ customRoleId: null })
          .where(and(eq(schema.users.customRoleId, id), eq(schema.users.tenantId, tenantId)));
        await tx.delete(schema.customRoles)
          .where(and(eq(schema.customRoles.id, id), eq(schema.customRoles.tenantId, tenantId)));
      });
      await invalidateUserPermissions(members.map((m) => m.id));
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/roles', tenantId });
      set.status = 500;
      return { error: 'Failed to delete role' };
    }
  })
  // GET /roles/users?roleId=xxx
  .get('/users', async ({ query, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      const roleId = query.roleId as string;
      if (!roleId) { set.status = 400; return { error: 'roleId is required' }; }

      const usersList = await db.query.users.findMany({
        where: and(eq(schema.users.customRoleId, roleId), eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'staff')),
        columns: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: [schema.users.name],
      });
      return usersList;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/roles/users', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch role users' };
    }
  })
  // PATCH /roles/users
  .patch('/users', async ({ body, tenantId, user: actor, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      // Assigning a custom role is granting permissions, so it must be admin-only.
      if (!actor || (actor.role !== 'admin' && actor.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: administrator privileges required' };
      }
      const b = body as any;
      if (!b.userId) { set.status = 400; return { error: 'userId is required' }; }

      const target = await db.query.users.findFirst({ where: eq(schema.users.id, b.userId) });
      if (!target || target.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Access denied' };
      }

      const roleId = b.roleId || null;
      if (roleId) {
        const role = await db.query.customRoles.findFirst({
          where: and(eq(schema.customRoles.id, roleId), eq(schema.customRoles.tenantId, tenantId)),
        });
        if (!role) { set.status = 400; return { error: 'Role not found in this tenant' }; }
      }

      const [updated] = await db.update(schema.users)
        .set({ customRoleId: roleId })
        .where(eq(schema.users.id, b.userId))
        .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, customRoleId: schema.users.customRoleId });

      await invalidateUserPermissions([b.userId]);

      return { success: true, user: updated };
    } catch (error: any) {
      captureError(error, { method: 'PATCH', path: '/roles/users', tenantId });
      set.status = 500;
      return { error: 'Failed to update user role' };
    }
  })
  // GET /roles/available-users — available staff
  .get('/available-users', async ({ tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }

      const usersList = await db.query.users.findMany({
        where: and(eq(schema.users.tenantId, tenantId), eq(schema.users.role, 'staff'), sql`${schema.users.customRoleId} IS NULL`),
        columns: { id: true, name: true, email: true, role: true, isActive: true, customRoleId: true },
        orderBy: [schema.users.name],
      });
      return usersList;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/roles/available-users', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch available users' };
    }
  });

