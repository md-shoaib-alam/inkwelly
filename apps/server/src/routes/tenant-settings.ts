import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { posthog, captureError } from '../lib/monitoring/posthog';

const DEFAULT_SETTINGS = { 
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  enableGradeSelection: false
};

export const tenantSettingsRoutes = new Elysia({ prefix: '/tenant-settings' })
  .use(requireAuth)
  .get('/', async ({ tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      const tenant = await db.query.tenants.findFirst({ 
        where: eq(schema.tenants.id, tenantId), 
        columns: { settings: true, name: true, address: true, phone: true, email: true, website: true } 
      });
      if (!tenant) { set.status = 404; return { error: 'Tenant not found' }; }

      let settings: Record<string, unknown> = DEFAULT_SETTINGS;
      if (tenant.settings && tenant.settings.trim() !== '' && tenant.settings !== '{}') {
        try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(tenant.settings) }; } catch { settings = DEFAULT_SETTINGS; }
      }
      return { 
        ...settings, 
        tenantName: tenant.name || '', 
        tenantAddress: tenant.address || '', 
        tenantPhone: tenant.phone || '', 
        tenantEmail: tenant.email || '', 
        tenantWebsite: tenant.website || '' 
      };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/tenant-settings', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch settings' };
    }
  })
  .put('/', async ({ body, tenantId, set }) => {
    try {
      if (!tenantId) { set.status = 403; return { error: 'Tenant context required' }; }
      const b = body as any;
      if (!b.settings || typeof b.settings !== 'object') { set.status = 400; return { error: 'settings object is required' }; }

      await db.update(schema.tenants)
        .set({ settings: JSON.stringify(b.settings) })
        .where(eq(schema.tenants.id, tenantId));

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'tenant_settings_updated',
        properties: {
          tenantId
        }
      });

      return { success: true, settings: b.settings };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/tenant-settings', tenantId });
      set.status = 500;
      return { error: 'Internal error' };
    }
  });

