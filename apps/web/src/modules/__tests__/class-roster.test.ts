import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(import.meta.dir, "..", "students", "classes", "index.tsx");
const source = () => readFileSync(SRC, "utf8");

// Only the header cells are read, on purpose. `font-medium` is a utility every cell
// carries, so a whole-file scan for these words would fail on the styling and never
// on the data it is meant to protect.
const columns = () =>
  [...source().matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1].trim());

// The reference app shows Medium, Vocational and Status per class. None of those is a
// field on `Class` (lib/types.ts:44), so a value rendered in that column would be
// invented. This guard is what stops a later restyle pass from "helpfully" filling it in.
test("the roster renders no column the schema cannot return", () => {
  for (const label of columns()) {
    expect(label.toLowerCase()).not.toMatch(/medium|vocational|status|completion/);
  }
});

test("the roster's column set is the six the schema backs", () => {
  expect(columns()).toEqual([
    "Class",
    "Grade",
    "Section",
    "Teacher",
    "Enrolled",
    "Capacity fill",
  ]);
});

test("the roster labels its bar as capacity, not completion", () => {
  expect(source()).toContain("Capacity fill");
});

// The REST `/api/classes` list counts students by loading them and under-reports; the
// GraphQL `classes` aggregate counts correctly. A screen that totals enrolment has to
// read the second one, and it has to page to the end before summing.
test("the roster reads the counting GraphQL hook, paged to the end", () => {
  const s = source();
  expect(s).toContain("useClassesInfinite");
  expect(s).not.toContain("apiFetch");
});
