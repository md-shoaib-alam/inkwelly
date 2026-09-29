import { eq, isNull } from 'drizzle-orm';
import { db } from '../lib/db';
import { classes } from './schema';
import { buildClassSlug, resolveSlugCollision } from '../lib/validation/class';

/**
 * Rows created before `Class.slug` existed have nothing to derive a URL segment
 * from, and the unique index would let them all collide on NULL-or-value. This
 * gives every one of them a slug, tenant by tenant so the collision counter
 * starts clean per school.
 */
export async function backfillClassSlugs() {
  const missing = await db.query.classes.findMany({
    where: isNull(classes.slug),
    columns: { id: true, tenantId: true, name: true, section: true },
    orderBy: (cls, { asc }) => [asc(cls.tenantId), asc(cls.name), asc(cls.section)],
  });

  const takenByTenant = new Map<string, Set<string>>();
  const seeded = await db.query.classes.findMany({
    where: (cls, { isNotNull }) => isNotNull(cls.slug),
    columns: { tenantId: true, slug: true },
  });
  for (const row of seeded) {
    if (!takenByTenant.has(row.tenantId)) takenByTenant.set(row.tenantId, new Set());
    takenByTenant.get(row.tenantId)!.add(row.slug!);
  }

  for (const row of missing) {
    const taken = takenByTenant.get(row.tenantId) ?? new Set<string>();
    takenByTenant.set(row.tenantId, taken);
    const slug = resolveSlugCollision(buildClassSlug(row.name, row.section), taken);
    taken.add(slug);
    await db.update(classes).set({ slug }).where(eq(classes.id, row.id));
  }

  return { updated: missing.length };
}

if (import.meta.main) {
  const { updated } = await backfillClassSlugs();
  console.log(`class-slug backfill: ${updated} class(es) given a slug`);
}
