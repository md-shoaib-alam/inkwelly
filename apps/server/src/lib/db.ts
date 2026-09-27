import { drizzle } from 'drizzle-orm/postgres-js';
import { addBreadcrumb } from './monitoring/sentry';
import postgres from 'postgres';
import * as schema from '../db/schema';
import * as relations from '../db/relations';
import { env } from './env';

const dbMetrics = {
  totalQueries: 0,
};

const connectionString = env.DATABASE_URL.replace(/^["']|["']$/g, '');

const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 20,
  prepare: true,
});

export const db = drizzle(client, { 
  schema: { ...schema, ...relations },
  logger: {
    logQuery(query, params) {
      dbMetrics.totalQueries++;

      // Only add Sentry breadcrumbs if explicitly enabled or on errors/slow queries
      if (process.env.LOG_LEVEL === 'debug') {
        addBreadcrumb({
          category: "db",
          message: query.slice(0, 500),
          data: { params: params?.slice(0, 10) },
          level: "debug",
        });
      }
    }
  }
});

// For raw queries if needed
export const rawDb = client;

/**
 * Pool state, read from the server. postgres.js keeps its queue lengths inside
 * closures, so `pg_stat_activity` is the only real source; previously this
 * returned `active: 0` unconditionally, which made every pool-pressure incident
 * look healthy. `available: false` means the numbers could not be measured —
 * callers must show that rather than a zero.
 *
 * Behind PgBouncer in transaction mode these are pooled *server* connections,
 * not the app's own, and the client-side queue stays invisible.
 */
export async function getPoolStats() {
  const base = {
    totalQueries: dbMetrics.totalQueries,
    max: 20,
    available: false,
    active: null as number | null,
    idle: null as number | null,
    idleInTransaction: null as number | null,
    blocked: null as number | null,
    total: null as number | null,
  };

  try {
    const rows = await client`SELECT
        count(*) FILTER (WHERE state = 'active')                 AS active,
        count(*) FILTER (WHERE state = 'idle')                   AS idle,
        count(*) FILTER (WHERE state = 'idle in transaction')    AS idle_in_transaction,
        count(*) FILTER (WHERE wait_event_type = 'Lock')         AS blocked,
        count(*)                                                 AS total
      FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid()`;
    const r = rows[0];
    if (!r) return base;
    return {
      ...base,
      available: true,
      active: Number(r.active),
      idle: Number(r.idle),
      idleInTransaction: Number(r.idle_in_transaction),
      blocked: Number(r.blocked),
      total: Number(r.total),
    };
  } catch {
    return base;
  }
}

export function getMemoryStats() {
  const mem = process.memoryUsage();
  return {
    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`,
  };
}
