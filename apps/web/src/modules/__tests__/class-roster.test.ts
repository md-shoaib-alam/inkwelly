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

// Medium, vocational and status were invented columns until the `Class` row grew those
// fields (db/schema.ts, migration 0011). This guard now protects the other direction:
// a later restyle pass must not add a column the payload still cannot return.
test("the roster renders no column the schema cannot return", () => {
  for (const label of columns()) {
    expect(label.toLowerCase()).not.toMatch(/completion|attendance|percentage|stream|shift/);
  }
});

test("the roster's column set is the nine the class payload backs", () => {
  expect(columns()).toEqual([
    "Class",
    "Grade",
    "Section",
    "Class teacher",
    "Medium",
    "Enrolled",
    "Capacity",
    "Capacity fill",
    "Status",
  ]);
});

test("the roster labels its bar as capacity, not completion", () => {
  expect(source()).toContain("Capacity fill");
});

// The whole point of the rework: the server filters, sorts and pages, so the browser
// never downloads the school to trim a list down. `useClassesInfinite` is the old shape
// — it walked every page to make the totals add up.
test("the roster asks the server to filter and page", () => {
  const s = source();
  expect(s).toContain("useClassesFiltered");
  expect(s).toContain("useClassFilterOptions");
  expect(s).not.toContain("useClassesInfinite");
  expect(s).not.toContain("apiFetch");
});

// Totals that are summed over the visible page print a confident wrong number the
// moment a school outgrows one page, so they come from `classStats` instead.
test("the roster's totals are tenant-wide, not a sum of the current page", () => {
  const s = source();
  expect(s).toContain("useClassStats");
  expect(s).toContain("ClassesStatsRow");
  expect(s).not.toContain(".reduce(");
});
