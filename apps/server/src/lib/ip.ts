// XFF is trusted ONLY from listed proxies (Traefik in production). Any client
// could otherwise set the header and bypass both login limiters (capacity
// study issue #2). Env read stays out of lib/env.ts on purpose: optional in
// tests, and env.ts hard-exits on parse failure.
function trustedProxies(): string[] {
  return (process.env.TRUSTED_PROXY_IPS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export function ipInCidr(ip: string, cidr: string): boolean {
  const [base = '', bitsStr] = cidr.split('/');
  const bits = Number(bitsStr);
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt === null || baseInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

export function isTrustedProxy(ip: string | null | undefined): boolean {
  if (!ip) return false;
  return trustedProxies().some((e) => (e.includes('/') ? ipInCidr(ip, e) : ip === e));
}

export function getClientIp(request: Request, server?: any): string {
  const peer: string | null = server?.requestIP(request)?.address || null;
  const xff = request.headers.get('x-forwarded-for');
  if (xff && isTrustedProxy(peer)) {
    return xff.split(',')[0]?.trim() || peer || 'anonymous';
  }
  return peer || 'anonymous';
}
