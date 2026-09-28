# Module-Keyed Folders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** give every live admin sidebar row that a dispatcher case can address today a file inside a folder named after its module, in both `apps/web/src/modules/` and `apps/server/src/modules/`, with no behaviour, export-name or URL change.

**Scope, measured:** `adminPanelSections` has **52 live rows** across 11 modules. This plan builds **33 folders**. 9 rows collapse onto a sibling folder in the same module (7 fee rows onto `student-fees/fees`, `security-pin` + `seed-defaults` onto `iam/iam-dashboard`) because their cases are stacked fall-throughs with identical props. **10 rows are deferred to routing Task 3** — `student-fees/classes`, `students/classes`, five `*/reports` rows, `student-attendance/student-leaves`, `employee-attendance/staff-leaves`, `employee-attendance/staff` — because each collides on a bare `case` shared with a sibling module, so a folder for it today is a file no case can return. See spec §4, "Re-validation".

**Architecture:** the sidebar module id becomes the folder key at all four layers (URL ↔ sidebar row ↔ web folder ↔ server folder). Each web move is `git mv <screen> → modules/<M>/<row>/index.tsx` plus `git mv` of that screen's private parts subtree inside the same folder, followed by a text rewrite of `@/modules/…` aliases. The one importer of all 25 moving screens is the tenant dispatcher, so the rewrite set is small and closed. Server moves rename or split whole folders, and `src/index.ts` is the only deep importer.

**Tech:** Next.js App Router + Turbopack, React Compiler, `tsc --noEmit`, `bun test`; Elysia + Drizzle + GraphQL, `eslint-plugin-boundaries` 7.2.

**Spec:** `docs/superpowers/specs/2026-09-29-module-keyed-folders-design.md` — read it with this plan. §3 is the rule, §4 and §5 are the target maps, §5's "Cross-references, measured" list is why four parts folders do **not** move, §6 is the guardrail arithmetic, §7 is the verification list.

## Global Constraints

- **Commits are local. Never `git push`.** Never commit without the user's approval for that plan.
- **`git commit` in this tree always carries a trailing `-- <paths>`.** No bare `git commit`, ever.
- **Never stage or commit a file the second window owns.** If `git status` shows an unstaged modification in a file you are about to move, STOP and report it — do not `git add -A`, do not `git stash`.
- **Exported symbol names do not change.** `AdminClasses` stays `AdminClasses`. Only paths move.
- **Folder names are the row key verbatim** (`bulk-promote`, `academic-years`). No new vocabulary.
- **Case keys must stay at 62** for the whole restructure. **Tenant specifiers go 69 → 77** and that raise happens in Task 10's step, not silently.
- **Do not touch the four shared parts folders**: `assessment/components/adminExams/`, `timetable/components/adminCalendar/`, `access-control/hooks/use-permissions.ts`, `academics/hooks/use-academic-years.ts` (spec §5).
- **Role, auth, platform, dashboard, support, communication and super-admin screens do not move.**
- **No new screens, no behaviour change, no visual change.** If a screen looks different after a move, that is a bug in the move.
- **No `Soon` stubs.** Roughly 30 catalogue modules stay file-less.
- **Do not create the ten deferred folders** (`student-fees/classes`, `students/classes`, five `*/reports`, `student-attendance/student-leaves`, `employee-attendance/staff-leaves`, `employee-attendance/staff`). They are live nav rows, so the instinct to file them is right and the timing is wrong: each shares a bare dispatcher `case` with a sibling module, and `componentKey()` collapses qualified keys to bare, so nothing could import the file. Task 11 asserts they are absent.
- Do not commit `.env`, `*.key`, `*.pem`, or `apps/web/certificates/`.
- Isolate with a branch in this tree, never a worktree (the hoisted bun linker makes a fresh worktree unrunnable).

### MOVE-RECIPE

Every web folder move in Tasks 3–10 is these five actions, in this order, for each screen. Each task lists its own concrete values; nothing here is a placeholder.

1. `mkdir -p apps/web/src/modules/<M>/<row>`
2. `git mv apps/web/src/modules/<src>/components/<Screen>.tsx apps/web/src/modules/<M>/<row>/index.tsx`
3. If the screen has a private parts folder `<parts>`: `git mv apps/web/src/modules/<src>/components/<parts> apps/web/src/modules/<M>/<row>/<parts>`. **Keep the parts folder's own name as a subdirectory** — this preserves the subtree's depth, so every relative import inside it (`../types`, `../../components/ui/…`) still resolves untouched. This is a deliberate deviation from spec §3's flat sketch, taken because it removes ~200 import rewrites and every rewrite is a chance to break a screen silently.
4. Rewrite aliases repo-wide for this screen: `grep -rl "<old-alias>" apps/web/src | xargs -r sed -i "s|<old-alias>|<new-alias>|g"` using the exact pairs the task lists.
5. **Rewrite aliases that point into the moved subtree, not just at its screen.** Preserving depth saves the *relative* imports; it cannot save an `@/modules/…` alias, because that names the old folder absolutely. Measured against the current tree, exactly three moved files are addressed this way from files that also move:
   - `@/modules/finance/hooks/use-fees` — **9 consumers**, all inside `adminFees/` (Task 8)
   - `@/modules/finance/components/adminFees/types` — 1 consumer (Task 8)
   - `@/modules/finance/hooks/use-expenses` — 1 consumer (Task 9)

   Everything else that is aliased absolutely stays put, which is why the list is short: `@/modules/access-control/hooks/use-permissions` (12), `@/modules/academics/hooks/use-academic-years` (7), `@/modules/finance/data/billing-constants` (8), `@/modules/assessment/components/adminExams/{types,marksheet-constants}` and `@/modules/assessment/components/teacherHomework/index` — all STAYS folders.
6. If the screen's parts folder **stays behind** (the four in Global Constraints), replace its relative prefix in the moved `index.tsx` with the absolute alias, e.g. `sed -i "s|from './adminExams/|from '@/modules/assessment/components/adminExams/|g"`.

`tsc --noEmit` is the oracle for steps 3–6: a wrong depth or a missed import is always reported by the compiler, never silent. Depth preservation is verified, not assumed — the only two parent-relative imports crossing out of a moving screen are `../../tenancy/components/adminSubscription/*` in `AdminPrintMarksheet` and `AdminAdmitCards`, and `assessment/components/` → `examinations/print-marksheet/` is the same depth, so `../../` still lands on `modules/`.

### Server folder renames and splits

A renamed server module folder keeps its `index.ts.ts` barrel content; only paths change:

1. `git mv apps/server/src/modules/<old> apps/server/src/modules/<new>` (whole folder) — or `mkdir` + per-file `git mv` when splitting.
2. `grep -rl "modules/<old>" apps/server/src | xargs -r sed -i 's|modules/<old>|modules/<new>|g'`
3. For a split, write the **new** `index.ts` barrel (the boundary rule requires one per module: `eslint.config.mjs:38` keys `barrel` on `src/modules/*/index.ts`).
4. `cd apps/server && bun run lint` must stay clean — `boundaries/elements` is glob-keyed (`src/modules/*`), so new folders are classified automatically and need no config edit.

### VERIFY blocks

Every task's "Verify" step is these two commands, run from the repo root. They are literal — a task that says "Verify" means exactly this, plus whatever extra test that task names.

```bash
# VERIFY-WEB
cd apps/web    && bun run typecheck && bun test src/modules/__tests__/ src/lib/__tests__/

# VERIFY-SERVER
cd apps/server && bun run typecheck && bun run lint && bun test
```

`bun test` inside `apps/server` composes the GraphQL SDL when it builds the app, which is what proves a server rename touched no schema. If `route-resolution` fails at ~5000 ms, Docker Desktop is paused, not the code — resume it and re-run rather than reverting.

### The dispatcher path, spelled once

`apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` is edited by **every** task from 3 to 10 and lives *outside* `apps/web/src/modules`. It therefore appears in the staging list of every one of those commits; a task that stages only `apps/web/src/modules` would leave its case-key and specifier edits uncommitted and the next task would start from a dirty tree. Quote it — the parentheses and brackets are shell metacharacters:

```bash
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
```

Server commits use `apps/server/src/modules apps/server/src/index.ts apps/server/src/graphql` — plus `apps/server/src/route-resolution.test.ts` in the task that moves the file it names. Measured against the current tree, exactly four files outside `src/modules/` reference a module path, and each is an importer:

