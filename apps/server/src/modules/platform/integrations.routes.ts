import { Elysia, t } from 'elysia';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { requireAuth, requireSuperAdmin } from '../../lib/auth';
import { requirePlatformPermission } from '../../lib/permissions';
import { decryptSecrets, encryptSecrets, hasEncryptionKey } from '../../lib/crypto';
import { createAuditLog } from '../../lib/audit-helper';
import {
  CONNECTION_STATUSES,
  PROVIDERS,
  getProvider,
  planAllows,
  resolveStatus,
  type IntegrationProvider,
  type PlanTier,
} from '../../lib/integrations/catalog';

type ConnectionRow = typeof schema.tenantIntegrations.$inferSelect;

const PLANS: PlanTier[] = ['basic', 'standard', 'premium'];

function asPlan(value: string | null | undefined): PlanTier | null {
  return value && PLANS.includes(value as PlanTier) ? (value as PlanTier) : null;
}

function parseConfig(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * A connection as the browser sees it: config in the clear, secret fields reduced to a
 * filled/empty flag. The ciphertext never leaves this file.
 */
function toPublicConnection(row: ConnectionRow, provider: IntegrationProvider) {
  const config = parseConfig(row.config);
  const storedSecrets = safeDecrypt(row.secrets);

  return {
    provider: row.provider,
    status: row.status,
    accountLabel: row.accountLabel,
    enabled: row.enabled,
    connectedAt: row.connectedAt,
    lastSyncAt: row.lastSyncAt,
    lastError: row.lastError,
    updatedAt: row.updatedAt,
    fields: provider.fields.map((field) => {
      if (field.sensitive) {
        const filled = Boolean(storedSecrets[field.key]);
        return { key: field.key, filled };
      }
      return { key: field.key, value: config[field.key] ?? null };
    }),
    hasSecrets: Object.keys(storedSecrets).length > 0,
  };
}

function safeDecrypt(blob: string | null | undefined): Record<string, string> {
  try {
    return decryptSecrets(blob);
  } catch {
    // A blob written under a rotated key must not take the whole screen down.
    return {};
  }
}

/** Super admin sees every tenant; a school admin only sees its own row. */
function canAccessTenant(
  user: { role?: string } | null | undefined,
  dbUser: { tenantId: string | null } | null | undefined,
  tenantId: string,
): boolean {
  if (user?.role === 'super_admin') return true;
  if (user?.role !== 'admin') return false;
  return Boolean(dbUser?.tenantId) && dbUser?.tenantId === tenantId;
}

async function findTenant(tenantId: string) {
  return db.query.tenants.findFirst({
    where: and(eq(schema.tenants.id, tenantId), isNull(schema.tenants.deletedAt)),
  });
}

async function findConnection(tenantId: string, provider: string) {
  return db.query.tenantIntegrations.findFirst({
    where: and(
      eq(schema.tenantIntegrations.tenantId, tenantId),
      eq(schema.tenantIntegrations.provider, provider),
    ),
  });
}

function forbidden(set: any) {
  set.status = 403;
  return { error: 'No access to this school' };
}

export const integrationsRoutes = new Elysia({ prefix: '/integrations' })
  // Static catalogue: no tenant data in it, so any signed-in role may read it.
  .use(requireAuth)
  .get('/providers', () => ({
    encryptionConfigured: hasEncryptionKey(),
    providers: PROVIDERS,
  }))

  .group('', (app) =>
    app
      .use(requireSuperAdmin)
      .use(requirePlatformPermission('integrations'))

      /** One round trip feeds the whole super-admin screen: tenants + every connection. */
      .get('/overview', async ({ set }) => {
        try {
          const [tenants, connections] = await Promise.all([
            db.query.tenants.findMany({
              where: isNull(schema.tenants.deletedAt),
              columns: {
                id: true, name: true, slug: true, plan: true,
                status: true, maxStudents: true, address: true, createdAt: true,
              },
              orderBy: (table, { asc }) => [asc(table.name)],
            }),
            db.query.tenantIntegrations.findMany(),
          ]);

          const byTenant = new Map<string, ConnectionRow[]>();
          for (const row of connections) {
            const list = byTenant.get(row.tenantId);
            if (list) list.push(row);
            else byTenant.set(row.tenantId, [row]);
          }

          let connected = 0;
          let needsAttention = 0;
          const schoolsWithIssues = new Set<string>();

          const rows = tenants.map((tenant) => {
            const plan = asPlan(tenant.plan);
            const stored = byTenant.get(tenant.id) ?? [];
            const store: Record<string, ConnectionRow> = {};
            for (const row of stored) store[row.provider] = row;

            const entries: Record<string, unknown> = {};
            let flagged = 0;
            for (const provider of PROVIDERS) {
              const row = store[provider.id];
              const status = resolveStatus(plan, provider, row?.status);
              // Built-ins read as "connected" for every school; counting them would
              // inflate the KPI with rows that don't exist in the table.
              if (status === 'connected' && !provider.builtIn) connected++;
              if (status === 'error' || status === 'pending') {
                needsAttention++;
                flagged++;
                schoolsWithIssues.add(tenant.id);
              }
              if (!row) continue;
              entries[provider.id] = {
                ...toPublicConnection(row, provider),
                resolvedStatus: status,
              };
            }

            return {
              tenantId: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              plan,
              status: tenant.status,
              maxStudents: tenant.maxStudents,
              address: tenant.address,
              needsAttention: flagged,
              connections: entries,
            };
          });

          return {
            schools: rows.length,
            activeConnections: connected,
            needsAttention,
            schoolsWithIssues: schoolsWithIssues.size,
            builtIn: PROVIDERS.filter((p) => p.builtIn).length,
            offered: PROVIDERS.filter((p) => !p.builtIn && p.offered !== false).length,
            encryptionConfigured: hasEncryptionKey(),
            tenants: rows,
          };
        } catch (error) {
          console.error('integrations overview failed', error);
          set.status = 500;
          return { error: 'Failed to load integrations' };
        }
      })

      .get('/tenant/:tenantId', async ({ params, user, dbUser, set }) => {
        if (!canAccessTenant(user, dbUser, params.tenantId)) return forbidden(set);
        const tenant = await findTenant(params.tenantId);
        if (!tenant) {
          set.status = 404;
          return { error: 'School not found' };
        }
        const stored = await db.query.tenantIntegrations.findMany({
          where: eq(schema.tenantIntegrations.tenantId, tenant.id),
        });
        const plan = asPlan(tenant.plan);
        return {
          tenantId: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan,
          status: tenant.status,
          connections: stored
            .map((row) => {
              const provider = getProvider(row.provider);
              if (!provider) return null;
              return { ...toPublicConnection(row, provider), resolvedStatus: resolveStatus(plan, provider, row.status) };
            })
            .filter(Boolean),
        };
      })

      .put('/tenant/:tenantId/:provider', async ({ params, body, user, dbUser, set }) => {
        if (!canAccessTenant(user, dbUser, params.tenantId)) return forbidden(set);

        const provider = getProvider(params.provider);
        if (!provider) {
          set.status = 404;
          return { error: 'Unknown provider' };
        }
        if (provider.builtIn) {
          set.status = 400;
          return { error: `${provider.name} is built into the platform — there is nothing to connect` };
        }
        if (provider.offered === false) {
          set.status = 400;
          return { error: provider.notOfferedReason ?? `${provider.name} is not available` };
        }

        const tenant = await findTenant(params.tenantId);
        if (!tenant) {
          set.status = 404;
          return { error: 'School not found' };
        }
        const plan = asPlan(tenant.plan);
        if (!planAllows(plan, provider.minPlan)) {
          set.status = 409;
          return {
            error: `${provider.name} needs the ${provider.minPlan} plan or higher`,
          };
        }

        const payload = (body ?? {}) as {
          status?: string;
          accountLabel?: string | null;
          enabled?: boolean;
          fields?: Record<string, string | null>;
        };

        if (payload.status && !CONNECTION_STATUSES.includes(payload.status as any)) {
          set.status = 422;
          return { error: `status must be one of: ${CONNECTION_STATUSES.join(', ')}` };
        }

        const incoming = payload.fields ?? {};
        const existing = await findConnection(tenant.id, provider.id);
        const nextConfig = { ...parseConfig(existing?.config) };
        const nextSecrets = safeDecrypt(existing?.secrets);
        const secretKeys = new Set(provider.fields.filter((f) => f.sensitive).map((f) => f.key));

        for (const field of provider.fields) {
          if (!(field.key in incoming)) continue;
          const value = incoming[field.key];
          if (secretKeys.has(field.key)) {
            // Blank means "leave the stored credential alone" — the UI never re-sends it.
            if (value === null || value === '') continue;
            nextSecrets[field.key] = String(value);
          } else {
            nextConfig[field.key] = value === null ? '' : String(value);
          }
        }
        // Anything the schema doesn't declare is dropped rather than stored.
        for (const key of Object.keys(nextConfig)) {
          if (!provider.fields.some((f) => f.key === key)) delete nextConfig[key];
        }

        const hasCredentials = Object.keys(nextSecrets).length > 0;
        if (hasCredentials && !hasEncryptionKey()) {
          set.status = 503;
          return { error: 'INTEGRATION_ENCRYPTION_KEY is not configured — credentials cannot be stored' };
        }

        const status = (payload.status ?? existing?.status ?? 'pending') as ConnectionStatusLike;
        const becomesConnected = status === 'connected';

        const values = {
          status,
          accountLabel: payload.accountLabel !== undefined ? payload.accountLabel : existing?.accountLabel ?? null,
          enabled: payload.enabled ?? existing?.enabled ?? true,
          config: JSON.stringify(nextConfig),
          secrets: hasCredentials ? encryptSecrets(nextSecrets) : existing?.secrets ?? null,
          lastError: status === 'error' ? existing?.lastError ?? null : null,
          connectedAt: existing?.connectedAt ?? (becomesConnected ? new Date() : null),
          updatedById: user?.id ?? null,
        };

        const [row] = await db.insert(schema.tenantIntegrations)
          .values({ tenantId: tenant.id, provider: provider.id, createdById: user?.id ?? null, ...values })
          .onConflictDoUpdate({
            target: [schema.tenantIntegrations.tenantId, schema.tenantIntegrations.provider],
            set: values,
          })
          .returning();

        if (!row) {
          set.status = 500;
          return { error: 'Failed to save the connection' };
        }

        await createAuditLog({
          action: existing ? 'update_integration' : 'create_integration',
          resource: 'tenant_integration',
          // Provider + status only. Field values, including credentials, are never audited.
          details: { tenantId: tenant.id, provider: provider.id, status: row.status },
          userId: user?.id ?? null,
          tenantId: tenant.id,
          userRole: user?.role ?? null,
        });

        return { ...toPublicConnection(row, provider), resolvedStatus: resolveStatus(plan, provider, row.status) };
      }, {
        body: t.Optional(t.Object({
          status: t.Optional(t.String()),
          accountLabel: t.Optional(t.Nullable(t.String())),
          enabled: t.Optional(t.Boolean()),
          fields: t.Optional(t.Record(t.String(), t.Nullable(t.String()))),
        })),
      })

      .delete('/tenant/:tenantId/:provider', async ({ params, user, dbUser, set }) => {
        if (!canAccessTenant(user, dbUser, params.tenantId)) return forbidden(set);
        const existing = await findConnection(params.tenantId, params.provider);
        if (!existing) {
          set.status = 404;
          return { error: 'No such connection' };
        }
        await db.delete(schema.tenantIntegrations).where(eq(schema.tenantIntegrations.id, existing.id));

        await createAuditLog({
          action: 'delete_integration',
          resource: 'tenant_integration',
          details: { tenantId: existing.tenantId, provider: existing.provider },
          userId: user?.id ?? null,
          tenantId: existing.tenantId,
          userRole: user?.role ?? null,
        });

        return { deleted: true, provider: existing.provider };
      }));

type ConnectionStatusLike = (typeof CONNECTION_STATUSES)[number];
