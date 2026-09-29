import { describe, expect, test } from 'bun:test';
import { decideYearGate, YEAR_FREE_SCREENS, type YearGateInput } from '../routing/year-gate';

const g = (over: Partial<YearGateInput> = {}) =>
  decideYearGate({
    role: 'admin',
    status: 'ready',
    yearSlug: '2026-2027',
    screen: 'classes',
    maySetUp: true,
    activeYearSlug: '2026-2027',
    ...over,
  });

describe("the year gate's happy path", () => {
  test('a URL that already carries a year renders', () => {
    expect(g()).toEqual({ kind: 'render' });
  });

  test('the setup screen is reachable with no year', () => {
    expect(g({ screen: 'academic-years', yearSlug: null })).toEqual({ kind: 'render' });
    expect(YEAR_FREE_SCREENS.has('academic-years')).toBe(true);
  });

  test('a bookmarked year-less URL is re-emitted under the active year', () => {
    expect(g({ yearSlug: null })).toEqual({ kind: 'canonicalise', toYearSlug: '2026-2027' });
  });

  test('an unknown year is not a year, so the tail is moved instead', () => {
    // `parseRoute` only reports a year that is in the tenant's own list, so a
    // typed `1999-2000` arrives here as `yearSlug: null` with the tail intact.
    expect(g({ yearSlug: null, activeYearSlug: '2025-2026' })).toEqual({
      kind: 'canonicalise',
      toYearSlug: '2025-2026',
    });
  });
});

describe("the year gate at a school with no session", () => {
  test('an admin is sent to set one up', () => {
    expect(g({ status: 'empty', yearSlug: null, screen: 'module' })).toEqual({
      kind: 'to-setup',
    });
  });

  test('a staff member who owns sessions gets the screen, not a bounce', () => {
    expect(
      g({ role: 'staff', status: 'empty', yearSlug: null, screen: 'academic-years', maySetUp: true }),
    ).toEqual({ kind: 'render' });
  });

  test('a non-admin is stopped, not sent to a screen they cannot open', () => {
    for (const role of ['teacher', 'student', 'parent', 'staff']) {
      expect(g({ role, status: 'empty', yearSlug: null, screen: 'students', maySetUp: false })).toEqual({
        kind: 'notice',
      });
    }
  });

  test('the empty arms ignore the screen, so nothing slips past them', () => {
    expect(g({ status: 'empty', yearSlug: null, screen: 'make-payment', maySetUp: true })).toEqual({
      kind: 'to-setup',
    });
    expect(g({ status: 'empty', yearSlug: null, screen: 'manage-plan', maySetUp: false })).toEqual({
      kind: 'notice',
    });
  });
});

describe("the year gate's guards against its own loops", () => {
  test('nothing paints while the years are still loading', () => {
    expect(g({ status: 'loading' })).toEqual({ kind: 'skeleton' });
  });

  test('loading wins over the exemption list, so the screen cannot flash', () => {
    expect(g({ status: 'loading', screen: 'academic-years', yearSlug: null })).toEqual({
      kind: 'skeleton',
    });
  });

  test('a year name with no usable characters is never written into a URL', () => {
    // `yearSlugOf('---')` is '', and canonicalising to '' re-emits the same
    // year-less URL this branch is reading, which would spin forever.
    expect(g({ yearSlug: null, activeYearSlug: '' })).toEqual({ kind: 'render' });
  });

  test('the setup screen is not canonicalised onto itself under a year', () => {
    expect(g({ yearSlug: null, screen: 'academic-years' })).toEqual({ kind: 'render' });
  });
});

describe("the year gate and the platform admin", () => {
  test('a platform admin is never gated: their year list is empty by construction', () => {
    for (const status of ['loading', 'empty', 'ready'] as const) {
      expect(g({ role: 'super_admin', status, yearSlug: null, screen: 'students' })).toEqual({
        kind: 'render',
      });
    }
  });

  test('every other role is gated, so no school screen opens without a year', () => {
    for (const role of ['admin', 'staff', 'teacher', 'student', 'parent']) {
      expect(g({ role, status: 'ready', yearSlug: null, screen: 'students' })).toEqual({
        kind: 'canonicalise',
        toYearSlug: '2026-2027',
      });
    }
  });
});
