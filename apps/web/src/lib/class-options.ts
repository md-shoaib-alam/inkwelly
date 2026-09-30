/**
 * The vocabularies the Classes screens offer. These mirror
 * `apps/server/src/lib/validation/class.ts` — there is no shared package between
 * the apps, so the two lists are kept in step by hand and the server stays the
 * authority (it rejects anything not on its list).
 */
export const CLASS_MEDIUMS = [
  'English', 'Hindi', 'Urdu', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia', 'Assamese',
] as const;

export const CLASS_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Matches the values the create form writes and the seed data already stores. */
export const CLASS_GRADES = [
  'Pre-Nursery', 'Nursery', 'LKG', 'UKG',
  ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
] as const;

export const CLASS_SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'grade', label: 'Class Level' },
  { value: 'section', label: 'Section' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'enrolled', label: 'Students enrolled' },
] as const;

export const CLASS_VOCATIONAL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

export const CLASS_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export interface ClassFilters {
  grade?: string;
  section?: string;
  medium?: string;
  /** 'all' | 'true' | 'false' — the panel is a select, the API wants a boolean. */
  vocational?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const ALL = 'all';

export const defaultClassFilters = (): ClassFilters => ({
  grade: ALL,
  section: ALL,
  medium: ALL,
  vocational: ALL,
  status: ALL,
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
});

export function filtersAreDefault(filters: ClassFilters): boolean {
  const base = defaultClassFilters();
  return (Object.keys(base) as (keyof ClassFilters)[]).every((k) => !filters[k] || filters[k] === base[k]);
}

/**
 * Turns the filter panel's state into GraphQL variables: untouched selects drop
 * out entirely so the server sees "no filter" rather than the string "all", and
 * the empty search box stops re-firing under a new cache key on every keystroke.
 */
export function classQueryArgs(filters: ClassFilters) {
  const args: Record<string, string | boolean> = {};
  if (filters.grade && filters.grade !== ALL) args.grade = filters.grade;
  if (filters.section && filters.section !== ALL) args.section = filters.section;
  if (filters.medium && filters.medium !== ALL) args.medium = filters.medium;
  if (filters.vocational && filters.vocational !== ALL) args.vocational = filters.vocational === 'true';
  if (filters.status && filters.status !== ALL) args.status = filters.status;
  if (filters.search?.trim()) args.search = filters.search.trim();
  args.sortBy = filters.sortBy || 'name';
  args.sortDir = filters.sortDir || 'asc';
  return args;
}

/**
 * `1` -> `Class 1st`. The stored grade stays a bare number because students,
 * fees and exams all key off it; only the label is decorated.
 */
export function formatGradeLabel(grade: string | undefined | null): string {
  if (!grade) return '—';
  if (!/^\d+$/.test(grade)) return grade;
  const n = Number(grade);
  if (n >= 11 && n <= 13) return `Class ${n}th`;
  const last = n % 10;
  const suffix = last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
  return `Class ${n}${suffix}`;
}

/**
 * The name the create form auto-fills. The section stays out of it: every stored
 * row is named after its class level alone ("Class 1"), and the slug is what carries the
 * section ("grade-1-a"). Putting the section in the name duplicates it there.
 */
export function autoClassName(grade: string): string {
  if (!grade) return '';
  return /^\d+$/.test(grade) ? `Class ${grade}` : grade;
}