| file | what it imports |
| --- | --- |
| `src/index.ts:36-71` | 26 `./modules/<domain>/<file>.routes` lines — the mount table |
| `src/graphql/typeDefs/index.ts:4-5` | `academic.typeDefs`, `finance.typeDefs` |
| `src/graphql/resolvers/index.ts:6-7` | `academic.resolvers`, `finance.resolvers` |
| `src/route-resolution.test.ts:75` | `await import('./modules/finance/index')` — the only test that names a moving barrel |

That last row is why the server pathspec list is never just `modules/`: the guard test that proves a rename broke nothing is itself a consumer of the renamed path, and it reaches the **barrel**, so a `sed` over the four moved *file* names will not touch it. Task 8 owns it. After the repo-wide `sed`, run `git status -s apps/server/src` anyway: if a file outside those paths was rewritten, name it and add it explicitly. Never widen a pathspec into a directory you have just looked at — that is how a second window's work rides along.

Every `git add`, `git commit` and VERIFY block in this plan uses repo-relative paths, so it runs from the repo root. Blocks that move you into a subdirectory for a `git mv` or a `sed` are marked with a leading `cd`; the commit block that follows starts with `cd /d/per/inkwelly` to come back.

---

### Task 1: Green the suite — raise the tenant case-key count deliberately

The spec's step 0a. `67bc4ab` added two dispatcher cases without touching the guard test, so the suite is red on arrival and the restructure cannot tell its own drift from theirs.

**Files:**
- Modify: `apps/web/src/modules/__tests__/screen-registry.test.ts:20-27`

