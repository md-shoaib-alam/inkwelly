import { Worker, Job } from 'bullmq';
import { bullmqRedis } from './redis';
import { QUEUE_NAMES, auditQueue, pushQueue } from './queue';
import { isQuietHours, msUntilQuietEnds } from './quiet-hours';
import { sendPushNotification } from './firebase-admin';
import { invalidateUnreadCount, invalidateUnreadCountBulk, pushTransientNotification, pushTransientNotificationsBulk } from './notifications';
import { chunked } from './batch';
import { db } from './db';
import * as schema from '../db/schema';
import { inArray, eq, sql, and } from 'drizzle-orm';

import { env } from './env';

// One multi-row INSERT per chunk. Each notification row has ~6 columns, so 500
// rows stay far below Postgres' 65535-parameter ceiling per statement while
// collapsing a school-wide notice into a handful of round-trips.
const NOTIFICATION_INSERT_CHUNK = 500;

// BullMQ's addBulk builds one Redis pipeline entry per job; a 50k-recipient
// notice would otherwise send a single oversized command.
const PUSH_ENQUEUE_CHUNK = 500;


// Register error listeners on all workers to prevent unhandled 'error' events from dumping duplicate stack traces in Bun
const commonWorkerOptions = {
  connection: bullmqRedis,

  // Cap parallel jobs per worker so the overnight backlog drains at a controlled
  // rate in the morning instead of bursting the DB during the school peak.
  concurrency: 3,

  // Idle Redis polling and stall detection are dialled down from BullMQ's
  // defaults (5s / 30s). Cost of that: if a worker dies mid-job, its job isn't
  // picked up by another worker for up to stalledInterval. Raise
  // stalledInterval back toward 30s if failed-job recovery latency starts to
  // matter more than the idle chatter.
  drainDelay: 60000,
  stalledInterval: 600000,

  // A job running longer than this is treated as stalled. BullMQ auto-renews the
  // lock while the processor is alive, so long batch jobs are safe.
  lockDuration: 60000,
};

/**
 * Worker for saving Audit Logs in background
 */
export const auditWorker = new Worker(
  QUEUE_NAMES.AUDIT,
  async (job: Job) => {
    const payload = job.data;

    // Validate required fields to prevent DB insert constraint violation errors
    if (!payload || typeof payload.action !== 'string' || typeof payload.entityType !== 'string') {
      console.warn(`[WORKER] Invalid audit log payload for job ${job.id}. Missing action or entityType. Skipping.`, payload);
      return;
    }

    try {
      await db.insert(schema.auditLogs).values({
        tenantId: payload.tenantId || null,
        userId: payload.userId || null,
        action: payload.action,
        resource: payload.entityType, // mapped from entityType
        ipAddress: payload.ip || null,
        details: JSON.stringify({
          entityId: payload.entityId,
          oldData: payload.oldData,
          newData: payload.newData,
          userAgent: payload.userAgent,
          timestamp: payload.timestamp
        }),
      });
    } catch (error) {
      console.error(`[WORKER] Failed to store audit log for job ${job.id}:`, error);
      throw error; // allow retry
    }
  },
  commonWorkerOptions
);

// Clean up any legacy repeatable/cron jobs in auditQueue to stop unwanted repeat jobs from spamming
auditQueue.getRepeatableJobs().then((jobs) => {
  for (const job of jobs) {
    console.log(`[QUEUE] Removing legacy repeatable job from auditQueue: ${job.name} (Key: ${job.key})`);
    auditQueue.removeRepeatableByKey(job.key).catch(err => {
      console.error(`[QUEUE] Failed to remove repeatable job ${job.key}:`, err);
    });
  }
}).catch(err => {
  console.error('[QUEUE] Failed to get repeatable jobs for auditQueue:', err);
});

/**
 * Worker for general background tasks
 */
