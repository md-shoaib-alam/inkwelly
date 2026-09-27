# Route Guard Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "a new `/api/*` route forgot its permission check" impossible to ship, by declaring every mounted route group's access tier in one registry that a single root-level guard enforces and a startup test audits.

**Architecture:** One registry file maps URL prefix → tier (`public` / `any-role` / `school` / `platform`) plus the module that unlocks it. A single `onBeforeHandle` hook installed on the root app consults it via one pure async function and denies with 401/403. Existing fine-grained in-handler checks stay exactly as they are — the registry is a coarse, un-forgettable outer gate, not a replacement.

**Tech Stack:** Bun 1.4.2, Elysia 1.4.30, `bun:test`, Drizzle + Postgres (local `appdb`), Redis-cached `AccessProfile`.

**Spec:** this file. Context lives in the project memory notes `project-platform-tier-grant-rules`, `project-elysia-lifecycle-verification-traps`, `project-graphql-authz-gate`.

## Global Constraints

- No git commit without explicit user approval, per folder (`server/`, `school-web/`, `test-app/`; the container root has no git). "Typecheck passed" is not permission to commit.
- Server typecheck: `cd server && bun run typecheck 2>&1 | grep -E "^(src|tmp)"` must print nothing.
- Tests: `cd server && bun test` (script exists; `src/route-resolution.test.ts` is the precedent for building a mini app from route instances).
- Do not change any response shape the shipped Expo app consumes, and do not turn a currently-allowed call into a denial: mobile leaves are not yet windowed and an app fix requires a publish.
- An absent caller gets **401**, never 403 — the web client only runs silent token refresh on 401.
- Logging stays on the hand-written console shim. No pino.
- `python` is not installed; use `bun` for scratch transforms, and delete every `tmp-*.ts` from `server/` before typechecking (the tsconfig has no `include`, so they pollute it).
- Platform tier (`super_admin` × `platformRole`, 15 modules) and school tier (`staff` × `customRole`, 20 modules) are separate. Never collapse them, never let `admin` satisfy a platform gate.

---

## Why this shape (read this before touching code)

Three facts were **measured this session** with `server/tmp-guard-probe.ts` (deleted after; reproduce it if you doubt any of this):

| Case | Shape | Result | Consequence |
|---|---|---|---|
| A | root `onBeforeHandle({as:'scoped'})` then `.use(child)` | child denied **403** | a root hook does reach mounted children |
| D | root `onBeforeHandle(...)` *local*, then `.use(child)` | child denied **407** | also reaches children — scoping is about the reverse trap, not this one |
| **E** | guard on sub-instance 1, then a *separate* sibling mount | sibling denied **409** | **scoped hooks leak forward across siblings** |
| F | scoped hook on a wrapper, `.use(child)` inside it | child denied **410** | per-mount wrappers "work" individually |

**E is the reason my earlier advice was wrong.** I suggested wrapping each mount in a guard helper (`guarded('platform', platformRoutes)`). Measured: once a scoped hook is declared in the chain that the root app composes, every *later* sibling inherits it. A per-mount decorator would have silently locked school routes behind the platform gate — the same class of invisible bug we just closed on `/api/platform`. So enforcement goes in **one** root hook, and the registry decides per URL prefix.

Coverage proof can't import `src/index.ts` (it calls `.listen()` at line 441, so importing it starts a server). It reads the source text and cross-checks the mounted identifiers instead — cheap, no port, fails on the exact mistake we care about.

Two traps in the matcher, both real in this codebase:
- `/api/platform` and `/api/platform-settings` share a name prefix. Matching must be **segment-aware** (`split('/')`), never `String.startsWith`.
- Every API group exists twice: `/api/v1/...` and legacy `/api/...`. Normalize the version segment away before lookup.
- `routes/integrations.ts` mixes tiers on purpose: `/integrations/providers` is open to any signed-in role, `/integrations/overview` is platform + `integrations`. A first-segment-only registry would 403 the teachers' catalog. So the registry supports **longest-prefix wins** with deeper keys.

