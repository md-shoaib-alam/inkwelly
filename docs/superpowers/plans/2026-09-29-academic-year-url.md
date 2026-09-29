# Academic Year in the URL and Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every tenant screen URL carries the school's academic year as the segment right after the tenant slug, a header chip switches it, and no screen renders without one.

**Architecture:** The two-segment `[slug]/[screen]` route tree collapses into one catch-all `[slug]/[...segments]` (Next 16 forbids sibling differently-named dynamic segments). `parseRoute` gains a `year` field and stays the single place that decides which screen is open. One hook reads the year, one pure builder writes it, and the dispatcher owns the gate.

**Tech Stack:** Next.js ^16.2.11 App Router (Turbopack, :3000), React Compiler, TanStack Query, Zustand, Tailwind v4, `bun test`. Server: Elysia + Drizzle/Postgres, GraphQL resolvers for academic years, REST routes for students/exams/fees/promotions.

**Spec:** `docs/superpowers/specs/2026-09-29-academic-year-url-design.md` (commit `c0718c9`) — read it with this plan; the plan argues from it.

**Divergences from the spec** (three, all deliberate; the behaviour is unchanged):
1. The spec's `RouteContext.exemptWithoutYear` predicate is dropped. `parseRoute` only detects and strips the year; the gate (Task 4) owns the exemption. Fewer knobs in the pure contract, same outcome.
2. The spec's `src/lib/academic-year/` folder is not created. Pure URL helpers go in `src/lib/routing/` next to `module-routes.ts`; the two hooks go in `src/modules/academics/hooks/` next to `use-academic-years.ts`, which is where this repo keeps domain data hooks.
3. The spec cited `ACADEMIC_YEAR_SHAPE`; **no regex participates in routing or data decisions**. Membership in the tenant's own year list is the only test (spec §3 withdrew the shape rule). One cosmetic shape test survives in `generateMetadata` (Task 2 Step 3), where the tenant's year list is not available without a client and a wrong guess there changes only a browser-tab title, never which screen opens or what is saved.

## Global Constraints

- Repo root `D:\per\inkwelly`. Work on a **branch**, never a worktree (bun `linker = "hoisted"` makes a fresh worktree unrunnable until reinstall).
- Web verification: `cd apps/web && bun run typecheck && bun test src/lib/__tests__/ src/modules/__tests__/`.
- Server verification: `cd apps/server && bun run typecheck && bun run lint && bun test`.
- Commits are local; **never `git push`**. **`git commit` never appears without a trailing `-- <paths>`**, and a rename needs **both sides** named or HEAD keeps a duplicate.
- Never commit the second window's work. See the isolation protocol below.
- No new dependencies. No Python on this machine.
- Year identity is the **name string** (`students.academicYear`, `feeStructures.academicYear`, `promotions.academicYear`, `exams.academicYear` are `text` columns holding the name), never the id.
- The dispatcher's screen-key and `dynamic()`-specifier counts are **not** changed by any task here. Read the current numbers from the top of `src/modules/__tests__/screen-registry.test.ts` at the start of each task and treat those as the oracle — the second window adds rows (it moved 62/77 → 64/79 for the Academics command centre on 2026-09-29), so a number copied into this plan is already stale. If a task ever makes that test fail on a count, the task is wrong, not the number.
- Do not run `bun run build` at the repo root: the other window's `next dev` (PID was 14984) shares `.next`.
- **Scope: Spec 1 of two.** This plan puts the year in the URL, in the header, and in front of every screen as a gate, and stamps `students` on create because that is where the URL year must reach the write. The other 15 year-less tables (spec §9) are Spec 2's; do not widen a task here to cover them.

---

## Isolation protocol (read before every task)

A second editor rewrites files in this working tree while you work. Re-measured live at 2026-09-29 (before writing this plan), `git status --porcelain -- . ':!scratch'` reports **modified and unstaged**: `apps/server/src/modules/academics/academic.resolvers.ts` (Task 9), `academic.typeDefs.ts`, `index.ts`, `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (Task 2), `components/layout/sidebar/module-nav-config.tsx`, `modules/__tests__/module-catalogue.test.ts`, `module-keyed-layout.test.ts`, `screen-registry.test.ts`, `modules/academics/academic-years/index.tsx` (Tasks 4 and 9), `dashboard/components/adminDashboard/moduleCatalogue.ts` — plus **untracked**: `apps/server/src/modules/academics/academics-dashboard.service.ts`, `apps/web/src/modules/academics/academics-dashboard/`, `apps/web/src/modules/academics/hooks/use-academics-command-center.ts`, `apps/web/src/modules/ai-connect/`. Their line counts may differ from anything quoted in this plan by the time you get there, so **re-run that status command at the start of every task** rather than trusting this list.

Two of their untracked files sit in directories this plan creates files in — `apps/web/src/modules/academics/hooks/` (Task 3) and `apps/server/src/modules/academics/` (Task 9). Creating a sibling is safe: a pathspec commit reads only the named files, and `git add -- <your exact path>` stages nothing of theirs. What is forbidden is `git add -A`, `git add .`, and `git commit -a`.

For a file that is **clean** (`git status --porcelain -- <file>` empty): edit and `git commit -m … -- <file>` directly.

For a file that is **dirty** (shared), every commit follows this order:

1. `cp <file> /tmp/theirs-<name>` — snapshot their working copy.
2. Apply your edits to the file (their content is preserved because you edit the working copy, not replace it).
3. Build the committed variant: start from `git show HEAD:<file>`, apply **only your** edits to that text, write it to the file.
4. `git commit -m … -- <file>` — git reads the index, and only the named path.
5. `cp /tmp/theirs-<name> <file>`, then re-apply your edits to the working copy so the tree stays coherent for the other window and for `bun test`.
6. `git show --stat HEAD` and `git status --porcelain` — report the surviving unstaged delta.

`scratch/isolate-my-lines.mjs` automates steps 1–5. Never `git commit --amend`, never `git stash` in this tree.

**A `git mv` of a dirty file is a leak vector:** moving it and then staging the new path re-stages their working copy into your commit. For the dispatcher in Task 2, do the move with Write + delete + a pathspec commit naming both sides, and follow the protocol above for its content.

**Shared files by risk, highest first:** `header.tsx`, `app-layout.tsx`, `tenant-screen-dispatcher.tsx`, `screen-registry.test.ts`, `module-nav-config.tsx`, `academic-years/index.tsx`. `module-routes.ts`, `moduleCatalogue.ts`-adjacent tests and anything under `src/lib/` are usually quiet, but always check first.

---

## File Structure

| Path | Created / modified | Responsibility |
|---|---|---|
| `apps/web/src/lib/routing/academic-year-url.ts` | create | Pure year-identity and URL building. Imports nothing from the app. |
| `apps/web/src/lib/__tests__/academic-year-url.test.ts` | create | Unit tests for the above. |
| `apps/web/src/lib/routing/module-routes.ts` | modify | `parseRoute` detects and strips the year segment. |
| `apps/web/src/lib/__tests__/module-routes.test.ts` | modify | The three year parse cases. |
| `apps/web/src/app/(authenticated)/[slug]/[...segments]/page.tsx` | create | Replaces `[screen]/page.tsx` and `[screen]/[detail]/page.tsx`. |
| `apps/web/src/app/(authenticated)/[slug]/[...segments]/loading.tsx` | create | Replaces `[screen]/loading.tsx`. |
| `apps/web/src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx` | move + modify | Reads `segments`, resolves the year, hosts the gate. |
| `apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx` | modify | `/[slug]` lands on the year-carrying dashboard. |
| `apps/web/src/modules/academics/hooks/use-active-academic-year.ts` | create | The only reader of "which year". |
| `apps/web/src/modules/academics/hooks/use-tenant-href.ts` | create | The only writer of tenant links. |
| `apps/web/src/modules/academics/hooks/use-academic-years.ts` | modify | Tenant-scoped cache key. |
| `apps/web/src/components/layout/header.tsx` | modify | The year chip. |
| `apps/web/src/components/layout/app-layout.tsx` | modify | Sidebar resolves through the year; `navigateTo` uses the builder. |
| `apps/web/src/modules/__tests__/year-carrying-links.test.ts` | create | Guard: no hand-built tenant URL survives. |
| 15 screen files under `modules/{assessment,examinations,student-fees,students}` | modify | Read the URL year instead of guessing. |
| `apps/server/src/modules/students/student.create.guards.ts` | create | `academicYearIsKnown` — a create is stamped only with a year the tenant owns. |
| `apps/server/src/modules/students/student-create-year.test.ts` | create | Unit tests for the guard above. |
| `apps/server/src/modules/students/students.routes.ts` | modify | Student create accepts and validates `academicYear`. |
| `apps/server/src/modules/academics/academic.year-usage.ts` | create | Typed per-table counts for the rename guard. |
| `apps/server/src/modules/academics/academic.year-in-use.test.ts` | create | The rename guard's table coverage. |
| `apps/server/src/modules/academics/academic.resolvers.ts` | modify | `YEAR_IN_USE:` rename refusal. |
| `apps/server/src/modules/support/common.resolvers.ts`, `apps/server/src/modules/tenancy/tenants.routes.ts` | modify | Default year at tenant creation. |
| `apps/server/src/db/backfill_academic_years.ts` | create | One-off backfill for existing tenants. |

---

### Task 1: Pure year identity and URL builders

**Files:**
- Create: `apps/web/src/lib/routing/academic-year-url.ts`
- Create: `apps/web/src/lib/__tests__/academic-year-url.test.ts`
- Modify: `apps/web/src/lib/routing/module-routes.ts`
- Modify: `apps/web/src/lib/__tests__/module-routes.test.ts`

**Interfaces:**
- Consumes: nothing (this file imports nothing from the app, exactly like `module-routes.ts`).
- Produces:
  - `yearSlugOf(name: string): string`
  - `academicYearUrl(slug: string, yearSlug: string | null, tail: string): string`
  - `canonicalTenantUrl(opts: { slug: string; segments: string[]; yearSlug: string; search?: string }): string`
  - `swapYearUrl(opts: { slug: string; segments: string[]; fromYearSlug: string | null; toYearSlug: string; search?: string }): string`
  - `RouteParts = { year: string | null; module: string | null; screen: string }`
  - `RouteContext.yearSlugs?: string[]`

- [x] **Step 1: Write the failing tests**

Create `apps/web/src/lib/__tests__/academic-year-url.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import {
  yearSlugOf,
  academicYearUrl,
  canonicalTenantUrl,
  swapYearUrl,
} from "../routing/academic-year-url";

describe("yearSlugOf", () => {
  test("passes a conventional name through unchanged", () => {
    expect(yearSlugOf("2026-2027")).toBe("2026-2027");
    expect(yearSlugOf("2026-27")).toBe("2026-27");
  });
  test("normalises free text an admin may have typed", () => {
    expect(yearSlugOf("FY 2026")).toBe("fy-2026");
    expect(yearSlugOf(" 2026--27 ")).toBe("2026-27");
    expect(yearSlugOf("Session 2026/27")).toBe("session-2026-27");
  });
});

describe("academicYearUrl", () => {
  test("a bare key gets the year inserted after the tenant", () => {
    expect(academicYearUrl("demo", "2026-2027", "results-entry")).toBe(
      "/demo/2026-2027/results-entry",
    );
  });
  test("a qualified key keeps both segments", () => {
    expect(academicYearUrl("demo", "2026-2027", "academics/classes")).toBe(
      "/demo/2026-2027/academics/classes",
    );
  });
  test("query strings ride along untouched", () => {
    expect(
      academicYearUrl("demo", "2026-2027", "students?student=S-1%20A"),
    ).toBe("/demo/2026-2027/students?student=S-1%20A");
  });
  test("no year yields the year-free URL the gate screen needs", () => {
    expect(academicYearUrl("demo", null, "academic-years")).toBe(
      "/demo/academic-years",
    );
  });
  test("no tenant yields a platform route", () => {
    expect(academicYearUrl("", null, "tenants")).toBe("/tenants");
  });
});

