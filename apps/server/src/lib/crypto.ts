import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const VERSION = 'v1';

/**
 * Accepts a 64-char hex key as-is, otherwise stretches the value with SHA-256 so a
 * passphrase still yields exactly 32 bytes. Rotating means re-encrypting stored blobs.
 */
function keyBytes(): Buffer | null {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!raw || raw.trim() === '') return null;
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, 'hex');
  return createHash('sha256').update(trimmed, 'utf8').digest();
}

export function hasEncryptionKey(): boolean {
  return keyBytes() !== null;
}

export function encryptSecrets(values: Record<string, string>): string {
  const key = keyBytes();
  if (!key) throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured — cannot store credentials');

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(values), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptSecrets(blob: string | null | undefined): Record<string, string> {
  if (!blob) return {};
  const key = keyBytes();
  if (!key) throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured — cannot read credentials');

  const [version, iv, tag, ciphertext] = blob.split('.');
  if (version !== VERSION || !iv || !tag || !ciphertext) throw new Error('Malformed encrypted payload');

  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString('utf8'));
}
