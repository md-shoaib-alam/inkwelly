import { Elysia, t } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireSuperAdmin, requireAuth } from '../lib/auth';
import { requirePlatformPermission } from '../lib/permissions';
import { captureError } from '../lib/monitoring/posthog';

// The tenant shell fetches these on mount for every role to render the
// maintenance banner. Every other platform setting is super-admin only.
const PUBLIC_SETTING_KEYS = ['maintenance_mode', 'maintenance_message'];

export const platformSettingsRoutes = new Elysia({ prefix: '/platform-settings' })
  .group('', (app) =>
    app
      .use(requireAuth)
      .get('/', async ({ query, set }) => {
        try {
          const { key } = query as { key?: string };
          if (key && !PUBLIC_SETTING_KEYS.includes(key)) {
            set.status = 403;
            return { error: 'This setting is not publicly readable' };
          }

          const settings = await db.query.platformSettings.findMany({
            where: key
              ? eq(schema.platformSettings.key, key)
              : inArray(schema.platformSettings.key, PUBLIC_SETTING_KEYS)
          });

          return key ? (settings[0] || { key, value: null }) : settings;
        } catch (error) {
          captureError(error, { method: 'GET', path: '/platform-settings' });
          set.status = 500;
          return { error: 'Failed to fetch platform settings' };
        }
      })
  )
  .group('', (app) =>
    app
      .use(requireSuperAdmin)
      .use(requirePlatformPermission('settings'))
      .get('/all', async ({ set }) => {
        try {
          return await db.query.platformSettings.findMany();
        } catch (error) {
          captureError(error, { method: 'GET', path: '/platform-settings/all' });
          set.status = 500;
          return { error: 'Failed to fetch platform settings' };
        }
      })
      .put('/', async ({ body, set }) => {
        try {
          const { key, value } = body as { key: string, value: string };
          
          const [setting] = await db.insert(schema.platformSettings)
            .values({ key, value })
            .onConflictDoUpdate({
              target: [schema.platformSettings.key],
              set: { value }
            })
            .returning();
          
          return setting;
        } catch (error) {
          set.status = 500;
          return { error: 'Failed to update platform setting' };
        }
      }, {
        body: t.Object({
          key: t.String(),
          value: t.String()
        })
      })
  );

