// apps/server/src/lib/user-agent.test.ts
import { expect, test } from 'bun:test';
import { parseUserAgent } from './user-agent';

test('labels a desktop Chrome and a mobile Safari', () => {
  expect(parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'))
    .toEqual({ device: 'Desktop', browser: 'Chrome', os: 'Windows' });
  expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'))
    .toEqual({ device: 'Mobile', browser: 'Safari', os: 'iOS' });
  expect(parseUserAgent(null).device).toBe('Unknown device');
});

test('labels the mobile app HTTP stacks as mobile, not desktop', () => {
  // React Native on Android ships okhttp's own agent; on iOS it is CFNetwork/Darwin.
  // Neither carries a browser token, and both used to fall through to "Desktop".
  expect(parseUserAgent('okhttp/4.12.0')).toEqual({ device: 'Mobile', browser: 'Inkwelly app', os: 'Android' });
  expect(parseUserAgent('Inkwelly/1.0 CFNetwork/1494.0.7 Darwin/23.4.0'))
    .toEqual({ device: 'Mobile', browser: 'Inkwelly app', os: 'iOS' });
  expect(parseUserAgent('InkwellyMobile/1.0 (android)')).toEqual({ device: 'Mobile', browser: 'Inkwelly app', os: 'Android' });
});

test('names the desktop operating systems', () => {
  expect(parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15').os).toBe('macOS');
  expect(parseUserAgent('Mozilla/5.0 (X11; Linux x86_64) Firefox/128.0').os).toBe('Linux');
  expect(parseUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/126.0 Mobile Safari/537.36').os).toBe('Android');
});
