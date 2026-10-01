// apps/server/src/lib/user-agent.ts
/**
 * The device list is shown on a phone, so the raw `userAgent` string stored at sign-in
 * must not be the thing the phone has to interpret. Coarse labels only.
 */
export interface UserAgentLabels {
  device: 'Mobile' | 'Desktop' | 'Unknown device';
  browser: string;
  os: string;
}

export function parseUserAgent(ua: string | null): UserAgentLabels {
  const text = ua || '';
  if (!text) return { device: 'Unknown device', browser: 'Unknown browser', os: 'Unknown OS' };

  // The mobile app's HTTP stack identifies itself, not the device: okhttp/Dalvik on
  // Android, CFNetwork/Darwin on iOS. Without these an app session reads as a Desktop
  // with an unknown browser, which is the exact inversion the device list was reported for.
  const inkwellyApp = /InkwellyMobile/i.test(text);
  const androidApp = inkwellyApp ? /android/i.test(text) : /okhttp|Dalvik/.test(text);
  const iosApp = inkwellyApp
    ? /ios/i.test(text)
    : /CFNetwork|Darwin/.test(text) && !/Safari\//.test(text);

  let browser = 'Unknown browser';
  if (androidApp || iosApp) browser = 'Inkwelly app';
  else if (/Edg\//.test(text)) browser = 'Edge';
  else if (/Firefox\//.test(text)) browser = 'Firefox';
  else if (/Chrome\//.test(text)) browser = 'Chrome';
  else if (/Safari\//.test(text)) browser = 'Safari';

  // iPhone UAs contain "like Mac OS X", and Android UAs contain "Linux", so the
  // mobile checks have to come before the desktop ones they resemble.
  let os = 'Unknown OS';
  if (androidApp) os = 'Android';
  else if (iosApp) os = 'iOS';
  else if (/Windows NT/.test(text)) os = 'Windows';
  else if (/iPhone|iPad|iPod/.test(text)) os = 'iOS';
  else if (/Mac OS X/.test(text)) os = 'macOS';
  else if (/Android/.test(text)) os = 'Android';
  else if (/Linux/.test(text)) os = 'Linux';

  const device = androidApp || iosApp || /Android|iPhone|iPad|iPod|Mobile/.test(text)
    ? 'Mobile'
    : 'Desktop';

  return { device, browser, os };
}
