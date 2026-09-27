import { test, expect } from 'bun:test';
import { hashPassword, verifyPassword, PASSWORD_OPTS } from './passwords';

test('hashed password verifies', async () => {
  const h = await hashPassword('S3cret!pass');
  expect(h.startsWith('$argon2')).toBe(true);
  const r = await verifyPassword('S3cret!pass', h);
  expect(r.valid).toBe(true);
  expect(r.needsRehash).toBe(false);
});

test('wrong password is invalid and never asks for a rehash', async () => {
  const h = await hashPassword('S3cret!pass');
  const r = await verifyPassword('wrong', h);
  expect(r.valid).toBe(false);
  expect(r.needsRehash).toBe(false);
});

test('a hash made with Bun defaults needs a rehash under the tuned opts', async () => {
  const legacy = await Bun.password.hash('S3cret!pass'); // 64MB default
  const r = await verifyPassword('S3cret!pass', legacy);
  expect(r.valid).toBe(true);
  expect(r.needsRehash).toBe(true);
  const upgraded = await hashPassword('S3cret!pass');
  expect((await verifyPassword('S3cret!pass', upgraded)).needsRehash).toBe(false);
});

test('opts are the documented tuned values unless env overrides', () => {
  expect(PASSWORD_OPTS.memoryCost).toBe(19456);
  expect(PASSWORD_OPTS.timeCost).toBe(2);
});
