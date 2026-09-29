import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, or, desc, inArray, count, asc, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { posthog, captureError } from '../../lib/monitoring/posthog';

// Idle TTL for a rotating QR session. A successful scan burns the code and the kiosk
// mints a fresh one within ~1s, so this only bounds how long a photo of the screen
// stays usable.
const QR_TTL_MS = 120 * 1000;

// The QR kiosk marks staff attendance: students/parents must not be able to write a
// staff attendance row or burn the code while a teacher is queued behind them.
const QR_SCAN_ROLES = new Set(['teacher', 'staff', 'admin', 'super_admin']);

export const staffAttendanceRoutes = new Elysia({ prefix: '/staff-attendance' })
  .use(requireAuth)
  .get('/', async ({ query, tenantId, user, set }) => {
    try {
      set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
      set.headers['Pragma'] = 'no-cache';
      set.headers['Expires'] = '0';

      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }

      const conditions = [eq(schema.staffAttendance.tenantId, tenantId)];

      // Security & Privacy: Non-admin users (teacher, staff, student) can only view their own attendance
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        conditions.push(eq(schema.staffAttendance.userId, user.id));
      } else if (query.userId) {
        // Admin querying specific user: Verify target user belongs to this tenant
        const targetUser = await db.query.users.findFirst({
          where: and(eq(schema.users.id, query.userId as string), eq(schema.users.tenantId, tenantId)),
          columns: { id: true },
        });
        if (!targetUser) {
          return []; // Secure isolation: cannot access users outside this tenant
        }
        conditions.push(eq(schema.staffAttendance.userId, query.userId as string));
      }

      if (query.date) conditions.push(eq(schema.staffAttendance.date, query.date as string));
      if (query.month) {
        conditions.push(or(
          eq(schema.staffAttendance.month, query.month as string),
          sql`${schema.staffAttendance.date} LIKE ${query.month + '%'}`
        )!);
      }

      const attendance = await db.query.staffAttendance.findMany({
        where: and(...conditions),
        with: { user: { columns: { name: true, role: true } } },
        orderBy: [desc(schema.staffAttendance.date), asc(schema.staffAttendance.userId)],
        // Ordering is date DESC, so a cap that a full tenant-month exceeds (staff x days)
        // silently drops the start of the month from the admin calendar rather than erroring.
        limit: 5000
      });

      return attendance.map(a => ({
        id: a.id,
        userId: a.userId,
        userName: a.user?.name || '',
        userRole: a.user?.role || '',
        date: a.date,
        month: a.month,
        status: a.status,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        remarks: a.remarks
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/staff-attendance', tenantId });
      set.status = 500;
      return { error: 'Failed to load staff attendance' };
    }
  })
  .post('/', async ({ body, tenantId, user, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Access denied: Administrator privileges required' };
      }

      const data = body as any;
      const { records, date } = data; // records: Array<{ userId, status, checkIn, checkOut, remarks }>

      if (!date || !records || !Array.isArray(records)) {
        set.status = 400;
        return { error: 'Date and records array are required' };
      }

      // Extract month for fast filtering
      const monthStr = date.substring(0, 7);
      const now = new Date();
      // Indian Standard Time (IST - Asia/Kolkata)
      const nowTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // SECURITY: Verify all users in the batch belong to this tenant
      const userIds = records.map((r: any) => r.userId);
      if (userIds.length > 0) {
        const userCountResult = await db.select({ count: count() }).from(schema.users).where(and(inArray(schema.users.id, userIds), eq(schema.users.tenantId, tenantId)));
        const userCount = Number(userCountResult[0]?.count || 0);
        
        if (userCount !== userIds.length) {
          set.status = 403;
          return { error: 'One or more user IDs are invalid or belong to another tenant' };
        }
      }

      // Drizzle bulk upsert
      await db.insert(schema.staffAttendance).values(
        records.map((record: any) => {
          const isPresent = (record.status || 'present') === 'present';
          return {
            tenantId: tenantId, 
            userId: record.userId, 
            date, 
            month: monthStr,
            status: record.status || 'present',
            checkIn: record.checkIn ?? (isPresent ? nowTimeStr : null),
            checkOut: record.checkOut,
            remarks: record.remarks
          };
        })
      ).onConflictDoUpdate({
        target: [schema.staffAttendance.userId, schema.staffAttendance.date],
        set: {
          status: sql`excluded.status`,
          month: sql`excluded.month`,
          checkIn: sql`CASE WHEN excluded.status = 'absent' THEN NULL ELSE COALESCE(excluded."checkIn", "StaffAttendance"."checkIn") END`,
          checkOut: sql`CASE WHEN excluded.status = 'absent' THEN NULL ELSE COALESCE(excluded."checkOut", "StaffAttendance"."checkOut") END`,
          remarks: sql`COALESCE(excluded.remarks, "StaffAttendance".remarks)`
        }
      });

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'staff_attendance_recorded',
        properties: {
          tenantId,
          date: (body as any).date,
          count: (body as any).records?.length
        }
      });

      return { success: true };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/staff-attendance', tenantId });
      console.error('[STAFF_ATTENDANCE_POST]', error);
      set.status = 500;
      return { error: 'Failed to save staff attendance' };
    }
  })
  .post('/check-in', async ({ body, user, tenantId, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!user || !user.id) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }
      if (user.tenantId && user.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Cross-tenant access forbidden' };
      }

      const clientBody = (body || {}) as { date?: string };
      const now = new Date();
      // Indian Standard Time (IST - Asia/Kolkata) date and time
      const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const dateStr: string = (clientBody.date && /^\d{4}-\d{2}-\d{2}$/.test(clientBody.date))
        ? clientBody.date
        : istDate;
      const monthStr: string = dateStr.slice(0, 7);
      const timeStr: string = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const existing = await db.query.staffAttendance.findFirst({
        where: and(
          eq(schema.staffAttendance.tenantId, tenantId),
          eq(schema.staffAttendance.userId, user.id),
          eq(schema.staffAttendance.date, dateStr)
        )
      });

      if (!existing) {
        set.status = 403;
        return {
          success: false,
          error: 'Remote self check-in is disabled. Please scan the school live attendance QR code or enter the kiosk backup code on campus to check in.',
        };
      } else if (!existing.checkOut) {
        const [record] = await db.update(schema.staffAttendance).set({
          checkOut: timeStr
        }).where(eq(schema.staffAttendance.id, existing.id)).returning();
        return { success: true, action: 'check_out', record };
      } else {
        return { success: false, message: 'Already checked in and checked out today' };
      }
    } catch (error) {
      captureError(error, { method: 'POST', path: '/staff-attendance/check-in', tenantId });
      set.status = 500;
      return { error: 'Failed to save check-in' };
    }
  })
  // ── 1. Admin generates dynamic rotating attendance QR token ──
  .get('/qr/active', async ({ tenantId, user, query, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Admin privileges required to generate attendance QR' };
      }

      // Never let a proxy/CDN cache a rotating token
      set.headers['Cache-Control'] = 'no-store';
      set.headers['Pragma'] = 'no-cache';

      const forceRefresh = query?.refresh === 'true';
      const existing = activeQRSessions.get(tenantId);
      const nowMs = Date.now();

      // If active and has at least 8 seconds left and not forced to refresh, return current
      if (!forceRefresh && existing && existing.expiresAt - nowMs > 8000) {
        return {
          success: true,
          qrData: JSON.stringify({
            tenantId,
            nonce: existing.nonce,
            code: existing.code,
            type: 'SCHOOL_ATTENDANCE_QR',
            v: 1
          }),
          code: existing.code,
          expiresAt: existing.expiresAt,
          remainingSeconds: Math.max(0, Math.floor((existing.expiresAt - nowMs) / 1000)),
          totalSeconds: QR_TTL_MS / 1000,
          // Lets the client schedule rotation against the server clock instead of its own
          serverTime: nowMs
        };
      }

      // Generate a fresh rotating token with guaranteed tenant uniqueness
      const nonce = crypto.randomUUID();
      let code = '';
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      } while (Array.from(activeQRSessions.values()).some((s) => s.code === code));

      const expiresAt = nowMs + QR_TTL_MS;

      const newSession: ActiveQRSession = {
        nonce,
        code,
        tenantId,
        createdAt: nowMs,
        expiresAt
      };

      activeQRSessions.set(tenantId, newSession);

      return {
        success: true,
        qrData: JSON.stringify({
          tenantId,
          nonce,
          code,
          type: 'SCHOOL_ATTENDANCE_QR',
          v: 1
        }),
        code,
        expiresAt,
        remainingSeconds: QR_TTL_MS / 1000,
        totalSeconds: QR_TTL_MS / 1000,
        serverTime: nowMs
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/staff-attendance/qr/active', tenantId });
      set.status = 500;
      return { error: 'Failed to load active session' };
    }
  })
  // ── 2. Admin long-polls live QR status & recent scan feed ──
  .get('/qr/status', async ({ tenantId, user, query, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        set.status = 403;
        return { error: 'Admin privileges required' };
      }

      set.headers['Cache-Control'] = 'no-store';
      set.headers['Pragma'] = 'no-cache';

      // Long-poll: hold the request until a scan happens (or wait expires) so the
      // kiosk stops hammering this endpoint every 2 seconds.
      // `since` = newest scan timestamp the client already has.
      const since = Number(query?.since) || 0;
      const waitMs = Math.min(Math.max(Number(query?.wait) || 0, 0), 20000);
      const lastScanTs = qrScanHistory.get(tenantId)?.[0]?.timestamp ?? 0;

      if (waitMs > 0 && lastScanTs <= since) {
        await waitForScanEvent(tenantId, waitMs);
      }

      const session = activeQRSessions.get(tenantId);
      const history = qrScanHistory.get(tenantId) || [];
      const nowMs = Date.now();

      return {
        isActive: !!session && nowMs < session.expiresAt,
        remainingSeconds: session ? Math.max(0, Math.floor((session.expiresAt - nowMs) / 1000)) : 0,
        code: session?.code || '',
        expiresAt: session?.expiresAt ?? 0,
        lastScan: history[0] || null,
        recentScans: history.slice(0, 8),
        serverTime: nowMs
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/staff-attendance/qr/status', tenantId });
      set.status = 500;
      return { error: 'Failed to load active QR session' };
    }
  })
  // ── 3. Teacher scans the QR code / enters 6-digit backup code to punch in ──
  .post('/qr/scan', async ({ body, user, tenantId, dbUser, set }) => {
    try {
      if (!tenantId) {
        set.status = 403;
        return { error: 'Tenant context required' };
      }
      if (!user || !user.id) {
        set.status = 401;
        return { error: 'Authentication required to scan attendance' };
      }
      if (user.tenantId && user.tenantId !== tenantId) {
        set.status = 403;
        return { error: 'Cannot record attendance for another school' };
      }

      // Strict Database-Level Tenant Isolation: the auth middleware already loaded this
      // user's row and rejected inactive/deactivated accounts, so re-check the tenant
      // against that row instead of running the same SELECT again.
      if (!dbUser || (dbUser.tenantId && dbUser.tenantId !== tenantId)) {
        set.status = 403;
        return { error: 'Security violation: User does not belong to this school.' };
      }

      // Staff-only: a student/parent scan would burn the code mid-queue and write a row
      // into the staff attendance table.
      if (!QR_SCAN_ROLES.has(user.role || '')) {
        set.status = 403;
        return { error: 'Only staff accounts can mark attendance from the QR kiosk.' };
      }

      const clientBody = (body || {}) as { qrData?: string; code?: string; date?: string };
      const isManualCode = Boolean(clientBody.code && !clientBody.qrData);
      const session = activeQRSessions.get(tenantId);
      const nowMs = Date.now();

      // Check if session has expired or not generated yet
      if (!session || nowMs > session.expiresAt) {
        set.status = 400;
        return {
          error: isManualCode ? 'Invalid code' : 'Invalid QR code'
        };
      }

      let isValid = false;

      // 1. Verify via full QR payload
      if (clientBody.qrData) {
        try {
          const parsed = JSON.parse(clientBody.qrData);
          if (
            parsed.tenantId === tenantId &&
            parsed.type === 'SCHOOL_ATTENDANCE_QR' &&
            parsed.nonce === session.nonce
          ) {
            isValid = true;
          } else {
            set.status = 400;
            return {
              error: 'Invalid QR code'
            };
          }
        } catch {
          set.status = 400;
          return {
            error: 'Invalid QR code'
          };
        }
      }

      // 2. Or verify via 6-digit manual backup code
      if (!isValid && clientBody.code) {
        const inputCode = clientBody.code.trim().replace(/\s+/g, '');
        if (inputCode === session.code) {
          isValid = true;
        } else {
          set.status = 400;
          return {
            error: 'Invalid code'
          };
        }
      }

      if (!isValid) {
        set.status = 400;
        return {
          error: isManualCode ? 'Invalid code' : 'Invalid QR code'
        };
      }

      // Current Indian Standard Time (IST - Asia/Kolkata)
      const now = new Date();
      const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);

      const dateStr = (clientBody.date && /^\d{4}-\d{2}-\d{2}$/.test(clientBody.date))
        ? clientBody.date
        : istDate;
      const monthStr = dateStr.slice(0, 7);
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Atomic insert: the unique index on (userId, date) makes a double-tap a clean
      // "already marked" response instead of a select-then-insert race that 500s.
      const [inserted] = await db.insert(schema.staffAttendance).values({
        tenantId,
        userId: user.id,
        date: dateStr,
        month: monthStr,
        status: 'present',
        checkIn: timeStr,
        remarks: 'QR Scan Check-in'
      }).onConflictDoNothing({
        target: [schema.staffAttendance.userId, schema.staffAttendance.date]
      }).returning();

      // Attendance already recorded for today
      if (!inserted) {
        set.status = 400;
        return {
          code: 'ATTENDANCE_ALREADY_MARKED',
          error: 'Your attendance is already marked for today.'
        };
      }

      // ── CRITICAL SECURITY: Burn the token immediately on a successful check-in! ──
      // This guarantees that after a scan, the QR code CANNOT be scanned by anyone else.
      activeQRSessions.delete(tenantId);

      const action = 'check_in';
      const record = inserted;

      // Teacher name comes from the row the auth middleware already loaded — no extra query.
      const userName = dbUser.name || 'Staff Member';

      // Record in recent scan history for live admin notification
      const historyItem = {
        userId: user.id,
        userName,
        userRole: user.role || 'teacher',
        action: action === 'check_in' ? 'Check In' : 'Check Out',
        time: timeStr,
        timestamp: nowMs
      };

      const tenantHistory = qrScanHistory.get(tenantId) || [];
      tenantHistory.unshift(historyItem);
      if (tenantHistory.length > 20) tenantHistory.pop();
      qrScanHistory.set(tenantId, tenantHistory);

      // Wake the kiosk's long-poll instantly so the scan is shown without delay
      notifyScanEvent(tenantId);

      return {
        success: true,
        action,
        time: timeStr,
        date: dateStr,
        userName,
        record
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/staff-attendance/qr/scan', tenantId });
      console.error('[STAFF_ATTENDANCE_QR_SCAN]', error);
      set.status = 500;
      return { error: 'Failed to save QR scan' };
    }
  });

