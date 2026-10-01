import { z } from 'zod';

/**
 * Mediums used by Indian schools (CBSE/ICSE/state boards). Stored as plain text
 * rather than a Postgres enum so adding one is a one-line change here instead of
 * an `ALTER TYPE` migration.
 */
export const CLASS_MEDIUMS = [
  'English', 'Hindi', 'Urdu', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia', 'Assamese',
] as const;

export const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const CLASS_SORT_COLUMNS = {
  name: 'name',
  classLevel: 'classLevel',
  section: 'section',
  capacity: 'capacity',
  enrolled: 'enrolled',
} as const;

/** `enrolled` is a computed count, so it sorts outside the Class table. */
export type ClassSortColumn = keyof typeof CLASS_SORT_COLUMNS;

// ─── Slug ─────────────────────────────────────────────────────────────────────

export function slugify(value: string): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/** `("Class 10th", "A") -> "class-10th-a"` — the shape the Classes screen shows. */
export function buildClassSlug(name: string, section: string): string {
  const parts = [slugify(name), slugify(section)].filter(Boolean);
  return parts.join('-');
}

/**
 * Slugs are unique per tenant, so a collision gets a numeric suffix rather than
 * an error — the admin who typed the second "Class 1st - A" shouldn't have to
 * invent a slug to finish creating a class.
 */
export function resolveSlugCollision(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * The name a class row carries is the class level in words: `"10" -> "Class 10"`.
 * An early-year level (`LKG`, `Pre-Nursery`) is already a name, so it passes through.
 * Section is deliberately absent — every stored row is named by level alone and the
 * slug is what carries the section.
 */
export function deriveClassName(classLevel: string): string {
  return /^\d+$/.test(classLevel) ? `Class ${classLevel}` : classLevel;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

const medium = z.enum(CLASS_MEDIUMS, {
  errorMap: () => ({ message: `Medium must be one of: ${CLASS_MEDIUMS.join(', ')}` }),
});

const section = z
  .string({ required_error: 'Section is required' })
  .trim()
  .min(1, 'Section is required')
  .max(4, 'Section must be 4 characters or fewer');

const capacity = z
  .number({ invalid_type_error: 'Capacity must be a number' })
  .int('Capacity must be a whole number')
  .min(1, 'Capacity must be at least 1')
  .max(1000, 'Capacity cannot exceed 1000');

export const CreateClassSchema = z.object({
  section,
  classLevel: z.string({ required_error: 'Class level is required' }).trim().min(1, 'Class level is required').max(40),
  medium: medium.default('English'),
  capacity: capacity.default(40),
  isVocational: z.boolean().default(false),
  isActive: z.boolean().default(true),
  classTeacherId: z.string().nullable().optional(),
});
export type CreateClassInput = z.infer<typeof CreateClassSchema>;

/**
 * Partial by design: mobile's edit sheet still sends only
 * section/classLevel/capacity/classTeacherId, and a defaulted field here would
 * silently overwrite the stored medium or flip the class inactive on every
 * mobile edit. The route applies exactly the keys the caller sent.
 */
export const UpdateClassSchema = CreateClassSchema
  .partial()
  .extend({ id: z.string({ required_error: 'ID required' }).min(1, 'ID required') });
export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

/** The whole teacher set for one class, as committed by the Manage dialog. */
export const AssignTeachersSchema = z.object({
  classId: z.string().min(1, 'classId is required'),
  teachers: z.array(z.object({
    id: z.string().min(1, 'teacher id is required'),
    isPrimary: z.boolean().default(false),
  })).max(20, 'A class can have at most 20 assigned teachers'),
});
export type AssignTeachersInput = z.infer<typeof AssignTeachersSchema>;

// ─── Reads (GET /classes and the `classes` GraphQL field) ─────────────────────

const triState = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

export const ClassListQuerySchema = z.object({
  classLevel: z.string().trim().min(1).optional(),
  section: z.string().trim().min(1).optional(),
  medium: z.string().trim().min(1).optional(),
  vocational: triState.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().trim().min(1).max(80).optional(),
  sortBy: z.enum(['name', 'classLevel', 'section', 'capacity', 'enrolled']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ClassListQuery = z.infer<typeof ClassListQuerySchema>;

/** Blank strings and 'all' arrive from the filter panel's "All …" options. */
export function blankToUndefined<T extends Record<string, unknown>>(filters: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === '' || value === 'all' || value === 'undefined' || value === 'null') continue;
    out[key] = value;
  }
  return out as T;
}

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
}
