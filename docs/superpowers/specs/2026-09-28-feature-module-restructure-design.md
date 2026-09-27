# Feature-Module Restructure — Design

Date: 2026-09-28
Status: awaiting user review
Scope: `apps/web`, `apps/server`, `apps/mobile` inside the `@inkwelly` turborepo

## 1. Problem

Three different organising axes are in use at once:

| app | current axis | symptom |
|---|---|---|
| `apps/web` | role — `components/screens/{admin,teacher,student,parent,staff,super-admin}/` | the same domain repeats in 5–6 folders; a fees change touches `admin/fees`, `parent/fees`, `student/fees`, `super-admin/billing` |
| `apps/server` | layer — `routes/`, `services/`, `graphql/resolvers/`, `graphql/typeDefs/`, `types/` | one domain is split across four places with inconsistent naming: `routes/fees.ts` + `services/fee.service.ts` + `graphql/resolvers/finance.resolvers.ts` |
| `apps/mobile` | mixed — `components/{admin,teacher,student}` **and** `components/{attendance,timetable,students}` | neither convention is reliable enough to follow |

Additionally: 49 places where `fees.tsx` and a sibling `fees/` folder coexist (resolution silently prefers the file), and 30 source files over 30 KB (web 12, server 6, mobile 12; largest `super-admin/bulk-attendance-import.tsx` at 93 KB).

## 2. Decisions already taken

1. **Axis:** feature modules inside each app (approach A). Role becomes part of the component name, not a folder.
2. **Depth:** relocate only. Splitting oversized files is a separate later pass, one module at a time.
3. **Shared `packages/`:** out of scope for this phase. Deferred duplicates are listed in §9.

## 3. Target taxonomy — 16 modules

Derived from `apps/server/docs/PRD.md` §3 ("Functional design, module by module"), not from the 34 server route filenames.

| module | absorbs |
|---|---|
| `auth` | auth, profile, security settings, session |
| `tenancy` | tenants, tenant-settings, subscriptions, manage-plan, school-detail, deleted-tenants |
| `platform` | platform, platform-settings, super-admins, analytics, audit-logs, integrations, queue-status, roadmap, performance |
| `access-control` | roles, permission constants (`PERMISSION_MODULES`, `STAFF_SCREEN_MODULES`) |
| `people` | students, staff, teachers, parents, children, users, manage-admins |
| `academics` | classes, subjects, academic-years, promotions |
| `attendance` | attendance, staff-attendance, take-attendance, my-attendance, leaves, bulk-attendance-import |
| `finance` | fees, fee-categories, fee-concessions, make-payment, check-receipt, fee-status, check-payments, expenses |
| `assessment` | exams, grades, assessments, homework, submissions, marksheet, print-marksheet, exams-entry, grade-management |
| `timetable` | timetable, calendar |
| `communication` | notices, events, notifications, send-notification, platform-notices |
| `support` | tickets |
| `certificates` | certificates, admit-cards |
| `transport` | transport, transport-fee |
| `data-io` | reports, exports, imports |
| `dashboard` | per-role dashboard aggregators |

Ambiguous placements, decided here so they are not re-litigated per file: `events` → `communication` (PRD 3.9 groups them); `leaves` → `attendance`; `transport-fee` → `transport` (not `finance`); `calendar` → `timetable`; `billing` (super-admin) → `finance`; `school-subscriptions` → `tenancy`.

## 4. Target trees

### `apps/server`

```
src/
  index.ts                     # composition root: .use(routes) + GraphQL wiring — stays
  modules/
    finance/
      fees.routes.ts           # from routes/fees.ts
      fee.service.ts           # from services/fee.service.ts
      fee-receipt.service.ts   # from services/fee-receipt.service.ts
      finance.resolvers.ts     # from graphql/resolvers/finance.resolvers.ts
      finance.typeDefs.ts      # from graphql/typeDefs/finance.typeDefs.ts
      fees.types.ts            # from types/fees.ts (currently the only file in types/)
      index.ts
    attendance/  people/  academics/  assessment/  … (16 total)
  db/**                        # NOT split — see rule below
  lib/**                       # cross-cutting infra stays (redis, env, validation, monitoring, integrations)
  auth/**                      # → modules/auth/, content unchanged
  graphql/**                   # shrinks to client setup + index.ts only
```

