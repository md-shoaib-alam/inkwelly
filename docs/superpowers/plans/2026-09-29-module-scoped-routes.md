# Module-scoped URLs and the two Classes screens — Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admin module screens a module segment in the URL (`/demo-academy/academics/classes`) and build a second, genuinely different Classes screen under Students.

**Architecture:** One dependency-free resolver, `src/lib/routing/module-routes.ts`, becomes the only place that reads meaning out of a path. It is injected with an `isModuleScreen` predicate derived from `adminPanelSections`, so the sidebar and the URL can never disagree. The dispatcher keeps switching on its existing ~50 bare keys through a small `componentKey` indirection, which is what keeps this a 6-file change instead of a rewrite.

**Tech Stack:** Next.js App Router (Turbopack), React with the React Compiler, Tailwind v4, Zustand (`useAppStore`), TanStack Query, lucide-react, `bun test`.

**Spec:** `docs/superpowers/specs/2026-09-29-module-scoped-routes-and-two-classes-screens-design.md` — read both. §4 of the spec was corrected during planning; the correction is load-bearing for Task 6.

## Global constraints

- **`git commit` never appears without a trailing `-- <paths>` in this repository.** A second editor is live in this working tree with files staged; a plain `git commit` commits their whole index. Three commits have already had to be undone that way. Every commit step below uses the pathspec form.
- Commits are **local only**. Never `git push`.
- Never commit a file you did not edit in the current task, and never commit the other window's files: `header.tsx`, `app-layout.tsx`, `ModulePanel.tsx`, `ModuleRail.tsx`, `module-sidebar.tsx`, `module-nav-config.tsx`, `adminDashboard/{index,FavoritesStrip,ModuleGrid}.tsx`. Several are currently staged or dirty; see "Collision plan" below.
- Unbuilt means a disabled "Soon" row. **Never render a value the database cannot return.** No `medium`, `vocational`, `status` or completion percentage may appear.
- Test runner is `bun test` from `apps/web`. Typecheck is `bun run typecheck`.
- Do not add a route folder. `[slug]/[screen]/[detail]` already matches every URL this feature produces.

## Collision plan (read before Task 2)

Four of the files this plan edits are files the other window also edits. The rule is the same one used all session: **re-read the file immediately before each Edit** (anchors go stale between read and write), and **commit by pathspec only files whose whole diff is yours**. Where a file is shared, run `git diff -- <file>` first and stop if a hunk is not yours — report the collision rather than resolving it quietly.

| File | Risk |
|---|---|
| `app-layout.tsx` | staged by the other window. Highest risk. Task 2 touches two functions in it. |
| `ModulePanel.tsx` | `MM` — staged and further modified. Task 3 touches two lines. |
| `module-sidebar.tsx` | staged. Task 3 touches one line. |
| `module-nav-config.tsx` | modified. Tasks 3 and 5 touch helpers and the students panel. |
| `tenant-screen-dispatcher.tsx` | modified. Tasks 2 and 5. |
| `moduleCatalogue.ts`, `module-routes.ts`, `ClassRoster.tsx`, tests | quiet — safe to take whole. |

## File structure

| Path | Responsibility |
|---|---|
| Create `src/lib/routing/module-routes.ts` | The routing contract only: parse a path, build a key, map to a component key. No React, no imports from the app. |
| Create `src/lib/__tests__/module-routes.test.ts` | Every rule above, table-driven. |
| Create `src/modules/academics/components/ClassRoster.tsx` | The Students → Classes read-only roster. |
| Modify `src/components/layout/app-layout.tsx` | Delegate `resolveScreenFromPathname` to `parseRoute`. |
| Modify `src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` | Switch on `componentKey`; add the roster case. |
| Modify `src/components/layout/sidebar/module-nav-config.tsx` | Qualify `getDefaultScreen`/`findModuleForScreen`; add the Students Classes row. |
| Modify `src/components/layout/sidebar/ModulePanel.tsx` | Compare and emit qualified keys. |
| Modify `src/components/layout/sidebar/module-sidebar.tsx` | Pass the qualified key through. |
| Modify `src/modules/__tests__/{module-nav,screen-registry}.test.ts` | Counts and qualified expectations. |

---

### Task 1: The routing contract

Pure module plus tests. Nothing imports it yet, so the app's behaviour cannot change — this task is safe to land alone.

**Files:**
- Create: `apps/web/src/lib/routing/module-routes.ts`
- Test: `apps/web/src/lib/__tests__/module-routes.test.ts`

**Interfaces:**
- Produces:
  - `type RouteParts = { module: string | null; screen: string }`
  - `type RouteContext = { isModuleScreen: (module: string, screen: string) => boolean; isTenantRoot: (first: string) => boolean }`
  - `parseRoute(pathname: string, ctx: RouteContext): RouteParts`
  - `qualifiedKey(module: string, screen: string): string`
  - `splitKey(key: string): { module: string | null; screen: string }`
  - `COMPONENT_OVERRIDES: Record<string, string>`
  - `componentKey(module: string | null, screen: string): string`
  - `canonicalOwner(screen: string, owners: Record<string, string>, moduleIds: Set<string>): string | null`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/__tests__/module-routes.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import {
  canonicalOwner,
  componentKey,
  parseRoute,
  qualifiedKey,
  splitKey,
  type RouteContext,
} from "@/lib/routing/module-routes";

// A panel shaped like the real one: `students` owns a `classes` sub-link, and
// `academics` owns `classes` and `academic-years`. `detail` is deliberately absent.
const PANEL: Record<string, string[]> = {
  academics: ["classes", "academic-years"],
  students: ["students", "classes"],
  "student-fees": ["classes", "fees"],
};

const ctx: RouteContext = {
  isModuleScreen: (module, screen) => PANEL[module]?.includes(screen) ?? false,
  isTenantRoot: (first) => first === "demo-academy",
};

const p = (pathname: string) => parseRoute(pathname, ctx);

