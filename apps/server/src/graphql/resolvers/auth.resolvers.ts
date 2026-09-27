import { db } from '../../lib/db'
import { resolveTenantId } from '../../lib/resolve-tenant'
import { checkAuth, forbidden, requireSchoolAdminOrPlatform, scopedTenantId, assertTenantOwnership } from './helpers'
import * as schema from '../../db/schema'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '../../lib/audit-helper'
import { isRootPlatformAdmin, invalidateUserPermissions } from '../../lib/permissions'
import { invalidateForUser } from '../../lib/authCache'
import { hashPassword, verifyPassword } from '../../lib/passwords'

/**
 * The platform's own accounts belong to its owner. The `users` grant opens a
 * school's staff directory; it must not let a scoped admin delete or disable a
 * platform account, so those actions against a `super_admin` stay root-only.
 */
async function assertMayTouchPlatformAccount(user: any, id: string, verb: string) {
  if (await isRootPlatformAdmin(user)) return;
  const [current] = await db.select({ role: schema.users.role })
    .from(schema.users).where(eq(schema.users.id, id)).limit(1);
  if (current?.role === 'super_admin') {
    throw forbidden(`Forbidden: only a root platform administrator can ${verb} a platform admin`);
  }
}

export const authResolvers = {
  createUser: async (_: unknown, { data }: { data: any }, context: any) => {
    const auth = await requireSchoolAdminOrPlatform(context, 'users', 'create')
    // Outside the try: its catch would turn the refusal into "Failed to create user".
    if (data.role === 'super_admin') {
      if (auth.user.role !== 'super_admin') throw forbidden('Forbidden: cannot create a platform admin');
      // A scoped platform admin holds grants, not the platform: only the owner may
      // create another super_admin, since one with no platform role is a root.
      if (!(await isRootPlatformAdmin(auth.user))) {
        throw forbidden('Forbidden: only a root platform administrator can create a platform admin');
      }
    }
    try {
      if (data.tenantId) {
        data.tenantId = await resolveTenantId(data.tenantId);
      }
      if (auth.user.role !== 'super_admin') {
        data.tenantId = scopedTenantId(auth);
      }
      if (data.password) {
        data.password = await hashPassword(data.password);
      }
      
      const [user] = await db.insert(schema.users).values({ 
        ...data, 
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (!user) throw new Error('Failed to create user');

      const fullUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
        with: { tenant: true }
      });
      
      // Auto-create profile record for parents
      if (data.role === 'parent') {
        await db.insert(schema.parents).values({ userId: user.id }).catch(() => {});
      }
      
      return fullUser;
    } catch (err: any) { 
      console.error("CRITICAL ERROR IN createUser:", err);
      throw new Error(`Failed to create user: ${err.message || err}`);
    }
  },

  requestPasswordReset: async (_: unknown, { email }: { email: string }) => {
    try {
      const { or, eq } = await import('drizzle-orm')
      const user = await db.query.users.findFirst({
        where: or(
          eq(schema.users.email, email),
          eq(schema.users.phone, email)
        )
      });
      if (!user) throw new Error('User with this email or mobile number does not exist');
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to request password reset');
    }
  },

  changePassword: async (_: unknown, { oldPassword, newPassword }: any, context: any) => {
    const { user } = checkAuth(context);
    const dbUser = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
    if (!dbUser) throw new Error('User not found');

    const { valid: isValid } = await verifyPassword(oldPassword, dbUser.password);
    if (!isValid) throw new Error('Invalid current password');

    const hashedPassword = await hashPassword(newPassword);
    await db.update(schema.users).set({ password: hashedPassword }).where(eq(schema.users.id, user.id));
    invalidateForUser(user.id);
    await createAuditLog({ 
      userId: user.id, 
      tenantId: user.tenantId, 
      action: 'CHANGE_PASSWORD', 
      resource: 'user', 
      details: { userId: user.id },
      userRole: user.role,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });
    return true;
  },

  toggleUserStatus: async (_: unknown, { id, isActive }: { id: string; isActive: boolean }, context: any) => {
    const auth = await requireSchoolAdminOrPlatform(context, 'users', 'edit');
    await assertTenantOwnership(schema.users, id, auth, 'user');
    // Outside the try: its catch discards the message, and "you may not switch
    // off a platform administrator" is the answer the caller needs.
    await assertMayTouchPlatformAccount(auth.user, id, isActive ? 'enable' : 'disable');
    try {
      await db.update(schema.users).set({ isActive }).where(eq(schema.users.id, id));
      // Best-effort local auth-cache invalidation; other API processes ride out
      // their ≤5 s TTL (approved trade-off, spec §3).
      invalidateForUser(id);
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id),
        with: { tenant: true }
      });
      await createAuditLog({ 
        action: isActive ? 'ENABLE_USER' : 'DISABLE_USER', 
        resource: 'user', 
        userId: context.user?.id || null,
        details: { userId: id, status: isActive },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
      return user;
    } catch { throw new Error('Failed to toggle user status') }
  },

  updateUser: async (_: unknown, { id, data }: { id: string; data: any }, context: any) => {
    const auth = await requireSchoolAdminOrPlatform(context, 'users', 'edit');
    const target = await assertTenantOwnership(schema.users, id, auth, 'user');
    // Outside the try: its catch would flatten a refusal into "Failed to update user".
    const updateData = { ...data };
    // Only a platform admin may change role or school. An unchanged echo of the
    // current value is allowed through so whole-record PATCHes keep working.
    if (target) {
      if (updateData.role !== undefined && updateData.role !== target.role) {
        throw forbidden('Forbidden: only a platform admin can change a role');
      }
      if (updateData.tenantId !== undefined && updateData.tenantId !== target.tenantId) {
        throw forbidden('Forbidden: only a platform admin can move a user between schools');
      }
    }
    // The platform's own hierarchy belongs to its owner. `users` opens a school's
    // staff; it must not let a scoped admin add a platform role, hand one out,
    // or clear one to turn a platform admin into a root owner.
    if ((updateData.role !== undefined || updateData.platformRoleId !== undefined) &&
      !(await isRootPlatformAdmin(auth.user))) {
      const [current] = await db.select({
        role: schema.users.role,
        platformRoleId: schema.users.platformRoleId,
      }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
      if (!current) throw forbidden('Forbidden: user not found');
      if (updateData.role !== undefined && updateData.role !== current.role) {
        throw forbidden('Forbidden: only a root platform administrator can change a platform role');
      }
      if (updateData.platformRoleId !== undefined && updateData.platformRoleId !== current.platformRoleId) {
        throw forbidden('Forbidden: only a root platform administrator can assign a platform role');
      }
    }
    try {
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      if (updateData.tenantId === "none" || updateData.tenantId === "") {
        updateData.tenantId = null;
      }
      await db.update(schema.users).set(updateData).where(eq(schema.users.id, id));
      if (updateData.isActive === false || updateData.password !== undefined) {
        invalidateForUser(id);
      }
      if (updateData.role !== undefined || updateData.platformRoleId !== undefined || updateData.tenantId !== undefined) {
        await invalidateUserPermissions([id]);
      }
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, id),
        with: { tenant: true }
      });
      await createAuditLog({
        action: 'UPDATE_USER',
        resource: 'user',
        userId: context.user?.id || null,
        details: { userId: id, campos: Object.keys(data) },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
      return user;
    } catch (err: any) {
      throw new Error(`Failed to update user: ${err.message}`);
    }
  },

  deleteUser: async (_: unknown, { id }: { id: string }, context: any) => {
    const auth = await requireSchoolAdminOrPlatform(context, 'users', 'delete');
    await assertTenantOwnership(schema.users, id, auth, 'user');
    await assertMayTouchPlatformAccount(auth.user, id, 'delete');
    try {
      await db.delete(schema.users).where(eq(schema.users.id, id));
      await createAuditLog({
        action: 'DELETE_USER',
        resource: 'user',
        userId: context.user?.id || null,
        details: { userId: id },
        userRole: context.user?.role,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });
      return true;
    } catch (err: any) {
      throw new Error(`Failed to delete user: ${err.message}`);
    }
  }
}

