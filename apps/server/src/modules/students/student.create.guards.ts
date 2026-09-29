/**
 * The academic year is the partition key for a student's records, so a write
 * that guesses it is worse than a write that fails. `students.academicYear`
 * defaults to the literal `'2024-2025'` in the schema, which no school
 * necessarily owns — hence an explicit fallback to the tenant's current year.
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
