import { db } from './db';
import { tenants } from '../db/schema';
import { or, eq } from 'drizzle-orm';

// High-performance in-memory cache to reduce DB load
const TENANT_CACHE = new Map<string, string | null>();

/**
 * Resolve a raw tenant identifier to a real database tenant ID.
 * Accepts cuid, slug, or "tenant-slug" prefixed string.
 */
export async function resolveTenantId(rawId: string): Promise<string | null> {
  if (!rawId || typeof rawId !== 'string' || rawId.trim().length === 0) {
    return null;
  }

  const trimmed = rawId.trim();
  
  // Check cache first
  if (TENANT_CACHE.has(trimmed)) {
    return TENANT_CACHE.get(trimmed)!;
  }

  const slug = trimmed.replace(/^tenant-/, '');

  try {
    const tenant = await db.query.tenants.findFirst({
      where: or(
        eq(tenants.id, trimmed),
        eq(tenants.slug, slug)
      ),
      columns: { id: true },
    });


    const result = tenant?.id || null;
    
    // Store in cache (expire logic not needed for basic slug/id mapping as they rareley change)
    TENANT_CACHE.set(trimmed, result);
    
    return result;
  } catch (error) {
    console.error('[RESOLVE_TENANT_ERROR]', error);
    return null;
  }
}