Scoping decision, stated plainly: the registry's `school` tier is deliberately *documentary plus 401-only*, because `requirePermission` in the individual files already does the staff/customRole work. Tightening any `any-role` group is **not** in this plan (Task 8 lists the candidates for a later slice).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `server/src/lib/route-guards.ts` | The registry data, prefix normalisation, `verdictFor()` decision function | Create |
| `server/src/lib/route-guards.test.ts` | Unit tests for normalisation + verdicts; mount-coverage audit over `index.ts` source | Create |
| `server/src/lib/permissions.ts` | Export the verb→action map it already keeps private; nothing else changes | Modify |
| `server/src/index.ts` | Install the one root hook, right after `.use(bunCompression(...))` | Modify |
| `server/docs/plans/2026-09-26-route-guard-registry.md` | This plan | Created now |

---

## Task 1: Measure the mechanism before relying on it

**Files:**
- Create then delete: `server/tmp-guard-probe.ts`

**Interfaces:**
- Produces: confirmed answers recorded in this plan's "Findings" section below, consumed by Tasks 2–4.

- [ ] **Step 1: Re-run the four-case probe** and paste the exact command output into the "Findings" section at the bottom of this file. It must be run from `server/` so `node_modules` resolves.

```ts
import { Elysia } from 'elysia';

async function probe(label: string, build: () => Elysia, path: string) {
  const app = build().compile();
  const viaHandle = String((await app.handle(new Request('http://localhost' + path))).status);
  const s = Bun.serve({ port: 0, fetch: app.fetch });
  let viaListen = 'n/a';
  try { viaListen = String((await fetch(`http://localhost:${s.port}${path}`)).status); }
  finally { s.stop(true); }
  console.log(`${label.padEnd(34)} ${path.padEnd(12)} handle=${viaHandle} listen=${viaListen}`);
}

const deny = (status: number) => ({ set }: any) => { set.status = status; return { error: 'blocked' }; };

// A root scoped hook reaches a later .use() child?
await probe('A parent scoped then use(child)',
  () => new Elysia().onBeforeHandle({ as: 'scoped' }, deny(403))
    .use(new Elysia().get('/a', () => ({ ok: true }))), '/a');

// E scoped guard on one sibling must NOT hit the next sibling (it does — that's the finding)
await probe('E sibling isolation',
  () => new Elysia()
    .use(new Elysia({ name: 'guarded' }).onBeforeHandle({ as: 'scoped' }, deny(409))
      .use(new Elysia().get('/guarded', () => ({ ok: true }))))
    .use(new Elysia().get('/open', () => ({ ok: true }))), '/open');
```

- [ ] **Step 2: Prove the hook sees a real route only, and can see `user`.** Add to the same file: build an app with the root hook plus `authPlugin`'s global derive, mount a route, request an unmatched path and assert the hook did not run for it (404 from the router, hook log empty) and that a matched path with a bearer token reaches the hook with `user.id` set. Record whether TypeBox body validation runs before or after the root hook (last session it beat a scoped guard, which is why `{}` on `PUT /platform-settings` returned 400 instead of 403).

- [ ] **Step 3: Delete the scratch file.** `rm tmp-guard-probe.ts` — an undeleted `tmp-*.ts` makes `bun run typecheck` report errors that aren't in `src/`.

- [ ] **Step 4: Hold, do not commit.** Report the findings; wait for approval.

---

## Task 2: Registry + `verdictFor()` with unit tests

**Files:**
- Create: `server/src/lib/route-guards.ts`
- Create: `server/src/lib/route-guards.test.ts`
- Modify: `server/src/lib/permissions.ts` (export the verb→action helper)

**Interfaces:**
- Consumes: `platformMay`, `isRootPlatformAdmin`, `staffMay` from `./permissions`; `PlatformModule`, `PermissionModule`, `PermissionAction` types.
- Produces: `GuardTier`, `RouteGuard`, `ROUTE_GUARDS`, `normalizeGuardPath(path: string): string`, `guardKeyFor(normalized: string): string | null`, `verdictFor(opts: { path: string; method: string; user: GuardUser | null }): Promise<GuardDenial | null>`.

- [ ] **Step 1: Write the failing tests first** (`route-guards.test.ts`). These must not open a DB or a port: they call `normalizeGuardPath`/`guardKeyFor` directly, and for `verdictFor` they only assert the branches that resolve *before* the grant lookup (401, wrong tier, public, undeclared). The grant-lookup branch is covered in Task 5 against the real local DB.

```ts
import { test, expect, describe } from 'bun:test';
import { normalizeGuardPath, guardKeyFor, verdictFor } from './route-guards';

