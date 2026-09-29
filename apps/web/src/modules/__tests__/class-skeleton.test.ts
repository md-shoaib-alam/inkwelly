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
const academics = () => fromModules("academics", "classes", "index.tsx");
const tableView = () => fromModules("academics", "classes", "adminClasses", "ClassesTableView.tsx");

/** The header cells a screen really renders, in order. */
const headers = (source: string) =>
  [...source.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1].trim());

/** The labels one column preset declares. */
const preset = (name: string) => {
  const body = SKELETON.match(new RegExp(`const ${name}: SkeletonColumn\\[\\] = \\[([\\s\\S]*?)\\n\\];`));
  expect(body, `${name} is missing from the skeleton component`).toBeTruthy();
  return [...body![1].matchAll(/label: "([^"]*)"/g)].map((m) => m[1]);
};

// A placeholder that previews the wrong layout is worse than a spinner: the admin
// braces for a grid and gets a table, and the screen reflows under them.
test("the Academics skeleton previews the Academics table", () => {
  expect(preset("CLASS_TABLE_COLUMNS")).toEqual(headers(tableView()));
});

test("the roster skeleton previews the roster table", () => {
  expect(preset("ROSTER_TABLE_COLUMNS")).toEqual(headers(roster()));
});

test("Academics loads the shape its live view mode will render", () => {
  const branch =
    academics().match(/showSkeleton \? \(\s*([\s\S]{0,240}?)\)\s*:\s*classes\.length === 0/)?.[1] ?? "";
  expect(branch).toContain('viewMode === "table"');
  expect(branch).toContain("ClassesTableSkeleton");
  expect(branch).toContain("ClassesGridSkeleton");
});

// The roster used to answer a slow tenant by returning a skeleton *instead of* the
// page, dropping its header, stat tiles and search row. It now paints the page and
// holds only the list area.
test("the roster loads inside its own page, not in place of it", () => {
  const s = roster();
  expect(s).not.toMatch(/return <ClassRosterSkeleton/);
  expect(s).toContain("listPending");
  expect(s).toContain("<ClassesStatsRow");
});
