import { test, expect, describe } from 'bun:test';
import {
  slugify, buildClassSlug, resolveSlugCollision, deriveClassName,
  CreateClassSchema, UpdateClassSchema, ClassListQuerySchema, AssignTeachersSchema,
  blankToUndefined, CLASS_MEDIUMS,
} from './class';

describe('class slugs', () => {
  test('a class level and section become the URL segment the Classes screen shows', () => {
    expect(buildClassSlug('Class 10th', 'A')).toBe('class-10th-a');
    expect(buildClassSlug('  Grade 1 - ', 'B')).toBe('grade-1-b');
  });

  test('punctuation and accents collapse instead of leaking into a URL', () => {
    expect(slugify('H.S.E. (Vocational) — A')).toBe('h-s-e-vocational-a');
    expect(slugify('')).toBe('');
  });

  test('collisions get a numeric suffix, counted from what is already taken', () => {
    const taken = new Set(['class-1st-a', 'class-1st-a-2']);
    expect(resolveSlugCollision('class-1st-a', taken)).toBe('class-1st-a-3');
    expect(resolveSlugCollision('class-2nd-a', taken)).toBe('class-2nd-a');
  });
});

describe('create validation', () => {
  test('a minimal form body fills in the Indian-school defaults', () => {
    const parsed = CreateClassSchema.parse({ name: 'Class 1st', section: 'A', classLevel: 'Class 1st' });
    expect(parsed.medium).toBe('English');
    expect(parsed.capacity).toBe(40);
    expect(parsed.isActive).toBe(true);
    expect(parsed.isVocational).toBe(false);
  });

  test('only the mediums the picker offers are accepted', () => {
    expect(CLASS_MEDIUMS).toContain('Hindi');
    const body = { name: 'X', section: 'A', classLevel: 'Y', medium: 'Klingon' };
    expect(CreateClassSchema.safeParse(body).success).toBe(false);
    expect(CreateClassSchema.safeParse({ ...body, medium: 'Hindi' }).success).toBe(true);
  });

  test('a missing class level is rejected, because the roster groups on it', () => {
    expect(CreateClassSchema.safeParse({ name: 'X', section: 'A' }).success).toBe(false);
  });
});

describe('update validation', () => {
  /**
   * Mobile's edit sheet sends name/section/grade/capacity only. If the update
   * schema defaulted medium/isActive here, every mobile edit would reset a Hindi
   * medium class back to English and switch off vocational.
   */
  test('fields the caller did not send stay absent rather than arriving as defaults', () => {
    const parsed = UpdateClassSchema.parse({ id: 'c1', name: 'Class 5th', section: 'A', classLevel: 'Class 5th', capacity: 30 });
    expect('medium' in parsed).toBe(false);
    expect('isActive' in parsed).toBe(false);
    expect('isVocational' in parsed).toBe(false);
  });

  test('id is the one field that cannot be omitted', () => {
    expect(UpdateClassSchema.safeParse({ name: 'X' }).success).toBe(false);
  });
});

describe('list query', () => {
  test('the filter panel sends empty strings and "all" for untouched selects', () => {
    const fromPanel: Record<string, unknown> = { classLevel: 'all', section: '', medium: 'Hindi', search: '' };
    expect(blankToUndefined(fromPanel)).toEqual({ medium: 'Hindi' });
  });

  test('sorting and paging have safe defaults', () => {
    const parsed = ClassListQuerySchema.parse({});
    expect(parsed).toMatchObject({ sortBy: 'name', sortDir: 'asc', page: 1, limit: 50 });
  });

  test('an unknown sort column is rejected instead of reaching ORDER BY', () => {
    expect(ClassListQuerySchema.safeParse({ sortBy: 'capacity; drop table' }).success).toBe(false);
    expect(ClassListQuerySchema.safeParse({ sortBy: 'enrolled' }).success).toBe(true);
  });

  test('limit is capped so a screen cannot ask for the whole tenant', () => {
    expect(ClassListQuerySchema.safeParse({ limit: 100_000 }).success).toBe(false);
  });

  test('REST query strings arrive as text and still coerce', () => {
    const parsed = ClassListQuerySchema.parse({ vocational: 'true', page: '3', limit: '20', status: 'inactive' });
    expect(parsed.vocational).toBe(true);
    expect(parsed.page).toBe(3);
    expect(parsed.status).toBe('inactive');
  });
});

describe('teacher assignment', () => {
  test('an empty list is a legitimate way to unassign everyone', () => {
    expect(AssignTeachersSchema.safeParse({ classId: 'c1', teachers: [] }).success).toBe(true);
  });

  test('isPrimary defaults to false so a plain add does not steal the role', () => {
    const parsed = AssignTeachersSchema.parse({ classId: 'c1', teachers: [{ id: 't1' }] });
    expect(parsed.teachers[0]?.isPrimary).toBe(false);
  });
});

describe('class name derivation', () => {
  test('a numeric level becomes "Class <n>" — the form the whole app already shows', () => {
    expect(deriveClassName('10')).toBe('Class 10');
    expect(deriveClassName('1')).toBe('Class 1');
  });

  test('an early-year level is its own name, with no "Class " prefix', () => {
    expect(deriveClassName('Pre-Nursery')).toBe('Pre-Nursery');
    expect(deriveClassName('Nursery')).toBe('Nursery');
    expect(deriveClassName('LKG')).toBe('LKG');
    expect(deriveClassName('UKG')).toBe('UKG');
  });

  test('the section never enters the name — the slug carries it', () => {
    expect(deriveClassName('5')).not.toContain('A');
    expect(deriveClassName('5')).toBe('Class 5');
  });
});
