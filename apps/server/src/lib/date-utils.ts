/**
 * Ultra-efficiently formats a Date object into the local 'YYYY-MM-DD' string format.
 * Eliminates heavy memory allocations from toISOString() allocations and .split('T') arrays,
 * while correctly respecting the process timezone (Asia/Kolkata).
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}