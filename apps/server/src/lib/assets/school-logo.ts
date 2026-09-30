import fs from 'fs';
import path from 'path';

const DEFAULT_LOGO_PATH = path.resolve(__dirname, '../../assets/default-school-logo.png');

let cachedDefaultLogoBuffer: Buffer | null = null;

export function getDefaultLogoBuffer(): Buffer {
  if (cachedDefaultLogoBuffer) return cachedDefaultLogoBuffer;
  try {
    if (fs.existsSync(DEFAULT_LOGO_PATH)) {
      cachedDefaultLogoBuffer = fs.readFileSync(DEFAULT_LOGO_PATH);
      return cachedDefaultLogoBuffer;
    }
  } catch (err) {
    console.error('Failed to read default school logo file:', err);
  }
  return Buffer.alloc(0);
}

export async function getSchoolLogoBuffer(logoUrlOrPath?: string | null): Promise<Buffer> {
  if (!logoUrlOrPath || logoUrlOrPath.trim() === '') {
    return getDefaultLogoBuffer();
  }

  // If data URI
  if (logoUrlOrPath.startsWith('data:image/')) {
    const base64Part = logoUrlOrPath.split(',')[1];
    if (base64Part) {
      return Buffer.from(base64Part, 'base64');
    }
  }

  // If remote URL
  if (logoUrlOrPath.startsWith('http://') || logoUrlOrPath.startsWith('https://')) {
    try {
      const res = await fetch(logoUrlOrPath, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch (e) {
      console.warn('Failed to fetch remote school logo, using fallback:', e);
    }
  }

  // If local file path
  if (fs.existsSync(logoUrlOrPath)) {
    try {
      return fs.readFileSync(logoUrlOrPath);
    } catch {
      // fallback
    }
  }

  return getDefaultLogoBuffer();
}

export async function getSchoolLogoDataUri(logoUrlOrPath?: string | null): Promise<string> {
  const buf = await getSchoolLogoBuffer(logoUrlOrPath);
  if (!buf || buf.length === 0) {
    return '';
  }
  return `data:image/png;base64,${buf.toString('base64')}`;
}
