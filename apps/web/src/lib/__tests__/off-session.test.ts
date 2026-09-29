import { describe, expect, test } from 'bun:test';
import {
  SESSION_FLAGGED_ROLES,
  shouldFlagOffSession,
  type OffSessionInput,
} from '../routing/off-session';

const f = (over: Partial<OffSessionInput> = {}) =>
  shouldFlagOffSession({
    role: 'admin',
    status: 'ready',
    urlYearSlug: '2025-2026',
    currentYearSlug: '2026-2027',
    ...over,
  });

describe('the off-session flag', () => {
  test.each(['admin', 'staff', 'teacher'])('a %s browsing a past session is flagged', (role) => {
    expect(f({ role })).toBe(true);
  });

  test('the live session is never flagged', () => {
    expect(f({ urlYearSlug: '2026-2027' })).toBe(false);
  });

  // A learner cannot reach this state at all: the year gate moves them back to the
  // current session, so a border would only ever be noise on their screens.
  test.each(['student', 'parent', 'super_admin'])('%s is not flagged', (role) => {
    expect(f({ role })).toBe(false);
  });

  test('nothing is flagged while the year list is still loading', () => {
    expect(f({ status: 'loading' })).toBe(false);
  });

  test('a school with no session flags nothing', () => {
    expect(f({ status: 'empty', urlYearSlug: null, currentYearSlug: null })).toBe(false);
  });

  test('a URL with no year cannot be compared, so it is not flagged', () => {
    expect(f({ urlYearSlug: null })).toBe(false);
  });

  test('a tenant whose years carry no current one is not flagged', () => {
    expect(f({ currentYearSlug: null })).toBe(false);
  });

  test('the flagged roles are exactly the three that may browse a past session', () => {
    expect([...SESSION_FLAGGED_ROLES].sort()).toEqual(['admin', 'staff', 'teacher']);
  });
});