**Interfaces:**
- Consumes: nothing.
- Produces: a green baseline (`bun test src/modules/__tests__/ src/lib/__tests__/` → 0 fail except the Task 2 guard, which is Task 2's business).

- [ ] **Step 1: Confirm the two failures and what they are**

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts 2>&1 | tail -20`
Expected: `(fail) tenant-screen-dispatcher > screen-key count is unchanged` with `Expected: 60 / Received: 62`, plus `(fail) … resolved key, not the raw param`.

- [ ] **Step 2: Read the new case keys before writing anything**

Run from the repo root (quote the object name — the path contains `( )` and `[ ]`, which bash would otherwise glob):

```bash
git show 'HEAD:apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx' \
  | grep -oE "case '[a-z0-9-]+'" | sort -u | tee /tmp/case-keys.txt | wc -l
```
Expected: `62`. Then see the keys themselves:

```bash
cat /tmp/case-keys.txt | tr "\n" " "
```

Record which two keys are new versus the 60 the test remembers — put them in the commit message. If the count is not 62, STOP: the other window has landed more cases and the spec's map needs re-running (spec §4, "The basis of this table").

- [ ] **Step 3: Raise the expectation**

```ts
// screen-registry.test.ts, the tenant entry of REGISTRIES
  {
    name: "tenant-screen-dispatcher",
    path: "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx",
    specifiers: 69,
    keys: 62,
  },
```

Also extend the comment block above `REGISTRIES` (it is the file's own audit trail) with one line:

```
// raised to 62 on 2026-09-29 for the two dispatcher cases 67bc4ab added without a test update.
```

- [ ] **Step 4: Run the test**

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts`
Expected: `screen-key count is unchanged` **passes**; only the Task 2 source guard still fails.

- [ ] **Step 5: Commit**

```bash
cd /d/per/inkwelly
git add apps/web/src/modules/__tests__/screen-registry.test.ts
git commit -m "test(web): raise the tenant case-key count to 62 for the cases 67bc4ab added

That commit added two dispatcher cases and never touched the guard, which owns the rule that a
count change is deliberate. Greening it here so the folder restructure starts from a suite whose
red lines are its own." -- apps/web/src/modules/__tests__/screen-registry.test.ts
```

---

### Task 2: Re-apply the module-route resolver and the staff guard

The spec's step 0b. `67bc4ab` reverted the earlier Task 2 in content: HEAD's dispatcher switches on the raw `screen` param and `lib/routing/module-routes.ts` is dead code. **Do not start this task until the other window's 7 dirty files are committed** — three of them are the files this task edits.

**Files:**
- Modify: `apps/web/src/components/layout/sidebar/module-nav-config.tsx` (append after `adminPanelSections` closes)
- Modify: `apps/web/src/components/layout/app-layout.tsx:57-74` and the import at line 12
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx`

**Interfaces:**
- Consumes: `parseRoute(pathname, ctx)`, `componentKey(module, screen)`, `qualifiedKey(module, screen)` from `apps/web/src/lib/routing/module-routes.ts` (already on `HEAD`, commit `3c8e236`).
- Produces: `isAdminModuleScreen(module: string, screen: string): boolean`, and a dispatcher that guards and switches on `screenKey`.

- [ ] **Step 1: Verify the collision gate**

Run: `git status -s`
Expected: the 7 files (`tenant-screen-dispatcher.tsx`, `generic-slug-dispatcher.tsx`, `(authenticated)/layout.tsx`, `app-layout.tsx`, `ModuleRail.tsx`, `module-sidebar.tsx`, `FavoritesStrip.tsx`) show **no** unstaged modifications. If any still shows ` M`, STOP and report — the other window is mid-edit.

- [ ] **Step 2: Confirm the guard is still red for the right reason**

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts 2>&1 | grep -A3 "resolved key"`
Expected: FAIL with `Expected substring or pattern: /STAFF_FORBIDDEN_SCREENS\.has\(screenKey\)/`.

- [ ] **Step 3: Add the nav-config predicate**

Append to `module-nav-config.tsx`, after `adminPanelSections` closes:

```tsx
/**
 * True when `screen` is a declared sub-link of admin module `module`. This is what
 * tells `/demo-academy/academics/classes` (a module-scoped screen) apart from
 * `/demo-academy/students/STU-123` (a screen with a detail param) — both are three
 * segments, and nothing but this index can tell them apart.
 */
export function isAdminModuleScreen(module: string, screen: string): boolean {
  return (
    adminPanelSections[module]?.some((s) => s.items.some((i) => i.key === screen)) ?? false
  );
}
```

- [ ] **Step 4: Point the layout resolver at the contract**

Replace `isTenantRootPath` and `resolveScreenFromPathname` (`app-layout.tsx:57-74`) with:

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

`isTenantRootPath` has exactly one caller; delete it. Imports become:

```ts
import { getAdminRail, isAdminModuleScreen } from "./sidebar/module-nav-config";
import { parseRoute, qualifiedKey } from "@/lib/routing/module-routes";
```

- [ ] **Step 5: Resolve the key in the dispatcher, before the guard**

Add the imports, then in `TenantScreenDispatcherClient` read `detail` and derive the key:

```tsx
import { isAdminModuleScreen } from '@/components/layout/sidebar/module-nav-config';
import { componentKey, parseRoute } from '@/lib/routing/module-routes';
```

```tsx
  const { slug, screen, detail } = useParams();
  // This route always puts the tenant in the first segment, so parts[0] is the
  // root by construction and can never be a module name.
  // A module-scoped admin URL arrives as screen=module, detail=screen.
  const route = parseRoute(`/${slug}/${screen}${detail ? `/${detail}` : ''}`, {
    isModuleScreen: isAdminModuleScreen,
    isTenantRoot: (first) => first === slug,
  });
  const screenKey = componentKey(route.module, route.screen);
```

and switch the guard and the admin `switch` onto it:

```tsx
        const denied =
          STAFF_FORBIDDEN_SCREENS.has(screenKey) ||
          (STAFF_SCREEN_MODULES[screenKey] !== undefined &&
            !hasPermission(currentUser, STAFF_SCREEN_MODULES[screenKey], 'view'));
```

```tsx
    switch (screenKey) {
```

Keep every `case` string bare — `componentKey` returns the bare key except for genuinely distinct screens. Re-check the file after the other window's commit: their version has two extra `screen === 'dashboard'` loading branches; leave those reading `screen`.

- [ ] **Step 6: Run both suites**

Run: `cd apps/web && bun run typecheck && bun test src/modules/__tests__/ src/lib/__tests__/`
Expected: typecheck clean; **0 failures** for the first time in this plan.

- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
git add apps/web/src/components/layout/sidebar/module-nav-config.tsx apps/web/src/components/layout/app-layout.tsx "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git commit -m "feat(web): resolve module-scoped admin URLs and guard on the resolved key

Re-applies the wiring 67bc4ab reverted. Without it the staff permission check reads the raw
screen param, so /slug/academics/classes asks whether \"academics\" is forbidden — it is not in
either table, and the check passes for a screen the user has no grant on." -- apps/web/src/components/layout/sidebar/module-nav-config.tsx apps/web/src/components/layout/app-layout.tsx "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
```

---

### Task 3: `iam/` — prove the recipe end to end

Six live rows (`iam-dashboard`, `roles`, `role-assignments`, `security-pin`, `permissions-catalog`, `seed-defaults`) fold into four folders; three of those rows stack onto one component with no props, exactly like the fee rows, so they share one folder.

**Files:**
- Create: `apps/web/src/modules/iam/{iam-dashboard,roles,role-assignments,permissions-catalog}/index.tsx` (moved, not written)
- Move: `apps/web/src/modules/access-control/components/adminRoles/` → `apps/web/src/modules/iam/components/adminRoles/` (shared by three screens in this module)
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (4 specifiers)
- Rename: `apps/server/src/modules/access-control/` → `apps/server/src/modules/iam/`
- Modify: `apps/server/src/index.ts:52` and `apps/server/src/graphql/*`
- Test: `apps/web/src/modules/__tests__/module-keyed-layout.test.ts` (new)

**Interfaces:**
- Consumes: MOVE-RECIPE.
- Produces: `modules/iam/<row>/index.tsx` with named exports `AdminIamDashboard`, `AdminRoles`, `AdminRoleAssignments`, `AdminPermissionsCatalog`; the layout test harness every later task appends to; server barrel `modules/iam/index.ts` exporting `rolesRoutes`.

- [ ] **Step 1: Write the failing layout guard**

Create `apps/web/src/modules/__tests__/module-keyed-layout.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const MOD_ROOT = resolve(import.meta.dir, "..");

/** A live admin row must have a real file at modules/<module>/<row>/. */
function rowHasScreen(module: string, row: string): boolean {
  const dir = join(MOD_ROOT, module, row);
  return [".tsx", ".ts"].some((e) => existsSync(join(dir, `index${e}`)));
}

describe("iam", () => {
  test("every iam row lives under modules/iam/", () => {
    for (const row of ["iam-dashboard", "roles", "role-assignments", "permissions-catalog"]) {
      expect(rowHasScreen("iam", row)).toBe(true);
    }
    // The three rows that stack onto <AdminIamDashboard /> with no props share one folder.
    for (const bare of ["AdminIamDashboard", "AdminRoles", "AdminRoleAssignments", "AdminPermissionsCatalog"]) {
      expect(existsSync(join(MOD_ROOT, "access-control/components", `${bare}.tsx`))).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd apps/web && bun test src/modules/__tests__/module-keyed-layout.test.ts`
Expected: FAIL, `Received: false` on `iam-dashboard`.

- [ ] **Step 3: Move the four screens and the shared parts folder**

```bash
cd apps/web/src/modules
mkdir -p iam/iam-dashboard iam/roles iam/role-assignments iam/permissions-catalog iam/components
git mv access-control/components/AdminIamDashboard.tsx      iam/iam-dashboard/index.tsx
git mv access-control/components/AdminRoles.tsx              iam/roles/index.tsx
git mv access-control/components/AdminRoleAssignments.tsx    iam/role-assignments/index.tsx
git mv access-control/components/AdminPermissionsCatalog.tsx iam/permissions-catalog/index.tsx
git mv access-control/components/adminRoles                  iam/components/adminRoles
```

`access-control/` keeps `SuperAdminRoles.tsx`, `superAdminRoles/*` and `hooks/use-permissions.ts` — all non-moving (spec §5).

- [ ] **Step 4: Repoint the shared parts folder inside the moved screens**

Three files import `./adminRoles/…`; they now live one level deeper and elsewhere, so use the alias:

```bash
cd apps/web/src/modules/iam
sed -i "s|from './adminRoles/|from '@/modules/iam/components/adminRoles/|g" roles/index.tsx role-assignments/index.tsx permissions-catalog/index.tsx
```

- [ ] **Step 5: Repoint the dispatcher**

```bash
cd apps/web/src
for pair in \
  "access-control/components/AdminIamDashboard|iam/iam-dashboard" \
  "access-control/components/AdminRoles|iam/roles" \
  "access-control/components/AdminRoleAssignments|iam/role-assignments" \
  "access-control/components/AdminPermissionsCatalog|iam/permissions-catalog" ; do
  old="@/modules/${pair%%|*}"; new="@/modules/${pair##*|}"
  grep -rlF "$old" . | xargs -r sed -i "s|$old|$new|g"
done
```

Then confirm the three iam rows still share one specifier:

Run: `grep -c "@/modules/iam/iam-dashboard" "app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"`
Expected: `1` (one `const` line serving all three `case`s).

- [ ] **Step 6: Rename the server module**

```bash
cd apps/server/src
git mv modules/access-control modules/iam
grep -rl "modules/access-control" . | xargs -r sed -i 's|modules/access-control|modules/iam|g'
```

`modules/iam/index.ts` content is unchanged; the deep path in `src/index.ts:52` becomes `./modules/iam/roles.routes`.

- [ ] **Step 7: Verify**

VERIFY-WEB + VERIFY-SERVER (Global Constraints), plus `cd apps/web && bun test src/modules/__tests__/module-keyed-layout.test.ts`.

Expected: all green; the layout test now passes. The server `bun test` is what proves the rename touched no SDL.

- [ ] **Step 8: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts apps/server/src/graphql
git commit -m "refactor(iam): one folder per admin row, keyed by the sidebar module

First module through the recipe: the four iam screens move out of access-control/ and the server
folder is renamed to match the sidebar, so the module is one place you can open on both sides.
Routes, permission strings and export names are untouched." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts apps/server/src/graphql
git status -s   # the dispatcher must not still show as modified
```

---

### Task 4: `academics/` — six folders, two of them cross-domain arrivals

**Files:**
- Move: 6 web screens + 4 private parts folders (lists in step 3)
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (6 specifiers)
- Test: `apps/web/src/modules/__tests__/module-keyed-layout.test.ts` (append a `academics` block)

**Interfaces:**
- Consumes: MOVE-RECIPE.
- Produces: `academics/{classes,subjects,academic-years,timetable,calendar,school-settings}/index.tsx` with exports `AdminClasses`, `AdminSubjects`, `AcademicYearsScreen`, `AdminTimetable`, `AdminCalendar`, `AdminSchoolSettings`. Task 5 and Task 8 import `academics/classes` (the `student-fees/classes` thin entry arrives in routing Task 3, not here).

- [ ] **Step 1: Append the failing block**

```ts
describe("academics", () => {
  test("every academics row lives under modules/academics/<row>/", () => {
    for (const row of ["classes", "subjects", "academic-years", "timetable", "calendar", "school-settings"]) {
      expect(rowHasScreen("academics", row)).toBe(true);
    }
  });
});
```

Run: `cd apps/web && bun test src/modules/__tests__/module-keyed-layout.test.ts`
Expected: FAIL on `classes`.

- [ ] **Step 2: Check the shared-parts rule against the filesystem, not memory**

Run: `cd apps/web/src/modules && grep -rln "from ['\"]\./adminCalendar/" --include=*.tsx . && grep -rln "from ['\"]\./adminSchoolSettings/" --include=*.tsx .`
Expected: the calendar line lists `AdminCalendar`, `ParentCalendar`, `StudentCalendar`, `TeacherCalendar` → `adminCalendar` **stays**; the settings line lists only `AdminSchoolSettings` → `adminSchoolSettings` **moves**. If the output differs, follow the rule (parts move only if every consumer moves with them) and record the deviation in the commit message.

- [ ] **Step 3: Move**

```bash
cd apps/web/src/modules
mkdir -p academics/classes academics/subjects academics/academic-years academics/timetable academics/calendar academics/school-settings
git mv academics/components/AdminClasses.tsx        academics/classes/index.tsx
git mv academics/components/adminClasses            academics/classes/adminClasses
git mv academics/components/AdminSubjects.tsx       academics/subjects/index.tsx
git mv academics/components/adminSubjects           academics/subjects/adminSubjects
git mv academics/components/AdminAcademicYears.tsx  academics/academic-years/index.tsx
git mv timetable/components/AdminTimetable.tsx      academics/timetable/index.tsx
git mv timetable/components/adminTimetable          academics/timetable/adminTimetable
git mv timetable/components/AdminCalendar.tsx       academics/calendar/index.tsx
git mv tenancy/components/AdminSchoolSettings.tsx   academics/school-settings/index.tsx
git mv tenancy/components/adminSchoolSettings       academics/school-settings/adminSchoolSettings
```

`academics/hooks/use-academic-years.ts` stays (7 consumers across 4 future modules); `timetable/` keeps every role calendar, the role timetables and `adminCalendar/`.

- [ ] **Step 4: Fix the two moved-in screens' relative prefixes**

```bash
cd apps/web/src/modules/academics
# adminCalendar did not move, so its new module cannot reach it relatively
sed -i "s|from './adminCalendar/|from '@/modules/timetable/components/adminCalendar/|g" calendar/index.tsx
# use-academic-years did not move either
sed -i "s|from '\.\./hooks/use-academic-years'|from '@/modules/academics/hooks/use-academic-years'|g" academic-years/index.tsx
```

- [ ] **Step 5: Repoint the dispatcher**

```bash
cd apps/web/src
for pair in \
  "academics/components/AdminClasses|academics/classes" \
  "academics/components/AdminSubjects|academics/subjects" \
  "academics/components/AdminAcademicYears|academics/academic-years" \
  "timetable/components/AdminTimetable|academics/timetable" \
  "timetable/components/AdminCalendar|academics/calendar" \
  "tenancy/components/AdminSchoolSettings|academics/school-settings" ; do
  old="@/modules/${pair%%|*}"; new="@/modules/${pair##*|}"
  grep -rlF "$old" . | xargs -r sed -i "s|$old|$new|g"
done
```

- [ ] **Step 6: Verify** — VERIFY-WEB (this task touches no server file). Expected: green; `bun test src/modules/__tests__/` shows the `academics` block passing.

- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP"
git commit -m "refactor(academics): one folder per admin row

Classes, subjects and academic-years were already in this module; timetable, calendar and
school-settings arrive from timetable/ and tenancy/. adminCalendar stays in timetable because
three role calendars read it too, which the private-parts rule says it may not move." \
  -- apps/web/src/modules "$DISP"
```

---

### Task 5: `students/` — the people split, promotions out of academics

**Files:**
- Move: 3 web screens + 3 private parts folders; create 2 thin entries
- Modify: `apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (specifiers 1→3 for promotions)
- Rename/split server: `modules/people/` → `students/` + `employees/` is Task 6; here only `students.routes.ts` + `student.service.ts` move out, and `academics/promotions.routes.ts` joins them
- Test: append a `students` block

**Interfaces:**
- Consumes: MOVE-RECIPE; `AdminPromotions` from `../promotions` inside the thin entries.
- Produces: `students/{students,promotions,bulk-promote,graduated,certificates}/`; exports `AdminStudents`, `AdminPromotions`, `StudentsBulkPromote`, `StudentsGraduated`, `AdminCertificates`. Server barrel `modules/students/index.ts` exporting `studentsRoutes`, `StudentService`, `promotionsRoutes`.

- [ ] **Step 1: Append the failing block**

```ts
describe("students", () => {
  test("every students row lives under modules/students/", () => {
    for (const row of ["students", "promotions", "bulk-promote", "graduated", "certificates"]) {
      expect(rowHasScreen("students", row)).toBe(true);
    }
  });
});
```

Run it; expect FAIL on `students`.

- [ ] **Step 2: Move the bodies**

```bash
cd apps/web/src/modules
mkdir -p students/students students/promotions students/bulk-promote students/graduated students/certificates
git mv people/components/AdminStudents.tsx           students/students/index.tsx
git mv people/components/adminStudents               students/students/adminStudents
git mv academics/components/AdminPromotions.tsx      students/promotions/index.tsx
git mv academics/components/adminPromotions          students/promotions/adminPromotions
git mv certificates/components/AdminCertificates.tsx students/certificates/index.tsx
git mv certificates/components/adminCertificates     students/certificates/adminCertificates
```

- [ ] **Step 3: Write the two thin entries**

```tsx
// apps/web/src/modules/students/bulk-promote/index.tsx
import { AdminPromotions } from "../promotions";
export const StudentsBulkPromote = () => <AdminPromotions initialTab="bulk" />;
```

```tsx
// apps/web/src/modules/students/graduated/index.tsx
import { AdminPromotions } from "../promotions";
export const StudentsGraduated = () => <AdminPromotions initialTab="graduated" />;
```

- [ ] **Step 4: Repoint the dispatcher and add the two specifiers**

Run the alias loop for `people/components/AdminStudents|students/students`, `academics/components/AdminPromotions|students/promotions`, `certificates/components/AdminCertificates|students/certificates`. Then replace the shared promotions cases with per-row imports:

```tsx
const AdminPromotions = dynamic(() => import('@/modules/students/promotions').then(m => m.AdminPromotions), { loading: LoadingScreen });
const StudentsBulkPromote = dynamic(() => import('@/modules/students/bulk-promote').then(m => m.StudentsBulkPromote), { loading: LoadingScreen });
const StudentsGraduated = dynamic(() => import('@/modules/students/graduated').then(m => m.StudentsGraduated), { loading: LoadingScreen });
```

```tsx
      case 'promotions': return <AdminPromotions key="individual-prom" initialTab="individual" />;
      case 'bulk-promote': return <StudentsBulkPromote key="bulk-prom" />;
      case 'graduated': return <StudentsGraduated key="graduated-prom" />;
```

The `key` stays on the case because it controls remount identity; `initialTab` moved into the entry. Net specifier change so far in this plan: **+2** (69 → 71).

- [ ] **Step 5: Split the server `students` module**

```bash
cd apps/server/src/modules
mkdir -p students
git mv people/students.routes.ts students/students.routes.ts
git mv people/student.service.ts students/student.service.ts
git mv academics/promotions.routes.ts students/promotions.routes.ts
```

Create `students/index.ts`:

```ts
export { studentsRoutes } from './students.routes';
export { StudentService } from './student.service';
export type { StudentListParams, StudentListItem, StudentListResult } from './student.service';
export { promotionsRoutes } from './promotions.routes';
```

Then rewrite the paths repo-wide (`people/students.routes` → `students/students.routes`, `people/student.service` → `students/student.service`, `academics/promotions.routes` → `students/promotions.routes`) and drop the three lines that leave `people/index.ts` and `academics/index.ts`. `promotions.routes.ts` reaching class data must import `ClassService` through `@academics`-equivalent: `import { ClassService } from '../academics'` — the barrel rule (`eslint.config.mjs:53`) will fail a deep import, so use the barrel.

- [ ] **Step 6: Verify** — VERIFY-WEB + VERIFY-SERVER. Expect the `students` block green, `people/` still holding the teacher/staff/parent files for Task 6, server lint clean.

- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
git commit -m "refactor(students): one folder per admin row, promotions leaves academics

The students module keeps its own folder even for screens whose data lives in academics, which is
the point of keying by sidebar module: students/promotions and academics/classes can now sit side
by side and mean different things." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
```

---

### Task 6: `employees/`

**Files:** 3 web screens + 3 private parts folders; 3 specifiers. Server: the rest of `people/` (`teachers.routes.ts`, `parents.routes.ts`, `staff.routes.ts`, `parent.service.ts`, `teacher.service.ts`) → `employees/`, emptying `people/`.

**Interfaces:**
- Produces: `employees/{teachers,staff,parents}/index.tsx` exporting `AdminTeachers`, `AdminStaff`, `AdminParents`; server barrel `modules/employees/index.ts` exporting `teachersRoutes`, `parentsRoutes`, `staffRoutes`, `TeacherService`, `ParentService`. `modules/people/` no longer exists.

- [ ] **Step 1: Append the failing block**

```ts
describe("employees", () => {
  test("every employees row lives under modules/employees/", () => {
    for (const row of ["teachers", "staff", "parents"]) {
      expect(rowHasScreen("employees", row)).toBe(true);
    }
  });
});
```

Expected: FAIL on `teachers`.

- [ ] **Step 2: Move the web screens with their parts**

```bash
cd apps/web/src/modules
mkdir -p employees/teachers employees/staff employees/parents
git mv people/components/AdminTeachers.tsx employees/teachers/index.tsx
git mv people/components/adminTeachers       employees/teachers/adminTeachers
git mv people/components/AdminStaff.tsx      employees/staff/index.tsx
git mv people/components/adminStaff          employees/staff/adminStaff
git mv people/components/AdminParents.tsx    employees/parents/index.tsx
git mv people/components/adminParents        employees/parents/adminParents
```

`people/` keeps `ParentChildren.tsx`, `ParentChildSelector.tsx`, `parentChildren/*` and the three `SuperAdmin*` screens.

- [ ] **Step 3: Repoint the dispatcher** — the loop over `people/components/AdminTeachers|employees/teachers`, `people/components/AdminStaff|employees/staff`, `people/components/AdminParents|employees/parents`. Specifier count unchanged (3 for 3).

- [ ] **Step 4: Move the rest of the server module**

```bash
cd apps/server/src/modules
mkdir -p employees
git mv people/teachers.routes.ts people/parents.routes.ts people/staff.routes.ts people/parent.service.ts people/teacher.service.ts employees/
git rm people/index.ts
# `../` is apps/server/src from this cwd; apps/server/src would not resolve here.
grep -rl "modules/people" ../ | xargs -r sed -i 's|modules/people|modules/employees|g'
```

Then hand-fix the rewritten lines that pointed at the *student* files, which Task 5 already moved to `students/` — `grep -rn "modules/employees/students\|modules/employees/student.service\|modules/employees/promotions" ../` must return nothing. Create `employees/index.ts` with the five exports named in the Interfaces block.

- [ ] **Step 5: Verify** — VERIFY-WEB + VERIFY-SERVER, plus `cd apps/web && bun test src/modules/__tests__/`.
- [ ] **Step 6: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
git commit -m "refactor(employees): move the three staff screens out of people/

people/ was a domain folder holding one admin screen per role surface plus three super-admin
screens; it is now split along the sidebar into students/ and employees/ and the name is gone." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
```

---

### Task 7: `student-attendance/`, `employee-attendance/`, `leaves/`

**Files:** 3 web bodies + 2 private parts folders + 3 thin entries; specifiers 1→2 (staff attendance) and 1→3 (leaves). Server: `modules/attendance/` splits three ways and empties.

**Interfaces:**
- Produces: `student-attendance/attendance` (`AdminAttendance`), `employee-attendance/teacher-attendance` (`StaffAttendance`), `employee-attendance/staff-attendance` (`EmployeeStaffAttendance`), `leaves/student-leaves` (`AdminLeaves`), `leaves/teacher-leaves` (`LeavesTeacherLeaves`), `leaves/staff-leaves` (`LeavesStaffLeaves`). Server barrels for `student-attendance`, `employee-attendance`, `leaves`.

- [ ] **Step 1: Append the failing block**

```ts
describe("attendance and leaves", () => {
  test("each row lives under its own sidebar module", () => {
    expect(rowHasScreen("student-attendance", "attendance")).toBe(true);
    expect(rowHasScreen("employee-attendance", "teacher-attendance")).toBe(true);
    expect(rowHasScreen("employee-attendance", "staff-attendance")).toBe(true);
    for (const row of ["student-leaves", "teacher-leaves", "staff-leaves"]) {
      expect(rowHasScreen("leaves", row)).toBe(true);
    }
  });
});
```

Expected: FAIL on `attendance`.

- [ ] **Step 2: Move the bodies and their private parts**

```bash
cd apps/web/src/modules
mkdir -p student-attendance/attendance employee-attendance/teacher-attendance employee-attendance/staff-attendance leaves/student-leaves leaves/teacher-leaves leaves/staff-leaves
git mv attendance/components/AdminAttendance.tsx        student-attendance/attendance/index.tsx
git mv attendance/components/adminAttendance            student-attendance/attendance/adminAttendance
git mv attendance/components/AdminStaffAttendance.tsx   employee-attendance/teacher-attendance/index.tsx
git mv attendance/components/adminStaffAttendance       employee-attendance/teacher-attendance/adminStaffAttendance
git mv attendance/components/AdminLeaves.tsx            leaves/student-leaves/index.tsx
```

`attendance/` keeps every `Teacher*`, `Student*`, `Parent*` screen and `SuperAdminBulkAttendanceImport.tsx`.

- [ ] **Step 3: Write the three thin entries**

```tsx
// apps/web/src/modules/employee-attendance/staff-attendance/index.tsx
import { StaffAttendance } from "../teacher-attendance";
export const EmployeeStaffAttendance = () => <StaffAttendance initialTab="staff" />;
```

```tsx
// apps/web/src/modules/leaves/teacher-leaves/index.tsx
import { AdminLeaves } from "../student-leaves";
export const LeavesTeacherLeaves = () => <AdminLeaves initialTab="teacher" />;
```

```tsx
// apps/web/src/modules/leaves/staff-leaves/index.tsx
import { AdminLeaves } from "../student-leaves";
export const LeavesStaffLeaves = () => <AdminLeaves initialTab="staff" />;
```

- [ ] **Step 4: Repoint the dispatcher**

Alias loop over `attendance/components/AdminAttendance|student-attendance/attendance`, `attendance/components/AdminStaffAttendance|employee-attendance/teacher-attendance`, `attendance/components/AdminLeaves|leaves/student-leaves`. Then add:

```tsx
const EmployeeStaffAttendance = dynamic(() => import('@/modules/employee-attendance/staff-attendance').then(m => m.EmployeeStaffAttendance), { loading: LoadingScreen });
const LeavesTeacherLeaves = dynamic(() => import('@/modules/leaves/teacher-leaves').then(m => m.LeavesTeacherLeaves), { loading: LoadingScreen });
const LeavesStaffLeaves = dynamic(() => import('@/modules/leaves/staff-leaves').then(m => m.LeavesStaffLeaves), { loading: LoadingScreen });
```

and rewrite the six cases:

```tsx
      case 'teacher-attendance': return <StaffAttendance key="teacher-att" initialTab="teacher" />;
      case 'staff-attendance': return <EmployeeStaffAttendance key="staff-att" />;
      case 'leaves': return <LeavesTeacherLeaves key="teacher-leaves-main" />;
      case 'student-leaves': return <AdminLeaves key="student-leaves" initialTab="student" />;
      case 'teacher-leaves': return <LeavesTeacherLeaves key="teacher-leaves" />;
      case 'staff-leaves': return <LeavesStaffLeaves key="staff-leaves" />;
```

`case 'leaves'` is not a nav row — it is the legacy bare key the staff sidebar still links — so it points at the teacher thin, which is what it rendered before. Net specifier change: **+3** (running total 74).

- [ ] **Step 5: Split the server `attendance` module**

```bash
cd apps/server/src/modules
mkdir -p student-attendance employee-attendance leaves
git mv attendance/attendance.routes.ts     student-attendance/attendance.routes.ts
git mv attendance/staffAttendance.routes.ts employee-attendance/staffAttendance.routes.ts
git mv attendance/leaves.routes.ts         leaves/leaves.routes.ts
git rm attendance/index.ts
```

Create one barrel per folder: `student-attendance/index.ts` → `export { attendanceRoutes } from './attendance.routes';`; `employee-attendance/index.ts` → `export { staffAttendanceRoutes } from './staffAttendance.routes';`; `leaves/index.ts` → `export { leavesRoutes } from './leaves.routes';`. Rewrite `modules/attendance/…` paths repo-wide, then confirm no rewritten line points at a file that moved elsewhere.

- [ ] **Step 6: Verify** — VERIFY-WEB + VERIFY-SERVER.
- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
git commit -m "refactor(attendance): split attendance/ into the three sidebar modules

One server module served student marking, employee attendance and leave management, which is why
the three sidebar modules had no place to point. attendance/ is now empty and deleted." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
```

---

### Task 8: `student-fees/` — the nine-row folder, reports, and the deferred thin entry

**Files:** 2 web bodies + 2 private parts folders + 1 hook + 1 thin entry; specifiers **+1**. Server: `finance/` keeps only the expenses SDL (Task 9) and gives its four fee files to `student-fees/`.

**Interfaces:**
- Produces: `student-fees/fees/index.tsx` (`AdminFees`), `student-fees/reports/index.tsx` (`AdminReports`), `transport/transport-fee/index.tsx` (`TransportTransportFee`); server `modules/student-fees/index.ts` exporting `feesRoutes`, `FeeService`, `FeeReceiptService` and the fee types.
- **Explicitly not built here:** `student-fees/classes/`, and by the same argument the nine other rows on Global Constraints' deferral list. A thin entry needs a dispatcher case that returns it; one bare `case 'classes'` serves `academics`, `students` and `student-fees`, so a folder here would be a file no URL can reach. Recorded against spec §4's count of 34 folders.

- [ ] **Step 1: Append the failing block**

```ts
describe("student-fees and transport", () => {
  test("the fee rows share one folder and reports has its own", () => {
    expect(rowHasScreen("student-fees", "fees")).toBe(true);
    expect(rowHasScreen("student-fees", "reports")).toBe(true);
    expect(rowHasScreen("transport", "transport-fee")).toBe(true);
  });
  test("student-fees/classes is NOT created until a case can reach it", () => {
    expect(rowHasScreen("student-fees", "classes")).toBe(false);
  });
});
```

Expected: FAIL on `fees`, and the second test **passes immediately** — it is a tripwire, not a target. If someone creates that folder early, this is the line that says why.

- [ ] **Step 2: Move the fee screen, its 26 parts and its private hook**

```bash
cd apps/web/src/modules
mkdir -p student-fees/fees/hooks student-fees/reports transport/transport-fee
git mv finance/components/AdminFees.tsx        student-fees/fees/index.tsx
git mv finance/components/adminFees            student-fees/fees/adminFees
git mv finance/hooks/use-fees.ts               student-fees/fees/hooks/use-fees.ts
git mv data-io/components/AdminReports.tsx     student-fees/reports/index.tsx
git mv data-io/components/adminReports         student-fees/reports/adminReports
```

`use-fees.ts` moves to `<target>/hooks/` because its consumers are the `adminFees/` parts files, which move with it. They do **not** reach it relatively — measured, all nine write it as an absolute alias (`@/modules/finance/hooks/use-fees`), so the alias is what must be rewritten, along with the one alias into the parts folder's types:

```bash
cd /d/per/inkwelly
grep -rl "@/modules/finance/hooks/use-fees" apps/web/src | xargs -r sed -i "s|@/modules/finance/hooks/use-fees|@/modules/student-fees/fees/hooks/use-fees|g"
grep -rl "@/modules/finance/components/adminFees/types" apps/web/src | xargs -r sed -i "s|@/modules/finance/components/adminFees/types|@/modules/student-fees/fees/adminFees/types|g"
```

`AdminFees.tsx` itself imports neither by relative path — its only cross-module reaches are `@/modules/access-control/hooks/use-permissions` and `@/modules/finance/data/billing-constants`, both of which stay put, so it needs no import edit at all.

`finance/` keeps `StudentFees.tsx`, `ParentFees.tsx`, `parentFees/*`, `SuperAdminBilling.tsx`, `superAdminBilling/*`, `data/` and `hooks/use-expenses.ts` — the expenses hook is Task 9's, so `finance/hooks/` still exists after this task and must not be removed here.

- [ ] **Step 3: Write the transport thin entry**

```tsx
// apps/web/src/modules/transport/transport-fee/index.tsx
import { AdminFees } from "@/modules/student-fees/fees";
export const TransportTransportFee = () => <AdminFees />;
```

- [ ] **Step 4: Repoint the dispatcher**

Alias loop over `finance/components/AdminFees|student-fees/fees` and `data-io/components/AdminReports|student-fees/reports`. Then add and split the one case:

```tsx
const TransportTransportFee = dynamic(() => import('@/modules/transport/transport-fee').then(m => m.TransportTransportFee), { loading: LoadingScreen });
```

```tsx
      case 'fees':
      case 'fee-categories':
      case 'fee-concessions':
      case 'make-payment':
      case 'check-receipt':
      case 'fee-status':
      case 'check-payments':
        return <AdminFees />;
      case 'transport-fee': return <TransportTransportFee />;
```

Net specifier change: **+1** (running total 75).

- [ ] **Step 5: Move the server fee files**

```bash
cd apps/server/src/modules
mkdir -p student-fees
git mv finance/fees.routes.ts finance/fee.service.ts finance/fee-receipt.service.ts finance/fees.types.ts student-fees/
```

Create `student-fees/index.ts`:

```ts
export { feesRoutes } from './fees.routes';
export { FeeService } from './fee.service';
export { FeeReceiptService } from './fee-receipt.service';
export type {
  FeeStatus, PaymentMethod, ConcessionType, FeeItem, FeeStats, ClassSummary,
  FeeListResult, FeeItemSummary, FeeReceiptRow, ReceiptStatsMethod, FeeReceiptStats,
  ConcessionRow, StructureRow,
} from './fees.types';
```

Rewrite the four moved files' import paths from the repo root:

```bash
cd /d/per/inkwelly
grep -rl "modules/finance/fees.routes\|modules/finance/fee.service\|modules/finance/fee-receipt.service\|modules/finance/fees.types" apps/server/src \
  | xargs -r sed -i 's|modules/finance/|modules/student-fees/|g'
```

Do **not** rewrite bare `modules/finance` — the expenses SDL still lives there until Task 9. Remove the four fee export statements (lines 2–8) from `finance/index.ts`, leaving only the two SDL lines Task 9 owns.

`data-io/reports.routes.ts` and `data-io/exports.routes.ts` **stay in `data-io/`** even though the web `reports` row moves to `student-fees/`. Spec §5 says so deliberately: reports and exports are one cross-domain aggregator, the server twin of `data-io`, and this is the one place the server does not mirror the web. Do not fold them in.

- [ ] **Step 5b: Update the guard test that names the finance barrel**

`apps/server/src/route-resolution.test.ts:70-85` asserts `/api/fees` resolves by importing `./modules/finance/index`. It reaches the barrel, not a file, so the `sed` above cannot catch it — and after step 5 the barrel no longer exports `feesRoutes`, so this is the test that fails first and loudest.

```ts
// fees moved to src/modules/student-fees/ (the sidebar module, not the domain). Importing
// through the barrel pins two things at once: the barrel re-exports feesRoutes under the same
// name, and /api/fees still resolves after the move.
test('fees resolves from its module barrel under both mounts', async () => {
  const { feesRoutes } = await import('./modules/student-fees/index');
```

Change only the import string and that comment; the assertions stay. Run: `cd apps/server && bun test src/route-resolution.test.ts` — expect the fees test to pass with `401`, which is the proof the mount survived the move.

- [ ] **Step 6: Verify** — VERIFY-WEB + VERIFY-SERVER, plus the layout test.
- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts apps/server/src/route-resolution.test.ts
git commit -m "refactor(student-fees): one folder for the eight fee rows, reports out of data-io

Nine sidebar rows, one screen: the eight fee rows share a folder because they render an identical
<AdminFees /> with no props, and transport/transport-fee is a thin entry over it. data-io/ keeps
SuperAdminReports -- only the admin reports row follows the sidebar. The route-resolution guard
moves with the barrel it imports, which is what proves /api/fees still mounts." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts apps/server/src/route-resolution.test.ts
```

---

### Task 9: `money-book/` — and the whole-file move that replaces the planned SDL split

**Files:** 1 web body + 1 parts folder + 1 hook; 1 specifier. Server: `finance/finance.typeDefs.ts` and `finance/finance.resolvers.ts` move **whole** to `money-book/`. Spec §5 records why nothing is split: neither file mentions `fee`, so `finance.*` is expenses-only, and `academic.*` mentions neither `promotion` nor `graduation` and therefore stays in `academics/`.

**Interfaces:**
- Produces: `money-book/expenses/index.tsx` (`ExpensesScreen`); server `modules/money-book/index.ts` exporting `moneyBookTypeDefs`-aliased `financeTypeDefs` and `financeQueries`/`financeMutations` **under their existing symbol names** (export names do not change).

- [ ] **Step 1: Append the failing block**

```ts
describe("money-book", () => {
  test("the expenses row lives under modules/money-book/", () => {
    expect(rowHasScreen("money-book", "expenses")).toBe(true);
  });
});
```

Expected: FAIL.

- [ ] **Step 2: Move the web screen, its parts and its private hook**

```bash
cd apps/web/src/modules
mkdir -p money-book/expenses/hooks
git mv finance/components/AdminExpenses.tsx money-book/expenses/index.tsx
git mv finance/components/adminExpenses     money-book/expenses/adminExpenses
git mv finance/hooks/use-expenses.ts        money-book/expenses/hooks/use-expenses.ts
```

Its single consumer is the screen itself, and it reaches the hook by absolute alias (verified: one line, `AdminExpenses.tsx:6`; `adminExpenses/` holds no parent-relative imports at all):

```bash
cd /d/per/inkwelly
grep -rl "@/modules/finance/hooks/use-expenses" apps/web/src | xargs -r sed -i "s|@/modules/finance/hooks/use-expenses|@/modules/money-book/expenses/hooks/use-expenses|g"
cd apps/web/src/modules && rmdir finance/hooks
```

- [ ] **Step 3: Repoint the dispatcher** — alias `finance/components/AdminExpenses|money-book/expenses`. Specifier count unchanged.

- [ ] **Step 4: Move the expenses SDL whole**

```bash
cd apps/server/src/modules
mkdir -p money-book
git mv finance/finance.typeDefs.ts   money-book/finance.typeDefs.ts
git mv finance/finance.resolvers.ts  money-book/finance.resolvers.ts
printf "%s\n" "export { financeTypeDefs } from './finance.typeDefs';" "export { financeQueries, financeMutations } from './finance.resolvers';" > money-book/index.ts
```

Then rewrite the two aggregator imports. Match on `modules/finance/finance.*` and **not** on `../modules/…`: the real lines read `'../../modules/finance/finance.typeDefs'`, so a pattern that includes one `../` would leave the other behind and emit `../../../modules/`, silently pointing above `src/`.

```bash
cd /d/per/inkwelly
sed -i "s|modules/finance/finance.typeDefs|modules/money-book/finance.typeDefs|" apps/server/src/graphql/typeDefs/index.ts
sed -i "s|modules/finance/finance.resolvers|modules/money-book/finance.resolvers|" apps/server/src/graphql/resolvers/index.ts
sed -n "s|^.*finance\.typeDefs.*$|  typeDefs: &|p" apps/server/src/graphql/typeDefs/index.ts
sed -n "s|^.*finance\.resolvers.*$|  resolvers: &|p" apps/server/src/graphql/resolvers/index.ts
```

and delete lines 9–10 (`financeQueries`/`financeMutations`, `financeTypeDefs`) from `finance/index.ts`. That file then has **zero** exports — after Task 8 removed its four fee statements, nothing is left to export — so `git rm apps/server/src/modules/finance/index.ts` and the folder is empty. Verify with:

```bash
cd /d/per/inkwelly
ls apps/server/src/modules/finance 2>&1        # expected: "No such file or directory"
grep -rn "modules/finance" apps/server/src     # expected: no output
```

If any `modules/finance` line survives it is a straggler import the sed missed, not a reason to keep the folder.

- [ ] **Step 5: Prove the schema did not change**

Run: `cd apps/server && bun test src/route-resolution.test.ts`
Expected: pass. That test builds the app and composes `typeDefs`, so a broken SDL import fails loudly. Then prove nothing but the two import paths changed:

Run (from the repo root): `git diff HEAD --stat -- apps/server/src/graphql`
Expected: two files, one changed line each — `typeDefs/index.ts` and `resolvers/index.ts`.
Run: `git diff HEAD -- 'apps/server/src/modules/money-book/*typeDefs*' 'apps/server/src/modules/money-book/*resolvers*' | grep -E "^[+-][^+-]" | grep -v "^+++ \|^--- " | head`
Expected: no output — the SDL bodies moved as whole files and were never edited. **If this shows content, you have re-introduced the split the spec removed; revert it.**

- [ ] **Step 6: Verify** — VERIFY-WEB + VERIFY-SERVER.
- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/graphql
git commit -m "refactor(money-book): expenses folder, expenses SDL moved whole

The spec planned to cut finance.* SDL in two on the belief it mixed fees with expenses. It never
mentions fee at all, so the whole pair belongs to money-book and nothing is split." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/graphql
```

---

### Task 10: `examinations/` and `homework/` — the last five folders, and the count raise

**Files:** 3 web bodies + 1 private parts folder + 2 thin entries; specifiers **+2** (75 → 77). Server: `assessment/` splits into `examinations/` + `homework/`, and `certificates/admitCards.routes.ts` joins `examinations/`.

**Interfaces:**
- Produces: `examinations/{exams,results-entry,published-results,print-marksheet,admit-cards}/`; exports `AdminExams`, `ExaminationsResultsEntry`, `ExaminationsPublishedResults`, `AdminPrintMarksheet`, `AdminAdmitCards`; server `modules/examinations/index.ts` and `modules/homework/index.ts`.

- [ ] **Step 1: Append the failing block**

```ts
describe("examinations", () => {
  test("every examinations row lives under modules/examinations/", () => {
    for (const row of ["exams", "results-entry", "published-results", "print-marksheet", "admit-cards"]) {
      expect(rowHasScreen("examinations", row)).toBe(true);
    }
  });
});
```

Expected: FAIL on `exams`.

- [ ] **Step 2: Confirm `adminExams` stays**

Run: `cd apps/web/src/modules && grep -rln "from ['\"]\./adminExams/" --include=*.tsx .`
Expected: `AdminExams.tsx`, `AdminPrintMarksheet.tsx`, `StudentMarksheet.tsx` (and any file inside `adminExams/` reaching a sibling). `StudentMarksheet` is a role screen that does not move, so the parts folder is cross-module shared and **stays at `assessment/components/adminExams/`** (spec §5).

- [ ] **Step 3: Move**

```bash
cd apps/web/src/modules
mkdir -p examinations/exams examinations/results-entry examinations/published-results examinations/print-marksheet examinations/admit-cards
git mv assessment/components/AdminExams.tsx          examinations/exams/index.tsx
git mv assessment/components/AdminPrintMarksheet.tsx examinations/print-marksheet/index.tsx
git mv certificates/components/AdminAdmitCards.tsx   examinations/admit-cards/index.tsx
git mv certificates/components/adminAdmitCards       examinations/admit-cards/adminAdmitCards
```

`certificates/` is now empty except nothing — `students/certificates` took `AdminCertificates` in Task 5 — so `git status` should show the folder gone; if a stray file remains, list it and decide by the same private-parts rule.

- [ ] **Step 4: Repoint the two exams screens at the staying parts folder**

```bash
cd apps/web/src/modules/examinations
sed -i "s|from './adminExams/|from '@/modules/assessment/components/adminExams/|g" exams/index.tsx print-marksheet/index.tsx
```

- [ ] **Step 5: Write the two thin entries**

```tsx
// apps/web/src/modules/examinations/results-entry/index.tsx
import { AdminExams } from "../exams";
export const ExaminationsResultsEntry = () => <AdminExams initialTab="results" />;
```

```tsx
// apps/web/src/modules/examinations/published-results/index.tsx
import { AdminExams } from "../exams";
export const ExaminationsPublishedResults = () => <AdminExams initialTab="published" />;
```

- [ ] **Step 6: Repoint the dispatcher, add the two specifiers, and raise the recorded counts**

Alias loop over `assessment/components/AdminExams|examinations/exams`, `assessment/components/AdminPrintMarksheet|examinations/print-marksheet`, `certificates/components/AdminAdmitCards|examinations/admit-cards`. Add:

```tsx
const ExaminationsResultsEntry = dynamic(() => import('@/modules/examinations/results-entry').then(m => m.ExaminationsResultsEntry), { loading: LoadingScreen });
const ExaminationsPublishedResults = dynamic(() => import('@/modules/examinations/published-results').then(m => m.ExaminationsPublishedResults), { loading: LoadingScreen });
```

```tsx
      case 'exams': return <AdminExams key="exams" initialTab="exams" />;
      case 'results-entry': return <ExaminationsResultsEntry key="results" />;
      case 'published-results': return <ExaminationsPublishedResults key="published" />;
```

Then set the guard's recorded specifier count and prove it is the number you meant:

```ts
// screen-registry.test.ts, tenant entry
    specifiers: 77,
    keys: 62,
```

Add to the audit comment: `// 69 -> 77 on 2026-09-29: the eight thin entries each take their own specifier.`

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts`
Expected: both tenant tests pass. If `specifiers` reports 76 or 78, do not edit the number — diff the specifier list against the 25 pairs in this plan and find which entry was missed or double-counted.

- [ ] **Step 7: Split the server `assessment` module**

```bash
cd apps/server/src/modules
mkdir -p examinations homework
git mv assessment/exams.routes.ts assessment/assessments.routes.ts assessment/grades.routes.ts assessment/submissions.routes.ts examinations/
git mv assessment/homework.routes.ts homework/homework.routes.ts
git mv certificates/admitCards.routes.ts examinations/admitCards.routes.ts
git rm assessment/index.ts
```

Create the barrels: `examinations/index.ts` exporting `examsRoutes`, `assessmentsRoutes`, `gradesRoutes`, `submissionsRoutes`, `admitCardsRoutes`; `homework/index.ts` exporting `homeworkRoutes`. Rewrite `modules/assessment/<file>` and `modules/certificates/admitCards.routes` repo-wide. `certificates/` keeps `certificates.routes.ts` and its barrel.

- [ ] **Step 8: Verify** — VERIFY-WEB + VERIFY-SERVER.
- [ ] **Step 9: Commit**

```bash
cd /d/per/inkwelly
DISP="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
# screen-registry.test.ts lives under apps/web/src/modules/, so it is already in scope.
git add apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
git commit -m "refactor(examinations): five folders for the exam rows, homework split from assessment

adminExams/ deliberately stays in assessment/: StudentMarksheet is a role screen that reads it, and
the private-parts rule forbids moving a folder across a boundary one consumer still stands on.
Tenant specifiers 75 -> 77, the eight thin entries accounted for." \
  -- apps/web/src/modules "$DISP" apps/server/src/modules apps/server/src/index.ts
```

---

### Task 11: Sweep, and the guard that keeps the convention

**Files:**
- Modify: `apps/web/src/modules/__tests__/module-keyed-layout.test.ts` (append the whole-map test)
- Delete: any emptied domain folder left by Tasks 3–10

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a permanent test that fails if a future admin screen is filed by domain instead of by sidebar module — spec §10, enforced rather than documented.

- [ ] **Step 1: Append the convention guard**

```ts
// The 33 live rows this plan gives a folder, read off adminPanelSections and cross-checked
// against the dispatcher's case keys. A row whose bare key is shared with a sibling module is
// NOT here -- see the deferral list two tests down. A new row that can be addressed today must
// appear here AND as a folder.
const LIVE_ROWS: [string, string][] = [
  ["iam", "iam-dashboard"], ["iam", "roles"], ["iam", "role-assignments"],
  ["iam", "permissions-catalog"],
  ["academics", "academic-years"], ["academics", "classes"], ["academics", "subjects"],
  ["academics", "timetable"], ["academics", "calendar"], ["academics", "school-settings"],
  ["students", "students"], ["students", "promotions"], ["students", "bulk-promote"],
  ["students", "graduated"], ["students", "certificates"],
  ["employees", "teachers"], ["employees", "staff"], ["employees", "parents"],
  ["student-attendance", "attendance"],
  ["employee-attendance", "teacher-attendance"], ["employee-attendance", "staff-attendance"],
  ["student-fees", "fees"], ["student-fees", "reports"],
  ["examinations", "exams"], ["examinations", "results-entry"],
  ["examinations", "published-results"], ["examinations", "print-marksheet"],
  ["examinations", "admit-cards"],
  ["leaves", "student-leaves"], ["leaves", "teacher-leaves"], ["leaves", "staff-leaves"],
  ["money-book", "expenses"], ["transport", "transport-fee"],
];

describe("the module-keyed convention", () => {
  test("33 of the 52 live rows have their own folder", () => {
    expect(LIVE_ROWS.length).toBe(33);
    for (const [module, row] of LIVE_ROWS) expect(rowHasScreen(module, row)).toBe(true);
  });

  test("the other 19 of the 52 live rows are 9 collapses and 10 deferrals", () => {
    // Collapsed onto a sibling folder in the same module, because their cases are stacked
    // fall-throughs with identical props:
    //   student-fees/fees <- fee-categories, fee-concessions, check-payments, make-payment,
    //                        check-receipt, fee-status, transport-fee            (7 rows)
    //   iam/iam-dashboard  <- security-pin, seed-defaults                          (2 rows)
    expect(rowHasScreen("student-fees", "fees")).toBe(true);
    expect(rowHasScreen("iam", "iam-dashboard")).toBe(true);

    // Deferred to routing Task 3. Each is a live row whose bare dispatcher key is shared with a
    // sibling module's row (reports x6 modules, classes x3, student-leaves x2, staff-leaves x2,
    // staff x2), and componentKey() returns the bare key, so no per-module case can reach a
    // folder for it yet. Creating one now is a file nothing imports.
    for (const [module, row] of [
      ["student-fees", "classes"], ["students", "classes"], ["students", "reports"],
      ["employees", "reports"], ["student-attendance", "reports"],
      ["student-attendance", "student-leaves"], ["employee-attendance", "reports"],
      ["employee-attendance", "staff-leaves"], ["employee-attendance", "staff"],
      ["money-book", "reports"],
    ]) {
      expect(rowHasScreen(module, row)).toBe(false);
    }

    // 33 folders built by this plan + 9 collapsed + 10 deferred = 52 live rows.
    expect(33 + 9 + 10).toBe(52);
  });

  test("no admin screen is still filed by domain", () => {
    for (const bare of [
      "AdminClasses", "AdminSubjects", "AdminStudents", "AdminTeachers", "AdminStaff",
      "AdminParents", "AdminFees", "AdminExpenses", "AdminExams", "AdminLeaves",
      "AdminAttendance", "AdminReports", "AdminCertificates", "AdminAdmitCards",
    ]) {
      const hits = ["people", "finance", "assessment", "attendance", "certificates", "data-io", "access-control"]
        .filter((d) => existsSync(join(MOD_ROOT, d, "components", `${bare}.tsx`)));
      expect(hits).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `cd apps/web && bun test src/modules/__tests__/module-keyed-layout.test.ts`
Expected: pass. If the last test lists a surviving domain path, that screen was missed by its module task — move it with MOVE-RECIPE before continuing.

- [ ] **Step 3: Delete emptied folders**

```bash
cd apps/web/src/modules && ls -d */ | tr -d '/' | while read d; do find "$d" -type f | grep -q . || echo "EMPTY: $d"; done
cd /d/per/inkwelly/apps/server/src/modules && ls -d */ | tr -d '/' | while read d; do find "$d" -type f | grep -q . || echo "EMPTY: $d"; done
```

For each `EMPTY:` line: `git ls-files <path> | head` first — a folder that still has tracked files was not fully moved, which is a bug to fix, not a folder to delete. Delete only genuinely empty leftovers (`rmdir`, or `git rm -r` if any tracked file remains by mistake and its content is already at the new path).

- [ ] **Step 4: Hunt stragglers by text, not by compiler**

Run: `grep -rn "@/modules/\(people\|finance\|assessment\|attendance\|certificates\|data-io\|access-control\|timetable\|tenancy\)/components/Admin" apps/web/src`
Expected: **no output.** Any hit is an admin screen reference the alias loop missed.

- [ ] **Step 5: Full verification, both apps**

```bash
cd apps/web  && bun run typecheck && bun test
cd ../server && bun run typecheck && bun run lint && bun test
cd .. && bun run build --filter=@inkwelly/web 2>&1 | tail -20
```

Expected: all green. The root `build` is the one check that catches a `dynamic()` path that `tsc` is content to leave as `any`.

- [ ] **Step 6: Prove a moved screen actually serves, and say what the proof covers**

Start the dev server (`cd apps/web && bun run dev`), wait for ready, then for one moved row per module:

Run: `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/demo-academy/<module>/<row>`
Expected: `200`. **A 200 proves compilation only** — `dynamic()` means the served HTML is a pre-hydration shell, so this never proves the right screen rendered. To actually prove the screen, open it with the browser tool and read a value the screen itself computes. If you cannot, report that the screens were not visually verified; do not report them as verified.

- [ ] **Step 7: Commit**

```bash
cd /d/per/inkwelly
# `git add <dir>` records the deletions from step 3 as faithfully as -A does, without the -A.
git add apps/web/src/modules apps/server/src/modules
git commit -m "chore(modules): clear emptied domain folders and guard the module-keyed layout

The layout test is what makes this a convention instead of a one-time cleanup: a new admin row
filed by domain fails CI, which is how a restructure undoes itself six months later. 33 folders
built, 9 rows collapsed onto a sibling, 10 deferred to qualified keys -- 52 live rows accounted." \
  -- apps/web/src/modules apps/server/src/modules
```

---

## After this plan

Three deferred tasks resume in the new shape, unchanged from the routing plan:

1. **Routing Task 3** — the sidebar emits qualified keys. This is the unblocking step for **all ten deferred folders**, and they land with it, one commit per module: `student-fees/classes`, `students/classes`, the five `*/reports` rows, `student-attendance/student-leaves`, `employee-attendance/staff-leaves`, `employee-attendance/staff`. Until then `componentKey()` returns the bare key, so `case 'reports'` can only ever serve one of six modules.
2. **Routing Task 4** — bookmarked bare screens converge onto the qualified URL.
3. **Routing Task 5** — the students class roster: `students/classes/` becomes a real body beside `academics/classes/` rather than a thin entry, using the `class-roster` override that `module-routes.ts:65` already reserves. That pair is the reason this plan exists.