describe("canonicalTenantUrl", () => {
  test("a year-free path gains the year before the screen", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["results-entry"],
        yearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/results-entry");
  });
  test("a module-scoped path keeps its two segments", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["academics", "classes"],
        yearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/academics/classes");
  });
  test("search is re-appended", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["students"],
        yearSlug: "2026-2027",
        search: "?classId=C-9",
      }),
    ).toBe("/demo/2026-2027/students?classId=C-9");
  });
});

describe("swapYearUrl", () => {
  test("only the year segment changes", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["2026-2027", "academics", "classes"],
        fromYearSlug: "2026-2027",
        toYearSlug: "2025-2026",
      }),
    ).toBe("/demo/2025-2026/academics/classes");
  });
  test("a URL that carries no year gains one at the front of the tail", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["exams"],
        fromYearSlug: null,
        toYearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/exams");
  });
  test("an empty tail means the dashboard", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["2026-2027"],
        fromYearSlug: "2026-2027",
        toYearSlug: "2025-2026",
      }),
    ).toBe("/demo/2025-2026/dashboard");
  });
});
```

- [x] **Step 2: Run them to make sure they fail**

Run: `cd apps/web && bun test src/lib/__tests__/academic-year-url.test.ts`
Expected: `Cannot find module '../routing/academic-year-url'` — a load failure, not a passing run.

- [x] **Step 3: Write the builders**

Create `apps/web/src/lib/routing/academic-year-url.ts`:

```ts
/**
 * Year identity as it appears in a URL, and the only writers of tenant paths.
 *
 * A year's routing identity is derived from its name, because the four tables
 * that partition by year (`students`, `feeStructures`, `promotions`, `exams`)
 * store the name as text, not the id. Names are free text — `2026-2027`,
 * `2026-27`, `FY 2026` all occur — so the slug is a normalisation, and the
 * authoritative check is membership in the tenant's own list (see
 * `module-routes.parseRoute`). Two names that slug identically resolve to the
 * newer one: `academicYears` is ordered `desc(startDate)` server-side.
 *
 * This file imports nothing from the app, like `module-routes.ts`, so the
 * dispatcher, the sidebar and the header cannot drift on what a path means.
 */

export function yearSlugOf(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function academicYearUrl(
  slug: string,
  yearSlug: string | null,
  tail: string,
): string {
  if (!slug) return `/${tail}`;
  if (!yearSlug) return `/${slug}/${tail}`;
  return `/${slug}/${yearSlug}/${tail}`;
}

/** The same path the browser is on, with the year forced to `yearSlug`. */
export function canonicalTenantUrl(opts: {
  slug: string;
  segments: string[];
  yearSlug: string;
  search?: string;
}): string {
  const tail = `${opts.segments.join("/")}${opts.search ?? ""}`;
  return academicYearUrl(opts.slug, opts.yearSlug, tail || "dashboard");
}

/**
 * `segments` is the catch-all: it may or may not start with the current year.
 * The tail is whatever is left after removing it, so switching years never
 * changes which screen is open.
 */
export function swapYearUrl(opts: {
  slug: string;
  segments: string[];
  fromYearSlug: string | null;
  toYearSlug: string;
  search?: string;
}): string {
  const rest =
    opts.fromYearSlug && opts.segments[0] === opts.fromYearSlug
      ? opts.segments.slice(1)
      : opts.segments;
  const tail = `${rest.join("/")}${opts.search ?? ""}` || "dashboard";
  return academicYearUrl(opts.slug, opts.toYearSlug, tail);
}
```

- [x] **Step 4: Run the tests to make them pass**

Run: `cd apps/web && bun test src/lib/__tests__/academic-year-url.test.ts`
Expected: PASS, 15 tests, 0 failures.

- [x] **Step 5: Write the failing parse tests**

Append to `apps/web/src/lib/__tests__/module-routes.test.ts` (keep whatever it already contains; add a new `describe` block):

```ts
import { parseRoute } from "../routing/module-routes";

const YEARS = ["2026-2027", "2025-2026"];
const ctx = (over: Record<string, unknown> = {}) => ({
  isModuleScreen: (m: string, s: string) => m === "academics" && s === "classes",
  isTenantRoot: (first: string) => first === "demo",
  yearSlugs: YEARS,
  ...over,
});

describe("parseRoute with a year segment", () => {
  test("recognised year at index 1 becomes the year and drops out of the screen path", () => {
    expect(parseRoute("/demo/2026-2027/exams", ctx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "exams",
    });
    expect(parseRoute("/demo/2026-2027/academics/classes", ctx())).toEqual({
      year: "2026-2027",
      module: "academics",
      screen: "classes",
    });
  });

  test("a bare or qualified URL still resolves to its screen, with no year", () => {
    expect(parseRoute("/demo/exams", ctx())).toEqual({
      year: null,
      module: null,
      screen: "exams",
    });
    expect(parseRoute("/demo/academics/classes", ctx())).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
  });

  test("an unrecognised segment at index 1 is a screen, not a year", () => {
    expect(parseRoute("/demo/2024-2025/exams", ctx())).toEqual({
      year: null,
      module: null,
      screen: "2024-2025",
    });
  });

  test("a year with nothing after it means the dashboard", () => {
    expect(parseRoute("/demo/2026-2027", ctx())).toEqual({
      year: "2026-2027",
      module: null,
      screen: "dashboard",
    });
  });

  test("the year is not read when the first segment is the tenant root", () => {
    expect(parseRoute("/demo", ctx())).toEqual({
      year: null,
      module: null,
      screen: "dashboard",
    });
  });

  test("no yearSlugs at all keeps the old behaviour exactly", () => {
    const bare = ctx({ yearSlugs: undefined });
    expect(parseRoute("/demo/academics/classes", bare)).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
    expect(parseRoute("/demo/students/STU-123", bare)).toEqual({
      year: null,
      module: null,
      screen: "students",
    });
  });
});
```

- [x] **Step 6: Run them to make sure they fail**

Run: `cd apps/web && bun test src/lib/__tests__/module-routes.test.ts`
Expected: FAIL — `year` is not a property of the returned object (TypeScript) or the assertions mismatch.

- [x] **Step 7: Update the five pre-existing assertions, which the widened shape breaks**

`bun:test`'s `toEqual` treats an extra defined key as a mismatch, so every `parseRoute` assertion already in `src/lib/__tests__/module-routes.test.ts` must gain `year: null`. The file's `ctx` has no `yearSlugs`, so nothing there is read as a year and `null` is always correct. Apply exactly these five edits (the block is `describe("parseRoute")`, currently lines 26-64):

```ts
  test("a bare tenant root is the dashboard", () => {
    expect(p("/demo-academy")).toEqual({ year: null, module: null, screen: "dashboard" });
  });

  test("one segment after the tenant is a bare screen", () => {
    expect(p("/demo-academy/school-settings")).toEqual({
      year: null,
      module: null,
      screen: "school-settings",
    });
  });

  test("module + screen when the pair is a declared sub-link", () => {
    expect(p("/demo-academy/academics/classes")).toEqual({
      year: null,
      module: "academics",
      screen: "classes",
    });
  });

  test("three segments that are NOT a declared sub-link stay a bare screen", () => {
    // `/students/STU-123` is the legacy screen/detail shape and must keep working.
    expect(p("/demo-academy/students/STU-123")).toEqual({
      year: null,
      module: null,
      screen: "students",
    });
  });

  test("an unknown module falls back to today's behaviour", () => {
    expect(p("/demo-academy/not-a-module/classes")).toEqual({
      year: null,
      module: null,
      screen: "not-a-module",
    });
  });
```

Leave the `key helpers` and `canonicalOwner` blocks and the two trailing tests untouched.

- [x] **Step 8: Extend the contract**

In `apps/web/src/lib/routing/module-routes.ts`, replace `RouteParts`, `RouteContext` and `parseRoute` with:

```ts
export type RouteParts = {
  year: string | null;
  module: string | null;
  screen: string;
};

export type RouteContext = {
  /** True when `screen` is a declared sub-link of module `module`. */
  isModuleScreen: (module: string, screen: string) => boolean;
  /** True when a single leading path segment names the tenant rather than a screen. */
  isTenantRoot: (first: string) => boolean;
  /**
   * The tenant's own year slugs. Membership, not shape, decides what segment 1
   * means: year names are free text, so `2024-2025` may be a year or a screen
   * depending on who owns it. Omit it and nothing is treated as a year.
   */
  yearSlugs?: string[];
};

export function parseRoute(pathname: string, ctx: RouteContext): RouteParts {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return { year: null, module: null, screen: "dashboard" };
  if (parts.length === 1) {
    return ctx.isTenantRoot(parts[0])
      ? { year: null, module: null, screen: "dashboard" }
      : { year: null, module: null, screen: parts[0] };
  }

  const rest = parts.slice(1);
  let year: string | null = null;
  if (rest[0] && ctx.yearSlugs?.includes(rest[0])) {
    year = rest[0];
    rest.shift();
  }

  if (rest.length === 0) return { year, module: null, screen: "dashboard" };

  const [first, second] = rest;
  if (second && ctx.isModuleScreen(first, second)) {
    return { year, module: first, screen: second };
  }
  return { year, module: null, screen: first };
}
```

Leave `qualifiedKey`, `splitKey`, `COMPONENT_OVERRIDES`, `componentKey` and `canonicalOwner` exactly as they are, and keep the file's header comment plus the two doc comments above `parseRoute` and `COMPONENT_OVERRIDES` — add to the `parseRoute` doc: *"A `year: null` result is not an error; it means the caller must canonicalise the URL (spec §3), except for the screen the gate itself renders."*

- [x] **Step 9: Run the whole web suite**

Run: `cd apps/web && bun test src/lib/__tests__/ src/modules/__tests__/ && bun run typecheck`
Expected: all tests PASS. `typecheck` reports errors **only** at the two `parseRoute` call sites that now read a widened return type — `tenant-screen-dispatcher.tsx` and `app-layout.tsx` destructure `{ module, screen }`, which still typechecks; if either reads `RouteParts` exhaustively, note it for Task 2 and do not fix it here.

- [x] **Step 10: Commit**

All four paths are clean of the other window unless `git status` says otherwise — check first, then:

```bash
git commit -m "feat(routing): the academic year becomes a URL segment the contract can see" -- \
  apps/web/src/lib/routing/academic-year-url.ts \
  apps/web/src/lib/__tests__/academic-year-url.test.ts \
  apps/web/src/lib/routing/module-routes.ts \
  apps/web/src/lib/__tests__/module-routes.test.ts
git show --stat HEAD
```

---

### Task 2: Collapse the tenant route tree into one catch-all

**Files:**
- Create: `apps/web/src/app/(authenticated)/[slug]/[...segments]/page.tsx`
- Create: `apps/web/src/app/(authenticated)/[slug]/[...segments]/loading.tsx`
- Move: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` → `apps/web/src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx`
- Delete: `apps/web/src/app/(authenticated)/[slug]/[screen]/page.tsx`
- Delete: `apps/web/src/app/(authenticated)/[slug]/[screen]/[detail]/page.tsx`
- Delete: `apps/web/src/app/(authenticated)/[slug]/[screen]/loading.tsx`
- Modify: `apps/web/src/modules/__tests__/screen-registry.test.ts` (two `path` strings) — **shared file, dirty**

**Interfaces:**
- Consumes: Task 1's `RouteParts`/`yearSlugs`.
- Produces: `useParams()` shape `{ slug: string; segments?: string[] }` for every tenant screen; the dispatcher at its new path; a local `screen` variable inside the dispatcher that means "the resolved screen key" and never the year.

**Interim behaviour, deliberately:** this task passes `yearSlugs: []`, so nothing is treated as a year yet and URLs keep working exactly as they do now. The gate arrives in Task 4. A reviewer rejecting Task 2 must only be able to reject the route shape.

- [x] **Step 1: Prove the two-segment tree is a dead end first**

```bash
cd apps/web && ls src/app/\(authenticated\)/\[slug\]/\[screen\]/ src/app/\(authenticated\)/\[slug\]/\[screen\]/\[detail\]/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/loadtest-academy/2026-2027/academics/classes
```
Expected: the four files listed; the curl prints `404` — today a year-shaped URL cannot resolve because the deepest route is three segments. Keep the number; Task 10 checks it becomes `200`.

- [x] **Step 2: Snapshot the shared dispatcher and record its baseline counts**

```bash
cd /d/per/inkwelly
cp "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx" /tmp/theirs-disp.tsx
grep -cE "import\(['\"]@/[^'\"]+['\"]\)" "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
grep -cE "^\s+case '" "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git status --porcelain -- "apps/web/src/app/(authenticated)/[slug]/[screen]/page.tsx" "apps/web/src/app/(authenticated)/[slug]/[screen]/loading.tsx" "apps/web/src/app/(authenticated)/[slug]/[screen]/[detail]/page.tsx"
```
Expected: the two counts (baseline, whatever the tree currently says) and **no output** from `git status` — the three page/loading files must be clean. If any is dirty, stop and report the collision before moving it.

- [x] **Step 3: Write the new page**

Create `apps/web/src/app/(authenticated)/[slug]/[...segments]/page.tsx`. `generateMetadata` reproduces both title formats the app serves today — `<Screen> | <Tenant> | SchoolSaaS` and, for the screen/detail shape, `<Detail> - <Screen> | <Tenant> | SchoolSaaS` — with the year excluded:

```tsx
export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TenantScreenDispatcherClient from './tenant-screen-dispatcher';

type Props = {
  params: Promise<{ slug: string; segments: string[] }>;
};

const titleCase = (value: string) =>
  value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * A year shaped like `2026-2027` or `2026-27` is left out of the title. This is
 * cosmetic only — routing decides by membership in the tenant's own list (see
 * module-routes.parseRoute). A free-text year name such as "FY 2026" therefore
 * shows up in the document title; nothing else changes.
 */
const YEAR_SHAPED = /^20\d{2}-\d{2,4}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, segments } = await params;
  const tail = YEAR_SHAPED.test(segments[0] ?? '') ? segments.slice(1) : segments;

  const displaySlug = titleCase(slug);
  const displayScreen = titleCase(tail[tail.length - 1] ?? 'dashboard');
  const displayDetail = tail.length > 1 ? titleCase(tail[0]) : null;

  const screenLabel = displayDetail ? `${displayScreen} - ${displayDetail}` : displayScreen;

  return {
    title: `${screenLabel} | ${displaySlug} | SchoolSaaS`,
    description: `Manage ${screenLabel} for ${displaySlug}. Access all your school management tools on SchoolSaaS.`,
  };
}

export default function TenantScreenDispatcher() {
  return <TenantScreenDispatcherClient />;
}
```

The old `[detail]/page.tsx` produced `${displayDetail} - ${displayScreen}` where `screen` was the module word — `tail[tail.length - 1]` and `tail[0]` reproduce that pair from one route, so `/slug/academics/classes` and `/slug/2026-2027/academics/classes` both still read `Classes - Academics | …`.

- [x] **Step 4: Write the new loading**

Create `apps/web/src/app/(authenticated)/[slug]/[...segments]/loading.tsx`. It keys off the *last* segment, so `/slug/2026-2027/dashboard` still gets the dashboard skeleton. No year shape is sniffed here — the year needs the tenant's own list, which this component cannot fetch, and a momentary generic skeleton is the right cost for not duplicating the parse rule:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { FullPageSkeleton } from "@/components/ui/full-page-skeleton";
import { AdminDashboardSkeleton } from "@/modules/dashboard/components/adminDashboard/DashboardSkeleton";

export default function ScreenLoading() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments[segments.length - 1] === "dashboard") {
    return <AdminDashboardSkeleton />;
  }

  return <FullPageSkeleton />;
}
```

- [x] **Step 5: Move the dispatcher and change only how it reads the route**

Copy the file to the new path and replace its route-reading prologue. Everything below line "const screenKey = …" — the permission maps, the four role switches, all 77 `dynamic()` imports — stays byte-for-byte:

```tsx
export default function TenantScreenDispatcherClient() {
  // The catch-all carries the year at index 1 for every tenant screen.
  const { slug, segments: rawSegments } = useParams();
  const segments = (rawSegments ?? []) as string[];
  const mounted = useHydrated();
  const { currentUser } = useAppStore();

  // Task 4 replaces this empty list with the tenant's own years. Until then no
  // segment is read as a year, so this is byte-equivalent to the old behaviour.
  const route = parseRoute(`/${slug}/${segments.join('/')}`, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: (first) => first === slug,
    yearSlugs: [],
  });
  const screenKey = componentKey(route.module, route.screen);
  const screen = route.screen;