// In-memory state for secure dynamic rotating QR codes per tenant
interface ActiveQRSession {
  nonce: string;
  code: string;
  tenantId: string;
  createdAt: number;
  expiresAt: number;
}

const activeQRSessions = new Map<string, ActiveQRSession>();
const qrScanHistory = new Map<string, Array<{
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  time: string;
  timestamp: number;
}>>();

/**
 * Long-poll registry for the kiosk's `/qr/status` requests.
 * One set of waiters per tenant; a scan wakes them all instantly instead of the
 * client asking every 2 seconds. The "read history → maybe wait" sequence in the
 * route is fully synchronous up to registration, so a scan can never slip in
 * between the two and get missed.
 */
interface ScanWaiter {
  resolve: (notified: boolean) => void;
}

const scanWaiters = new Map<string, Set<ScanWaiter>>();

function waitForScanEvent(tenantId: string, waitMs: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const waiter: ScanWaiter = { resolve };
    let waiters = scanWaiters.get(tenantId);
    if (!waiters) {
      waiters = new Set();
      scanWaiters.set(tenantId, waiters);
    }
    waiters.add(waiter);

    setTimeout(() => {
      const set = scanWaiters.get(tenantId);
      if (set) {
        set.delete(waiter);
        if (set.size === 0) scanWaiters.delete(tenantId);
      }
      resolve(false); // no-op when a scan already resolved this waiter
    }, waitMs);
  });
}

function notifyScanEvent(tenantId: string) {
  const waiters = scanWaiters.get(tenantId);
  if (!waiters || waiters.size === 0) return;
  scanWaiters.delete(tenantId);
  for (const waiter of waiters) waiter.resolve(true);
}


