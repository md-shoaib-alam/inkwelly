import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

// Text, not imports: these are client components that pull in Radix and recharts, and
// every claim here is about what the screen draws. Reading the source keeps the guard
// honest about the rendered layout rather than the module graph.
const DASH = resolve(import.meta.dir, "..", "students", "students-dashboard");
const STUDENTS = resolve(import.meta.dir, "..", "students");
// The pins below count indentation, so a working copy saved with CRLF would fail a
// layout that is unchanged. Line endings carry no meaning for what this file asserts.
const read = (p: string) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const INDEX = read(resolve(DASH, "index.tsx"));
const CARDS = readdirSync(resolve(DASH, "components"))
  .map((f) => read(resolve(DASH, "components", f)))
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
    "Enrolment growth",
    "Movement this session",
    "Class strength",
    "Age pyramid",
    "Religion",
    "Mother tongue",
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
    "EnrolmentGrowthCard",
    "MovementCard",
    "ClassStrengthCard",
    "AgePyramidCard",
    "ReligionCard",
    "MotherTongueCard",
  ]) {
    expect(INDEX, `index.tsx no longer mounts ${card}`).toContain(`<${card}`);
  }
});

test("the expanded region carries the labels and footings the reference draws", () => {
  for (const text of [
    "Trends",
    "Classes",
    "Demographics",
    "Transfers",
    "Admitted",
    "Withdrawn",
    "Net change",
    "Admissions",
    "Withdrawals",
    "Transferred in",
    "Promoted",
    "Average class size",
    "Largest ·",
    "Median age",
    "Range ·",
  ]) {
    expect(ALL, `the expanded region no longer draws "${text}"`).toContain(text);
  }
});

test("the toggle sits below the drawer it opens, and the footer below that", () => {
  // The reference puts the pill at the very end of the page, so an expanded screen has
  // to be scrolled to before it can be collapsed again. Above the charts it is a lie
  // about direction — the drawer would open upward, over content already read.
  const drawer = INDEX.indexOf("<AnimatePresence");
  const pill = INDEX.indexOf("Show more insights");
  const footer = INDEX.indexOf("<UpdatedFooter");
  expect(drawer).toBeGreaterThan(-1);
  expect(pill).toBeGreaterThan(drawer);
  expect(footer).toBeGreaterThan(pill);
  expect(INDEX).toContain("Show less");
});

test("the drawer is mounted only when open, and animates its height", () => {
  // The recharts panes are code-split; rendering them collapsed would pay for them on
  // every page load. A fixed-height slide would clip the tallest card.
  expect(INDEX).toMatch(/\{showMore && \(/);
  expect(INDEX).toContain('animate={{ height: "auto", opacity: 1 }}');
  expect(INDEX).toContain('exit={{ height: 0, opacity: 0 }}');
  expect(INDEX).toContain('overflow: "hidden"');
});

test("a class move is a link and a Soon tile, never a counted number", () => {
  // Nothing in this build's schema separates a promotion from a profile edit, so the
  // tile says so; `Promoted` is the one movement the Promotion table does record.
  const movement = read(resolve(DASH, "components", "movement-card.tsx"));
  expect(movement).toMatch(/tenantHref\("class-change"\)/);
  expect(movement).toMatch(/label="Transferred in"\s*\n\s*soon/);
  const hook = read(resolve(STUDENTS, "hooks", "use-students-command-center.ts"));
  expect(hook).toMatch(/\n {8}promoted\n/);
});

test("the frames with no data source say Soon rather than measuring nothing", () => {
  // Category, Document completeness, Compliance, Religion and Mother tongue have no
  // column to read, and duplicate identifiers no field to match on. A bar at zero
  // reads as a finding.
  const untracked = read(resolve(DASH, "components", "untracked-cards.tsx"));
  expect([...untracked.matchAll(/<SoonNote/g)]).toHaveLength(5);
  expect(untracked).not.toMatch(/width: `/);
  expect(CARDS, "an alert row was invented for a check the server does not run").not.toMatch(
    /Aadhaar numbers/,
  );
});

test("the dashboard search hands its term to the roster rather than filtering in place", () => {
  // Nothing on this screen is a list of students, so the box can only be a link.
  expect(CARDS).toMatch(/list\?search=/);
});

test("the footer names the last change to a record, not the moment the query ran", () => {
  const footer = read(resolve(DASH, "components", "updated-footer.tsx"));
  const hook = read(resolve(STUDENTS, "hooks", "use-students-command-center.ts"));

  expect(INDEX).toContain("<UpdatedFooter");
  expect(hook).toMatch(/lastUpdated: string \| null/);
  // A field the type declares but the query never asks for is always undefined.
  expect(hook).toMatch(/\n {6}lastUpdated\n/);

  // An empty cohort has no stamp. Rendering one would say "Updated Invalid Date".
  expect(footer).toMatch(/return null/);
  expect(footer).toMatch(/en-GB/);
  // The reference reads "Updated 29 Sept 2026 · 11:38 pm" — day first, and a dot between.
  expect(footer).toMatch(/Updated \{/);
  expect(footer).toMatch(/·/);
  // The stamp is the only clock: `new Date()` with no argument would report when the
  // page was opened, and the footer would always read as today.
  expect(footer).toMatch(/new Date\(at\)/);
  expect(footer).not.toMatch(/new Date\(\)/);
});
