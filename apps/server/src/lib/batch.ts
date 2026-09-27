/**
 * Splitting large ID lists and job payloads into fixed-size groups.
 *
 * Postgres caps a statement at 65535 bound parameters and oversized Redis
 * pipelines / BullMQ bulk adds get slow or rejected, so every fan-out path in
 * this app (fee bulk-assign, notice delivery, absence alerts) chunks first.
 */
export function chunked<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