export const generalWorker = new Worker(
  QUEUE_NAMES.GENERAL,
  async (job: Job) => {
    console.log(`[WORKER] Processing General Job: ${job.name} (ID: ${job.id})`);
    
    // Simulate heavy work
    if (job.name === 'test-job') {
      await new Promise(res => setTimeout(res, 2000));
      console.log(`[WORKER] Finished test-job with data:`, job.data);
    }

    if (job.name === 'student-import') {
      const { validRows, targetTenantId, hashedPassword, routeMap, totalRows, skippedCount = 0, preValidationErrors } = job.data;
      const errors = [...(preValidationErrors || [])];
      let imported = 0;
      const totalToImport = validRows.length;
      
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < totalToImport; i += BATCH_SIZE) {
        const batch = validRows.slice(i, i + BATCH_SIZE);
        
        try {
          await db.transaction(async (tx) => {
            const usersToInsert = batch.map((v: any) => ({
              email: v.email,
              name: v.name,
              role: 'student' as const,
              phone: v.phone,
              password: hashedPassword,
              tenantId: targetTenantId,
            }));

            const createdUsers = await tx.insert(schema.users)
              .values(usersToInsert)
              .onConflictDoUpdate({
                target: schema.users.email,
                set: {
                  name: sql`EXCLUDED.name`,
                  phone: sql`EXCLUDED.phone`,
                  tenantId: sql`EXCLUDED."tenantId"`
                }
              })
              .returning();
            
            if (createdUsers.length > 0) {
              const userMap = new Map(createdUsers.map(u => [u.email.toLowerCase(), u.id]));
              const studentsToInsert: any[] = [];

              batch.forEach((v: any) => {
                const userId = userMap.get(v.email.toLowerCase());
                if (!userId) return;

                let formattedDob = v.dobRaw ? v.dobRaw.toString() : null;
                if (typeof v.dobRaw === 'number') {
                  const XLSX_SSF = require('xlsx').SSF;
                  const dateObj = XLSX_SSF.parse_date_code(v.dobRaw);
                  formattedDob = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                }

                let formattedAdmission = v.admissionDateRaw ? v.admissionDateRaw.toString() : null;
                if (typeof v.admissionDateRaw === 'number') {
                  const XLSX_SSF = require('xlsx').SSF;
                  const dateObj = XLSX_SSF.parse_date_code(v.admissionDateRaw);
                  formattedAdmission = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                }

                studentsToInsert.push({
                  userId,
                  rollNumber: v.rollNumber,
                  classId: v.classId,
                  gender: v.gender,
                  dateOfBirth: formattedDob,
                  bloodGroup: v.bloodGroup,
                  admissionDate: formattedAdmission,
                });
              });

              if (studentsToInsert.length > 0) {
                const createdStudents = await tx.insert(schema.students)
                  .values(studentsToInsert)
                  .onConflictDoUpdate({
                    target: schema.students.userId,
                    set: {
                      rollNumber: sql`EXCLUDED."rollNumber"`,
                      classId: sql`EXCLUDED."classId"`,
                      gender: sql`EXCLUDED.gender`,
                      dateOfBirth: sql`EXCLUDED."dateOfBirth"`,
                      bloodGroup: sql`EXCLUDED."bloodGroup"`,
                      admissionDate: sql`EXCLUDED."admissionDate"`,
                    }
                  })
                  .returning();
                imported += createdStudents.length;

                const studentUserMap = new Map(createdStudents.map(s => [s.userId, s.id]));
                const realTransport: any[] = [];

                batch.forEach((v: any) => {
                  const userId = userMap.get(v.email.toLowerCase());
                  const studentId = userId ? studentUserMap.get(userId) : null;
                  const routeId = v.transportRouteName && routeMap ? routeMap[v.transportRouteName.toLowerCase()] : null;
                  
                  if (studentId && routeId) {
                    let formattedAdmission = v.admissionDateRaw ? v.admissionDateRaw.toString() : null;
                    if (typeof v.admissionDateRaw === 'number') {
                      const XLSX_SSF = require('xlsx').SSF;
                      const dateObj = XLSX_SSF.parse_date_code(v.admissionDateRaw);
                      formattedAdmission = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
                    }

                    realTransport.push({
                      studentId,
                      routeId,
                      pickupPoint: v.pickupPoint || 'Main Stop',
                      startDate: formattedAdmission
                    });
                  }
                });

                if (realTransport.length > 0) {
                  await tx.insert(schema.transportAssignments).values(realTransport);
                }
              }
            }
          });
        } catch (batchErr: any) {
          console.error(`[WORKER] Batch student import error at offset ${i}:`, batchErr);
          errors.push(`Batch starting at row ${i + 1}: ${batchErr.message || String(batchErr)}`);
        }

        // Calculate and update progress
        const percent = Math.min(Math.round(((i + batch.length) / totalToImport) * 100), 100);
        await job.updateProgress({
          percent,
          total: totalRows,
          imported,
          skipped: skippedCount,
          errors: errors.length,
          errorDetails: errors
        });
      }

      // Purge cache for the tenant
      const { dataCache } = await import('./cache');
      await dataCache.deleteMatch([
        `*students*${targetTenantId}*`,
        `dashboard:${targetTenantId}:*`
      ]);

      return {
        success: errors.length === 0,
        imported,
        skipped: skippedCount,
        errors: errors.length,
        total: totalRows,
        errorDetails: errors
      };
    }
  },
  commonWorkerOptions
);