describe('path normalisation', () => {
  test('/api/v1 and /api collapse to the same key', () => {
    expect(normalizeGuardPath('/api/v1/tenants/42')).toBe('/tenants/42');
    expect(normalizeGuardPath('/api/tenants/42')).toBe('/tenants/42');
  });
  test('query strings and trailing slashes are irrelevant', () => {
    expect(normalizeGuardPath('http://x/api/v1/subscriptions?view=admin')).toBe('/subscriptions');
    expect(normalizeGuardPath('/api/notices/')).toBe('/notices');
  });
  test('platform never shadows platform-settings', () => {
    expect(guardKeyFor('/platform/audit-logs')).toBe('platform');
    expect(guardKeyFor('/platform-settings')).toBe('platform-settings');
  });
  test('longest registered prefix wins', () => {
    expect(guardKeyFor('/integrations/overview')).toBe('integrations/overview');
    expect(guardKeyFor('/integrations/providers')).toBe('integrations');
  });
});

describe('verdicts that need no grant lookup', () => {
  const root = { id: 'u1', role: 'super_admin', platformRoleId: null };
  test('public tier allows anonymous', async () => {
    expect(await verdictFor({ path: '/api/v1/ping', method: 'GET', user: null })).toBeNull();
  });
  test('gated tiers answer 401, not 403, for an absent caller', async () => {
    for (const p of ['/api/tenants', '/api/students', '/api/notices']) {
      expect(await verdictFor({ path: p, method: 'GET', user: null })).toEqual({
        deny: 401, message: 'Authentication required',
      });
    }
  });
  test('a school role is 403 on a platform prefix', async () => {
    expect(await verdictFor({ path: '/api/tenants', method: 'GET', user: { id: 'a', role: 'admin' } }))
      .toMatchObject({ deny: 403 });
  });
  test('a super_admin is 403 on a school-only prefix', async () => {
    expect(await verdictFor({ path: '/api/students', method: 'GET', user: root })).toMatchObject({ deny: 403 });
  });
  test('an undeclared, matched route fails closed', async () => {
    expect(await verdictFor({ path: '/api/brand-new-thing', method: 'GET', user: root }))
      .toMatchObject({ deny: 403, message: expect.stringContaining('not declared') });
  });
});
```

- [ ] **Step 2: Run and watch them fail.** `cd server && bun test src/lib/route-guards.test.ts` — expected: cannot resolve `./route-guards`.

- [ ] **Step 3: Lift the verb map out of `permissions.ts`.** `requirePlatformPermission` / `requirePermission` already translate a method to an action inline. Move that map into one exported helper and have both call it — do **not** create a second copy.

```ts
const METHOD_ACTIONS: Record<string, PermissionAction> = {
  GET: 'view', HEAD: 'view', OPTIONS: 'view',
  POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete',
};
export function actionForMethod(method: string): PermissionAction {
  return METHOD_ACTIONS[method.toUpperCase()] ?? 'view';
}
```

- [ ] **Step 4: Write `route-guards.ts`.**

```ts
import {
  platformMay, staffMay, isRootPlatformAdmin, actionForMethod,
  type PlatformModule, type PermissionModule,
} from './permissions';

export type GuardTier = 'public' | 'any-role' | 'school' | 'platform';

export interface GuardUser {
  id: string;
  role: string;
  platformRoleId?: string | null;
  tenantId?: string | null;
}

export interface GuardDenial { deny: 401 | 403; message: string }

