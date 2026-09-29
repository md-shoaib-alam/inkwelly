import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Text, not imports: these screens are client components that pull in Radix and
// framer-motion, and a skeleton is a layout claim, not a behaviour one. Reading
// the source keeps the guard honest about what is actually rendered.
const fromModules = (...p: string[]) => readFileSync(resolve(import.meta.dir, "..", ...p), "utf8");
const fromSrc = (...p: string[]) => readFileSync(resolve(import.meta.dir, "..", "..", ...p), "utf8");

const SKELETON = fromSrc("components", "shared", "classes", "ClassesTableSkeleton.tsx");
const roster = () => fromModules("students", "classes", "index.tsx");
const rosterTable = () => fromModules("students", "classes", "ClassRosterTable.tsx");
const academics = () => fromModules("academics", "classes", "index.tsx");
const academicsTable = () => fromModules("academics", "classes", "adminClasses", "ClassesTableView.tsx");

/** The header cells a screen really renders, in order. */
const headers = (source: string) =>
  [...source.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1].trim());

/** The roster builds its header row from one array, so read that array. */
const rosterHeaders = () => {
  const body = rosterTable().match(/const COLUMNS = \[([^\]]*)\]/);
  expect(body, "the roster table no longer declares its columns in one array").toBeTruthy();
  return [...body![1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
};

/** The labels one column preset declares. */
const preset = (name: string) => {
  const body = SKELETON.match(new RegExp(`const ${name}: SkeletonColumn\\[\\] = \\[([\\s\\S]*?)\\n\\];`));
  expect(body, `${name} is missing from the skeleton component`).toBeTruthy();
  return [...body![1].matchAll(/label: "([^"]*)"/g)].map((m) => m[1]);
};

// A placeholder that previews the wrong layout is worse than a spinner: the admin
// braces for a grid and gets a table, and the screen reflows under them.
test("the Academics skeleton previews the Academics table", () => {
  expect(preset("CLASS_TABLE_COLUMNS")).toEqual(headers(academicsTable()));
});

test("the roster skeleton previews the roster table", () => {
  expect(preset("ROSTER_TABLE_COLUMNS")).toEqual(rosterHeaders());
});

test("Academics loads the shape its live view mode will render", () => {
  const branch =
    academics().match(/showSkeleton \? \(\s*([\s\S]{0,240}?)\)\s*:\s*classes\.length === 0/)?.[1] ?? "";
  expect(branch).toContain('viewMode === "table"');
  expect(branch).toContain("ClassesTableSkeleton");
  expect(branch).toContain("ClassesGridSkeleton");
});

// The roster used to answer a slow tenant by returning a skeleton *instead of* the
// page, dropping its header and search row. It now paints the page and holds only
// the list area.
test("the roster loads inside its own page, not in place of it", () => {
  const s = roster();
  expect(s).not.toMatch(/return <ClassRosterSkeleton/);
  expect(s).toContain("listPending");
  expect(s).toContain("<ClassesTableSkeleton");
});

/*
 * The two class screens were mirrored once and it was wrong: the Academics one edits
 * rows and the Students one reports on them, so the shipped design gives the roster a
 * summary line, inline filters and a completion column instead. These fail if someone
 * re-shares the layout, which is the mistake being avoided.
 */
test("the roster keeps its own filter frame and header line", () => {
  const s = roster();
  expect(s).not.toContain("ClassesFilterPanel");
  expect(s).not.toContain("ClassesStatsRow");
  expect(s).toContain("per class");
  expect(rosterTable()).toContain("profileCompletePercent");
});

test("the Academics screen keeps the layout the roster gave up", () => {
  const s = academics();
  expect(s).toContain("ClassesFilterPanel");
  expect(s).toContain("ClassesStatsRow");
});