/**
 * Worker for Emails
 */
export const emailWorker = new Worker(
  QUEUE_NAMES.EMAILS,
  async (job: Job) => {
    console.log(`[WORKER] Processing Email Job: ${job.name}`);
    await new Promise(res => setTimeout(res, 1000));
    console.log(`[WORKER] Email sent to: ${job.data.to}`);
  },
  commonWorkerOptions
);

const FEE_TEMPLATE_URL = 'https://i.pinimg.com/736x/e7/39/c5/e739c5443d9d10dc13d704a9e6af3ea8.jpg';

interface FeeReminder {
  studentId: string;
  feeType: string;
  amount: number | string;
  dueDate: string;
}

/**
 * Resolve fee reminders for a whole chunk at once: one student lookup, one
 * tenant lookup, one Redis pipeline and one bulk push enqueue. Assigning fees
 * school-wide used to enqueue one job per student, which serialized thousands
 * of round-trips across the 3-slot worker pool during the morning peak.
 */
async function processFeeReminders(tenantId: string, fees: FeeReminder[]): Promise<void> {
  const targets = fees.filter((f) => f?.studentId);
  if (targets.length === 0) return;

  const [students, tenant] = await Promise.all([
    db.query.students.findMany({
      where: inArray(schema.students.id, [...new Set(targets.map((f) => f.studentId))]),
      with: {
        user: { columns: { name: true } },
        parent: { with: { user: { with: { notificationTokens: true } } } }
      }
    }),
    db.query.tenants.findFirst({
      where: eq(schema.tenants.id, tenantId),
      columns: { slug: true }
    })
  ]);

  const tenantSlug = tenant?.slug || 'demo-academy';
  const studentsById = new Map(students.map((s: any) => [s.id, s]));
  const quietDelay = msUntilQuietEnds();

  const transientEntries: { userId: string; notif: unknown }[] = [];
  const pushJobs: { name: string; data: any; opts: any }[] = [];

  for (const [index, fee] of targets.entries()) {
    const student = studentsById.get(fee.studentId);
    const parentUser = student?.parent?.user;
    if (!student || !parentUser) continue;

    const body = `${student.user.name}'s fee of ₹${fee.amount} (${fee.feeType}) is due on ${fee.dueDate}.`;

    transientEntries.push({
      userId: parentUser.id,
      notif: {
        id: `transient_${Date.now()}_fee_${fee.studentId}_${index}`,
        tenantId,
        userId: parentUser.id,
        title: 'Fee Due Alert',
        content: body,
        type: 'fee',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    });

    if (parentUser.notificationTokens?.length) {
      const jobId = `push_fee_${Date.now()}_${index}_${Math.random().toString(36).substring(7)}`;
      pushJobs.push({
        name: jobId,
        data: {
          tokens: parentUser.notificationTokens.map((t: any) => t.token),
          title: 'Fee Payment Due',
          body,
          data: {
            type: 'fee_due',
            studentId: fee.studentId,
            dueDate: fee.dueDate,
            link: `${env.NEXT_PUBLIC_APP_URL}/${tenantSlug}/fees`
          },
          imageUrl: FEE_TEMPLATE_URL
        },
        opts: {
          jobId,
          priority: 2, // Premium: Medium Priority for Finance
          delay: quietDelay > 0 ? quietDelay : undefined,
        }
      });
    }
  }

  await pushTransientNotificationsBulk(transientEntries);

  if (pushJobs.length > 0) {
    for (const group of chunked(pushJobs, PUSH_ENQUEUE_CHUNK)) {
      await pushQueue.addBulk(group).catch((e) =>
        console.error('[QUEUE_ERROR] Failed to bulk queue fee due pushes:', e)
      );
    }
  }
}

/**
 * Worker for System Notifications (Fees, Notices, etc.)
 */
export const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATIONS,
  async (job: Job) => {
    console.log(`[WORKER] Processing Notification Job: ${job.name}`);
    
    if (job.name === 'new-notice') {
      const { tenantId, noticeId, title, targetRole } = job.data;
      
      const conditions = [
        eq(schema.users.tenantId, tenantId),
        eq(schema.users.isActive, true)
      ];

      if (targetRole && targetRole !== 'all') {
        conditions.push(eq(schema.users.role, targetRole as any));
      }

      const targetedUsers = await db.query.users.findMany({
        where: and(...conditions),
        with: { notificationTokens: true }
      });

      if (targetedUsers.length === 0) return;

      const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.id, tenantId),
        columns: { slug: true }
      });
      const tenantSlug = tenant?.slug || 'demo-academy';
      const noticeLink = `${env.NEXT_PUBLIC_APP_URL}/${tenantSlug}/notices`;

      // Chunked multi-row inserts: one statement per 500 recipients instead of
      // one per user. Stays far below Postgres' parameter ceiling per chunk.
      const createdAt = new Date();
      for (const group of chunked(targetedUsers, NOTIFICATION_INSERT_CHUNK)) {
        await db.insert(schema.notifications).values(group.map((user: any) => ({
          tenantId,
          userId: user.id,
          title: 'New School Notice',
          content: title,
          type: 'notice',
          isRead: false,
          createdAt
        }))).catch(e => console.error(`[DB_ERROR] Failed to insert a chunk of notice notifications for tenant ${tenantId}:`, e));
      }

      const pushJobs: { name: string; data: any; opts: any }[] = [];
      for (const user of targetedUsers) {
        if (!user.notificationTokens?.length) continue;
        const jobId = `push_notice_${noticeId}_${user.id}`;
        pushJobs.push({
          name: jobId,
          data: {
            tokens: user.notificationTokens.map((t: any) => t.token),
            title: 'New School Notice',
            body: title,
            data: { type: 'new_notice', noticeId, link: noticeLink }
          },
          opts: { jobId, priority: 2 }
        });
      }

      for (const group of chunked(pushJobs, PUSH_ENQUEUE_CHUNK)) {
        await pushQueue.addBulk(group).catch(e => console.error('[QUEUE_ERROR] Failed to bulk queue notice pushes:', e));
      }

      await invalidateUnreadCountBulk(targetedUsers.map((u: any) => u.id));
      return;
    }

    if (job.name === 'absence-alerts') {
      const { tenantId, date, absentStudentIds } = job.data;
      if (!absentStudentIds || absentStudentIds.length === 0) return;

      const [students, tenant] = await Promise.all([
        db.query.students.findMany({
          where: inArray(schema.students.id, absentStudentIds),
          with: { 
            user: { with: { notificationTokens: true } },
            parent: { with: { user: { with: { notificationTokens: true } } } }
          }
        }),
        db.query.tenants.findFirst({
          where: eq(schema.tenants.id, tenantId),
          columns: { slug: true }
        })
      ]);

      const tenantSlug = tenant?.slug || 'demo-academy';

      // Use a pre-made static template image for absence alerts
      // You can upload your own custom designed image to any hosting service (Imgur, S3, etc.) and paste the link here
      const absenceTemplateUrl = 'https://i.pinimg.com/736x/a2/80/37/a280379252ca902758915df7e1d317da.jpg';
      const absenceLink = `${env.NEXT_PUBLIC_APP_URL}/${tenantSlug}/attendance`;
      const stamp = Date.now();

      const transientEntries: { userId: string; notif: unknown }[] = [];
      const pushJobs: { name: string; data: any; opts: any }[] = [];

      // The alert always names the absent student, whether it goes to the
      // parent or to the student themselves.
      const addRecipient = (recipient: any, studentId: string, studentName: string, who: string) => {
        transientEntries.push({
          userId: recipient.id,
          notif: {
            id: `transient_${stamp}_${who}_${studentId}`,
            tenantId,
            userId: recipient.id,
            title: `Absent: ${studentName}`,
            content: `Date: ${date}`,
            type: 'absence',
            isRead: false,
            createdAt: new Date().toISOString()
          }
        });

        if (!recipient.notificationTokens?.length) return;
        const jobId = `push_abs_${stamp}_${who}_${studentId}`;
        pushJobs.push({
          name: jobId,
          data: {
            tokens: recipient.notificationTokens.map((t: any) => t.token),
            title: `Absent: ${studentName}`,
            body: `Date: ${date}`,
            data: { type: 'attendance_alert', studentId, date, link: absenceLink },
            imageUrl: absenceTemplateUrl
          },
          opts: { jobId, priority: 1 } // Premium: High Priority
        });
      };

      for (const student of students) {
        const studentName = student.user?.name;
        if (student.parent?.user) addRecipient(student.parent.user, student.id, studentName, 'parent');
        if (student.user) addRecipient(student.user, student.id, studentName, 'std');
      }

      // Transient cache storage only — these deliberately have no DB row.
      await pushTransientNotificationsBulk(transientEntries);
      for (const group of chunked(pushJobs, PUSH_ENQUEUE_CHUNK)) {
        await pushQueue.addBulk(group).catch(e => console.error('[QUEUE_ERROR] Failed to bulk queue absence pushes:', e));
      }
      return;
    }

    if (job.name === 'fee-due') {
      const { tenantId, studentId, feeType, amount, dueDate } = job.data;
      if (!studentId) return;
      await processFeeReminders(tenantId, [{ studentId, feeType, amount, dueDate }]);
      return;
    }

    if (job.name === 'fee-due-batch') {
      const { tenantId, fees } = job.data;
      await processFeeReminders(tenantId, Array.isArray(fees) ? fees : []);
      return;
    }

    if (job.name === 'subscription-alert') {
      const { parentId, planName, status, amount, endDate, tenantId } = job.data;
      if (!parentId) return;

      const parent = await db.query.parents.findFirst({
        where: eq(schema.parents.id, parentId),
        with: { user: { with: { notificationTokens: true } } }
      });

      if (parent?.user) {
        const parentUser = parent.user;

        let title = 'Subscription Update';
        let body = `Your subscription for ${planName} is active.`;

        if (status === 'cancelled') {
          title = 'Subscription Cancelled';
          body = `Your subscription for ${planName} has been cancelled.`;
        } else if (status === 'pending_cancellation') {
          title = 'Subscription Cancellation Scheduled';
          body = `Your subscription for ${planName} will not renew after ${endDate}.`;
        } else if (status === 'active') {
          title = 'Subscription Active';
          body = `Your subscription for ${planName} is active until ${endDate}.`;
        }

        if (parentUser.notificationTokens?.length) {
          const tokens = parentUser.notificationTokens.map(t => t.token);
          const { queuePushNotification } = await import('./firebase-admin');

          const tenant = await db.query.tenants.findFirst({
            where: eq(schema.tenants.id, tenantId),
            columns: { slug: true }
          });
          const tenantSlug = tenant?.slug || 'demo-academy';

          await queuePushNotification({
            tokens,
            title,
            body,
            data: {
              type: 'subscription_alert',
              parentId,
              status,
              link: `${env.NEXT_PUBLIC_APP_URL}/${tenantSlug}/subscription`
            },
            priority: 1 //  Premium: High Priority for billing status
          }).catch(e => console.error(`[PREMIUM_PUSH_ERROR] Failed to queue sub push for parent ${parentUser.name}:`, e));
        }


        // Save to transient cache list
        const transientNotif = {
          id: `transient_${Date.now()}_sub_${parentId}`,
          tenantId,
          userId: parentUser.id,
          title,
          content: body,
          type: 'subscription',
          isRead: false,
          createdAt: new Date().toISOString()
        };

        await pushTransientNotification(parentUser.id, transientNotif);
      }
      return;
    }

    // Example: Create an in-app notification record in DB
    console.log(`[WORKER] Notification created for: ${job.data.userId}`);
  },
  commonWorkerOptions
);

