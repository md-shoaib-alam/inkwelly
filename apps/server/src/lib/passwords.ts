// Single entry point for password hashing. Tuned argon2id (~19 MB) is the
// approved "moderate tune" (spec §4): ~2x faster logins than Bun defaults,
// ~3x less RAM per in-flight login, still an OWASP-grade floor. Old hashes
// stay valid and upgrade themselves via needsRehash on next successful login.
// Env reads stay out of lib/env.ts on purpose: optional in tests.
export const PASSWORD_OPTS = {
  algorithm: 'argon2id' as const,
  memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
  parallelism: 1,
};

export function hashPassword(pw: string): Promise<string> {
  return Bun.password.hash(pw, PASSWORD_OPTS);
}

// Bun has no needsRehash API, so parse the params embedded in the stored hash.
// argon2 format: $argon2id$v=19$m=65536,t=2,p=1$<salt>$<hash>
// Anything verifiable that is not argon2 with our exact params (bcrypt legacy,
// older argon2 defaults) upgrades on next successful login.
export function needsRehash(stored: string): boolean {
  const parts = stored.split('$');
  if (parts[1]?.startsWith('argon2')) {
    const params = parts[3] ?? '';
    const m = Number(/(?:^|,)m=(\d+)/.exec(params)?.[1]);
    const t = Number(/(?:^|,)t=(\d+)/.exec(params)?.[1]);
    const p = Number(/(?:^|,)p=(\d+)/.exec(params)?.[1] ?? 1);
    return m !== PASSWORD_OPTS.memoryCost || t !== PASSWORD_OPTS.timeCost || p !== PASSWORD_OPTS.parallelism;
  }
  return true;
}

export async function verifyPassword(
  pw: string,
  stored: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  const valid = await Bun.password.verify(pw, stored);
  return { valid, needsRehash: valid && needsRehash(stored) };
}
