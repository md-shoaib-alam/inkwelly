import { db } from '../lib/db';
import { studentAddresses } from './schema';

/**
 * `StudentAddress` replaces a single free-text column (`User.address`) that the Students
 * module had been reading as if it were an address record. Every existing value becomes
 * one row, so a school does not lose the addresses it already typed.
 *
 * The whole string goes into `line1` and the typed parts stay empty. Splitting
 * "B-260, Vikaspuri, New Delhi, India 110074" into house no., city, state and pincode
 * reliably is not possible, and guessing would put an address in a school's records that
 * nobody wrote. The school fills the parts in when it edits the row.
 *
 * Each one is marked primary: it is the only address that student has, and the tab shows
 * a primary badge rather than nothing.
 */
export async function backfillStudentAddresses() {
  const existing = await db.query.students.findMany({
    columns: { id: true },
    with: { user: { columns: { id: true, tenantId: true, address: true } } },
  });

  const already = new Set(
    (await db.query.studentAddresses.findMany({ columns: { studentId: true } })).map(
      (row) => row.studentId,
    ),
  );

  const rows = existing
    .filter((s) => (s.user.address ?? '').trim() && !already.has(s.id))
    .map((s) => ({
      tenantId: s.user.tenantId ?? 'master',
      studentId: s.id,
      addressType: 'current',
      line1: s.user.address!.trim(),
      isPrimary: true,
    }));

  if (rows.length) await db.insert(studentAddresses).values(rows);
  return { inserted: rows.length };
}

if (import.meta.main) {
  const { inserted } = await backfillStudentAddresses();
  console.log(`student-address backfill: ${inserted} address record(s) created`);
}