/**
 * Worker for Push Notifications (Firebase)
 */
export const pushWorker = new Worker(
  QUEUE_NAMES.PUSH,
  async (job: Job) => {
    const { tokens, title, body, data, imageUrl } = job.data;
    console.log(`[WORKER] Sending Push Notification: ${job.name} to ${tokens.length} devices`);
    
    try {
      await sendPushNotification(tokens, title, body, data, imageUrl);
      console.log(`[WORKER] Push delivery successful for job ${job.id}`);
    } catch (error) {
      console.error(`[WORKER] Push delivery failed for job ${job.id}:`, error);
      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  commonWorkerOptions
);

// Event Listeners
generalWorker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} has completed!`);
});

generalWorker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} has failed with ${err.message}`);
});

// Register error listeners on all workers to prevent unhandled 'error' events from dumping duplicate stack traces in Bun
const workers = [auditWorker, generalWorker, emailWorker, notificationWorker, pushWorker];
workers.forEach((w) => {
  w.on('error', () => {
    // Gracefully caught here; ioredis's global error event already handles and throttles the console log
  });
});

// ─── Quiet Hours: pause all background processing overnight (21:00–07:00 IST) ───
// Jobs enqueued overnight stay queued and drain in the morning at capped
// concurrency, so the resume doesn't burst the DB during the school peak.
let workersPaused = false;
function applyQuietHours() {
  const quiet = isQuietHours();
  if (quiet === workersPaused) return; // no state change
  workersPaused = quiet;
  for (const w of workers) {
    if (quiet) {
      // pause(false) lets the active job finish, then stops pulling new work
      w.pause(false).catch(() => {});
    } else {
      w.resume();
    }
  }
  console.log(
    quiet
      ? '🌙 [QUIET HOURS] Background workers paused until 07:00 IST'
      : '🌅 [QUIET HOURS] Background workers resumed'
  );
}

applyQuietHours();
setInterval(applyQuietHours, 60000);

console.log('BullMQ Workers Started Successfully');

