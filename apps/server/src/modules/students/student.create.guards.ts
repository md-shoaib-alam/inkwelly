/**
 * The academic year is the partition key for a student's records, so a write
 * that guesses it is worse than a write that fails. `students.academicYear`
 * has no column default: this guard is the only way a student row gets its
 * year, and it refuses anything the tenant doesn't own.
 */
export function academicYearIsKnown(
  requested: string | undefined,
  owned: string[],
  current?: string,
): string {
  const value = requested?.trim();
  if (!value) {
    if (current && owned.includes(current)) return current;
    throw new Error(`Academic year required: this tenant has none (${owned.join(', ') || 'no years'})`);
  }
  if (!owned.includes(value)) {
    throw new Error(`Unknown academic year '${value}' for this tenant`);
  }
  return value;
}
