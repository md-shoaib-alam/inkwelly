import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, desc, asc, gte, lte, ilike, or, count } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { invalidateUnreadCount } from '../lib/notifications';
import { posthog, captureError } from '../lib/monitoring/posthog';

// Leave history grows unbounded, so a page load must never return the whole
// table: newest-first with a bounded window instead.
const DEFAULT_LEAVE_LIMIT = 500;
const MAX_LEAVE_LIMIT = 1000;

// Paginated (admin web) mode — one screenful at a time.
const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 100;

// Starter (basic) plans keep a rolling 3-month history; paid tiers see everything.
const BASIC_HISTORY_MONTHS = 3;

const SORTABLE_COLUMNS: Record<string, any> = {
  userName: schema.leaves.userName,
  leaveType: schema.leaves.leaveType,
  startDate: schema.leaves.startDate,
  status: schema.leaves.status,
  createdAt: schema.leaves.createdAt,
};

export const leavesRoutes = new Elysia({ prefix: '/leaves' })
  .use(requireAuth)
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      if (!tenantId || !user) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const {
        role, status, leaveType, userId, limit, offset,
        paginate, search, from, to, sortBy, order,
      } = query as any;

      const conditions = [eq(schema.leaves.tenantId, tenantId as string)];

      let targetUserId = userId;
      if (!['admin', 'super_admin'].includes(user.role)) {
        // Non-admin can only see their own leaves
        targetUserId = user.id;
      }

      if (targetUserId) {
        conditions.push(eq(schema.leaves.userId, targetUserId as string));
      } else {
        // Manager view (Admin looking at others)
        if (role) conditions.push(eq(schema.leaves.role, role as string));
      }

      if (leaveType && leaveType !== 'all') conditions.push(eq(schema.leaves.leaveType, leaveType as string));

      // ── Paginated mode (admin web) — opt-in via ?paginate=true so existing
      // callers that expect a bare array (mobile app, self-service screens)
      // keep their contract.
      if (paginate === 'true') {
        const term = typeof search === 'string' ? search.trim() : '';
        if (term) {
          const pattern = `%${term}%`;
          conditions.push(or(
            ilike(schema.leaves.userName, pattern)!,
            ilike(schema.leaves.userEmail, pattern)!,
            ilike(schema.leaves.reason, pattern)!
          )!);
        }

        // A request matches the date range only when it sits entirely inside it
        if (from) conditions.push(gte(schema.leaves.startDate, String(from)));
        if (to) conditions.push(lte(schema.leaves.endDate, String(to)));

        // Plan window: basic gets the last 3 months, paid tiers full history
        const tenant = await db.query.tenants.findFirst({
          where: eq(schema.tenants.id, tenantId as string),
          columns: { plan: true },
        });
        const plan = tenant?.plan?.toLowerCase() || 'basic';
        const historyMonths = plan === 'basic' ? BASIC_HISTORY_MONTHS : null;
        if (historyMonths) {
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - historyMonths);
          conditions.push(gte(schema.leaves.createdAt, cutoff));
        }

        const baseWhere = and(...conditions);
        const statusWhere =
          status && status !== 'all'
            ? and(baseWhere, eq(schema.leaves.status, status as string))
            : baseWhere;

        const parsedPage = parseInt(String(query.page ?? ''), 10);
        const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

        const parsedPageSize = parseInt(String(limit ?? ''), 10);
        const pageSize =
          Number.isFinite(parsedPageSize) && parsedPageSize > 0
            ? Math.min(parsedPageSize, MAX_PAGE_SIZE)
            : DEFAULT_PAGE_SIZE;

        const sortColumn = SORTABLE_COLUMNS[sortBy as string] ?? schema.leaves.createdAt;
        const sortAscending = order === 'asc';

        const [items, totalRows, statusRows] = await Promise.all([
          db.query.leaves.findMany({
            where: statusWhere,
            orderBy: [sortAscending ? asc(sortColumn) : desc(sortColumn), desc(schema.leaves.id)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
          db.select({ count: count() }).from(schema.leaves).where(statusWhere),
          // Status tabs deliberately ignore the status filter so the cards stay
          // meaningful while one status is selected.
          db.select({ status: schema.leaves.status, count: count() })
            .from(schema.leaves)
            .where(baseWhere)
            .groupBy(schema.leaves.status),
        ]);

        const total = Number(totalRows[0]?.count || 0);

        const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
        let allCount = 0;
        for (const row of statusRows) {
          const value = Number(row.count || 0);
          counts[row.status] = value;
          allCount += value;
        }

        return {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          counts: { all: allCount, ...counts },
          historyMonths,
        };
      }

      if (status && status !== 'all') conditions.push(eq(schema.leaves.status, status as string));

      const queryOptions: any = {
        where: and(...conditions),
        orderBy: [desc(schema.leaves.createdAt), desc(schema.leaves.id)],
      };

      const parsedLimit = limit ? parseInt(String(limit)) : NaN;
      queryOptions.limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, MAX_LEAVE_LIMIT)
          : DEFAULT_LEAVE_LIMIT;
      if (offset) queryOptions.offset = parseInt(String(offset));

      const records = await db.query.leaves.findMany(queryOptions);

      return records;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/leaves', tenantId });
      set.status = 500;
      return { error: 'Failed to load leave requests' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId || !user) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { userId: applicantId, leaveType, startDate, endDate, reason } = body as any;

      // JWT only carries id/email/role — fetch name from DB
      const dbUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
        columns: { name: true, email: true, role: true },
      });

      if (!dbUser) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Admins may file a request on behalf of someone in their own tenant.
      // Everyone else can only ever file their own — body.userId is ignored.
      let applicant = {
        id: user.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role || user.role,
      };

      if (['admin', 'super_admin'].includes(user.role) && applicantId && applicantId !== user.id) {
        const target = await db.query.users.findFirst({
          where: and(
            eq(schema.users.id, applicantId as string),
            eq(schema.users.tenantId, tenantId as string)
          ),
          columns: { id: true, name: true, email: true, role: true },
        });

        if (!target) {
          set.status = 404;
          return { error: 'Applicant not found in this school' };
        }

        applicant = { id: target.id, name: target.name, email: target.email, role: target.role };
      }

      const [record] = await db.insert(schema.leaves).values({
        tenantId: tenantId as string,
        userId: applicant.id,
        userName: applicant.name,
        userEmail: applicant.email,
        role: applicant.role,
        leaveType,
        startDate,
        endDate,
        reason,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      if (!record) {
        set.status = 500;
        return { error: 'Failed to create leave record' };
      }

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'leave_requested',
        properties: {
          tenantId,
          userId: applicant.id,
          leaveType: (body as any).leaveType
        }
      });

      // --- Notify School Admins FCM & Persistent Integration ---
      try {
        const title = `New Leave Request: ${applicant.name}`;
        const content = `${applicant.name} (${applicant.role.toUpperCase()}) has requested leave for ${leaveType} from ${startDate} to ${endDate}.`;

        // 1. Fetch all users belonging to this school/tenant with the role of 'admin'
        const schoolAdmins = await db.query.users.findMany({
          where: and(
            eq(schema.users.tenantId, tenantId as string),
            eq(schema.users.role, 'admin'),
            eq(schema.users.isActive, true)
          ),
          columns: { id: true }
        });

        const adminUserIds = schoolAdmins.map(admin => admin.id);

        for (const adminId of adminUserIds) {
          // Write to persistent database notification log
          await db.insert(schema.notifications).values({
            tenantId: tenantId as string,
            userId: adminId,
            title,
            content,
            type: 'push',
            isRead: false,
            createdAt: new Date(),
          });
          await invalidateUnreadCount(adminId);

          // Fetch admin FCM registration tokens
          const tokensRows = await db.query.notificationTokens.findMany({
            where: eq(schema.notificationTokens.userId, adminId),
            columns: { token: true }
          });
          const tokens = tokensRows.map(t => t.token);

          if (tokens.length > 0) {
            const { sendPushNotification } = require('../lib/firebase-admin');
            
            // Resolve dynamic redirection link paths
            const adminTenant = await db.query.tenants.findFirst({
              where: eq(schema.tenants.id, tenantId as string),
              columns: { slug: true }
            });
            const linkPath = `/${adminTenant?.slug || tenantId}/leaves`;

            await sendPushNotification(
              tokens,
              title,
              content,
              {
                type: 'new_leave_request',
                leaveId: record.id,
                userId: applicant.id,
                link: linkPath,
              }
            ).catch((fcmErr: any) => console.error(`FCM failed for admin ${adminId}:`, fcmErr));
          }
        }
      } catch (notifyError) {
        console.error("FCM execution failed when notifying admins of leave request:", notifyError);
      }

      return record;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/leaves', tenantId });
      set.status = 500;
      return { error: 'Failed to save leave requests' };
    }
  })
  .put('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId || !user) {
        set.status = 401;
        return { error: 'Authentication required' };
      }

      const { id, status, approverRemarks } = body as any;

      const leave = await db.query.leaves.findFirst({ where: eq(schema.leaves.id, id) });

      if (!leave || leave.tenantId !== tenantId) {
        set.status = 404;
        return { error: 'Leave request not found' };
      }

      // If status is 'cancelled', user is cancelling their own pending leave
      if (status === 'cancelled') {
        if (leave.userId !== user.id) {
          set.status = 403;
          return { error: 'You can only cancel your own leave requests' };
        }
        if (leave.status !== 'pending') {
          set.status = 400;
          return { error: 'Only pending requests can be cancelled' };
        }
      } else {
        // Manager action (Approve/Reject)
        if (!['admin', 'super_admin'].includes(user.role)) {
          set.status = 403;
          return { error: 'Only administrators can approve or reject leaves' };
        }
      }

      const [updated] = await db.update(schema.leaves).set({
        status,
        approvedBy: status !== 'cancelled' ? user.id : undefined,
        approverRemarks: approverRemarks || leave.approverRemarks,
      }).where(eq(schema.leaves.id, id)).returning();

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'leave_updated',
        properties: {
          tenantId,
          leaveId: id,
          status
        }
      });

      // --- FCM & Persistent Notifications Integration ---
      if (['approved', 'rejected', 'cancelled'].includes(status)) {
        try {
          // Retrieve the name of the user who requested the leave
          let userName = 'A user';
          const requester = await db.query.users.findFirst({
            where: eq(schema.users.id, leave.userId),
            columns: { name: true }
          });
          if (requester) {
            userName = requester.name;
          }

          const title = `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`;
          const content = status === 'cancelled'
            ? `Leave request from ${userName} for ${leave.leaveType} starting ${leave.startDate} has been cancelled.`
            : `Your leave request for ${leave.leaveType} starting ${leave.startDate} has been ${status}.`;


          // Determine notification recipients based on action type
          const recipientUserIds: string[] = [];

          if (status === 'cancelled') {
            // Cancelled: notify school admins so they know a pending leave was withdrawn
            const schoolAdmins = await db.query.users.findMany({
              where: and(
                eq(schema.users.tenantId, tenantId as string),
                eq(schema.users.role, 'admin'),
                eq(schema.users.isActive, true)
              ),
              columns: { id: true }
            });
            recipientUserIds.push(...schoolAdmins.map(a => a.id));
          } else {
            // Approved/Rejected: notify the requester
            recipientUserIds.push(leave.userId);
          }

          // 2. If it's a student leave, also find the parent userId and notify them
          if (leave.role === 'student') {
            const studentProfile = await db.query.students.findFirst({
              where: eq(schema.students.userId, leave.userId),
              columns: { parentId: true }
            });
            if (studentProfile?.parentId) {
              const parentProfile = await db.query.parents.findFirst({
                where: eq(schema.parents.id, studentProfile.parentId),
                columns: { userId: true }
              });
              if (parentProfile?.userId) {
                recipientUserIds.push(parentProfile.userId);
              }
            }
          }

          // Send notifications & push tokens
          for (const targetUid of recipientUserIds) {
            // Write notification to persistent database schema
            await db.insert(schema.notifications).values({
              tenantId: tenantId as string,
              userId: targetUid,
              title,
              content,
              type: 'push',
              isRead: false,
              createdAt: new Date(),
            });
            await invalidateUnreadCount(targetUid);

            // Fetch device FCM tokens
            const tokensRows = await db.query.notificationTokens.findMany({
              where: eq(schema.notificationTokens.userId, targetUid),
              columns: { token: true }
            });
            const tokens = tokensRows.map(t => t.token);
            
            if (tokens.length > 0) {
              const { sendPushNotification } = require('../lib/firebase-admin');
              
              // Resolve dynamic redirection link paths
              const userTenant = await db.query.tenants.findFirst({
                where: eq(schema.tenants.id, tenantId as string),
                columns: { slug: true }
              });
              const linkPath = `/${userTenant?.slug || tenantId}/leaves`;

              await sendPushNotification(
                tokens,
                title,
                content,
                {
                  type: 'leave_status',
                  leaveId: leave.id,
                  status,
                  link: linkPath,
                }
              ).catch((fcmErr: any) => console.error(`FCM failed for user ${targetUid}:`, fcmErr));
            }
          }
        } catch (notifyError) {
          console.error("FCM/Notification execution failed for leave update:", notifyError);
        }
      }

      return updated;
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/leaves', tenantId });
      set.status = 500;
      return { error: 'Failed to update leave requests' };
    }
  });

