import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const at = (...p: string[]) => readFileSync(resolve(import.meta.dir, "..", "students", "classes", ...p), "utf8");
const screen = () => at("index.tsx");
const table = () => at("ClassRosterTable.tsx");

// The roster renders its header row from one array, so that array is the column set.
const columns = () => {
  const body = table().match(/const COLUMNS = \[([^\]]*)\]/);
  expect(body, "the roster table no longer declares its columns in one array").toBeTruthy();
  return [...body![1].matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
};

/*
 * This guard used to forbid a completion column, because nothing in the schema could
 * back one. The class query now computes `profileCompletePercent` in SQL over the same
 * fields the Students dashboard scores, so the column is real — and the fields that are
 * still not stored anywhere are listed here to keep it that way.
 */
test("the roster renders no column the payload cannot return", () => {
  for (const label of columns()) {
    expect(label.toLowerCase()).not.toMatch(/attendance|stream|shift|fee|house|transport/);
  }
});

test("the roster's column set is the eight the class payload backs", () => {
  expect(columns()).toEqual([
    "Class",
    "Grade",
    "Section",
    "Teacher",
    "Medium",
    "Enrolled",
    "Completion",
    "Status",
  ]);
});

// A header is not evidence. If the cell stops reading the field, the bar goes flat at
// zero and still looks like a number.
test("the completion cell reads the server's field, not a client-side guess", () => {
  const s = table();
  expect(s).toContain("profileCompletePercent");
  expect(s).not.toMatch(/studentCount\s*\/\s*capacity/);
});

// Capacity belongs to the editing screen. The roster reports who is in the class and
// how filled-in their records are, so pulling capacity back in would re-merge the two.
test("the roster reports completion where Academics reports capacity", () => {
  expect(columns()).not.toContain("Capacity");
  expect(table()).not.toMatch(/capacity/i);
  expect(screen()).not.toMatch(/\.capacity\b/);
});

// The whole point of the rework: the server filters, sorts and pages, so the browser
// never downloads the school to trim a list down. `useClassesInfinite` is the old shape
// — it walked every page to make the totals add up.
test("the roster asks the server to filter and page", () => {
  const s = screen();
  expect(s).toContain("useClassesFiltered");
  expect(s).toContain("useClassFilterOptions");
  expect(s).not.toContain("useClassesInfinite");
  expect(s).not.toContain("apiFetch");
});

// Totals that are summed over the visible page print a confident wrong number the
// moment a school outgrows one page, so the header line reads `classStats` instead.
test("the roster's header line is tenant-wide, not a sum of the current page", () => {
  const s = screen();
  expect(s).toContain("useClassStats");
  expect(s).toContain("stats?.enrolled");
  expect(s).not.toContain(".reduce(");
});