describe("parseRoute", () => {
  test("a bare tenant root is the dashboard", () => {
    expect(p("/demo-academy")).toEqual({ module: null, screen: "dashboard" });
  });

  test("one segment after the tenant is a bare screen", () => {
    expect(p("/demo-academy/school-settings")).toEqual({
      module: null,
      screen: "school-settings",
    });
  });

  test("module + screen when the pair is a declared sub-link", () => {
    expect(p("/demo-academy/academics/classes")).toEqual({
      module: "academics",
      screen: "classes",
    });
  });

  test("three segments that are NOT a declared sub-link stay a bare screen", () => {
    // `/students/STU-123` is the legacy screen/detail shape and must keep working.
    expect(p("/demo-academy/students/STU-123")).toEqual({
      module: null,
      screen: "students",
    });
  });

  test("the same screen name under two modules resolves to two different routes", () => {
    expect(p("/demo-academy/academics/classes").module).toBe("academics");
    expect(p("/demo-academy/students/classes").module).toBe("students");
  });

  test("an unknown module falls back to today's behaviour", () => {
    expect(p("/demo-academy/not-a-module/classes")).toEqual({
      module: null,
      screen: "not-a-module",
    });
  });
});

describe("key helpers", () => {
  test("qualifiedKey and splitKey round-trip", () => {
    expect(splitKey(qualifiedKey("academics", "classes"))).toEqual({ module: "academics", screen: "classes" });
    expect(splitKey(qualifiedKey("student-fees", "classes"))).toEqual({ module: "student-fees", screen: "classes" });
    expect(splitKey("dashboard")).toEqual({ module: null, screen: "dashboard" });
  });

  test("componentKey maps only the declared pairs and otherwise passes through", () => {
    expect(componentKey("academics", "classes")).toBe("classes");
    expect(componentKey("student-fees", "classes")).toBe("classes");
    expect(componentKey("students", "classes")).toBe("class-roster");
    expect(componentKey(null, "classes")).toBe("classes");
    expect(componentKey(null, "dashboard")).toBe("dashboard");
  });
});

