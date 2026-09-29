import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { academicYears, tenants } from "./schema";

/**
 * The academic year a school starts with. The name format is what every
 * existing row already uses (`2026-2027`), because `feeStructures`, `exams` and
 * `students` store the name as text and `fees.dueDate` is derived from it.
 */
export function defaultYearNames(now: Date = new Date()) {
  const start = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const end = start + 1;
  return {
    name: `${start}-${end}`,
    startDate: `${start}-04-01`,
    endDate: `${end}-03-31`,
  };
}

export async function ensureYearsForTenants() {
  const empty = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(sql`${tenants.id} NOT IN (SELECT ${academicYears.tenantId} FROM ${academicYears})`);

  for (const { id } of empty) {
    const { name, startDate, endDate } = defaultYearNames();
    await db.insert(academicYears).values({
      tenantId: id,
      name,
      startDate,
      endDate,
      status: "active",
      isCurrent: true,
    });
  }
  return { created: empty.length, tenants: empty.map((t) => t.id) };
}

if (import.meta.main) {
  const { created, tenants: ids } = await ensureYearsForTenants();
  console.log(`academic-year backfill: ${created} tenant(s) given a default year`);
  console.table(ids);
}
