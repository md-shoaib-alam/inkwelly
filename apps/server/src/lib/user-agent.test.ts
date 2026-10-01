// apps/server/src/lib/user-agent.test.ts
import { expect, test } from 'bun:test';
import { parseUserAgent } from './user-agent';

test('labels a desktop Chrome and a mobile Safari', () => {
  expect(parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'))
    .toEqual({ device: 'Desktop', browser: 'Chrome' });
  expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'))
    .toEqual({ device: 'Mobile', browser: 'Safari' });
  expect(parseUserAgent(null).device).toBe('Unknown device');
});
