// apps/server/src/lib/user-agent.ts
/**
 * The device list is shown on a phone, so the raw `userAgent` string stored at sign-in
 * must not be the thing the phone has to interpret. Coarse labels only.
 */
export function parseUserAgent(ua: string | null): { device: string; browser: string } {
  const text = ua || '';

  let browser = 'Unknown browser';
  if (/Edg\//.test(text)) browser = 'Edge';
  else if (/Firefox\//.test(text)) browser = 'Firefox';
  else if (/Chrome\//.test(text)) browser = 'Chrome';
  else if (/Safari\//.test(text)) browser = 'Safari';

  let device = 'Desktop';
  if (/Android|iPhone|iPad|iPod|Mobile/.test(text)) device = 'Mobile';
  if (!text) { device = 'Unknown device'; browser = 'Unknown browser'; }

  return { device, browser };
}