```

Then apply these three edits, and no others:

1. `if (mounted && currentUser && typeof slug === 'string' && typeof screen === 'string')` → `if (mounted && currentUser && typeof slug === 'string')` (line was 162). `screen` is now always a `string` from `route.screen`, and the guard's purpose — "do not redirect before the params exist" — is served by `slug` alone.
2. `redirect(\`/${correctSlug}/${screen}\`)` (line was 171) → `redirect(\`/${correctSlug}/${segments.join('/')}\`)`. The old line dropped the module segment of a qualified URL; the tail is the honest target and keeps `/[slug]/academics/classes` bookmarks landing on Classes.
3. In the `if (!mounted || !currentUser || …)` early return (line was 176), drop the `typeof screen !== 'string'` term: `if (!mounted || !currentUser || typeof slug !== 'string')`.

Delete the three old files and the now-empty `[detail]` folder:

```bash
cd /d/per/inkwelly/apps/web/src/app/\(authenticated\)/\[slug\]
rm "\[screen\]/\[detail\]/page.tsx" "\[screen\]/page.tsx" "\[screen\]/loading.tsx"
rmdir "\[screen\]/\[detail\]"
```

(`tenant-screen-dispatcher.tsx` at the old path is removed in Step 7 as part of the commit, so its deletion is recorded with both sides of the move.)

- [x] **Step 6: Update every guard path, counts unchanged**

**Five** strings name the old dispatcher path, not two: `screen-registry.test.ts` has one in `REGISTRIES` *and* one inside the "guards and switches on the resolved key" test (`join(APP_ROOT, …)`), and `module-catalogue.test.ts:12` and `module-nav.test.ts:12` each keep their own copy. Retarget all five to `[slug]/[...segments]/tenant-screen-dispatcher.tsx`. `generic-slug-dispatcher` keeps its path (it does not move). Do **not** touch `specifiers` or `keys` — read them from the file and leave them.

- [x] **Step 6b: Regenerate the route types before typechecking**

Deleting a route folder leaves `.next/types/validator.ts` pointing at the removed `page.js` modules, and `bun run typecheck` fails with TS2307 on files that no longer exist. The running `next dev` does **not** refresh them. Fix with `cd apps/web && bunx next typegen` (writes only `.next/types`, touches no compiled output, so the other window's server is unaffected) — never `bun run build`, which is what the shared `.next` rule protects.

- [x] **Step 7: Prove the move changed no counts, then typecheck**

```bash
cd apps/web
grep -cE "import\(['\"]@/[^'\"]+['\"]\)" "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx"
grep -cE "^\s+case '" "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx"
bun run typecheck && bun test src/modules/__tests__/screen-registry.test.ts
```
Expected: both counts identical to Step 2. `bun test` must pass **against the working copy**, i.e. at the working counts (78/63 today). If the numbers moved, the move is wrong — diff the two dispatcher copies with `diff /tmp/theirs-disp.tsx "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx"` and confirm every difference is inside the Step 5 block.

- [x] **Step 8: Prove it in the browser, at the URL shape the app serves today**

With the other window's `next dev` already on :3000 (or start one if it is gone: `cd apps/web && bun run dev`), open `http://localhost:3000/loadtest-academy/dashboard`, `/loadtest-academy/academics/classes` and `/loadtest-academy/results-entry`. Use the network log, not rendered text: each returns 200 and the screen's own data requests fire. `/loadtest-academy/2026-2027/academics/classes` still 404s at this stage (no year is recognised yet) — that is expected and fixed in Task 4, so write it down rather than "fixing" it here.

- [x] **Step 9: Commit through the isolation protocol, naming both sides of the move**

```bash
cd /d/per/inkwelly
cp "apps/web/src/modules/__tests__/screen-registry.test.ts" /tmp/theirs-registry.ts
# Build HEAD+mine for the dispatcher and the registry test per the protocol,
# then commit every path of the move in one go:
git commit -m "refactor(web): collapse the tenant route tree so a year segment can exist" -- \
  "apps/web/src/app/(authenticated)/[slug]/[...segments]/page.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[...segments]/loading.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[screen]/page.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[screen]/loading.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[screen]/[detail]/page.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx" \
  apps/web/src/modules/__tests__/screen-registry.test.ts \
  apps/web/src/modules/__tests__/module-catalogue.test.ts \
  apps/web/src/modules/__tests__/module-nav.test.ts
git show --stat -M HEAD
```
Expected: a `rename … (97%)` line for the dispatcher (only the prologue differs) and two `delete mode` lines. Also delete `[screen]/tenant-screen-dispatcher.tsx` from the working tree and `rmdir [screen]` **before** staging, otherwise the old copy is neither deleted nor renamed and the move is recorded half-done. A large insertion count on the dispatcher means their lines rode along — undo with `git reset --soft HEAD~1`, rebuild the committed variant, commit again. Afterwards restore their working copies of the dispatcher (at the **new** path, with their lines and your Step 5 block) and of `screen-registry.test.ts` (`cp /tmp/theirs-registry.ts` back, then re-apply only the Step 6 path edit), and report the surviving unstaged delta.

---

### Task 3: The year context hook and a tenant-scoped cache key

**Files:**
- Create: `apps/web/src/modules/academics/hooks/use-active-academic-year.ts`
- Create: `apps/web/src/modules/academics/hooks/use-tenant-href.ts`
- Modify: `apps/web/src/modules/academics/hooks/use-academic-years.ts`
- Modify: `apps/web/src/components/layout/app-layout.tsx` (`resolveScreenFromPathname` + `useAppNavigation`) — **shared file, dirty**

**Interfaces:**
- Consumes: Task 1's builders and `yearSlugs`; the existing `useAcademicYears()`.
- Produces:
  - `useActiveAcademicYear(): { status: 'loading' | 'empty' | 'ready'; years: any[]; year: any | null; yearSlug: string | null; yearSlugs: string[]; setActiveYear: (slug: string) => void }` — `status === 'ready'` with `year === null` means "the URL has no usable year; the caller canonicalises".
  - `useTenantHref(): (tail: string) => string`
  - `useAcademicYears()` unchanged in shape, cache key now `['academic-years', tenantSlug]`.

- [x] **Step 1: Scope the cache key per tenant**

In `apps/web/src/modules/academics/hooks/use-academic-years.ts` replace the hook body's query key and all four invalidation calls so the list never leaks across schools:

```ts
export function useAcademicYears() {
  const queryClient = useQueryClient();
  const { currentTenantSlug, currentTenantId } = useAppStore();
  // A super admin moving between schools must not see the previous school's
  // years while the new query is in flight; the chip would offer the wrong list.
  const cacheKey = ['academic-years', currentTenantSlug || currentTenantId || ''];

  const { data, isLoading, error } = useQuery({
    queryKey: cacheKey,
    queryFn: () => graphqlQuery<{ academicYears: any[] }>(GET_ACADEMIC_YEARS),
  });
```

Add the store import at the top (`import { useAppStore } from '@/store/use-app-store';`) and change each of the four `onSuccess` handlers to `queryClient.invalidateQueries({ queryKey: cacheKey })`. Leave the GraphQL documents and the returned object exactly as they are.

- [x] **Step 2: Write the year context**

Create `apps/web/src/modules/academics/hooks/use-active-academic-year.ts`:

```ts
"use client";

import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAcademicYears } from './use-academic-years';
import {
  parseRoute,
  type RouteParts,
} from '@/lib/routing/module-routes';
import {
  yearSlugOf,
  swapYearUrl,
} from '@/lib/routing/academic-year-url';
import { isAdminModuleScreen } from '@/components/layout/sidebar/module-nav-config';

/**
 * The single reader of "which academic year is this screen in".
 *
 * The URL is the authority. The tenant's own year list decides whether a
 * segment is a year at all, so this cannot report `ready` before that list
 * arrives — callers must hold a skeleton through `loading`.
 */
export function useActiveAcademicYear() {
  const { academicYears, isLoading } = useAcademicYears();
  const params = useParams();
  const search = useSearchParams();
  const { replace } = useRouter();

  const slug = (params?.slug ?? '') as string;
  const segments = ((params?.segments ?? []) as string[]);

  const yearSlugs = useMemo(
    () => academicYears.map((y: any) => yearSlugOf(y.name)),
    [academicYears],
  );

  const route: RouteParts = useMemo(
    () =>
      parseRoute(`/${slug}/${segments.join('/')}`, {
        isModuleScreen: isAdminModuleScreen,
        isTenantRoot: (first) => first === slug,
        yearSlugs,
      }),
    [slug, segments, yearSlugs],
  );

  const year = useMemo(
    () => (route.year ? academicYears.find((y: any) => yearSlugOf(y.name) === route.year) ?? null : null),
    [academicYears, route.year],
  );

  const status: 'loading' | 'empty' | 'ready' = isLoading
    ? 'loading'
    : academicYears.length === 0
      ? 'empty'
      : 'ready';

  const setActiveYear = (nextSlug: string) => {
    replace(
      swapYearUrl({
        slug,
        segments,
        fromYearSlug: route.year,
        toYearSlug: nextSlug,
        search: search?.toString() ? `?${search.toString()}` : '',
      }),
    );
  };

  return {
    status,
    years: academicYears,
    year,
    yearSlug: route.year,
    yearSlugs,
    setActiveYear,
  };
}
```

- [x] **Step 3: Write the link adapter**

Create `apps/web/src/modules/academics/hooks/use-tenant-href.ts`:

```ts
"use client";

import { useAppStore } from '@/store/use-app-store';
import { useActiveAcademicYear } from './use-active-academic-year';
import { academicYearUrl } from '@/lib/routing/academic-year-url';

/**
 * Turns a screen tail (`'manage-plan'`, `'academics/classes'`,
 * `'students?student=S-1'`) into an absolute tenant URL that carries the year.
 * One adapter so the 40-odd inline `push(`/${slug}/…`)` sites can each change
 * to a single call and never re-derive slug or year themselves.
 */
export function useTenantHref(): (tail: string) => string {
  const { currentUser, currentTenantSlug, currentTenantId } = useAppStore();
  const { yearSlug } = useActiveAcademicYear();

  return (tail: string) => {
    const slug = currentTenantSlug || currentTenantId ||
      currentUser?.tenantSlug || currentUser?.tenantId || '';
    return academicYearUrl(slug, yearSlug, tail);
  };
}
```

- [x] **Step 4: Make the sidebar resolve through the year**

In `apps/web/src/components/layout/app-layout.tsx`, give the module-level resolver the year list and thread it from the component (shared file — snapshot it first per the protocol):

```ts
function resolveScreenFromPathname(
  pathname: string,
  currentUser: any,
  currentTenantSlug: string | null,
  yearSlugs: string[] = []
): string {
  const { module, screen } = parseRoute(pathname, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: tenantRootPredicate(currentUser, currentTenantSlug),
    yearSlugs,
  });
  return module ? qualifiedKey(module, screen) : screen;
}
```

Then inside `AppLayout`, import and call the hook and add `yearSlugs` to the memo (around the existing `resolvedScreen` memo, which is at line ~327 in the current tree — re-read before editing):

```ts
import { useActiveAcademicYear } from '@/modules/academics/hooks/use-active-academic-year';
// …
  const { yearSlugs } = useActiveAcademicYear();

  const resolvedScreen = useMemo(() => {
    return resolveScreenFromPathname(pathname, currentUser, currentTenantSlug, yearSlugs);
  }, [pathname, currentUser, currentTenantSlug, yearSlugs]);
```

- [x] **Step 5: Prove the year does not become the active row**

```bash
cd apps/web && bun run typecheck && bun test src/lib/__tests__/ src/modules/__tests__/
```
Expected: green. Then in the browser, open `/loadtest-academy/2026-2027/dashboard` **manually typed** and check the network log: the URL 404s today (Task 4 makes it live), so instead prove this task's claim at `/loadtest-academy/dashboard` — the sidebar still highlights Dashboard and `resolvedScreen` in React DevTools is `'dashboard'`, not `'2026'`. The year-aware resolution is only observable after Task 4; record that in the task report rather than claiming it works.

- [x] **Step 6: Commit**

`use-academic-years.ts` and the two new hooks are usually quiet; `app-layout.tsx` is not — commit Step 4's edits through the protocol:

```bash
git commit -m "feat(web): one hook owns the active academic year" -- \
  apps/web/src/modules/academics/hooks/use-active-academic-year.ts \
  apps/web/src/modules/academics/hooks/use-tenant-href.ts \
  apps/web/src/modules/academics/hooks/use-academic-years.ts \
  apps/web/src/components/layout/app-layout.tsx
git show --stat HEAD
```

---

### Task 4: The gate — no screen without a year

**Files:**
- Modify: `apps/web/src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx` — **shared file, dirty**
- Modify: `apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx`
- Modify: `apps/web/src/modules/academics/academic-years/index.tsx` (banner) — **shared file, dirty**
- Test: `apps/web/src/lib/__tests__/academic-year-url.test.ts` (the canonicalisation cases already exist from Task 1)

**Interfaces:**
- Consumes: `useActiveAcademicYear()`, `canonicalTenantUrl`, `academicYearUrl`.
- Produces: `YEAR_FREE_SCREENS` — the screens reachable with no year, currently `new Set(['academic-years'])`.

- [x] **Step 1: Wire the parser to the real years and add the gate**

In the moved dispatcher, replace the Task 2 interim `yearSlugs: []` block with the hook and the gate. The gate goes **after** the existing mounted/user guard and **before** the role blocks, so it inherits the "during render" redirect mechanism the file already uses:

```tsx
const { status: yearStatus, yearSlug, yearSlugs, years } = useActiveAcademicYear();

const route = parseRoute(`/${slug}/${segments.join('/')}`, {
  isModuleScreen: isAdminModuleScreen,
  isTenantRoot: (first) => first === slug,
  yearSlugs,
});
const screenKey = componentKey(route.module, route.screen);
const screen = route.screen;
```

Then, immediately after the `if (!mounted || !currentUser || typeof slug !== 'string')` early return:

```tsx
  // No tenant screen paints without a year. While the tenant's years are still
  // loading this is the same skeleton the file already shows.
  if (yearStatus === 'loading') {
    return screen === 'dashboard' ? <DashboardLoadingScreen /> : <LoadingScreen />;
  }

  if (yearStatus === 'empty') {
    // A school with no session. Admins are sent to set one up; a non-admin must
    // NOT be redirected there, or they bounce off a screen they cannot open and
    // the gate loops. They get one blocking notice, here, in the dispatcher —
    // every tenant screen already routes through this file, so this single
    // return covers all of them. Do not duplicate it into the 15 screens.
    const canSetUp =
      currentUser.role === 'admin' ||
      hasPermission(currentUser, 'academic-years', 'view');
    if (canSetUp) {
      if (screen !== 'academic-years') redirect(`/${slug}/academic-years`);
    } else {
      return <NoAcademicYearNotice tenant={slug} />;
    }
  } else if (yearSlug === null && !YEAR_FREE_SCREENS.has(screen)) {
    // Bookmarks and any link not yet converted to useTenantHref land here: the
    // tail is re-emitted under the active year, so the screen never changes.
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    redirect(
      canonicalTenantUrl({ slug, segments, yearSlug: yearSlugOf(years.find((y: any) => y.isCurrent)?.name ?? years[0].name), search }),
    );
  }
```

`NoAcademicYearNotice` is a small inline component beside the file's other inline screens (`LoadingScreen`, `DashboardLoadingScreen`, lines 14-15) — same convention, no new module:

```tsx
// The dispatcher is the only mount point every tenant screen passes through, so
// this one return is the whole non-admin empty-year surface.
const NoAcademicYearNotice = ({ tenant }: { tenant: string }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
    <p className="text-lg font-semibold">No academic session is set up yet</p>
    <p className="max-w-md text-sm text-muted-foreground">
      {tenant} has no academic year, so its records cannot be opened. Ask a school
      admin to add one under Academics → Sessions.
    </p>
  </div>
);
```

Confirm `text-muted-foreground` is a token this app emits (it is used elsewhere in the module screens; if not, use the file's existing muted colour class).

Add at the top of the file:

```tsx
import { useActiveAcademicYear } from '@/modules/academics/hooks/use-active-academic-year';
import { yearSlugOf, canonicalTenantUrl } from '@/lib/routing/academic-year-url';
import { useSearchParams } from 'next/navigation';
```
and `const searchParams = useSearchParams();` with the other hook calls. `hasPermission` is already imported (the staff guard uses it). Define the exemption list once, above the component:

```tsx
/**
 * The setup screen is the one URL a tenant can be at with no year — it is how a
 * school gets its first one. Everything else must carry a year.
 */
const YEAR_FREE_SCREENS = new Set(['academic-years']);
```

- [x] **Step 2: Teach the remaining in-file redirects about the year**

The dispatcher still has seven `redirect(\`/${tid}/dashboard\`)`-style lines (staff denial, per-role defaults, the invalid-screen fail-safe). Replace each with the builder so an internal bounce never costs an extra canonicalisation hop:

```tsx
redirect(canonicalTenantUrl({ slug: tid, segments: ['dashboard'], yearSlug, search: '' }));
```

For `yearSlug === null` inside those branches (possible when the denial fires before any year is in the URL), fall back to the current year the same way Step 1 does — extract one local helper at the top of the component instead of repeating the expression:

```tsx
const activeYearSlug = yearSlug ?? yearSlugOf(years.find((y: any) => y.isCurrent)?.name ?? years[0]?.name ?? '');
const dashboardUrl = (tenant: string) =>
  canonicalTenantUrl({ slug: tenant, segments: ['dashboard'], yearSlug: activeYearSlug, search: '' });
```

then `redirect(dashboardUrl(tid))`. If `activeYearSlug` is `''` (empty-year school) `academicYearUrl` returns the year-free `/[slug]/dashboard`, which is what the `empty` branch wants.

- [x] **Step 3: `/[slug]` lands on the year-carrying dashboard**

In `generic-slug-dispatcher.tsx`, the two `redirect` lines inside the tenant block (currently `redirect(\`/${slug}/dashboard\`)` and the fail-safe `redirect(fallback ? \`/${fallback}/dashboard\` : "/dashboard")`) become year-aware. Import `useActiveAcademicYear`, `canonicalTenantUrl`, `yearSlugOf`, and note the platform switch must stay reachable without a year:

```tsx
  const { status: yearStatus, yearSlug, years } = useActiveAcademicYear();
  const activeYearSlug = yearSlug ?? yearSlugOf(years.find((y: any) => y.isCurrent)?.name ?? years[0]?.name ?? '');

  if (mounted && currentUser && typeof slug === 'string') {
    // … existing isTenantContext computation, unchanged …
    if (yearStatus === 'loading' && isTenantContext) return <DashboardLoadingScreen />;

    if (correctSlug && slug !== correctSlug) {
      redirect(yearStatus === 'empty' ? `/${correctSlug}` : academicYearUrl(correctSlug, activeYearSlug, 'dashboard'));
    }
    if (isTenantContext) {
      redirect(yearStatus === 'empty' ? `/${slug}/academic-years` : canonicalTenantUrl({ slug, segments: ['dashboard'], yearSlug: activeYearSlug, search: '' }));
    }
  }
```

Use `academicYearUrl` for the auto-correct case because the tail there is empty by construction; the `yearStatus === 'empty'` arms send the admin to the setup screen and leave a non-admin on `/[slug]`, where this file's own fail-safe then bounces them to `/dashboard` and the dispatcher's `empty` branch handles them. Do **not** touch the super-admin `switch (slug)` block — platform routes have no tenant and therefore no year.

- [x] **Step 4: The setup banner**

In `apps/web/src/modules/academics/academic-years/index.tsx` (shared, dirty — snapshot first), render the banner above the existing list when `status === 'empty'`:

```tsx
{yearStatus === 'empty' && (
  <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
    This school has no academic session yet. Add one to open the rest of the portal.
  </div>
)}
```
with `const { status: yearStatus } = useActiveAcademicYear();` at the top of the component.

- [x] **Step 5: Prove the four gate branches in the browser, with the network log**

Against `next dev` on :3000, for the seeded school (`loadtest-academy`, one year `2026-2027`):

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/loadtest-academy/2026-2027/academics/classes   # 200 (was 404 in Task 2)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/loadtest-academy/academics/classes            # 200 after one canonicalising hop
```
Then in the browser: type `/loadtest-academy/2024-2025/exams` and confirm the address bar becomes `/loadtest-academy/2026-2027/exams` and the Exams screen renders (an unknown year 302s to the current one); confirm `?classId=` survives from the Classes screen's "view students" link; confirm the sidebar row matches the screen.

For the two `empty` arms, a year-less tenant is needed. Rather than create one through the UI, fake the response: in DevTools → Network, block `/api/academic-years` (or override it to return `{ years: [] }`) on the seeded school and reload as an admin — expect one hop to `/loadtest-academy/academic-years` and the amber banner; then sign in as the seeded teacher/student/parent and expect the `NoAcademicYearNotice` and **no** redirect (this is the loop guard, so watch the address bar stay put). Unblock afterwards. Verify each with the network log, not the rendered text alone: a blocked request that yields a silent empty state looks identical to the notice.

- [x] **Step 6: Full web verification and commit**

```bash
cd apps/web && bun run typecheck && bun test src/lib/__tests__/ src/modules/__tests__/
```
Expected green. Commit dispatcher + generic dispatcher + the years screen through the protocol (both the dispatcher paths if the old one still exists in HEAD):

```bash
git commit -m "feat(web): an academic year becomes compulsory on every tenant screen" -- \
  "apps/web/src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx" \
  "apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx" \
  apps/web/src/modules/academics/academic-years/index.tsx
git show --stat HEAD
```
Report the surviving unstaged delta.

---

### Task 5: The header chip

**Files:**
- Modify: `apps/web/src/components/layout/header.tsx` — **shared file, dirty; this is the highest-risk file in the plan**

**Interfaces:**
- Consumes: `useActiveAcademicYear()` (`status`, `years`, `year`, `setActiveYear`).
- Produces: nothing later tasks depend on.

- [x] **Step 1: Snapshot, then re-read the chip you are sitting next to**

```bash
cd /d/per/inkwelly && cp apps/web/src/components/layout/header.tsx /tmp/theirs-header.tsx
grep -n "Date Display Chip" -A 22 apps/web/src/components/layout/header.tsx
```
The chip's container class string is what the year chip must reuse; the file's own `cn(...)` and `shouldShowDashboard`/`effectiveIsMinimal` variables are already in scope at that point.

- [x] **Step 2: Add the chip after the date chip**

Insert immediately after the closing `</div>` of the Date Display Chip block, reusing that block's class string verbatim and swapping the label content:

```tsx
        {/* Academic Year Chip — the URL is the authority; this is its control */}
        {yearStatus === 'ready' && resolvedScreen !== 'academic-years' && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 shadow-2xs select-none whitespace-nowrap shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                shouldShowDashboard ? "hidden md:flex" : "flex",
                !effectiveIsMinimal && "hidden sm:flex"
              )}
              aria-label="Change academic session"
            >
              <Calendar className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {year?.name}
              </span>
              <ChevronDown className="size-3 opacity-60 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {years.map((y: any) => (
                <DropdownMenuItem
                  key={y.id}
                  onClick={() => setActiveYear(yearSlugOf(y.name))}
                  className={yearSlugOf(y.name) === yearSlug ? "font-semibold" : ""}
                >
                  {y.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
```

Add to the component body with the other hook calls:

```tsx
  const { status: yearStatus, years, year, yearSlug, setActiveYear } = useActiveAcademicYear();
```

and imports: `import { useActiveAcademicYear } from "@/modules/academics/hooks/use-active-academic-year";` and `import { yearSlugOf } from "@/lib/routing/academic-year-url";`. `Calendar`, `ChevronDown`, `cn`, `DropdownMenu*` and `useRouter` are already imported in this file — verify with `grep -n "ChevronDown" apps/web/src/components/layout/header.tsx` rather than assuming.

- [x] **Step 3: Prove it changes the URL and nothing else**

In the browser on a tenant screen, open the chip and pick the other year. Confirm in the address bar that **only** segment 1 changed (e.g. `/loadtest-academy/2026-2027/exams?tab=published` → `/loadtest-academy/2025-2026/exams?tab=published`), that `useRouter().replace` was used (no new history entry: press Back and confirm you return to the *previous screen*, not the previous year), and that the screen's data refetches for the new year. Also confirm the chip is absent on `/loadtest-academy/academic-years`.

- [x] **Step 4: Typecheck, then commit through the protocol**

```bash
cd apps/web && bun run typecheck
git commit -m "feat(header): the academic year gets a header chip that rewrites only its URL segment" -- apps/web/src/components/layout/header.tsx
git show --stat HEAD && cp /tmp/theirs-header.tsx apps/web/src/components/layout/header.tsx
```
The last `cp` is the "restore their working copy" step and must be followed by re-applying Step 2's insert to the working file, exactly as the protocol says. Report the delta.

---

### Task 6: The link-builder sweep

**Files:**
- Modify: the 7 `navigateTo`/URL helpers and the ~36 inline `push()` sites listed below, across `src/modules`, `src/components/layout`, `src/app`
- Create: `apps/web/src/modules/__tests__/year-carrying-links.test.ts`

**Interfaces:**
- Consumes: `useTenantHref()` (Task 3), `academicYearUrl` / `canonicalTenantUrl` (Task 1).
- Produces: a guard test the rest of the plan (and future work) is checked against.

- [x] **Step 1: Write the guard so the sweep has a finish line**

Create `apps/web/src/modules/__tests__/year-carrying-links.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(import.meta.dir, "..", "..");

/**
 * A tenant URL must come from `academicYearUrl`, `canonicalTenantUrl`,
 * `swapYearUrl` or `useTenantHref`. Anything still interpolating a tenant slug
 * into a hand-written template literal would silently drop the year and bounce
 * the user to the school's default one.
 *
 * Platform routes have no tenant, so they stay bare; the allowlist is the only
 * way a new entry gets in, and each entry needs a reason.
 */
const TENANT_LITERAL =
  /(push|replace|redirect|href)\s*[=(]?\s*`\/[^`]*\$\{\s*(slug|tid|t[0-9]?|tenantIdentifier|tenantSlug|currentTenantSlug|currentTenantId|correctSlug|fallback)/;

const ALLOWLIST: string[] = [
  // super-admin platform routes: no tenant, therefore no year.
  "src/components/layout/app-layout.tsx:`/${screen}` — platform route when there is no tenant",
  "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx:`/${correctSlug}` — auto-correct to the tenant root, which resolves to the year itself",
  "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx:`/${fallback}/dashboard` — unreachable after Task 4; kept until verified dead",
];

function files(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next') continue;
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("every tenant link carries the academic year", () => {
  test("no hand-built tenant URL survives outside the builders", () => {
    const offenders: string[] = [];
    for (const file of files(join(SRC, "app").replace(/__tests__.*$/, ""))) {
      const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
      const lines = readFileSync(file, "utf8").split(/\r?\n/);
      lines.forEach((line, i) => {
        if (!TENANT_LITERAL.test(line)) return;
        if (line.includes("academicYearUrl(") || line.includes("canonicalTenantUrl(") ||
            line.includes("swapYearUrl(") || line.includes("tenantHref(")) return;
        offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
    }
    for (const dir of ["modules", "components"]) {
      for (const file of files(join(SRC, dir))) {
        const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
        const lines = readFileSync(file, "utf8").split(/\r?\n/);
        lines.forEach((line, i) => {
          if (!TENANT_LITERAL.test(line)) return;
          if (line.includes("academicYearUrl(") || line.includes("canonicalTenantUrl(") ||
              line.includes("swapYearUrl(") || line.includes("tenantHref(")) return;
          offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
      }
    }
    const known = ALLOWLIST.map((a) => a.split(" — ")[0]);
    const unexpected = offenders.filter((o) => !known.some((k) => o.startsWith(k.split(":")[0])));
    expect(unexpected.join("\n")).toBe("");
  });
});
```

Run it now: `cd apps/web && bun test src/modules/__tests__/year-carrying-links.test.ts` — it must fail, listing the sites below. That list **is** the work queue; if it differs from the table, trust the test.

- [x] **Step 2: Convert the seven shared helpers first**

Each becomes a `tenantHref(tail)` call. `useTenantHref` supplies slug and year, so the helpers lose their tenant plumbing but keep their side effects:

`apps/web/src/components/layout/app-layout.tsx` (`useAppNavigation`, currently lines 239-285):

```tsx
  const tenantHref = useTenantHref();
  const navigateTo = useCallback((screen: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    setCurrentScreen(screen);
    if (isSuperAdmin && isPlatformRoute(screen)) {
      push(`/${screen}`);
      return;
    }
    push(tenantHref(screen));
  }, [isSuperAdmin, push, setCurrentScreen, setSidebarOpen, tenantHref]);
```
(drop `currentTenantSlug`/`currentTenantId`/`tenantIdentifier` from this function only if nothing else in it uses them.)

`apps/web/src/components/layout/header.tsx` (`navigateTo`, currently ~line 120):

```tsx
  const tenantHref = useTenantHref();
  const navigateTo = (screen: string) => {
    setCurrentScreen(screen);
    push(tenantHref(screen));
  };
```

Then the four dashboard helpers, each with the identical two-line change — locate them with:

```bash
cd apps/web/src/modules && grep -n "push(\`/\${" dashboard/components/adminDashboard/index.tsx dashboard/components/parentDashboardComponents/MinimalDashboard.tsx dashboard/components/staffDashboard/StaffDashboard.tsx dashboard/components/teacherDashboard/index.tsx iam/iam-dashboard/index.tsx
```
In each, replace `push(\`/${tid}/${screen}\`)` with `push(tenantHref(screen))` (adding `const tenantHref = useTenantHref();` beside the other hooks) and delete the now-unused `const tid = …` line **only if** nothing else in that function uses it.

- [x] **Step 3: Convert the inline screen-site literals**

The mechanical rule at every site: keep the tail exactly as it was, drop the `/${tenant}` prefix, wrap in `tenantHref(...)`. Query strings and encoded details stay inside the tail.

| File (under `apps/web/src/`) | Today | Becomes |
|---|---|---|
| `modules/academics/classes/index.tsx:298` | ``push(`/${slug}/students?classId=${cls.id}`)`` | ``push(tenantHref(`students?classId=${cls.id}`))`` |
| `modules/student-attendance/attendance/index.tsx:122` | ``push(`/${currentTenantSlug}/students?student=${encodeURIComponent(id)}`)`` | ``push(tenantHref(`students?student=${encodeURIComponent(record.studentId)}`))`` |
| `modules/student-fees/fees/adminFees/transport/RoutesAndVehiclesView.tsx:112` | ``push(`/${slug}/transport-fee/${encodeURIComponent(r.name)}`)`` | ``push(tenantHref(`transport-fee/${encodeURIComponent(r.name)}`))`` |
| `modules/student-fees/fees/adminFees/transport/RouteDetailsView.tsx:89` | ``push(`/${slug}/transport-fee`)`` | ``push(tenantHref('transport-fee'))`` |
| `modules/assessment/components/adminExams/useExamsState.ts:320` | ``push(`/${slug}/results-entry?examId=…&classId=…`)`` | ``push(tenantHref(`results-entry?examId=${exam.id}&classId=${exam.classId}`))`` |
| `modules/assessment/components/adminExams/useExamsState.ts:506` | ``push(`/${slug}/exams`)`` | ``push(tenantHref('exams'))`` |
| `modules/assessment/components/adminExams/useExamsState.ts:485` | ``replace(`/${slug}/…`)`` | ``replace(tenantHref(…))`` — read the current line first, it is the only `replace` in the file |
| `modules/assessment/components/ParentGrades.tsx:79` | ``push(`/${slug}/view-marksheet?studentId=${activeTab}`)`` | ``push(tenantHref(`view-marksheet?studentId=${activeTab}`))`` |
| `modules/assessment/components/studentMyGrades/grades-header.tsx:43` | ``push(`/${slug}/view-marksheet`)`` | ``push(tenantHref('view-marksheet'))`` |
| `modules/examinations/print-marksheet/index.tsx:131,132,147,321` | three `manage-plan`/`print-marksheet` links + one with `?classId=&examName=` | `tenantHref('manage-plan')` ×2, `tenantHref('print-marksheet')`, ``tenantHref(`print-marksheet?classId=${c.id}&examName=${encodeURIComponent(group.cycleName)}`)`` |
| `modules/examinations/admit-cards/index.tsx:468,469` | ``push(`/${slug}/manage-plan`)`` ×2 | `tenantHref('manage-plan')` |
| `modules/tenancy/components/AdminSubscription.tsx:154` | ``push(`/${slug}/manage-plan`)`` | `tenantHref('manage-plan')` |
| `modules/tenancy/components/AdminManagePlan.tsx:61` | ``push(`/${slug}/school-subscription`)`` | `tenantHref('school-subscription')` |
| `modules/tenancy/components/SubscriptionExpired.tsx:94` | ``push(`/${tenantSlug}/school-subscription`)`` | `tenantHref('school-subscription')` |
| `modules/leaves/student-leaves/index.tsx:557` | ``push(`/${slug}/manage-plan`)`` | `tenantHref('manage-plan')` |
| `modules/finance/components/parentFees/FeeTable.tsx:59` | ``push(`/${slug}/subscription`)`` | `tenantHref('subscription')` |
| `modules/attendance/components/parentAttendance/AttendanceChart.tsx:134` | ``push(`/${slug}/subscription`)`` | `tenantHref('subscription')` |
| `modules/people/components/superAdminUsers/UserDetailSheet.tsx:696` | ``push(`/${slugOfTenant}`)`` | ``push(academicYearUrl(slugOfTenant, null, ''))`` — a super-admin jump to a tenant root, which `generic-slug-dispatcher` then year-resolves |

Add `import { useTenantHref } from '@/modules/academics/hooks/use-tenant-href';` and one `const tenantHref = useTenantHref();` per converted component. Where a file has several sites, one hook call covers them. **Re-read each line before editing** — the other window shifts line numbers.

- [x] **Step 4: Run the guard and the suite**

```bash
cd apps/web && bun test src/modules/__tests__/year-carrying-links.test.ts && bun run typecheck
```
Expected: the guard passes. Trim `ALLOWLIST` entries whose literal you actually removed; an allowlist line that matches nothing should be deleted, not kept "just in case".

- [x] **Step 5: Prove three of them in the browser**

Classes → "view students" (`?classId=` must survive with the year in front); Exams screen → a results-entry row (`?examId=&classId=`); a parent account → Fees → `subscription`. For each, the address bar must contain the year after exactly one navigation with no redirect hop — check the network log for a single 200 document, not a 307 then 200.

- [x] **Step 6: Commit in two slices**

```bash
git commit -m "feat(web): shared navigation helpers carry the academic year" -- \
  apps/web/src/components/layout/app-layout.tsx \
  apps/web/src/components/layout/header.tsx \
  apps/web/src/modules/dashboard/components/adminDashboard/index.tsx \
  apps/web/src/modules/dashboard/components/parentDashboardComponents/MinimalDashboard.tsx \
  apps/web/src/modules/dashboard/components/staffDashboard/StaffDashboard.tsx \
  apps/web/src/modules/dashboard/components/teacherDashboard/index.tsx \
  apps/web/src/modules/iam/iam-dashboard/index.tsx \
  apps/web/src/modules/__tests__/year-carrying-links.test.ts
git commit -m "feat(web): screen-level links carry the academic year" -- \
  apps/web/src/modules/academics/classes/index.tsx \
  apps/web/src/modules/student-attendance/attendance/index.tsx \
  apps/web/src/modules/student-fees/fees/adminFees/transport/RoutesAndVehiclesView.tsx \
  apps/web/src/modules/student-fees/fees/adminFees/transport/RouteDetailsView.tsx \
  apps/web/src/modules/assessment/components/adminExams/useExamsState.ts \
  apps/web/src/modules/assessment/components/ParentGrades.tsx \
  apps/web/src/modules/assessment/components/studentMyGrades/grades-header.tsx \
  apps/web/src/modules/examinations/print-marksheet/index.tsx \
  apps/web/src/modules/examinations/admit-cards/index.tsx \
  apps/web/src/modules/tenancy/components/AdminSubscription.tsx \
  apps/web/src/modules/tenancy/components/AdminManagePlan.tsx \
  apps/web/src/modules/tenancy/components/SubscriptionExpired.tsx \
  apps/web/src/modules/leaves/student-leaves/index.tsx \
  apps/web/src/modules/finance/components/parentFees/FeeTable.tsx \
  apps/web/src/modules/attendance/components/parentAttendance/AttendanceChart.tsx \
  apps/web/src/modules/people/components/superAdminUsers/UserDetailSheet.tsx
git show --stat HEAD~1 HEAD
```
`app-layout.tsx` and `header.tsx` are shared — run them through the protocol first. If the guard flags a site not in the table (their window adds links), convert it in the same commit and say so in the report.

---

### Task 7: Screens read the URL year; students get stamped

**Files:**
- Modify: the 15 `academicYears`-consuming screen files listed below
- Modify: `apps/web/src/modules/students/students/index.tsx:354` (create payload)
- Modify: `apps/server/src/modules/students/students.routes.ts` (`handleCreateStudent`)
- Test: `apps/server/src/modules/students/*` — the suite has no student-create test today, so this task adds one at `apps/server/src/modules/students/student-create-year.test.ts`

**Interfaces:**
- Consumes: `useActiveAcademicYear()`.
- Produces: `POST /api/students` accepting `academicYear` (a name the tenant owns); a created student row whose `academicYear` equals the URL segment.

- [x] **Step 1: Point each screen at the hook**

Each file below currently derives a year the same wrong way — `academicYears.find(y => y.isCurrent)?.name || '<literal>'` or a local `useState` seeded from the list. Replace the derivation with the hook and keep every downstream variable name, so no child component's props change:

```bash
cd apps/web/src/modules && grep -rn "isCurrent" assessment examinations student-fees students | grep -i "academicYear\|selectedYear\|currentAcademicYear"
```

| File | Today's derivation | After |
|---|---|---|
| `examinations/print-marksheet/index.tsx:38-41` | `academicYears.find(a => a.isCurrent)?.name \|\| '2024-2025'` | `const { year } = useActiveAcademicYear(); const currentAcademicYear = year?.name ?? '';` |
| `assessment/components/StudentMarksheet.tsx:100-129` | list + `?academicYear=` + `isCurrent` fallback | `year?.name` wins; the query param still applies only when it matches a name the tenant owns |
| `assessment/components/StudentMyGrades.tsx:89-97` | `isCurrent \|\| [0]` | `year?.name` |
| `assessment/components/adminExams/useExamsState.ts` | `currentAcademicYear` from the list | `year?.name`, and drop `useAcademicYears` if nothing else uses it |
| `assessment/components/adminExams/ExamsHeader.tsx` | year `<Select>` over the list | remove the control (see Step 2) |
| `student-fees/fees/adminFees/SetFeesTab.tsx:64,124-140` | `getDefaultAcademicYear()` + `isCurrent \|\| status==='active'` | `year?.name` for `addForm.academicYear` and for the initial `yearFilter` |
| `students/promotions/index.tsx:44,198` | `currentAcademicYear` from the list | `year?.name` for the form; keep the `'all'` **filter** |
| the remaining `CreateExamWizard.tsx`, `EditExamDialog.tsx`, `ExamDialogs.tsx`, `wizard/Step1BasicDetails.tsx`, `PublishedResultsView.tsx`, `examinations/exams/index.tsx`, `studentMyGrades/grades-header.tsx`, `structures/AddFeeStructureDialog.tsx` | receive years/selected year as props | unchanged: their parent now supplies the URL year, so no edit is needed **unless** the file itself calls `useAcademicYears()` — check with `grep -n "useAcademicYears()" <file>` and convert those two lines only |

- [x] **Step 2: Remove the two redundant pickers**

`assessment/components/adminExams/ExamsHeader.tsx` and the year `<Select>` in `student-fees/fees/adminFees/SetFeesTab.tsx` (and `structures/AddFeeStructureDialog.tsx`, which mirrors it) now duplicate the header chip and the URL. Delete the control and its `onValueChange` wiring; where the dialog used `form.academicYear` from the select, it now reads `year?.name` from the hook and the field stays hidden — do not leave a disabled `<Select>` behind. Then grep for orphans:

```bash
cd apps/web/src/modules && grep -rn "academicYears" assessment/components/adminExams/ExamsHeader.tsx student-fees/fees/adminFees/
```
Expected: no matches, or only a `yearFilter === 'all'` comparison.

`students/promotions/index.tsx` keeps its year filter select — `promotions.routes.ts:30` explicitly supports `academicYear !== 'all'`, so "All years" is a legitimate in-screen filter while writes still use the URL year.

- [x] **Step 3: Write the failing server test for the student stamp**

Create `apps/server/src/modules/students/student-create-year.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { academicYearIsKnown } from "./student.create.guards";

describe("student create honours the requested academic year", () => {
  test("a year the tenant owns is accepted verbatim", () => {
    expect(academicYearIsKnown("2026-2027", ["2026-2027", "2025-2026"])).toBe("2026-2027");
  });
  test("a year the tenant does not own is refused rather than silently stored", () => {
    expect(() => academicYearIsKnown("1999-2000", ["2026-2027"])).toThrow(/1999-2000/);
  });
  test("no year falls back to the tenant's current one", () => {
    // The mobile app does not send the header yet; a missing value must not 400.
    expect(academicYearIsKnown(undefined, ["2025-2026", "2026-2027"], "2026-2027")).toBe("2026-2027");
  });
  test("a tenant with no years at all cannot create a student", () => {
    // Task 8 gives every new school a year; this is the pre-backfill state, and it
    // must fail loudly instead of writing the schema's literal default.
    expect(() => academicYearIsKnown(undefined, [])).toThrow(/Academic year required/);
  });
});
```

Run: `cd apps/server && bun test src/modules/students/student-create-year.test.ts` → fails, module missing.

- [x] **Step 4: Add the guard and thread the year through create**

Create `apps/server/src/modules/students/student.create.guards.ts`:

```ts
/**
 * The academic year is the partition key for a student's records, so a write
 * that guesses it is worse than a write that fails. `students.academicYear`
 * defaults to the literal `'2024-2025'` in the schema, which no school
 * necessarily owns — hence an explicit fallback to the tenant's current year.
 */
export function academicYearIsKnown(
  requested: string | undefined,
  owned: string[],
  current?: string,
): string {
  const value = requested?.trim();
  if (!value) {
    if (current && owned.includes(current)) return current;
    throw new Error(`Academic year required: this tenant has none (${owned.join(', ') || 'no years'})`);
  }
  if (!owned.includes(value)) {
    throw new Error(`Unknown academic year '${value}' for this tenant`);
  }
  return value;
}
```

In `apps/server/src/modules/students/students.routes.ts`, inside `handleCreateStudent` (the `const data = body` block, guards around line ~306-343), before the transaction:

```ts
  const ownedYears = await db.query.academicYears.findMany({
    where: eq(schema.academicYears.tenantId, tenantId),
    columns: { name: true, isCurrent: true },
  });
  const academicYear = academicYearIsKnown(
    data.academicYear,
    ownedYears.map((y) => y.name),
    ownedYears.find((y) => y.isCurrent)?.name,
  );
```
and in the insert (`const [student] = await tx.insert(schema.students).values({…})`, currently line ~358) add `academicYear,`. `StudentRouteError` is the file's own error type — wrap the guard's throw so a bad year answers `400 INVALID_ACADEMIC_YEAR` instead of a 500:

```ts
  let academicYear: string;
  try {
    academicYear = academicYearIsKnown(data.academicYear, ownedYears.map(y => y.name), ownedYears.find(y => y.isCurrent)?.name);
  } catch (err) {
    throw new StudentRouteError(400, 'INVALID_ACADEMIC_YEAR', (err as Error).message);
  }
```

- [x] **Step 5: Send the year from the web create form**

In `apps/web/src/modules/students/students/index.tsx`, add the hook beside the others and extend the payload at line ~354:

```tsx
  const { year } = useActiveAcademicYear();
  // …
          const payload: Record<string, any> = {
            name: formData.name.trim(),
            rollNumber: formData.rollNumber.trim(),
            classId: formData.classId,
            gender: formData.gender || "male",
            transportEnabled: Boolean(formData.transportEnabled),
          };
          if (isCreate && year?.name) payload.academicYear = year.name;
```

Then block the create entry point rather than relying on the server's current-year fallback. `students/index.tsx:566` is the "Add Student" opener; add:

```tsx
  disabled={!year?.name}
  title={!year?.name ? "Choose an academic session first" : undefined}
```

**Why this is worth one line:** `students.academicYear` has a schema default of `'2024-2025'` (`schema.ts:102`), and the server guard falls back to the tenant's current year when the field is absent. Either way a save still succeeds — it just lands under a year nobody chose. Disabling the opener turns that silent misfile into a visible precondition, and it stays inside a file Task 7 already commits, so `StudentDialog.tsx` is not touched.

- [x] **Step 6: Verify the four stamped writes**

`cd apps/server && bun test && bun run typecheck && bun run lint`, then `cd apps/web && bun run typecheck && bun test src/lib/__tests__/ src/modules/__tests__/`. In the browser, on `/loadtest-academy/2025-2026/academics/academic-years`, create the year `2025-2026` if it is missing, switch to it with the chip, then: create a student, create an exam, add a fee structure, create a promotion. For each, read the **request body** in the network log and confirm `academicYear` is `2025-2026` — not `2026-2027`, not the schema default. Then reload the screen and confirm the new row appears under that year and disappears under the other.

- [x] **Step 7: Commit**

```bash
git commit -m "feat(web): screens read the academic year from the URL instead of guessing it" -- \
  apps/web/src/modules/examinations/print-marksheet/index.tsx \
  apps/web/src/modules/assessment/components/StudentMarksheet.tsx \
  apps/web/src/modules/assessment/components/StudentMyGrades.tsx \
  apps/web/src/modules/assessment/components/adminExams/useExamsState.ts \
  apps/web/src/modules/assessment/components/adminExams/ExamsHeader.tsx \
  apps/web/src/modules/student-fees/fees/adminFees/SetFeesTab.tsx \
  apps/web/src/modules/student-fees/fees/adminFees/structures/AddFeeStructureDialog.tsx \
  apps/web/src/modules/students/promotions/index.tsx \
  apps/web/src/modules/students/students/index.tsx
git commit -m "feat(server): student creation is stamped with the tenant's academic year" -- \
  apps/server/src/modules/students/student.create.guards.ts \
  apps/server/src/modules/students/student-create-year.test.ts \
  apps/server/src/modules/students/students.routes.ts
git show --stat HEAD~1 HEAD
```
Any file the Step 1 table marks "unchanged" must not appear in the pathspec. `academic-years/index.tsx` is theirs — if Step 1 touched it, use the protocol.

---

### Task 8: A new school always has a year

**Files:**
- Modify: `apps/server/src/modules/support/common.resolvers.ts` (`createTenant`)
- Modify: `apps/server/src/modules/tenancy/tenants.routes.ts` (`POST /`)
- Modify: `apps/server/package.json` (one script line)
- Create: `apps/server/src/db/backfill_academic_years.ts`
- Test: `apps/server/src/db/backfill_academic_years.test.ts`

**Interfaces:**
- Consumes: `schema.academicYears`, Drizzle `db.transaction`.
- Produces: `defaultYearNames(now?: Date): { name: string; startDate: string; endDate: string }` and `ensureYearsForTenants(): Promise<{ created: number; tenants: number[] }>` — importable by the test and by the script's `main`.

- [x] **Step 1: Write the failing test for the default year**

Create `apps/server/src/db/backfill_academic_years.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { defaultYearNames } from "./backfill_academic_years";

describe("defaultYearNames", () => {
  test("an April start keeps the same academic year all calendar year", () => {
    expect(defaultYearNames(new Date("2026-09-29T00:00:00Z"))).toEqual({
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    });
  });
  test("January belongs to the year that started last April", () => {
    expect(defaultYearNames(new Date("2027-01-15T00:00:00Z"))).toEqual({
      name: "2026-2027",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
    });
  });
  test("the name format matches the seeded year and the exam fallback", () => {
    // full_seed_data.ts seeds '2026-2027'; exams.routes.ts builds `${y}-${y+1}`.
    expect(defaultYearNames().name).toMatch(/^\d{4}-\d{4}$/);
  });
});
```

Run: `cd apps/server && bun test src/db/backfill_academic_years.test.ts` → fails, module missing.

- [x] **Step 2: Write the shared default and the backfill**

Create `apps/server/src/db/backfill_academic_years.ts`:

```ts
import { and, eq, sql } from "drizzle-orm";
import { db } from "./index";            // match the import path db.seed.ts uses
import { academicYears, tenants } from "./schema";

/**
 * The academic year a school starts with. The name format is what every
 * existing row already uses (`2026-2027`), because `feeStructures`, `exams` and
 * `students` store the name as text and `fees.dueDate` is derived from it.
 */
export function defaultYearNames(now: Date = new Date()) {
  const start = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const end = start + 1;
  return {
    name: `${start}-${end}`,
    startDate: `${start}-04-01`,
    endDate: `${end}-03-31`,
  };
}

export async function ensureYearsForTenants() {
  const empty = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(sql`${tenants.id} NOT IN (SELECT ${academicYears.tenantId} FROM ${academicYears})`);

  for (const { id } of empty) {
    const { name, startDate, endDate } = defaultYearNames();
    await db.insert(academicYears).values({
      tenantId: id,
      name,
      startDate,
      endDate,
      status: "active",
      isCurrent: true,
    });
  }
  return { created: empty.length, tenants: empty.map((t) => t.id) };
}

if (import.meta.main) {
  const { created, tenants } = await ensureYearsForTenants();
  console.log(`academic-year backfill: ${created} tenant(s) given a default year`);
  console.table(tenants);
}
```
Check the seed files for the real import specifiers before writing (`grep -n "^import" apps/server/src/db/full_seed_data.ts`), and drop `and`/`eq` if the final version does not use them — `bun run lint` will tell you.

- [x] **Step 3: Run it against the local database**

Add to `apps/server/package.json` scripts: `"db:backfill:years": "bun run src/db/backfill_academic_years.ts"`. Then:

```bash
cd apps/server && bun run db:backfill:years && bun run db:backfill:years
```
Expected: the first run reports a count ≥ 0, the second reports `0 tenant(s)` — idempotent. Requires Docker Desktop running; a ~5000 ms route-resolution timeout means it is paused, not that the code broke.

- [x] **Step 4: Give a new tenant its year inside the same transaction**

`apps/server/src/modules/support/common.resolvers.ts` — `createTenant` currently does `const [tenant] = await db.insert(schema.tenants).values({…}).returning();`. Wrap that insert plus the year insert in `db.transaction`, using `defaultYearNames()` imported from `../../db/backfill_academic_years` (verify the relative path with `grep -rn "from '\.\./\.\./db" apps/server/src/modules/support/ | head -3`):

```ts
      const [tenant] = await db.transaction(async (tx) => {
        const [row] = await tx.insert(schema.tenants).values({
          ...data, name: name.trim(), slug: slug.trim(),
          startDate: new Date().toISOString().substring(0, 10),
          updatedAt: new Date(),
        }).returning();
        const { name: yearName, startDate, endDate } = defaultYearNames();
        await tx.insert(schema.academicYears).values({
          tenantId: row.id, name: yearName, startDate, endDate,
          status: 'active', isCurrent: true,
        });
        return row;
      });
```

`apps/server/src/modules/tenancy/tenants.routes.ts` `POST /` — the same shape around its `db.insert(schema.tenants).values({ name: b.name, slug: b.slug, logo: logoUrl, … })`. Keep the audit-log call after the transaction, exactly where it is now.

- [x] **Step 5: Prove a brand-new school opens straight into a year**

Through the super-admin UI, create a tenant. Then as its first admin, sign in and confirm the address bar is `/<new-slug>/<year>/dashboard` with **no** bounce through `/academic-years`, and that the chip is present. Then delete only that tenant's `AcademicYear` rows in `bun run db:studio` and re-check the admin sees the setup banner from Task 4.

- [x] **Step 6: Commit**

```bash
cd apps/server && bun run typecheck && bun run lint && bun test
git commit -m "feat(server): every new school gets a default academic year, and old ones can be backfilled" -- \
  apps/server/src/db/backfill_academic_years.ts \
  apps/server/src/db/backfill_academic_years.test.ts \
  apps/server/src/modules/support/common.resolvers.ts \
  apps/server/src/modules/tenancy/tenants.routes.ts \
  apps/server/package.json
git show --stat HEAD
```

---

### Task 9: A year with data cannot be renamed

**Files:**
- Create: `apps/server/src/modules/academics/academic.year-usage.ts`
- Modify: `apps/server/src/modules/academics/academic.resolvers.ts` (`updateAcademicYear`, line 714; plus its import block)
- Test: `apps/server/src/modules/academics/academic.year-in-use.test.ts`
- Modify: `apps/web/src/modules/academics/academic-years/index.tsx` (surface the error) — **shared file, dirty**

**Interfaces:**
- Consumes: the module-level `db` from `../../lib/db` and `schema.students` / `schema.feeStructures` / `schema.promotions` / `schema.exams` / `schema.fees`. Verified at HEAD: all five exist with those exact export names (`schema.ts:96, 314, 616, 677, 267`); the first four each carry a not-null `academicYear` **text column holding the year name**; `fees` has **no** `academicYear` column — its year lives inside `dueDate` (`schema.ts:275`).
- Produces: `yearUsageCounts(tenantId, name)` → `Record<UsageTable, number>`, and the message prefix `YEAR_IN_USE:` on the thrown error.

- [x] **Step 1: Write the failing guard test**

Create `apps/server/src/modules/academics/academic.year-in-use.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { YEAR_COLUMN_TABLES, feeDueDatePattern } from "./academic.year-usage";
import * as schema from "../../db/schema";

describe("the rename guard knows which tables partition by academic year", () => {
  test("exactly the four academicYear-column tables are covered", () => {
    // Spec §1 found the year stored as a name on students, feeStructures,
    // promotions, exams. If a fifth column appears, this test must fail loudly
    // so the guard is widened rather than quietly staying half-complete.
    expect(Object.keys(YEAR_COLUMN_TABLES).sort()).toEqual(
      ["exams", "feeStructures", "promotions", "students"],
    );
  });

  test("fees are matched by the dueDate prefix because the table has no year column", () => {
    // `${year}-04-01` is the encoding the fee screens write (spec §1).
    expect(feeDueDatePattern("2026-2027")).toBe("2026-2027-%");
    expect(schema.fees.academicYear).toBeUndefined();
  });
});
```

Neither case queries the database. Verified on this machine: `bun -e "import('./src/lib/db.ts')"` in `apps/server` resolves without a live Postgres (postgres.js connects lazily and `.env` supplies `DATABASE_URL`), so this test stays green while Docker Desktop is paused — unlike the resolvers, which need a running DB.

Run: `cd apps/server && bun test src/modules/academics/academic.year-in-use.test.ts` → fails, module missing.

- [x] **Step 2: Extract the usage probe**

Create `apps/server/src/modules/academics/academic.year-usage.ts`. Typed Drizzle, no raw SQL, no `db: any` parameter — `academic.resolvers.ts:1-3` already imports `db` and `* as schema` at module scope, and `class.service.ts:7` shows `count` is the house aggregate:

```ts
import { and, count, eq, like } from 'drizzle-orm';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';

/**
 * Renaming a year orphans every row that stores its name. `fees` is the sharp
 * edge: it has no academicYear column, the year is encoded inside each row's
 * dueDate, so a rename silently changes what an existing receipt means.
 * The guard is server-side because the edit dialog is not the only writer.
 */
export const YEAR_COLUMN_TABLES = {
  students: schema.students,
  feeStructures: schema.feeStructures,
  promotions: schema.promotions,
  exams: schema.exams,
};

export type UsageTable = keyof typeof YEAR_COLUMN_TABLES | 'fees';

/** `fees.dueDate` is `${academicYear}-04-01` (see the fee screens' payload builders). */
export const feeDueDatePattern = (name: string) => `${name}-%`;

const firstCount = (rows: { n: number }[]): number => Number(rows[0]?.n ?? 0);

export async function yearUsageCounts(tenantId: string, name: string): Promise<Record<UsageTable, number>> {
  const rows = await Promise.all([
    ...Object.values(YEAR_COLUMN_TABLES).map((table) =>
      db
        .select({ n: count() })
        .from(table)
        .where(and(eq(table.tenantId, tenantId), eq(table.academicYear, name))),
    ),
    db
      .select({ n: count() })
      .from(schema.fees)
      .where(and(eq(schema.fees.tenantId, tenantId), like(schema.fees.dueDate, feeDueDatePattern(name)))),
  ]);

  const keys = [...Object.keys(YEAR_COLUMN_TABLES), 'fees'] as UsageTable[];
  return Object.fromEntries(keys.map((key, i) => [key, firstCount(rows[i])])) as Record<UsageTable, number>;
}
```

If `typecheck` complains that Drizzle cannot infer `table.tenantId` across the union of four tables, keep the four `.map` arms but write them out as four explicit `db.select(...)` calls instead of looping — do **not** reach for `as any`.

- [x] **Step 3: Refuse the rename in `updateAcademicYear`**

`academic.resolvers.ts:714-728`. Today it is `requireModule` → `db.transaction` → `if (!year) throw new Error('Academic year not found')`. Insert the guard **between** `requireModule` and the transaction so no partial write happens and a rename of a nonexistent id still reports not-found:

```ts
    const existing = await db.query.academicYears.findFirst({
      where: and(eq(schema.academicYears.id, id), eq(schema.academicYears.tenantId, tenantId)),
    });
    if (!existing) throw new Error('Academic year not found');

    if (input.name && input.name !== existing.name) {
      const counts = await yearUsageCounts(tenantId, existing.name);
      const inUse = Object.entries(counts).filter(([, n]) => n > 0);
      if (inUse.length) {
        throw new Error(
          `YEAR_IN_USE: "${existing.name}" is in use (${inUse.map(([t, n]) => `${t}: ${n}`).join(', ')}). ` +
          `Create "${input.name}" as a new session instead of renaming.`,
        );
      }
    }
```

Verified: `GraphQLError` appears nowhere in `academic.resolvers.ts` and every failure path there throws a plain `Error`, so the code travels as a **message prefix**, not `extensions`. Add `import { yearUsageCounts } from './academic.year-usage'` beside the sibling imports at the top of the file (`./class.service`, `./subject.service`, …).

Leave the rest of the resolver alone: date/status/`isCurrent` edits still go through the transaction and only the name is blocked. `deleteAcademicYear` (line 730) is **not** touched in this plan (spec §7) — the four columns are plain text, so no FK would catch a delete, and the question is data retention, which is Spec 2's.

- [x] **Step 4: Surface it in the edit dialog**

In `apps/web/src/modules/academics/academic-years/index.tsx` (shared, dirty — protocol first), where the update mutation is awaited, show the server message inline instead of a generic toast:

```tsx
      const err = e as { message?: string };
      if (err?.message?.includes('YEAR_IN_USE')) {
        setRenameError(err.message.replace(/^.*YEAR_IN_USE:\s*/, ''));
        return;
      }
```
with `const [renameError, setRenameError] = useState<string | null>(null);`, `{renameError && <p className="text-xs text-red-600 dark:text-red-400">{renameError}</p>}` inside the dialog, and `setRenameError(null)` on open. If the file already has an error state for this dialog, reuse it rather than adding a second one — read the file first.

- [x] **Step 5: Prove both arms**

Server: `cd apps/server && bun test && bun run typecheck && bun run lint`. Browser: on the seeded school, try to rename `2026-2027` (which has students, exams, fees from `full_seed_data.ts`) → the dialog shows the count message and the row keeps its name. Change only its end date → saves. On a school with a brand-new empty year (Task 8's default, before any data), rename it → succeeds.

- [x] **Step 6: Commit**

```bash
git commit -m "feat(server): an academic year with data attached cannot be renamed" -- \
  apps/server/src/modules/academics/academic.year-usage.ts \
  apps/server/src/modules/academics/academic.year-in-use.test.ts \
  apps/server/src/modules/academics/academic.resolvers.ts \
  apps/web/src/modules/academics/academic-years/index.tsx
git show --stat HEAD
```

---

### Task 10: Whole-app verification and the honest report

**Files:** none modified (except anything a failure proves wrong).

- [x] **Step 1: Both apps green**

```bash
cd apps/web && bun run typecheck && bun test src/lib/__tests__/ src/modules/__tests__/
cd apps/server && bun run typecheck && bun run lint && bun test
```
Expected: web and server suites green, including `screen-registry.test.ts` at the working counts and the new `year-carrying-links.test.ts`.

- [x] **Step 2: Route-resolution proof on the server**

```bash
cd apps/server && bun test src/route-resolution.test.ts
```
Expected: pass — no SDL or mount moved in this plan.

- [x] **Step 3: The URL matrix, each with the network log**

For `loadtest-academy` on :3000, from a signed-in admin, and recorded as a table in the task report:

| Input URL | Expected |
|---|---|
| `/loadtest-academy` | `/<slug>/<year>/dashboard`, one hop |
| `/loadtest-academy/results-entry` (bookmark) | `/<slug>/<year>/results-entry`, one hop, Results Entry renders |
| `/loadtest-academy/academics/classes` (qualified bookmark) | `/<slug>/<year>/academics/classes`, Classes renders |
| `/loadtest-academy/2026-2027/academics/classes` | renders, no redirect |
| `/loadtest-academy/2024-2025/exams` (unknown year) | ~~`/<slug>/<year>/exams`~~ **observed `/<slug>/<year>/dashboard`** — this row contradicted spec §3 case 3; see Execution notes 1 |
| `/loadtest-academy/2026-2027` | `/<slug>/<year>/dashboard` |
| `/loadtest-academy/academic-years` | renders, chip hidden, banner only when empty |
| `/loadtest-academy/2026-2027/students?classId=C-9` | renders with the class pre-filtered |
| `/tenants` (super admin platform) | renders, no year, no redirect |

A silent 404 looks exactly like a healthy empty state, so check the response codes, not the text on screen. Also switch years with the chip on a data-bearing screen (Exams, Fees, Promotions) and confirm the list contents actually change.

- [ ] **Step 4: Staff, teacher, student and parent roles**

Sign in as one non-admin role and confirm: the year segment is present, the chip renders and switching works, and no `STAFF_FORBIDDEN_SCREENS` behaviour regressed (the staff denial still lands on `/<slug>/<year>/dashboard`).

- [x] **Step 5: Report, and name the collisions**

Write the report as: what changed, the four verification commands with their real output, the URL matrix, and — explicitly — any file that was dirty when you touched it and the surviving unstaged delta. Nothing gets claimed without its command and output.

- [ ] **Step 6: Hand to superpowers:finishing-a-development-branch**

It decides merge/PR/cleanup, and it is the only place a push could be proposed — this repo's rule is local commits only, so say so before any push is offered.

---

## Execution notes (written while executing, not planned)

Things where the code, the data, or the environment disagreed with this plan. Each is
recorded with what was actually observed so the next reader does not re-chase it.

1. **Task 10 Step 3's "unknown year" row contradicted spec §3, and the spec won.** The row
   expected `/slug/2024-2025/exams` to be repaired to `/slug/<active year>/exams`. Spec §3
   case 3 says an unrecognised segment at index 1 is parsed as the *screen*, and Task 2's own
   unit test (`module-routes` "an unrecognised segment at index 1 is a screen, not a year")
   locks that in. So `2024-2025` becomes the screen name, no `case` matches it, and the
   dispatcher's `default:` sends the user to `/<slug>/<active year>/dashboard`. Observed on
   `demo-academy`. Not a defect — a wrong expectation in this table, now annotated.
   Consequence worth knowing: after a year is renamed or deleted, deep links carrying the old
   year land on the dashboard instead of the screen they named. Task 9's rename block makes
   that much rarer, and Spec 2 can revisit repairing the tail.
2. **Only some screens are actually year-scoped for reading.** The chip switch was proven on
   Student Fees: `/demo-academy/2025-2026/fees` → 2 structures; switch to a second (empty)
   year → `0 structures found`, Total Structures ₹0, year filter auto-follows the URL; switch
   back → 2 rows again. The *Active Exams* tab is not year-filtered at all
   (`useActiveExamsData.ts:191` filters on status and search only), so Step 3's "switch on
   Exams and watch the list change" cannot pass as written; the year-scoped exam surface is
   Published Results. The Students screen reads the URL year for the **write** path only
   (`students/index.tsx:364`) — the roster list is not year-filtered.
3. **Task 9 needed the GraphQL error mask widened.** `apps/server/src/graphql/route.ts`
   replaces every thrown error with `Unexpected error.`, so a plain
   `new Error('YEAR_IN_USE: …')` never reached the browser. The allowlist is now
   `CLIENT_READABLE_CODES = { FORBIDDEN, UNAUTHENTICATED, YEAR_IN_USE }` and the resolver
   throws a `GraphQLError` with `extensions.code`. Without this the UI can only say "failed".
4. **Task 9's usage query is five hand-written arms, not a loop.** The plan assumed every
   year-bearing table has `tenantId`. `students` and `feeStructures` do not — they reach the
   school through `users` and `feeCategories` — and `fees` has no `academicYear` column at
   all, so it is matched with `like(dueDate, '<name>-%')`. Typecheck caught all three.
5. **Task 8 Step 5 was proved through the resolver, not the super-admin UI.** `createTenant`
   was run with a forged root context against the live database (tenant created, year created,
   re-run created 0). The REST `POST /tenants` path shares the same helper but is only
   typechecked — a real call needs a super-admin bearer token this session does not have.
6. **Task 4's amber "no academic year" notice is unverified.** Reaching the `notice` arm needs
   a role that lacks `academic-years` view; every account available was an admin.
7. **Task 10 Step 4 (staff/teacher/student/parent) was not run.** No non-admin credentials
   exist in the repo and the session holds only a school-admin login.
8. **`?classId=` survival was proved by clicking, not by typing.** From the Classes screen,
   "View Students" produced `/demo-academy/2025-2026/students?classId=<id>` with the class
   filter applied (Grade 1-A, 15 rows) and the chip still showing `2025-2026`.
9. **`rscNavs` (counting `_rsc` resource entries) is not a reliable hop counter** in a hidden
   tab; treat the address bar plus the emitted `Location` as the evidence.
10. **Data finding for Spec 2:** students are stamped with years no `AcademicYear` row owns —
    `demo-academy` 401 students @ `2024-2025`, `loadtest-academy` 5000 @ `2025-2026` (the old
    schema default). The URL year is now authoritative on write, so the backlog is reachable.
11. **Environment:** verification ran against the other window's `next dev` on :3000. Two
    fixture years (one for the rename probe, one for the chip-switch probe) were created and
    both deleted; `demo-academy` is verified back to exactly one year (`2025-2026`, current).

