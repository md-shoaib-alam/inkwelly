import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Text, not imports: these are client components that pull in Radix and recharts, and
// every claim here is about what the screen draws. Reading the source keeps the guard
// honest about the rendered layout rather than the module graph.
const DASH = resolve(import.meta.dir, "..", "students", "students-dashboard");
const STUDENTS = resolve(import.meta.dir, "..", "students");
const INDEX = readFileSync(resolve(DASH, "index.tsx"), "utf8");
const CARDS = readdirSync(resolve(DASH, "components"))
  .map((f) => readFileSync(resolve(DASH, "components", f), "utf8"))
  .join("\n");
const ALL = `${INDEX}\n${CARDS}`;

/**
 * The Students dashboard is its own screen, not the Academics center with a different
 * title. That was the bug this file exists to keep: someone copying a layout ends up
 * importing the original, and the two then have to be changed together forever.
 */
test("nothing in the students module reaches into Academics' dashboard", () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (
        /\.tsx?$/.test(entry.name) &&
        /academics-dashboard/.test(readFileSync(p, "utf8"))
      ) {
        offenders.push(p);
      }
    }
  };
  walk(STUDENTS);
  expect(offenders).toEqual([]);
});

test("the screen opens on its counts, not on a centered page title", () => {
  // The reference gives the module no heading at all — the panel already says Students.
  expect(INDEX).not.toMatch(/command center/i);
  expect(INDEX).not.toMatch(/<h1/);
});

test("every card the reference shows is mounted", () => {
  for (const title of [
    "Total students",
    "New admissions",
    "Profile completeness",
    "Withdrawals · TC",
    "Alerts",
    "Upcoming birthdays",
    "Gender split",
    "Category",
    "By NEP stage",
    "Document completeness",
    "Compliance",
    "Recent activity",
  ]) {
    expect(ALL, `the dashboard no longer draws "${title}"`).toContain(title);
  }
  for (const card of [
    "StatTiles",
    "DashboardSearch",
    "AlertsCard",
    "BirthdaysCard",
    "GenderSplitCard",
    "CategoryCard",
    "StagesCard",
    "DocumentsCard",
    "ComplianceCard",
    "RecentActivityCard",
  ]) {
    expect(INDEX, `index.tsx no longer mounts ${card}`).toContain(`<${card}`);
  }
});

test("the four frames with no data source say Soon rather than measuring nothing", () => {
  // Category, Document completeness and Compliance have no table, and duplicate
  // identifiers has no column to match on. A bar at zero reads as a finding.
  const untracked = readFileSync(resolve(DASH, "components", "untracked-cards.tsx"), "utf8");
  expect([...untracked.matchAll(/<SoonNote/g)]).toHaveLength(3);
  expect(untracked).not.toMatch(/width: `/);
  expect(CARDS, "an alert row was invented for a check the server does not run").not.toMatch(
    /Aadhaar numbers/,
  );
});

test("the dashboard search hands its term to the roster rather than filtering in place", () => {
  // Nothing on this screen is a list of students, so the box can only be a link.
  expect(CARDS).toMatch(/list\?search=/);
});