export interface RouteGuard {
  /** Identifier mounted in src/index.ts, e.g. `tenantsRoutes`. The coverage audit matches on this. */
  mountedAs: string;
  tier: GuardTier;
  /** Only for tier 'platform' or 'school'. Omit when the file gates per-sub-instance. */
  module?: PlatformModule | PermissionModule;
  /**
   * Required for 'public' and 'any-role'. The reason is the review surface:
   * an un-gated prefix is allowed only when someone wrote down why.
   */
  reason: string;
}

/** Keyed by the first normalised segment, plus deeper keys where one file mixes tiers. */
export const ROUTE_GUARDS: Record<string, RouteGuard> = { /* Task 4 fills this in */ };

export function normalizeGuardPath(rawPath: string): string {
  const clean = rawPath.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
  const withoutApi = clean.replace(/^\/api(\/v1)?/, '');
  return withoutApi.replace(/\/+$/, '') || '/';
}

/** Longest registered prefix, matched on whole segments. */
export function guardKeyFor(normalized: string): string | null {
  const segs = normalized.split('/').filter(Boolean);
  for (let i = segs.length; i > 0; i--) {
    const key = segs.slice(0, i).join('/');
    if (ROUTE_GUARDS[key]) return key;
  }
  return null;
}

export async function verdictFor(
  { path, method, user }: { path: string; method: string; user: GuardUser | null }
): Promise<GuardDenial | null> {
  const key = guardKeyFor(normalizeGuardPath(path));
  // Unmatched normalised path ('/' => /api itself, /ping, /health) is never served
  // by this app's route table, so treat it as public rather than undeclared.
  const guard = key === null ? ROUTE_GUARDS[''] : ROUTE_GUARDS[key!];
  if (!guard) {
    return { deny: 403, message: `Route '${key ?? path}' is not declared in the guard registry` };
  }
  if (guard.tier === 'public') return null;
  if (!user) return { deny: 401, message: 'Authentication required' };

  if (guard.tier === 'any-role') return null;

  if (guard.tier === 'platform') {
    if (user.role !== 'super_admin') {
      return { deny: 403, message: 'Platform access required' };
    }
    if (!guard.module) return null;              // role-only coarse gate
    if (await isRootPlatformAdmin(user)) return null;
    return await platformMay(user, guard.module as PlatformModule, actionForMethod(method))
      ? null
      : { deny: 403, message: `Platform role lacks ${guard.module}` };
  }

  // tier === 'school': the staff/customRole decision already belongs to
  // requirePermission inside the route file. The registry only refuses the
  // wrong tier here, so a platform admin cannot wander into school data.
  if (user.role === 'super_admin') {
    return { deny: 403, message: 'Use the platform routes for cross-tenant data' };
  }
  if (guard.module && user.role === 'staff') {
    return await staffMay(user, guard.module as PermissionModule, actionForMethod(method))
      ? null
      : { deny: 403, message: `Role lacks ${guard.module}` };
  }
  return null;
}
```

- [ ] **Step 5: `bun test src/lib/route-guards.test.ts` → all green.** (With the empty registry in Step 4 the two `verdictFor` describes will fail; that is the signal to move to Task 4. Keep Step 6 as the order that leaves the suite green.)

- [ ] **Step 6: Hold, report, do not commit.**

---

## Task 3: Install the single root hook

**Files:**
- Modify: `server/src/index.ts` (immediately after `.use(bunCompression({ threshold: 1024 }))`, around line 127)

**Interfaces:**
- Consumes: `verdictFor` from `./lib/route-guards`.
- Produces: runtime enforcement for every mounted route group.

- [ ] **Step 1: Add the import** alongside the other `./lib/*` imports.

```ts
import { verdictFor } from './lib/route-guards';
```

- [ ] **Step 2: Add the hook.** One place, all prefixes, no per-mount decorator.

```ts
  // One coarse gate for every mounted group, driven by ROUTE_GUARDS. It is a
  // single root hook because a scoped hook declared on a composed sub-instance
  // leaks forward to sibling mounts — measured, see the plan. Fine-grained
  // module/action checks stay inside the route files.
  .onBeforeHandle({ as: 'scoped' }, async ({ request, user, set }: any) => {
    const verdict = await verdictFor({
      path: request.url,
      method: request.method,
      user: user ?? null,
    });
    if (verdict) {
      set.status = verdict.deny;
      return { error: verdict.message };
    }
  })
```

- [ ] **Step 3: Verify against the running server** (local DB is authorized; `bun run dev` in one shell):

```bash
curl -s -o /dev/null -w '%{http_code}\n' localhost:4000/api/platform      # want 401 (was 200 pre-fix)
curl -s -o /dev/null -w '%{http_code}\n' localhost:4000/api/ping          # want 200
curl -s -o /dev/null -w '%{http_code}\n' localhost:4000/api/health        # want 200
```

- [ ] **Step 4: Guard against the regression that matters most — the shipped Expo app.** With a `teacher` and a `parent` token, call the leaves `test-app` actually hits (`/api/dashboard`, `/api/attendance/*`, `/api/notices`, `/api/notifications`, `/api/homework`, `/api/leaves`, `/api/submissions`) and confirm every status is unchanged from before the hook. Capture the list in the task report; a single new 403 here means a publish is needed, which is the one thing this plan must not cause.

- [ ] **Step 5: `bun run typecheck`** → nothing from `src/`.

- [ ] **Step 6: Hold, report, do not commit.**

---

## Task 4: Declare all 35 groups and audit the mounts

**Files:**
- Modify: `server/src/lib/route-guards.ts` (fill `ROUTE_GUARDS`)
- Modify: `server/src/lib/route-guards.test.ts` (add the coverage audit)

**Interfaces:**
- Consumes: `src/index.ts` text (`Bun.file`), `ROUTE_GUARDS`.
- Produces: the coverage guarantee — an undeclared mount fails `bun test`.

- [ ] **Step 1: Write the failing coverage audit.**

```ts
import { file } from 'bun';

test('every route group mounted in index.ts is declared in the registry', async () => {
  const src = await file('src/index.ts').text();
  const mounted = new Set(
    [...src.matchAll(/\.use\((\w*(?:Routes|Route))\)/g)].map((m) => m[1])
  );
  const declared = new Set(Object.values(ROUTE_GUARDS).map((g) => g.mountedAs));
  const undeclared = [...mounted].filter((name) => !declared.has(name));
  expect(undeclared).toEqual([]);
});

test('no declared guard names a route file that is not mounted', () => {
  const srcFileSync = ROUTE_GUARDS; // registry self-check: every entry needs a reason
  for (const [key, g] of Object.entries(srcFileSync)) {
    if (g.tier === 'public' || g.tier === 'any-role') {
      expect(g.reason.length, `${key} needs a written reason for being un-gated`).toBeGreaterThan(15);
    }
  }
});
```

- [ ] **Step 2: `bun test src/lib/route-guards.test.ts`** → fails listing the ~35 missing names. That list is the work order.

- [ ] **Step 3: Fill in the registry.** Values below were read from the route files this session; re-read each file before shipping, and if a row disagrees with the code, **the code wins** — record the disagreement in your report instead of "fixing" it silently.

| key | `mountedAs` | tier | module | why |
|---|---|---|---|---|
| `''` | *(none — root-level handlers)* | public | | `/api/ping` is a no-DB liveness probe; `/api/health` is throttled |
| `graphql` | `graphqlRoutes` | public | | builds its own context and already refuses anonymous; see `project-graphql-authz-gate` |
| `swagger` | *(via app)* | public | | docs; already CSP-restricted |
| `auth` | `authRoutes` | public | | login/refresh must be reachable unauthenticated |
| `platform` | `platformRoutes` | platform | *(none)* | mixed file: module gates hang off sub-instances inside it (`audit-logs`, `billing`, `users`, root-only debug) |
| `super-admins` | `superAdminsRoutes` | platform | *(none)* | root-only leaves guarded in-file |
| `performance` | `performanceRoutes` | platform | `analytics` | platform telemetry only |
| `platform-settings` | `platformSettingsRoutes` | platform | `settings` | matches its in-file guard |
| `tenants` | `tenantsRoutes` | platform | `tenants` | cross-tenant reach *is* this grant |
| `integrations` | `integrationsRoutes` | any-role | | `/integrations/providers` is the vendor catalog, open to staff by design |
| `integrations/overview` | `integrationsRoutes` | platform | `integrations` | cost/usage view |
| `billing` | `subscriptionsRoutes` | *(see `subscriptions`)* | | |
| `subscriptions` | `subscriptionsRoutes` | any-role | | parents purchase/cancel/resume here (Expo depends on it); the `admin-*` and `?view=admin` leaves gate on `billing` in-file |
| `students` | `studentsRoutes` | school | `students` | |
| `teachers` | `teachersRoutes` | school | `teachers` | |
| `classes` | `classesRoutes` | school | `classes` | |
| `attendance` | `attendanceRoutes` | school | `attendance` | QR scan burn + 120s rotation live here — do not alter semantics |
| `staff-attendance` | `staffAttendanceRoutes` | any-role | | staff record their own attendance |
| `grades` | `gradesRoutes` | school | `grades` | |
| `assessments` | `assessmentsRoutes` | any-role | | teacher/parent reads of their own rows |
| `submissions` | `submissionsRoutes` | any-role | | student/parent uploads |
| `homework` | `homeworkRoutes` | any-role | | per-user scoping in-handler |
| `exams` | `examsRoutes` | any-role | | mixed; in-handler role branches |
| `fees` | `feesRoutes` | school | `fees` | |
| `tickets` | `ticketsRoutes` | any-role | | parents open tickets; platform `support` grant checked in-file |
| `notices` | `noticesRoutes` | school | `notices` | |
| `notifications` | `notificationsRoutes` | any-role | | token-scoped FCM registration + bell counts |
| `parents` | `parentsRoutes` | school | `parents` | |
| `subjects` | `subjectsRoutes` | school | `subjects` | |
| `timetable` | `timetableRoutes` | school | `timetable` | |
| `transport` | `transportRoutes` | any-role | | bus/vehicle views for parents |
| `events` | `eventsRoutes` | any-role | | calendar reads |
| `calendar` | *(in `events`)* | any-role | | if it is a separate mount, declare it |
| `leaves` | `leavesRoutes` | any-role | | staff apply their own; approval checked in-file |
| `certificates` | `certificatesRoutes` | school | `certificates` | |
| `promotions` | `promotionsRoutes` | school | `promotions` | |
| `admit-cards` | `admitCardsRoutes` | any-role | | parent-facing card download |
| `roles` | `rolesRoutes` | any-role | | school custom-role CRUD, escalated inside the file (task #16) |
| `tenant-settings` | `tenantSettingsRoutes` | any-role | | tenant-scoped settings, handler-side checks |
| `staff` | `staffRoutes` | school | `staff` | |
| `dashboard` | `dashboardRoutes` | any-role | | every role gets its own slice; scoped by JWT |
| `exports` | `exportsRoutes` | school | `reports` | section sub-guards inside the file stay |
| `imports` | `importsRoutes` | school | `students` | |
| `import` | `importRoute` | school | `students` | single-leaf mount used by the importer |
| `health` | `healthRoutes` | public | | `/api/v1/health` rich probe |

- [ ] **Step 4: `bun test src/lib/route-guards.test.ts` → green**, and the unit tests from Task 2 now pass too (the registry exists).

- [ ] **Step 5: `bun run typecheck`** → clean. **Step 6: Hold, report, do not commit.**

---

## Task 5: Prove it in reality, not just in unit tests

**Files:**
- Create then delete: `server/tmp-guard-sweep.ts`

**Interfaces:**
- Consumes: the real app via `bun run dev` on :4000, `scripts`-style e2e precedent `platform-permissions.e2e.ts`.
- Produces: a table of expected vs. actual verdicts per prefix per caller, pasted into the report.

- [ ] **Step 1: Boot on an ephemeral port** (never `app.handle()` for verdict assertions — it skips `onAfterResponse`; `listen(0)` is the proven shape in this repo).

```ts
const proc = Bun.spawn(['bun', 'run', 'src/index.ts'], { cwd: import.meta.dir, env: process.env });
await new Promise((r) => setTimeout(r, 2500));
```

- [ ] **Step 2: Sweep every declared prefix with four callers** — anonymous, `teacher`, school `admin`, scoped `super_admin` (a `platformRole` holding only `billing`), root `super_admin`. Assert:

| caller | platform prefix | school prefix | any-role prefix | public |
|---|---|---|---|---|
| anonymous | 401 | 401 | 401 | 200 |
| teacher | 403 | per grant | 200 | 200 |
| school admin | 403 | 200 | 200 | 200 |
| scoped super_admin | 200 only under `billing` | 403 | 200* | 200 |
| root super_admin | 200 | 403 | 200* | 200 |

\* any-role prefixes answer for the caller's own rows; the sweep only asserts "not 403-by-registry".

- [ ] **Step 3: Any surprise is a declaration bug, not a test bug.** Fix the registry row, re-run. Do not paper over with `expect(...).toBeTruthy()`.

- [ ] **Step 4: Clean up.** Delete the sweep, and assert the DB holds no `e2e-%` users/roles (`select id,email from "User" where email like 'e2e-%'`). Stop the spawned server.

- [ ] **Step 5: `bun run typecheck`** + `bun test` → both clean. **Step 6: Hold, report, do not commit.**

---

## Task 6: Record it where the next person will hit it

**Files:**
- Modify: `server/docs/architecture-health-report.md` (append a "Guard registry" section) — or a short `server/docs/route-guards.md` if you prefer separation
- Memory: update `project-platform-tier-grant-rules.md`, add the cross-sibling scoped-hook leak to `project-elysia-lifecycle-verification-traps.md`

- [ ] **Step 1: Write the 10-line rule:** new mount → add a `ROUTE_GUARDS` row or `bun test` fails; scoped hooks leak forward across siblings, so enforcement is one root hook; a missing caller is 401; platform and school tiers never collapse.
- [ ] **Step 2: Save both memory files, then the `MEMORY.md` index line** (two-step process, index hook under 150 chars).
- [ ] **Step 3: Hold, report, do not commit.**

---

## Explicitly NOT in this plan

1. **Tightening any `any-role` groups to `school`.** `dashboard`, `exams`, `leaves`, `roles`, `tenant-settings`, `tickets`, `transport` and friends are truthful today: they require a token and decide per-role inside the handler. Changing those semantics is a behavior change with Expo-app exposure and deserves its own slice.
2. **Replacing the in-file module/action checks.** Defense in depth, and only the handlers know `?view=admin` versus `?parentId=`, or `admin-*` versus parent self-service.
3. **The other reported findings**, carried forward unchanged: invalid enum → 500 on `POST /ticket-categories`; `POST /subscriptions` cancel/resume/add-addon missing an ownership check; GraphQL subscription `parentId` unverified; no web-side dispatcher enforcement for deep links; dead `/platform/audit-logs`, `/billing`, `/users`, `/test-queue` (dead *as mounts* — `/platform/audit-logs` and `/platform/billing` and `/platform/users` are live sub-instances; re-check before deleting anything); `manage-admins` granting nothing; billing screens needing `billing`+`tenants`; `monthlyData`/`billingData` still `Math.random()`.
4. **Committing.** Local-DB test permission is not git permission.

## Verification gates (run all, in order, at the end)

```bash
cd /d/per/drizzelfull/server  && bun run typecheck 2>&1 | grep -E "^(src|tmp)"   # want: no output
cd /d/per/drizzelfull/server  && bun test                                        # want: all green
cd /d/per/drizzelfull/school-web && node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
cd /d/per/drizzelfull/test-app   && node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit
```

## Findings (Task 1 fills in)

- A root scoped hook reaches mounted children: **yes — measured, /a 403**
- A root *local* hook reaches children: **yes — measured, /d 407**
- Scoped hook leaks to later siblings: **yes — measured, /open 409. This is the constraint that forced the single-root-hook design.**
- Wrapper-per-mount works in isolation: **yes, but poisoned by the leak above**
- Unmatched URL vs. hook ordering: `[needs confirming]`
- TypeBox validation vs. root hook order: `[needs confirming]` (last session: validation beat a scoped guard, `{}` → 400)
- `handle()` vs `listen(0)` agreement: **identical for onBeforeHandle in every case above**