### `apps/web`

```
src/
  app/**                                   # UNCHANGED — every URL stays byte-identical
  modules/
    finance/
      components/
        AdminFees.tsx                      # from screens/admin/fees.tsx
        ParentFees.tsx                     # from screens/parent/fees.tsx
        StudentFees.tsx                    # from screens/student/fees.tsx
        SuperAdminBilling.tsx              # from screens/super-admin/billing.tsx
        fees/                              # the old screens/admin/fees/ folder (tabs, dialogs)
      hooks/  data/  types/
      index.ts
  components/
    ui/  layout/  providers/  shared/      # screens/ is removed
  lib/  store/  hooks/                       # generic infra only
```

### `apps/mobile`

Same `modules/` shape. `src/app/**` unchanged (Expo router URLs). `components/{admin,teacher,student,parent,staff}` and the existing partial feature folders (`attendance`, `timetable`, `students`) all fold into the 16 modules; `components/ui`, `providers`, `common`, `themed-*` stay.

## 5. Rules

1. **Modules never import each other's internals.** Cross-module access goes through the module's `index.ts` barrel only. This binds module→module traffic; the composition layers (`app/**`, and the web `tenant-screen-dispatcher`) are deliberately exempt, because rule 3 requires them to address component files directly.
2. **`db/` and `lib/` are shared layers.** A Drizzle schema with cross-module foreign keys cannot be sliced per module without circular imports and migration churn, so `db/schema.ts`, `db/schema/`, `db/relations.ts` remain one shared layer that any module may import.
3. **Lazy-loaded screens import the file path, not the barrel.** The two web screen registries hold 93 `dynamic(() => import(...))` calls between them (67 + 26) whose entire purpose is per-screen code splitting. Importing a barrel would collapse every screen in a module into one chunk — a real performance regression. So `dynamic(() => import('@/modules/finance/components/AdminFees'))` stays file-level; barrels are only for eager imports.
4. **Route files never move.** `apps/web/src/app/**` and `apps/mobile/src/app/**` are filesystem routers; moving them changes public URLs.
5. **The URL screen-key contract is frozen.** Web has **two** lazy screen registries, not one: `(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` (67 specifiers, 58 keys) and `(authenticated)/[slug]/generic-slug-dispatcher.tsx` (26 specifiers, 20 keys, holds `billing`). Every `case` label in both, `navItems` keys in `components/layout/nav-config.ts`, and the `STAFF_SCREEN_MODULES` permission map keep identical string values. Only import specifiers change.
6. **Tests stay co-located** as `<subject>.test.ts` beside their subject inside the module.
7. **`X.tsx` + `X/` collisions** resolve as `X.tsx → modules/<m>/components/<Role>X.tsx`, `X/* → modules/<m>/components/<x>/*`.

## 6. Enforcement (this is what stops it rotting)

There is currently **no boundary-enforcing rule anywhere**: `apps/web/eslint.config.mjs` is Next defaults with ~30 rules switched off, `apps/mobile/eslint.config.js` likewise, and `apps/server` has **no eslint config at all**. A move without enforcement reverts within a few sessions.

- Add `eslint-plugin-boundaries` to web and mobile: `modules/*` may import `app`, `components/ui`, `lib`, `store`, `db` freely; may import another module **only** via its barrel; may not import `modules/*/components/**` directly.
- Add a new `apps/server/eslint.config.mjs` with the same boundaries rules.
- Wire into the existing `lint` task so `turbo run lint` fails on a violation.

## 7. Sequencing

| step | work | gate (must pass before next step) |
|---|---|---|
| 0 | Baseline commit of the current tree | user approves the commit; without it a ~1,000-file move has no reviewable diff and no rollback |
| 1 | **`finance` slice in all three apps**, end to end | `bunx turbo run typecheck test build` green; web build succeeds; `expo config` loads |
| 2 | Boundary lint rules (web, mobile, new server config) | `turbo run lint` green |
| 3 | Remaining 15 modules, one domain slice at a time | `typecheck` per slice, full `build` + `test` at the end |

Step 1 is deliberately domain-first rather than app-first: it proves the pattern against a real API + screen pair before 1,000 files commit to it, and it lands enforcement while there are still few modules to police.