describe("canonicalOwner", () => {
  const owners = { classes: "academics", fees: "student-fees" };
  const moduleIds = new Set(["academics", "students", "student-fees"]);

  test("a bare screen owned by a module canonicalises to it", () => {
    expect(canonicalOwner("classes", owners, moduleIds)).toBe("academics");
  });

  test("a bare screen that is also a module id is never rewritten", () => {
    // `/demo-academy/students` means All Students, not the students module root.
    expect(canonicalOwner("students", owners, moduleIds)).toBeNull();
  });

  test("an unowned screen is left alone", () => {
    expect(canonicalOwner("dashboard", owners, moduleIds)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && bun test src/lib/__tests__/module-routes.test.ts`
Expected: `Cannot find module '@/lib/routing/module-routes'` — a resolution error, not an assertion failure.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/routing/module-routes.ts`:

```ts
/**
 * The whole routing contract for admin module screens.
 *
 * A screen key is either bare (`dashboard`) or module-qualified
 * (`academics/classes`). Qualified keys are how admin module screens are
 * addressed; bare keys keep working for every other role and for existing
 * bookmarks.
 *
 * This file deliberately imports nothing from the app. The sidebar and the
 * dispatcher both consult it, so keeping it pure is what stops the two from
 * disagreeing about which screen is open — `adminPanelSections` is passed in as
 * a predicate rather than imported, which is also what avoids a cycle through
 * `module-nav-config`.
 */

export type RouteParts = { module: string | null; screen: string };

export type RouteContext = {
  /** True when `screen` is a declared sub-link of module `module`. */
  isModuleScreen: (module: string, screen: string) => boolean;
  /** True when a single leading path segment names the tenant rather than a screen. */
  isTenantRoot: (first: string) => boolean;
};

export function qualifiedKey(module: string, screen: string): string {
  return `${module}/${screen}`;
}

export function splitKey(key: string): { module: string | null; screen: string } {
  const slash = key.indexOf("/");
  if (slash === -1) return { module: null, screen: key };
  return { module: key.slice(0, slash), screen: key.slice(slash + 1) };
}

/**
 * `/demo-academy/academics/classes` and `/demo-academy/students/STU-123` are both
 * three segments. `isModuleScreen` is what tells a module-scoped screen apart from
 * the legacy screen-with-detail shape, so an unknown second segment keeps the
 * behaviour it has always had.
 */
export function parseRoute(pathname: string, ctx: RouteContext): RouteParts {
  const parts = pathname.split("/").filter(Boolean);

  if (parts.length === 0) return { module: null, screen: "dashboard" };
  if (parts.length === 1) {
    return ctx.isTenantRoot(parts[0])
      ? { module: null, screen: "dashboard" }
      : { module: null, screen: parts[0] };
  }

  const [, first, second] = parts;
  if (second && ctx.isModuleScreen(first, second)) {
    return { module: first, screen: second };
  }
  return { module: null, screen: first };
}

/**
 * Most qualified keys share a body with their bare form, so the dispatcher keeps
 * switching on the same bare keys it always has and only genuinely different
 * screens get a new one. Retargeting all ~50 admin cases to qualified strings
 * would be a large, risky diff for no behavioural gain.
 */
export const COMPONENT_OVERRIDES: Record<string, string> = {
  "students/classes": "class-roster",
};

export function componentKey(module: string | null, screen: string): string {
  if (!module) return screen;
  return COMPONENT_OVERRIDES[qualifiedKey(module, screen)] ?? screen;
}

/**
 * A bookmarked bare key is rewritten to its canonical module so the address bar
 * converges. A key that is also a module id is never rewritten: `/demo-academy/students`
 * means the All Students screen, and silently sending it to a module root would
 * make an existing URL mean something else.
 */
export function canonicalOwner(
  screen: string,
  owners: Record<string, string>,
  moduleIds: Set<string>,
): string | null {
  if (moduleIds.has(screen)) return null;
  return owners[screen] ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && bun test src/lib/__tests__/module-routes.test.ts`
Expected: PASS, 12 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
cd apps/web && git commit -m "feat(web): add the module-route contract that scopes admin screens

A screen key becomes either bare or module-qualified, and one pure function reads
a path into that shape. Nothing imports it yet, so behaviour cannot change.

The contract takes isModuleScreen as an injected predicate instead of importing
adminPanelSections: that is what keeps module-nav-config and this file from
forming a cycle, and it is why the sidebar and the dispatcher can no longer
disagree about which screen is open." -- src/lib/routing/module-routes.ts src/lib/__tests__/module-routes.test.ts
```

Expected: `2 files changed`. If the stat names any other file, run `git reset --soft HEAD~1` and redo the commit with the pathspec.

---

### Task 2: Make the app read module-scoped URLs

Wires the contract into the two places that interpret a path. **Behaviour-preserving**: every URL that works today keeps working identically, and the new shape starts resolving correctly. That is what makes this a safe place to commit.

**Files:**
- Modify: `apps/web/src/components/layout/app-layout.tsx:59-73` (`isTenantRootPath`, `resolveScreenFromPathname`)
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (param read + admin switch)
- Test: `apps/web/src/modules/__tests__/screen-registry.test.ts` (unchanged counts, run as a guard)

**Interfaces:**
- Consumes: `parseRoute`, `componentKey`, `qualifiedKey` from Task 1.
- Produces: `resolveScreenFromPathname(pathname, currentUser, currentTenantSlug)` still returns a string, but for admin module screens it is now qualified. The dispatcher's admin branch switches on `componentKey(...)`.

- [ ] **Step 1: Re-read the shared file and confirm the diff is yours**

```bash
cd apps/web && git diff --stat -- src/components/layout/app-layout.tsx
```
If it is non-empty with hunks you did not write, **stop and report the collision** before editing. Otherwise note the current line numbers:

```bash
cd apps/web && grep -n "function resolveScreenFromPathname\|function isTenantRootPath" src/components/layout/app-layout.tsx
```

- [ ] **Step 2: Replace the resolver**

In `app-layout.tsx`, replace the existing `isTenantRootPath` + `resolveScreenFromPathname` pair with:

```ts
function tenantRootPredicate(currentUser: any, currentTenantSlug: string | null) {
  return (first: string) =>
    first === currentUser?.tenantId ||
    first === currentTenantSlug ||
    first === currentUser?.tenantSlug;
}

// Delegates to the shared contract so the sidebar's active row and the
// dispatcher's switch cannot drift apart on what a path means.
function resolveScreenFromPathname(
  pathname: string,
  currentUser: any,
  currentTenantSlug: string | null
): string {
  const { module, screen } = parseRoute(pathname, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: tenantRootPredicate(currentUser, currentTenantSlug),
  });
  return module ? qualifiedKey(module, screen) : screen;
}
```

`isTenantRootPath` had one other caller — check before deleting it:

```bash
cd apps/web && grep -n "isTenantRootPath" src/components/layout/app-layout.tsx
```
If only the resolver used it, delete the function. If something else did, leave it in place and note it in the commit message.

- [ ] **Step 3: Add the panel predicate to `module-nav-config.tsx`**

The predicate belongs next to the data it reads, so `adminPanelSections` stays the single source of truth:

```tsx
/**
 * True when `screen` is a declared sub-link of admin module `module`. This is what
 * tells `/demo-academy/academics/classes` (a module-scoped screen) apart from
 * `/demo-academy/students/STU-123` (a screen with a detail param) — both are three
 * segments, and nothing but this index can tell them apart.
 */
export function isAdminModuleScreen(module: string, screen: string): boolean {
  return adminPanelSections[module]?.some((s) => s.items.some((i) => i.key === screen)) ?? false;
}
```

Add `isAdminModuleScreen, qualifiedKey` to the existing import list in `app-layout.tsx`, and:

```ts
import { componentKey, parseRoute } from "@/lib/routing/module-routes";
```

- [ ] **Step 4: Make the dispatcher use the contract — and close the hole that creates**

In `tenant-screen-dispatcher.tsx`, the switch at `:182` is **shared by super_admin,
admin and staff** — it is not an admin-only branch. Read the region before editing:

```bash
cd apps/web && sed -n '165,185p' "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
```

That matters, because the staff permission guard above it currently tests the raw
`screen` param. Once module-scoped URLs exist, a staff user who types
`/demo-academy/academics/classes` gets `screen === "academics"`, which is in
neither `STAFF_FORBIDDEN_SCREENS` nor `STAFF_SCREEN_MODULES` — so the guard checks
the wrong word, passes, and the switch then resolves `componentKey` to `classes`
and renders the admin class editor. **A privilege escalation reachable by typing a
URL.** The fix is to resolve the key first and guard on the resolved key:

```tsx
  const { slug, screen, detail } = useParams();
  // A module-scoped admin URL arrives as screen=module, detail=screen.
  const route = parseRoute(`/${slug}/${screen}${detail ? `/${detail}` : ""}`, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: (first) =>
      first === currentUser?.tenantId ||
      first === currentTenantSlug ||
      first === currentUser?.tenantSlug,
  });
  const screenKey = componentKey(route.module, route.screen);
```

Then change **both** the staff guard and the switch to use `screenKey`:

```tsx
      const denied =
        STAFF_FORBIDDEN_SCREENS.has(screenKey) ||
        (STAFF_SCREEN_MODULES[screenKey] !== undefined &&
          !hasPermission(currentUser, STAFF_SCREEN_MODULES[screenKey], 'view'));

      if (denied) {
        const tid = currentUser.tenantSlug || currentUser.tenantId || slug;
        redirect(`/${tid}/dashboard`);
      }
    }

    switch (screenKey) {
```

For every bare path `componentKey(null, screen) === screen`, so staff, teacher and
student behaviour is bit-for-bit unchanged; only a qualified URL resolves to
something the guard now sees correctly.

Every other `redirect()` in the file targets `dashboard`, which is not a sub-link
of any module, so leave them as `/${tid}/dashboard`. Do **not** build a
module-prefixed dashboard URL — there is no such route, and a defensive ternary
that can only take one branch is dead code.

- [ ] **Step 4b: Prove the escalation is closed**

Append to `apps/web/src/lib/__tests__/module-routes.test.ts`:

```ts
// The dispatcher's staff guard must run on the resolved key. These two cases are
// the whole reason: a staff user typing a module-scoped URL must not slip past a
// guard that was only ever shown the bare half.
test("a module-scoped URL resolves to the same component key as the bare screen", () => {
  expect(componentKey("academics", "classes")).toBe(componentKey(null, "classes"));
});

test("a qualified key never leaks its module name as the screen", () => {
  expect(componentKey("academics", "classes")).not.toBe("academics");
});
```

Run: `cd apps/web && bun test src/lib/__tests__/module-routes.test.ts`
Expected: PASS — and the point of adding them here is that they document *why* the
guard reads `screenKey`, so a later reader cannot "simplify" it back to `screen`.

- [ ] **Step 4c: Pin the convention with a source guard**

A comment outlives nobody. `screen-registry.test.ts` already reads the dispatcher
source, so append there:

```ts
// The staff permission guard and the screen switch must both read the resolved
// key. Reading the raw `screen` param was a privilege escalation once URLs became
// module-scoped: /slug/academics/classes puts "academics" in `screen`, which is in
// neither STAFF_FORBIDDEN_SCREENS nor STAFF_SCREEN_MODULES, so the guard checked
// the wrong word and passed. If you are about to undo this, undo the module-scoped
// URLs instead — or add /slug/academics/classes as a staff user and watch it render
// the admin class editor.
test("the dispatcher guards and switches on the resolved key, not the raw param", () => {
  const src = readFileSync(
    join(APP_ROOT, "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"),
    "utf8",
  );
  expect(src).toMatch(/STAFF_FORBIDDEN_SCREENS\.has\(screenKey\)/);
  expect(src).toMatch(/STAFF_SCREEN_MODULES\[screenKey\]/);
  expect(src).toMatch(/switch \(screenKey\) \{/);
  expect(src).not.toMatch(/STAFF_FORBIDDEN_SCREENS\.has\(screen\)/);
});
```

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts`
Expected: PASS after Step 4, FAIL before it. Confirm it fails first — a guard that
never failed proves nothing.

- [ ] **Step 5: Run the guard tests**

```bash
cd apps/web && bun test src/modules/__tests__/
```
Expected: PASS. `screen-registry.test.ts` counts must be **unchanged** by this task — no `case` was added or removed. If a count moved, you edited the switch statement's cases rather than its subject; revert and redo step 4.

- [ ] **Step 6: Typecheck**

```bash
cd apps/web && bun run typecheck
```
Expected: no new errors. A `HeaderProps` mismatch in `app-layout.tsx` is the other window's in-flight save — re-run once before investigating.

- [ ] **Step 7: Verify by hand that nothing regressed**

With the dev server already running on :3000 (do not start a second `next dev` — two of them on one tree kill each other, and a restart logs the admin out):

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/demo-academy/classes"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/demo-academy/academics/classes"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/demo-academy/students"
```
Expected: `200` for all three. **This proves compilation only.** `dynamic()` means the served HTML is a pre-hydration shell, so a 200 does not prove the right screen rendered — say so in the report, do not claim the UI works.

- [ ] **Step 8: Commit**

```bash
cd apps/web && git commit -m "feat(web): resolve module-scoped admin URLs through the shared contract

Both the layout and the dispatcher used to interpret the path themselves, which is
how they could disagree about which screen is open. They now call parseRoute, and
the admin switch moves to componentKey so its ~50 existing cases stay as written.

Behaviour-preserving: every URL that resolved before resolves the same way, and
/students/STU-123 is still a screen with a detail param because isModuleScreen
says so." -- src/components/layout/app-layout.tsx "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx" src/components/layout/sidebar/module-nav-config.tsx
```

- [ ] **Step 9: Confirm the commit is clean**

```bash
cd D:/per/inkwelly && git show --stat HEAD
```
Expected: exactly the three named files. Report any surviving unstaged delta on them — a pathspec commit overwrites the index entry for each named path, which can demote the other window's staged version of that file.

---

### Task 3: Make the sidebar emit qualified keys

After this task, clicking Academics → Classes puts `/demo-academy/academics/classes` in the address bar, which is the visible half of the request.

**Files:**
- Modify: `apps/web/src/components/layout/sidebar/module-nav-config.tsx` (`findModuleForScreen`, `getDefaultScreen`)
- Modify: `apps/web/src/components/layout/sidebar/ModulePanel.tsx` (two lines)
- Modify: `apps/web/src/components/layout/sidebar/module-sidebar.tsx` (one line)
- Modify: `apps/web/src/modules/__tests__/module-nav.test.ts`

**Interfaces:**
- Consumes: `qualifiedKey`, `splitKey` from Task 1; `parseRoute` behaviour from Task 2.
- Produces: `getDefaultScreen(module)` returns a **qualified** key for panel rows; `findModuleForScreen(items, key)` accepts either form.

- [ ] **Step 1: Update the guard test first, so it fails**

In `module-nav.test.ts`, the two tests that compare against `routable` (a set of bare `case` strings) must now qualify. Replace the "every rail module opens on a screen that routes" and "every contextual sub-link routes" tests with:

```ts
  test("every rail module opens on a screen that routes", () => {
    // getDefaultScreen now returns a qualified key, which is what the sidebar
    // pushes; the dispatcher is reached through componentKey.
    const dead = rail
      .map((m) => ({ key: m.key, screen: getDefaultScreen(m) }))
      .filter((m) => !routable.has(componentKeyOf(m.screen)))
      .map((m) => `${m.key} -> ${m.screen}`);
    expect(dead).toEqual([]);
  });

  test("every contextual sub-link routes", () => {
    // A `disabled` entry is a deliberate placeholder for shipped-but-unbuilt
    // screens, so it is labelled "Soon" and never navigates.
    const dead = rail.flatMap((m) =>
      m.sections
        .flatMap((s) => s.items)
        .filter((i) => !i.disabled && !routable.has(componentKeyOf(`${m.key}/${i.key}`)))
        .map((i) => `${m.key} / ${i.key}`),
    );
    expect(dead).toEqual([]);
  });
```

Add to the imports at the top of the file:

```ts
import { componentKey } from "@/lib/routing/module-routes";

const componentKeyOf = (key: string) => {
  const slash = key.indexOf("/");
  return slash === -1 ? componentKey(null, key) : componentKey(key.slice(0, slash), key.slice(slash + 1));
};
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/web && bun test src/modules/__tests__/module-nav.test.ts
```
Expected: FAIL — `getDefaultScreen` still returns bare keys, so `componentKeyOf` receives e.g. `"classes"` where the test now expects `"academics/classes"`, and the panel test reports dead links for rows whose bare key is not in the registry.

- [ ] **Step 3: Qualify the two helpers**

In `module-nav-config.tsx`:

```tsx
export function findModuleForScreen(
  items: ModuleNavItem[],
  screen: string
): ModuleNavItem | undefined {
  // Accepts a qualified or a bare key: the URL can arrive either way, and a
  // bookmarked bare key must still highlight the row that owns it.
  const { module, screen: bare } = splitKey(screen);
  return items.find((m) =>
    (module ? m.key === module : true) &&
    m.sections.some((s) => s.items.some((i) => i.key === bare))
  );
}

export function getDefaultScreen(item: ModuleNavItem): string {
  const firstLive = item.sections.flatMap((s) => s.items).find((i) => !i.disabled);
  const screen = item.defaultScreen ?? firstLive?.key ?? item.key;
  // A module's own root screen (`students` for the students module) stays bare;
  // only a sub-link qualifies.
  return screen === item.key ? screen : qualifiedKey(item.key, screen);
}
```

Add `import { qualifiedKey, splitKey } from "@/lib/routing/module-routes";`.

- [ ] **Step 4: Qualify the panel rows**

In `ModulePanel.tsx`, re-read the file first, then change exactly two lines:

```tsx
                const isActive = resolvedScreen === qualifiedKey(module.key, entry.key);
```

```tsx
                    onClick={() => onNavigate(qualifiedKey(module.key, entry.key))}
```

Add `import { qualifiedKey } from "@/lib/routing/module-routes";`.

- [ ] **Step 5: Confirm the module sidebar needs no change**

`module-sidebar.tsx` passes whatever it is handed straight to `navigateTo`, and `navigateTo` builds `/${tenant}/${screen}` — a qualified key contains the slash, so the URL comes out right with no edit. Verify rather than assume:

```bash
cd apps/web && grep -n "navigateTo(" src/components/layout/sidebar/module-sidebar.tsx
```
Expected: two call sites, both forwarding a key unchanged. If either transforms the key, qualify it there instead.

- [ ] **Step 6: Run the whole web suite and typecheck**

```bash
cd apps/web && bun test && bun run typecheck
```
Expected: PASS. If `module-catalogue.test.ts` fails on the launcher's bare `card.screen`, that is correct and expected — the launcher still emits bare keys and Task 4 handles it. Do not "fix" it by qualifying the catalogue.

- [ ] **Step 7: Commit**

```bash
cd apps/web && git commit -m "feat(web): emit module-qualified keys from the admin sidebar

Clicking a panel row now puts /academics/classes in the address bar. Qualification
is derived from the module the row is already rendered under, so no nav entry needed
a hand-written edit and the sidebar cannot fall out of step with the panel index.

A module's own root screen stays bare on purpose: /demo-academy/students means All
Students, and rewriting it to a module root would change what an existing URL means." -- src/components/layout/sidebar/module-nav-config.tsx src/components/layout/sidebar/ModulePanel.tsx src/modules/__tests__/module-nav.test.ts
```

---

### Task 4: Land legacy bookmarks on the qualified URL

**Files:**
- Modify: `apps/web/src/components/layout/app-layout.tsx`
- Modify: `apps/web/src/components/layout/sidebar/module-nav-config.tsx` (add the derived index)
- Test: `apps/web/src/lib/__tests__/module-routes.test.ts` (extend)

**Interfaces:**
- Consumes: `canonicalOwner` from Task 1; `adminPanelSections` and `buildAdminRail`, both already in `module-nav-config`.
- Produces: `screenOwners: Record<string, string>` and `moduleIds: Set<string>` exported from `module-nav-config`, and a `router.replace` in the layout that converges a bare bookmark onto its module-scoped URL.

**Why the index lives in `module-nav-config` and not in `lib/routing`:** a `lib` module importing from `components/layout/sidebar` is architecturally backwards, and it would make `module-owners → module-nav-config → module-routes` a chain that only happens not to be a cycle. `module-nav-config` already owns both inputs, so it owns the derived index.

- [ ] **Step 1: Write the failing test for the owner index**

Append to `module-routes.test.ts`:

```ts
describe("screenOwners index", () => {
  test("classes is owned by academics, the first module in rail order that declares it", () => {
    // This is the assertion that protects a bookmark. If rail order changes and
    // /demo-academy/classes starts meaning something else, this test fails loudly
    // instead of silently re-pointing every saved link.
    expect(screenOwners.classes).toBe("academics");
  });

  test("a screen declared by exactly one module maps to that module", () => {
    expect(screenOwners["academic-years"]).toBe("academics");
  });

  test("no owner entry is also a module id", () => {
    // canonicalOwner refuses to rewrite these, so declaring one would be dead config.
    const collision = Object.keys(screenOwners).filter((k) => moduleIds.has(k));
    expect(collision).toEqual([]);
  });
});
```

Import at the top: `import { moduleIds, screenOwners } from "@/components/layout/sidebar/module-nav-config";`

- [ ] **Step 2: Run it to verify it fails**

```bash
cd apps/web && bun test src/lib/__tests__/module-routes.test.ts
```
Expected: FAIL — `screenOwners` is not exported from `module-nav-config`, so the import resolves to `undefined` and the first assertion throws on reading a property of undefined.

- [ ] **Step 3: Build the index from the panel, not by hand**

Append to `apps/web/src/components/layout/sidebar/module-nav-config.tsx`, after `buildAdminRail`:

```tsx
/**
 * Derived, never authored: a second list of screen -> module mappings is exactly
 * the thing that would let the sidebar and the URL disagree. The first module in
 * rail order that declares a screen owns its canonical bare form.
 */
export const moduleIds: Set<string> = new Set(buildAdminRail().map((m) => m.key));

export const screenOwners: Record<string, string> = (() => {
  const owners: Record<string, string> = {};
  for (const moduleKey of moduleIds) {
    for (const section of adminPanelSections[moduleKey] ?? []) {
      for (const item of section.items) {
        if (!(item.key in owners)) owners[item.key] = moduleKey;
      }
    }
  }
  return owners;
})();
```

Note `for (const moduleKey of moduleIds)` iterates a `Set` in insertion order, which is rail order — that is what makes "first module that declares it wins" deterministic.

- [ ] **Step 4: Run the test and fix the collision it finds**

```bash
cd apps/web && bun test src/lib/__tests__/module-routes.test.ts
```
Expected: the third test **fails on the first run**, because `students` is both a module id and an `All Students` row key inside the students panel. That is the collision the guard exists to catch. Resolve it by skipping module-id keys while building the index — a screen that shares its module's name is reached bare, so it has no canonical qualified form to rewrite to:

```ts
        if (!(item.key in owners) && item.key !== moduleKey) owners[item.key] = moduleKey;
```

Re-run. Expected: PASS, all tests.

- [ ] **Step 5: Converge the address bar**

In `app-layout.tsx`, inside the effect that already syncs the store from the URL, add the rewrite. Re-read the file first:

```ts
  // A bookmarked bare key is replaced, not redirected, so the client store is
  // never thrown away by a server-side 308.
  useEffect(() => {
    if (!isAdmin) return;
    if (resolvedScreen.includes("/")) return;
    const owner = canonicalOwner(resolvedScreen, screenOwners, moduleIds);
    if (!owner) return;
    const tenant = currentTenantSlug || currentTenantId;
    if (tenant) replace(`/${tenant}/${qualifiedKey(owner, resolvedScreen)}`);
  }, [isAdmin, resolvedScreen, currentTenantSlug, currentTenantId, replace]);
```

`replace` comes from the `useRouter()` already destructured in the component — add it to that destructure.

- [ ] **Step 6: Run the suite and typecheck**

```bash
cd apps/web && bun test && bun run typecheck
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd apps/web && git commit -m "feat(web): converge bookmarked bare screens onto the qualified URL

The owner index is derived from adminPanelSections in rail order, because a
hand-written second mapping is exactly what would let the sidebar and the URL
disagree. A screen whose key equals its own module id is excluded: /students means
All Students and must stay that way.

router.replace rather than a redirect, so the client store survives." -- src/components/layout/sidebar/module-nav-config.tsx src/lib/__tests__/module-routes.test.ts src/components/layout/app-layout.tsx
```

---

### Task 5: The Students → Classes roster

The second screen. It is a different question from the structure editor: *how full is each class*, not *edit this class*.

**Files:**
- Create: `apps/web/src/modules/academics/components/ClassRoster.tsx`
- Modify: `apps/web/src/components/layout/sidebar/module-nav-config.tsx` (students panel)
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (one case + one import)
- Modify: `apps/web/src/modules/__tests__/screen-registry.test.ts` (counts)
- Test: `apps/web/src/modules/__tests__/class-roster.test.ts`

**Interfaces:**
- Consumes: `useClassesInfinite(tenantId, { limit })` from `@/lib/graphql/hooks` (`academic.hooks.ts:39`) — it already wraps `useInfiniteQuery` over the `CLASSES` document with `queryKey: [...queryKeys.classes, 'infinite', tenantId, filters]`, so it rides the same cache prefix that `triggerGlobalRefresh()` clears on every class write. `ClassInfo` from `@/lib/types`.
- Produces: component `ClassRoster`, dispatcher key `class-roster`, nav key `students/classes`.

- [ ] **Step 1: Write the failing test for the honest-data rule**

Create `apps/web/src/modules/__tests__/class-roster.test.ts`. This is a source-text guard, the same style the repo already uses, because the thing worth protecting is what the screen does **not** show:

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(import.meta.dir, "..", "academics", "components", "ClassRoster.tsx");
const source = () => readFileSync(SRC, "utf8");

// The reference app shows Medium, Vocational and Status per class. None of those
// columns exists on `Class`, so a value rendered there would be invented. This
// guard is what stops a later restyle pass from "helpfully" filling them in.
test("the roster renders no column the schema cannot return", () => {
  const s = source();
  for (const fabricated of ["vocational", "medium", "completion"]) {
    expect(s.toLowerCase()).not.toContain(fabricated);
  }
});

test("the roster labels its bar as capacity, not completion", () => {
  expect(source()).toContain("Capacity fill");
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd apps/web && bun test src/modules/__tests__/class-roster.test.ts
```
Expected: FAIL — `ENOENT ... ClassRoster.tsx`.

- [ ] **Step 3: Write the component**

Create `apps/web/src/modules/academics/components/ClassRoster.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Settings, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/use-app-store";
import { useClassesInfinite } from "@/lib/graphql/hooks";
import type { ClassInfo } from "@/lib/types";
import { qualifiedKey } from "@/lib/routing/module-routes";
import { cn } from "@/lib/utils";

const PAGE = 100;

/**
 * Students -> Classes: how full is each class. The Academics screen with the same
 * name edits these rows; this one only reads them, which is why it is a separate
 * component rather than a mode flag on that one.
 */
export function ClassRoster() {
  const { slug } = useParams();
  const { push } = useRouter();
  const { currentTenantId } = useAppStore();
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [section, setSection] = useState("all");

  // Paged to completion rather than summed over one page: an aggregate over a
  // truncated list would print a wrong total with a straight face.
  const { data, isLoading } = useClassesInfinite(currentTenantId || undefined, { limit: PAGE });

  const classes = useMemo(
    () => (data?.pages.flatMap((p) => p.classes) ?? []) as ClassInfo[],
    [data],
  );

  const grades = useMemo(() => [...new Set(classes.map((c) => c.grade))].sort(), [classes]);
  const sections = useMemo(() => [...new Set(classes.map((c) => c.section))].sort(), [classes]);

  const visible = useMemo(
    () =>
      classes.filter(
        (c) =>
          (grade === "all" || c.grade === grade) &&
          (section === "all" || c.section === section) &&
          (!search || `${c.name} ${c.grade} ${c.section}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [classes, grade, section, search],
  );

  const enrolled = classes.reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
  const average = classes.length ? Math.round(enrolled / classes.length) : 0;

  if (isLoading || (!currentTenantId && classes.length === 0)) return <ClassRosterSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[16px] leading-6 font-semibold text-slate-900 dark:text-zinc-50">Classes</h1>
          <p className="text-[13px] text-slate-500 dark:text-zinc-400">
            {classes.length} classes · {enrolled} students · avg {average} per class
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => push(`/${slug}/${qualifiedKey("academics", "classes")}`)}
        >
          <Settings className="size-4" /> Manage
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes..."
            className="pl-9"
          />
        </div>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All grades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All sections" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Section</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Enrolled</th>
                <th className="px-4 py-3 font-medium">Capacity fill</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => {
                const fill = c.capacity > 0 ? Math.round((c.studentCount / c.capacity) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-zinc-100">
                      {c.name} - {c.section}
                    </td>
                    <td className="px-4 py-3">{c.grade}</td>
                    <td className="px-4 py-3">{c.section}</td>
                    <td className="px-4 py-3">{c.classTeacher || "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5 text-slate-400" />{c.studentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              fill >= 100 ? "bg-rose-500" : fill >= 80 ? "bg-amber-500" : "bg-emerald-500",
                            )}
                            style={{ width: `${Math.min(fill, 100)}%` }}
                          />
                        </div>
                        <span className="text-[12px] tabular-nums text-slate-500 dark:text-zinc-400">{fill}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-zinc-400">
                    No classes match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ClassRosterSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
```

Notes the implementer needs:
- **No per-row chevron.** The reference drills into a class; `All Students` has no class filter in this copy, so a drill-in would land on an unfiltered list and read as a bug. `STUDENTS` in `queries.ts:171` already accepts `classId`, so the data half exists — wiring it is a separate slice. That is why `ChevronRight` is **not** imported; leave it out or the lint fails on an unused symbol.
- `useClassesInfinite` is verified at `academic.hooks.ts:39-61`: it takes `(tenantId, { limit })`, pages on `page < totalPages`, and has `enabled: !!tenantId`. Do not re-implement it inline — that is what an earlier draft of this plan did.
- Because it is `enabled`-gated, `isLoading` is `false` while the tenant id is still resolving, so the first paint can briefly read "0 classes · 0 students". Guard it:

```tsx
  if (isLoading || (!currentTenantId && classes.length === 0)) return <ClassRosterSkeleton />;
```

- Import paths are verified against `academic.hooks.ts:1-13`: `graphqlQuery` lives in `@/lib/graphql/core`, `CLASSES` in `@/lib/graphql/queries`, `ClassesResponse` in `@/lib/graphql/types/index`. The roster needs none of them directly — only `useClassesInfinite` and `ClassInfo`.

- [ ] **Step 4: Run the guard test**

```bash
cd apps/web && bun test src/modules/__tests__/class-roster.test.ts
```
Expected: PASS. If the fabricated-column test fails, you added a Medium or Status column — remove it.

- [ ] **Step 5: Register the screen**

In `module-nav-config.tsx`, re-read first, then add to the `students` panel's Overview section, after the `students` row:

```tsx
        { key: "classes", label: "Classes", icon: <School className={iconCls} />, permModule: "classes" },
```

In `tenant-screen-dispatcher.tsx`, add the lazy import beside the other academics ones and one case in the **admin** branch:

```tsx
const ClassRoster = dynamic(() => import('@/modules/academics/components/ClassRoster').then(m => m.ClassRoster), { loading: LoadingScreen });
```
```tsx
      case 'class-roster': return <ClassRoster />;
```

- [ ] **Step 6: Update the registry counts deliberately**

```bash
cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts
```
Expected: FAIL, reporting `specifiers: expected 70, got 69` and `keys: expected 61, got 60`. That is the guard doing its job — it forces the count change to be an explicit act. Update `REGISTRIES` for `tenant-screen-dispatcher` to `specifiers: 70, keys: 61` and extend the comment above it:

```ts
// Counts measured on the pre-move tree, 2026-09-28; raised to 69/60 on 2026-09-29 for the
// IAM landing screen and Permissions Catalog, to 70/61 for Role Assignments, dropped to
// 69/60 and 25/19 when the profile screen was removed, then raised to 70/61 again for the
// Students class roster. Changing one of these numbers must be a deliberate act in a task
// step, never a side effect of a rewrite.
```

Re-run. Expected: PASS.

- [ ] **Step 7: Full suite, typecheck, and the routing guard**

```bash
cd apps/web && bun test && bun run typecheck
```
Expected: PASS. `module-nav.test.ts` must now accept `students/classes` — it does, because the row's bare key `classes` is in the registry and `componentKey('students','classes')` returns `class-roster`, which Step 5 added. If it reports `students / classes` as dead, `COMPONENT_OVERRIDES` and the new case disagree; they must match exactly.

- [ ] **Step 8: Commit**

```bash
cd apps/web && git commit -m "feat(web): give Students its own Classes screen, separate from the editor

The reference has two Classes screens asking two different questions: Academics
edits the rows, Students asks how full each class is. Ours had one screen and the
nav key was shared with Student Fees, so both rows opened the same thing.

The roster pages to completion before totalling, because an aggregate over one
page would print a wrong number with a straight face. It shows no Medium,
Vocational or Status column and no per-row drill-in: none of those have backing in
this schema, and All Students has no class filter to land on. A source guard fails
if a later pass adds them anyway." -- src/modules/academics/components/ClassRoster.tsx src/modules/__tests__/class-roster.test.ts src/modules/__tests__/screen-registry.test.ts src/components/layout/sidebar/module-nav-config.tsx "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
```

---

### Task 6 (optional, and it belongs to another feature): stop counting students by loading them

**Do this task only if the user asks for the server work.** The spec's §4 was corrected during planning: the roster reads GraphQL `classes` → `ClassService.listPaginated`, which **already** counts correctly. The over-fetch is in the REST `list`, whose only web callers are two assessment screens. It is a real bug; it is not this feature's bug.

**Files:**
- Modify: `apps/server/src/modules/academics/class.service.ts:63-88`

- [ ] **Step 1: Confirm the two callers still want the same shape**

```bash
cd D:/per/inkwelly && grep -rn "api/classes" apps/web/src --include=*.ts --include=*.tsx | grep -v "mode=min"
```
Expected: `useTeacherExams.ts` and `useGradeManagement.ts`, both `?all=true`, both consuming a bare array of `{ id, name, section, grade, capacity, studentCount, classTeacher, classTeacherId }`. The output shape must not change.

- [ ] **Step 2: Replace the row-loading count with a grouped count**

In `ClassService.list`, the query currently loads every enrolled student row to call `.length`:

```ts
        const classesList = await db.query.classes.findMany({
          where,
          with: {
            students: { columns: { id: true } },
            teachers: { where: eq(schema.classTeachers.isClassTeacher, true), limit: 1,
              with: { teacher: { with: { user: { columns: { name: true } } } } } },
          },
        });
```

Replace it and the mapping below it with the batched count `listPaginated` already uses:

```ts
        const classesList = await db.query.classes.findMany({
          where,
          with: {
            teachers: {
              where: eq(schema.classTeachers.isClassTeacher, true),
              limit: 1,
              with: { teacher: { with: { user: { columns: { name: true } } } } },
            },
          },
        });

        // Counted in one grouped query. Loading a row per enrolled student to call
        // .length fetched 298 rows to produce 12 numbers.
        const classIds = classesList.map((c: any) => c.id);
        const studentCounts = classIds.length > 0
          ? await db.select({ classId: schema.students.classId, count: count() })
              .from(schema.students)
              .where(inArray(schema.students.classId, classIds))
              .groupBy(schema.students.classId)
          : [];
        const countMap = new Map(studentCounts.map((s) => [s.classId, Number(s.count)]));

        const allItems = classesList.map((c: any) => {
          const classTeacher = c.teachers?.[0];
          return {
            id: c.id,
            name: c.name,
            section: c.section,
            grade: c.grade,
            capacity: c.capacity,
            studentCount: countMap.get(c.id) ?? 0,
            classTeacher: classTeacher?.teacher?.user?.name || 'Unassigned',
            classTeacherId: classTeacher?.teacher?.id || null,
          };
        }).sort(sortByName);
```

Leave `total`, the slice, the cache key and the 300 s TTL exactly as they are — the cache key has no slot for filter params, which is why no `search`/`grade`/`section` param is being added.

- [ ] **Step 3: Verify the imports and run the server suite**

```bash
cd D:/per/inkwelly/apps/server && grep -n "^import\|from \"drizzle-orm\"" src/modules/academics/class.service.ts | grep -c "count\|inArray"
```
Expected: at least 2 — `listPaginated` already imports both. If the count is lower, add them to the existing drizzle import.

```bash
cd D:/per/inkwelly/apps/server && bun test
```
Expected: PASS. A route-resolution test timing out at 5000 ms means Docker Desktop is paused, not that the code broke — resume Docker and re-run.

- [ ] **Step 4: Commit**

```bash
cd D:/per/inkwelly && git commit -m "perf(server): count class enrolment with one grouped query

GET /api/classes loaded a row per enrolled student and called .length, so a tenant
with 298 students fetched 298 rows to produce twelve numbers. listPaginated below it
already did this correctly; this is the same query.

Output shape is unchanged, so the two assessment screens that call ?all=true are
unaffected." -- apps/server/src/modules/academics/class.service.ts
```

---

## Self-review

**1. Spec coverage.** §1 routing contract → Task 1. §2 call sites → Tasks 2–4 (`app-layout`, dispatcher, `module-nav-config`, `ModulePanel`, `module-sidebar` verified as needing no change in Step 5 of Task 3). §3 roster → Task 5. §4 server → Task 6, correctly demoted to optional by the spec's own correction. §5 testing → Tasks 1, 3, 4, 5, 6. §6 deviation (three routes, two bodies) → `COMPONENT_OVERRIDES` in Task 1 declares only `students/classes`, so `academics/classes` and `student-fees/classes` share the `classes` body, as the spec states. No gaps.

**2. Placeholders.** None. Every code step carries the code; the two "check the import path" notes give the exact command, not a TODO.

**3. Type consistency.** `parseRoute` returns `RouteParts { module, screen }` everywhere; Task 2 uses `route.module`/`route.screen`; Task 4's `canonicalOwner(resolvedScreen, screenOwners, moduleIds)` matches Task 1's signature. `componentKey(module, screen)` is called with two args in Tasks 1, 2, 3 and the test helper `componentKeyOf` adapts a single string to that shape rather than inventing an overload. The key `class-roster` appears identically in `COMPONENT_OVERRIDES` (Task 1), the dispatcher case (Task 5) and the Task 3 test's expectations.

**One thing to watch while executing:** Task 3's Step 6 expects `module-catalogue.test.ts` to keep passing. If it fails, the launcher's `card.screen` is being qualified somewhere it shouldn't — the launcher must keep emitting bare keys and let Task 4's `router.replace` do the converging.
