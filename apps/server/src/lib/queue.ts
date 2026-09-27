import { Queue } from 'bullmq';
import { bullmqRedis, redis } from './redis';

// Define names for our queues
export const QUEUE_NAMES = {
  GENERAL: 'general-tasks',
  EMAILS: 'email-notifications',
  REPORTS: 'report-generation',
  NOTIFICATIONS: 'system-notifications',
  PUSH: 'push-notifications',
  AUDIT: 'audit-logs',
} as const;

// Completed jobs are deleted rather than accumulating in Redis forever: a
// school-wide fee reminder used to be one job per student, so retention would
// leave tens of thousands of finished payloads (data + returnvalue) in memory.
// The last KEEP_FAILED_JOBS failures are kept for debugging.
const KEEP_FAILED_JOBS = 1000;

/**
 * Initialize Queues
 */
export const generalQueue = new Queue(QUEUE_NAMES.GENERAL, {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: KEEP_FAILED_JOBS,
  },
});

export const emailQueue = new Queue(QUEUE_NAMES.EMAILS, {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: KEEP_FAILED_JOBS,
  },
});

export const reportQueue = new Queue(QUEUE_NAMES.REPORTS, {
  connection: bullmqRedis,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: KEEP_FAILED_JOBS },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
  connection: bullmqRedis,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: KEEP_FAILED_JOBS },
});

export const pushQueue = new Queue(QUEUE_NAMES.PUSH, {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 5 * 60 * 1000 },
    removeOnComplete: true,
    removeOnFail: KEEP_FAILED_JOBS,
  },
});

export const auditQueue = new Queue(QUEUE_NAMES.AUDIT, {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: KEEP_FAILED_JOBS
  }
});

/**
 * Helper to add jobs easily
 */
export async function addJob(queueName: keyof typeof QUEUE_NAMES, jobName: string, data: any) {
  const queue = 
    queueName === 'GENERAL' ? generalQueue : 
    queueName === 'EMAILS' ? emailQueue : 
    queueName === 'NOTIFICATIONS' ? notificationQueue :
    queueName === 'PUSH' ? pushQueue : 
    queueName === 'AUDIT' ? auditQueue :
    reportQueue;
  
  return await queue.add(jobName, data);
}

// Register error listeners on all queues to prevent unhandled 'error' events from dumping duplicate stack traces in Bun
const queues = [generalQueue, emailQueue, reportQueue, notificationQueue, pushQueue, auditQueue];
queues.forEach((q) => {
  q.on('error', () => {
    // Gracefully caught here; ioredis's global error event already handles and throttles the console log
  });
});