## 8. Verification

Every slice is checked with commands, never by eye:

```sh
bunx turbo run typecheck          # catches every broken import specifier
bunx turbo run test               # 31 server tests must stay passing
bunx turbo run build              # next build proves the lazy-import graph still resolves
bunx turbo run lint               # boundary violations
```

Plus two new guard tests added in step 1, because typecheck alone cannot catch a *silently dropped* file:

- **web:** asserts every screen key the dispatcher's `switch` handles resolves to an existing component file. This is a static source scan (read the dispatcher, check each import specifier exists on disk) — no DOM, no React rendering — so it runs under `bun test` and needs no new framework. It does need `"test": "bun test"` added to `apps/web/package.json`, because **`apps/web` and `apps/mobile` have zero tests and no test runner today**; all 9 existing test files are in `apps/server` (8 under `src/lib/`, plus `src/route-resolution.test.ts`).
- **server:** asserts every declared route is registered in the composition root. `src/route-resolution.test.ts` already exists and covers this — extended, not invented.

`apps/mobile` gets no guard test in this phase: its router is filesystem-driven and `app/**` never moves (rule 4), so `typecheck` plus `expo config` loading is the whole signal available there.

## 9. Known issues recorded, deliberately out of scope

- **Dead code (~31 KB, verifiably unreferenced anywhere, including package scripts):** `apps/server/src/db/seed_bulk.ts`, `apps/server/src/db/seed_huge.ts`, `apps/web/src/components/screens/teacher/dashboard_components/DashboardIllustrations.tsx`, `apps/mobile/src/store/protected-route.tsx`, and the empty `apps/web/src/components/screens/admin/old/`. Deleted as step 0 housekeeping, not as part of any module move. `protected-route.tsx` gets a human check first — a store file by that name may be aspirational rather than dead.
- **The 4 `students.ts` `minLength` type errors are gone.** They were a symptom of the `@sinclair/typebox` dedupe below, not an elysia/zod problem: with `^0.34.52` pinned in `apps/server`, `bunx turbo run typecheck` reports 0 errors across all three apps (re-verified 2026-09-28).
- **`/api/v1/health` has no timeout on its dependency checks.** The handler `await`s live Postgres and Redis pings, so when the database is unreachable the request blocks for the driver's full connect timeout (~20 s observed). `src/route-resolution.test.ts` probes that route, so the server test suite fails whenever Docker Desktop is paused. Not caused by this restructure; recorded so a red `route-resolution` test is read as "check Docker" rather than "a module move broke something".
- **Hoisting hazard, already hit once during this conversion.** The bun `hoisted` linker (required for Expo/Metro in a monorepo) deduped `@sinclair/typebox` to `0.27.12`, the version `@jest/schemas` wanted, breaking elysia, which requires `^0.34`. Symptom was `SyntaxError: Export named 'Unsafe' not found` and 4 failing server tests. Fixed by declaring `@sinclair/typebox@^0.34.52` in `apps/server` dependencies; suite went 17 pass / 4 fail / 3 errors → 31 pass / 0 fail. Rule: after any dependency change, run `bun install` and `bunx turbo run test`, and read bun's peer-dependency warnings rather than skimming past them.
- **Deferred duplicates for a later `packages/` phase:** web and mobile each carry an ~41 KB `StudentOverviewTab`; the billing catalog is mirrored between `server/src/lib/plans.ts` and `web/src/lib/billing-constants.tsx`, and `PERMISSION_MODULES` is mirrored between web and `server/src/lib/permissions.ts`. The PRD names these mirror pairs as load-bearing; they are the strongest argument for a shared-types package, and they are not touched here.
- **30 source files over 30 KB** (largest: `web/.../super-admin/bulk-attendance-import.tsx` at 93 KB) — split in the follow-up pass per decision 2.

## 10. What "done" looks like

`apps/{web,server,mobile}/src/modules/<16 domains>/`, `app/**` byte-identical, zero URL or screen-key changes, `components/screens/` gone from web, `routes/`+`services/`+per-domain `graphql/` gone from server, boundary lint rules failing CI on cross-module internals, and `turbo run typecheck test build lint` all green.
