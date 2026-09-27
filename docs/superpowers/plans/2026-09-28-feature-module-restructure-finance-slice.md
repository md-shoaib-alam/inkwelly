# Feature-Module Restructure — Finance Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every finance-related source file in `apps/web`, `apps/server` and `apps/mobile` into a `src/modules/finance/` directory, add a guard test that proves no screen was dropped, and add lint rules that stop the layout from decaying.

**Architecture:** Feature modules live inside each app. `app/**` route files never move (they are the public URL contract). Cross-module imports go through a module barrel, except lazily-loaded screens, which must keep addressing the concrete file so code-splitting survives. `db/` and `lib/` stay shared.

**Tech Stack:** bun 1.4.2 workspaces with `linker = "hoisted"`, Turborepo 2.11.4, Next.js 16 App Router, Expo SDK 57 / expo-router, Elysia 1.4.30 + Drizzle + graphql-yoga, TypeScript 5.9.3, `bun:test`, `eslint-plugin-boundaries` 7.2.0.

**Spec:** `docs/superpowers/specs/2026-09-28-feature-module-restructure-design.md` — read it with this plan; it carries the 16-module taxonomy and the seven rules this plan implements.

## Global Constraints

- `apps/web/src/app/**` and `apps/mobile/src/app/**` are never moved, renamed or deleted. (spec rule 4)
- The URL screen-key contract is frozen: every `case '…'` label in `tenant-screen-dispatcher.tsx`, every `navItems` key in `apps/web/src/components/layout/nav-config.ts`, and every key of `STAFF_SCREEN_MODULES` / `PERMISSION_MODULES` keeps its exact string. Only import specifiers change. (spec rule 5)
- Lazily-loaded screens import the **file path**, never the module barrel. (spec rule 3)
- `src/db/**` and `src/lib/**` are shared layers and are not split per module. (spec rule 2)
- No new runtime dependencies except `eslint-plugin-boundaries` (dev). Never remove the existing `@sinclair/typebox@^0.34.52` pin from `apps/server` — the hoisted linker will otherwise dedupe it to 0.27.x and break elysia. (spec §9)
- Server code uses **relative** imports (its tsconfig has no `paths`). Web and mobile use `@/*` → `./src/*`.
- Green pipeline means: `bunx turbo run typecheck`, `bunx turbo run test` (31 server tests, 0 fail), `bunx turbo run build` (web `next build` succeeds).
- Commits are local only. Never `git push`.

## File Structure

Created:

```
apps/server/src/modules/finance/index.ts        barrel: exports fee routes + services + resolvers
apps/web/src/modules/finance/index.ts           barrel for eager consumers only
apps/web/src/modules/finance/data/              billing-constants.tsx
apps/web/src/modules/finance/hooks/             use-fees.ts, use-expenses.ts
apps/web/src/modules/finance/components/        AdminFees.tsx, ParentFees.tsx, StudentFees.tsx,
                                                AdminExpenses.tsx, SuperAdminBilling.tsx,
                                                adminFees/, adminExpenses/, parentFees/, superAdminBilling/
apps/web/src/modules/__tests__/screen-registry.test.ts
apps/mobile/src/modules/finance/index.ts
apps/mobile/src/modules/finance/components/     adminFees/, parentFees/, adminExpenses/
apps/mobile/src/modules/transport/components/   adminFeesTransport/      (3 bus-fee files, spec §3 → transport)
apps/server/eslint.config.mjs                   new — server has no eslint config today
```

Moved (all with `git mv`, never copy-then-delete):

| from | to | import-depth effect |
|---|---|---|
| `apps/server/src/routes/fees.ts` | `apps/server/src/modules/finance/fees.routes.ts` | `'../x'` → `'../../x'` |
| `apps/server/src/services/fee.service.ts` | `…/modules/finance/fee.service.ts` | `'../x'` → `'../../x'` |
| `apps/server/src/services/fee-receipt.service.ts` | `…/modules/finance/fee-receipt.service.ts` | `'../x'` → `'../../x'` |
| `apps/server/src/types/fees.ts` | `…/modules/finance/fees.types.ts` | `'../x'` → `'../../x'` |
| `apps/server/src/graphql/resolvers/finance.resolvers.ts` | `…/modules/finance/finance.resolvers.ts` | none — already 2 deep |
| `apps/server/src/graphql/typeDefs/finance.typeDefs.ts` | `…/modules/finance/finance.typeDefs.ts` | none — already 2 deep |

Deliberately **not** moved in this slice: `apps/server/src/lib/fees-cache.ts` and `apps/server/src/lib/validation/fees.ts` (shared `lib/`, spec rule 2), `apps/web/src/components/screens/admin/reports/FeeReport.tsx` and the two `dashboard_components/Fee*.tsx` (belong to the `data-io` and `dashboard` slices), `apps/mobile/src/components/students/profile/StudentFeesTab.tsx` and `apps/mobile/src/components/parent/subscription-promos/ReceiptsPromo.tsx` (belong to the `people` and `tenancy` slices).

---

### Task 1: Baseline commit

Nothing in this plan is safely reversible until the tree is committed.

**Baseline status, re-verified 2026-09-28:** the source tree is already committed — `777623e init` holds all 1437 tracked files, so step 3 commits only this session's `docs/` work. `typecheck` is 3/3 green and the web `build` succeeds; `test` is 30 pass / 1 fail **only** while Docker Desktop is paused, because `route-resolution.test.ts` probes `/api/v1/health` and that handler awaits live Postgres/Redis pings with no timeout. Docker must be running before the gate is meaningful.

**Files:** none modified — this task only creates the first commit.

**Interfaces:**
- Produces: commit `baseline` that every later task diffs against and reverts to.

- [ ] **Step 1: Confirm the pipeline is green before committing**

Run: `bunx turbo run typecheck test build`
Expected: all tasks `successful`, and the server suite reports 31 pass / 0 fail. There are **no** accepted-failure carve-outs: the 4 `students.ts` `minLength` errors recorded in spec §9 were a `@sinclair/typebox` dedupe symptom and disappeared with the `^0.34.52` pin, so `typecheck` must be clean. A `(fail) route resolution after duplicate mount removal [5000ms]` timeout means Postgres/Redis are unreachable — check `docker desktop status` and unpause before continuing. Any *other* error is a blocker: stop and report.

- [ ] **Step 2: Confirm no secret is about to be committed**

Run: `git status --porcelain | grep -E "\.env$|\.key$|\.pem$|\.mobileprovision$|\.jks$|\.p8$" | head`
Expected: no output. `apps/web/certificates/` holds local HTTPS keys; `.gitignore` covers `*.key`/`*.pem`. If anything shows, stop and report before committing.

- [ ] **Step 3: Stage and commit**

```bash
git add -A
git status --porcelain | wc -l
git commit -m "$(cat <<'EOF'
chore: baseline the turborepo conversion before module restructure

Captures the current tree as the rollback point for moving files into
feature modules. No source content changes in this commit.
EOF
)"
```

Expected: one commit, `git status` clean afterwards.

- [ ] **Step 4: Record the baseline sha**

Run: `git rev-parse HEAD`
Write the sha at the top of this file under a `Baseline sha:` line so later tasks can diff against it.

---

### Task 2: Delete verified dead code

spec §9 lists four files with zero references anywhere (re-verified 2026-09-28: the only hit outside each file itself was my own spec document) plus one empty directory. Doing this before the move means they never need migrating.

**Files:**
- Delete: `apps/server/src/db/seed_bulk.ts`
- Delete: `apps/server/src/db/seed_huge.ts`
- Delete: `apps/web/src/components/screens/teacher/dashboard_components/DashboardIllustrations.tsx`
- Delete: `apps/web/src/components/screens/admin/old/` (empty)
- Inspect, then delete: `apps/mobile/src/store/protected-route.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a tree where every remaining file is reachable, so a `typecheck` failure later means a real break.

- [ ] **Step 1: Re-verify each file is unreferenced**

Run:
```bash
for n in seed_bulk seed_huge DashboardIllustrations protected-route; do
  printf "%-24s " "$n"
  grep -rl --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
    --exclude-dir=.expo --exclude-dir=docs --exclude-dir=.qoder "$n" apps | wc -l
done
```
Expected: `0` for all four. A non-zero count means the file is live — stop, do not delete it, and report which file referenced it.

- [ ] **Step 2: Human-check the store file before deleting**

Read `apps/mobile/src/store/protected-route.tsx` in full. It is the one deletion with a plausible counter-argument: a store file named `protected-route` may be intended as future scaffolding for route guards rather than dead code. If it exports a hook or provider that a route-guard design would consume, keep it and move it to `apps/mobile/src/modules/auth/` in the auth slice instead of deleting. Record whichever decision you take in this task's commit message.

- [ ] **Step 3: Delete**

```bash
git rm apps/server/src/db/seed_bulk.ts apps/server/src/db/seed_huge.ts \
  apps/web/src/components/screens/teacher/dashboard_components/DashboardIllustrations.tsx
git rm -r apps/web/src/components/screens/admin/old
git rm apps/mobile/src/store/protected-route.tsx   # only if Step 2 said delete
```

- [ ] **Step 4: Prove nothing broke**

Run: `bunx turbo run typecheck build`
Expected: same status as the Task 1 baseline — no new errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove four unreferenced files and the empty admin/old dir"
```

---

### Task 3: Web screen-registry guard test

The web app has **two** lazy screen registries, not one:

| file | `@`-specifiers | unique screen keys | quote style | holds finance keys |
|---|---|---|---|---|
| `src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx` | 67 | 58 | single | fees, expenses, fee-categories, fee-concessions, fee-status, make-payment, check-receipt, check-payments, transport-fee |
| `src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx` | 26 | 20 | **double** | billing |

The spec only named the tenant dispatcher (its rule 5 and §1 both refer to it). `generic-slug-dispatcher.tsx` carries 26 more lazy screens and 20 more URL keys, including the super-admin `billing` screen this slice moves. The guard test therefore covers both files and must be quote-agnostic. `tsc` will happily let a specifier keep resolving to the *wrong* file after a move, and nothing today proves all 78 keys still reach a real component. This test is the safety net for Tasks 4–8; it must be green **before** anything moves.

**Files:**
- Create: `apps/web/src/modules/__tests__/screen-registry.test.ts`
- Modify: `apps/web/package.json` (add a `test` script)
- Modify: `apps/web/tsconfig.json` (`exclude` test files)

**Interfaces:**
- Produces: `bunx turbo run test` now covers web, and a `REGISTRIES` table whose counts later tasks change only deliberately.

- [ ] **Step 1: Give apps/web a test runner**

In `apps/web/package.json`, add to `scripts` (keep every existing script untouched):

```json
    "test": "bun test",
```

Turbo already defines a `test` task at the root, so `bunx turbo run test` picks it up with no turbo edit.

- [ ] **Step 2: Keep `tsc` out of the test file**

`apps/web` has no `bun` types, so a `bun:test` import under `src/**` would fail `typecheck`. In `apps/web/tsconfig.json`, change `exclude` to:

```json
  "exclude": [
    "node_modules",
    "scratch",
    "**/*.test.ts",
    "**/__tests__/**"
  ]
```

- [ ] **Step 3: Write the test**

Create `apps/web/src/modules/__tests__/screen-registry.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");

/** A '@/' specifier resolves as .ts, .tsx, .js, .jsx, or an index file inside a folder. */
function resolvesToAFile(specifier: string): boolean {
  if (!specifier.startsWith("@/")) return false;
  const base = join(APP_ROOT, "src", specifier.slice(2));
  return (
    [".ts", ".tsx", ".js", ".jsx"].some((ext) => existsSync(base + ext)) ||
    [".ts", ".tsx"].some((ext) => existsSync(join(base, `index${ext}`)))
  );
}

// Counts measured on the pre-move tree, 2026-09-28. Changing one of these numbers
// must be a deliberate act in a task step, never a side effect of a rewrite.
const REGISTRIES = [
  {
    name: "tenant-screen-dispatcher",
    path: "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx",
    specifiers: 67,
    keys: 58,
  },
  {
    name: "generic-slug-dispatcher",
    path: "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
    specifiers: 26,
    keys: 20,
  },
];

// Quote style differs between the two files (single vs double), so match both.
const SPECIFIER_RE = /import\((['"])(@[^'"]+)\1\)/g;
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;

for (const reg of REGISTRIES) {
  describe(reg.name, () => {
    const src = readFileSync(join(APP_ROOT, reg.path), "utf8");

    test("every lazy import specifier points at a real file", () => {
      const specifiers = [...src.matchAll(SPECIFIER_RE)].map((m) => m[2]);
      expect(specifiers.length).toBe(reg.specifiers);
      const broken = specifiers.filter((s) => !resolvesToAFile(s));
      expect(broken).toEqual([]);
    });

    test("screen-key count is unchanged", () => {
      const keys = [...new Set([...src.matchAll(KEY_RE)].map((m) => m[2]))];
      expect(keys.length).toBe(reg.keys);
    });
  });
}

test("finance keys are still routed across both registries", () => {
  const read = (p: string) => readFileSync(join(APP_ROOT, p), "utf8");
  const tenant = new Set(
    [...read(REGISTRIES[0].path).matchAll(KEY_RE)].map((m) => m[2]),
  );
  const generic = new Set(
    [...read(REGISTRIES[1].path).matchAll(KEY_RE)].map((m) => m[2]),
  );
  for (const key of [
    "fees", "fee-categories", "fee-concessions", "fee-status",
    "make-payment", "check-receipt", "check-payments", "expenses", "transport-fee",
  ]) {
    expect(tenant.has(key)).toBe(true);
  }
  expect(generic.has("billing")).toBe(true);
});
```

- [ ] **Step 4: Run it and confirm it is green on the untouched tree**

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts`
Expected: 5 pass, 0 fail. If a count differs from 67/58/26/20, the tree changed since measurement — trust the file, update that constant to the observed number, and re-run. Do not delete an assertion to make it pass.

- [ ] **Step 5: Confirm the test can actually fail**

Break one specifier in each registry, then restore:

```bash
sed -i "s|@/components/screens/admin/fees'|@/components/screens/admin/feesGONE'|" \
  "apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
sed -i 's|@/components/screens/super-admin/billing"|@/components/screens/super-admin/billingGONE"|' \
  "apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx"
(cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts)   # expect FAIL
git checkout -- "apps/web/src/app/(authenticated)"
(cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts)   # expect PASS again
```

Expected: failures naming both broken paths, then green after restore. A test that cannot fail is not a guard.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(web): add screen-registry guard covering both lazy dispatchers"
```

---

### Task 4: Server finance module

Eight files become one module. `src/lib/fees-cache.ts` and `src/lib/validation/fees.ts` stay in `lib/` on purpose (spec rule 2).

**Files:**
- Create: `apps/server/src/modules/finance/index.ts`
- Move: the six files in the File Structure table
- Modify: `apps/server/src/index.ts` (fees import), `apps/server/src/graphql/resolvers/index.ts:7`, `apps/server/src/graphql/typeDefs/index.ts:5`, `apps/server/src/route-resolution.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `apps/server/src/modules/finance/index.ts` exporting `feesRoutes`, `FeeService`, `FeeReceiptService`, `financeQueries`, `financeMutations`, `financeTypeDefs`. Routes keep their own path strings — no URL changes.

- [ ] **Step 1: Extend the route-resolution guard first**

Spec rule 6 says tests are co-located inside their module. This one is the exception, deliberately: `route-resolution.test.ts` tests the **composition root** (which routes `src/index.ts` mounts, under which prefix), not the finance module, so it belongs at `src/` where it already is. Do not move it into `modules/finance/` — that would make a root-level concern invisible to the next person wiring routes. Tests written *for* module internals go beside their subject.

Append to `apps/server/src/route-resolution.test.ts` (do not modify the existing tests):

Append to `apps/server/src/route-resolution.test.ts` (do not modify the existing tests):

```ts
// The fees module moved to src/modules/finance/. This pins two things at once:
// the barrel re-exports feesRoutes under the same name, and /api/fees still
// resolves after the move. requireAuth is mounted inside feesRoutes, so 401
// proves the route matched — 404 would mean the mount vanished.
import { feesRoutes } from './modules/finance';

test('fees resolves from its module barrel under both mounts', async () => {
  const app = new Elysia()
    .group('/api/v1', (a) => a.use(feesRoutes))
    .group('/api', (a) => a.use(feesRoutes))
    .compile();
  for (const prefix of ['/api', '/api/v1']) {
    const res = await app.handle(new Request(`http://localhost${prefix}/fees`));
    expect([401, 400]).toContain(res.status);
    expect(res.status).not.toBe(404);
  }
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `cd apps/server && bun test src/route-resolution.test.ts`
Expected: FAIL — `Cannot find module './modules/finance'`. That is the red state we want.

- [ ] **Step 3: Move the files**

```bash
mkdir -p apps/server/src/modules/finance
git mv apps/server/src/routes/fees.ts                    apps/server/src/modules/finance/fees.routes.ts
git mv apps/server/src/services/fee.service.ts           apps/server/src/modules/finance/fee.service.ts
git mv apps/server/src/services/fee-receipt.service.ts   apps/server/src/modules/finance/fee-receipt.service.ts
git mv apps/server/src/types/fees.ts                     apps/server/src/modules/finance/fees.types.ts
git mv apps/server/src/graphql/resolvers/finance.resolvers.ts apps/server/src/modules/finance/finance.resolvers.ts
git mv apps/server/src/graphql/typeDefs/finance.typeDefs.ts   apps/server/src/modules/finance/finance.typeDefs.ts
```

- [ ] **Step 4: Fix the relative depth on the four newly-deepened files**

Only the files that were one level under `src/` need it. The two `graphql/**` files were already two levels deep, so their `'../../x'` imports are already correct — do not touch them.

```bash
cd apps/server/src/modules/finance
sed -i "s|from '\.\./|from '../../|g" fees.routes.ts fee.service.ts fee-receipt.service.ts fees.types.ts
cd /d/per/inkwelly
grep -n "from '\.\.\." apps/server/src/modules/finance/*.ts | grep -v "'\.\./\.\./" | head
```

Expected: the final grep prints nothing. Any line it prints is a `'../…'` that still points outside the module.

- [ ] **Step 5: Enumerate every referrer, then fix it**

```bash
grep -rn --include=*.ts -E "routes/fees|services/fee\.service|services/fee-receipt|types/fees'|graphql/resolvers/finance|graphql/typeDefs/finance" apps/server/src
```

Update each hit to the new location. The verified referrer set is: `src/index.ts` (imports `feesRoutes` from `./routes/fees`), `src/graphql/resolvers/index.ts:7` (`import { financeQueries, financeMutations } from './finance.resolvers'`), `src/graphql/typeDefs/index.ts:5` (`import { financeTypeDefs } from './finance.typeDefs'`), and `src/route-resolution.test.ts` (already added in Step 1). Files inside the module import each other by bare filename now, so `fees.routes.ts` referencing `../services/fee.service` becomes `./fee.service`.

The two `graphql/*/index.ts` files keep their own aggregation role — they import the finance symbols from their new home rather than a sibling file. Do not delete them; every other domain still lives under `graphql/resolvers/` and `graphql/typeDefs/` until its own slice runs.

- [ ] **Step 6: Write the barrel**

Create `apps/server/src/modules/finance/index.ts`:

```ts
export { feesRoutes } from './fees.routes';
export { FeeService } from './fee.service';
export { FeeReceiptService } from './fee-receipt.service';
export { financeQueries, financeMutations } from './finance.resolvers';
export { financeTypeDefs } from './finance.typeDefs';
```

Use named re-exports, **not** `export *`. `fee.service.ts:10` and `fee-receipt.service.ts:10` each export their own `type DbTransaction`, so a star export would produce a duplicate-identifier error at the barrel. Verify names against the tree before committing this file (`grep -n "^export" apps/server/src/modules/finance/*.ts`) and match the real ones — never rename an export to fit a barrel.

- [ ] **Step 7: Verify green**

Run: `cd apps/server && bun test`
Expected: **32 pass / 0 fail** (31 baseline + the new fees test).
Run: `cd apps/server && bun run typecheck`
Expected: 0 errors. `typecheck` is clean at baseline, so any error here is introduced by the move.

- [ ] **Step 8: Confirm the old directories emptied out**

Run: `ls apps/server/src/types/ 2>/dev/null; ls apps/server/src/graphql/resolvers/ apps/server/src/graphql/typeDefs/`
Expected: `types/` is now empty or gone — if empty, `git rm` is unnecessary (git does not track empty dirs), just confirm no other file was left behind. `graphql/resolvers` and `graphql/typeDefs` should hold only the non-finance domains still awaiting their own slice.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(server): move fees routes, services, types and graphql into modules/finance"
```

---

### Task 5: Web finance module

**Files:**
- Create: `apps/web/src/modules/finance/index.ts`, plus `components/`, `hooks/`, `data/` under it
- Move: 5 screen files + 4 folders + 2 hooks + `billing-constants.tsx`
- Modify: `tenant-screen-dispatcher.tsx` lines 27, 44, 68, 76 (4 single-quoted specifiers), `generic-slug-dispatcher.tsx:17` (the `billing` specifier, **double**-quoted), `app/(authenticated)/billing/page.tsx:1` (eager named import), 9 `use-fees` consumers, 1 `use-expenses` consumer, 8 `billing-constants` consumers

**Interfaces:**
- Consumes: Task 3's guard test as the acceptance gate.
- Produces: `@/modules/finance/components/AdminFees` (and siblings) as the stable lazy targets; `@/modules/finance` as the barrel for eager consumers.

Verified export shapes on the current tree — all five are named function exports, none is a default:

| file | export |
|---|---|
| `admin/fees.tsx:51` | `export function AdminFees()` |
| `admin/expenses.tsx:74` | `export function ExpensesScreen()` |
| `parent/fees.tsx:17` | `export function ParentFees()` |
| `student/fees.tsx:71` | `export function StudentFees()` |
| `super-admin/billing.tsx:32` | `export function SuperAdminBilling()` |

Renaming the *file* to `AdminExpenses.tsx` does not rename the *export* — it stays `ExpensesScreen`, and the dispatcher's `.then(m => m.ExpensesScreen)` must not be "corrected" to match the filename.

- [ ] **Step 1: Create the module skeleton**

```bash
mkdir -p apps/web/src/modules/finance/{components,hooks,data}
```

- [ ] **Step 2: Move role screens to `<Role><Feature>.tsx` and their parts to camelCase folders**

```bash
cd apps/web/src
git mv components/screens/admin/fees.tsx        modules/finance/components/AdminFees.tsx
git mv components/screens/admin/fees            modules/finance/components/adminFees
git mv components/screens/admin/expenses.tsx    modules/finance/components/AdminExpenses.tsx
git mv components/screens/admin/expenses        modules/finance/components/adminExpenses
git mv components/screens/parent/fees.tsx       modules/finance/components/ParentFees.tsx
git mv components/screens/parent/fees           modules/finance/components/parentFees
git mv components/screens/student/fees.tsx      modules/finance/components/StudentFees.tsx
git mv components/screens/super-admin/billing.tsx modules/finance/components/SuperAdminBilling.tsx
git mv components/screens/super-admin/billing   modules/finance/components/superAdminBilling
git mv hooks/use-fees.ts                        modules/finance/hooks/use-fees.ts
git mv hooks/use-expenses.ts                    modules/finance/hooks/use-expenses.ts
git mv lib/billing-constants.tsx                modules/finance/data/billing-constants.tsx
cd /d/per/inkwelly
```

The `adminFees/` / `parentFees/` folder names are lowercase deliberately: a folder named `fees/` next to `Fees.tsx` would re-create the exact `X.tsx` + `X/` shadowing that spec §1 records 49 of.

- [ ] **Step 3: Rewrite the lazy specifiers — file path, not barrel**

Four finance specifiers live in the tenant dispatcher (single-quoted); the fifth, `billing`, lives in the **generic** dispatcher (double-quoted). Two commands, because the quote style differs:

```bash
T="apps/web/src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"
G="apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx"
sed -i \
  -e "s|@/components/screens/admin/fees'|@/modules/finance/components/AdminFees'|" \
  -e "s|@/components/screens/admin/expenses'|@/modules/finance/components/AdminExpenses'|" \
  -e "s|@/components/screens/parent/fees'|@/modules/finance/components/ParentFees'|" \
  -e "s|@/components/screens/student/fees'|@/modules/finance/components/StudentFees'|" "$T"
sed -i 's|@/components/screens/super-admin/billing"|@/modules/finance/components/SuperAdminBilling"|' "$G"
grep -c "modules/finance" "$T" "$G"
```

Expected: `4` in `$T`, `1` in `$G`. The guard test pins the totals at 67 and 26 specifiers, so those counts must not change — only the paths do.

Also fix the eager route-level import, which is not covered by either sed:

```bash
sed -i "s|@/components/screens/super-admin/billing'|@/modules/finance/components/SuperAdminBilling'|" \
  "apps/web/src/app/(authenticated)/billing/page.tsx"
```

`app/(authenticated)/billing/` itself does not move — spec rule 4. Only its import specifier changes.

- [ ] **Step 4: Rewrite all remaining references**

```bash
grep -rln --include=*.ts --include=*.tsx -E "@/components/screens/(admin|parent|student|super-admin)/(fees|expenses|billing)|@/hooks/use-fees|@/hooks/use-expenses|@/lib/billing-constants" apps/web/src
```

For each file listed, apply the mapping:
`@/components/screens/admin/fees/<x>` → `@/modules/finance/components/adminFees/<x>`
`@/components/screens/admin/expenses/<x>` → `@/modules/finance/components/adminExpenses/<x>`
`@/components/screens/parent/fees/<x>` → `@/modules/finance/components/parentFees/<x>`
`@/components/screens/super-admin/billing/<x>` → `@/modules/finance/components/superAdminBilling/<x>`
`@/hooks/use-fees` → `@/modules/finance/hooks/use-fees`
`@/hooks/use-expenses` → `@/modules/finance/hooks/use-expenses`
`@/lib/billing-constants` → `@/modules/finance/data/billing-constants`

Inside the moved folders, relative imports (`./PaymentSummaryCards`, `../hooks/use-fees`) keep working as long as the folder moved whole — but any `@/hooks/use-fees` inside them must follow the mapping too. Do not assume a moved file is clean; re-grep after.

- [ ] **Step 5: Write the barrel for eager consumers only**

`apps/web/src/modules/finance/index.ts` — named re-exports, matching the verified shapes in this task's table:

```ts
export { AdminFees } from "./components/AdminFees";
export { ExpensesScreen } from "./components/AdminExpenses";
export { ParentFees } from "./components/ParentFees";
export { StudentFees } from "./components/StudentFees";
export { SuperAdminBilling } from "./components/SuperAdminBilling";
export * from "./hooks/use-fees";
export * from "./hooks/use-expenses";
```

`ExpensesScreen` keeps its own name even though the file is now `AdminExpenses.tsx`. Before committing, check the two hook files for a name collision the same way Task 4 checked the services: `grep -n "^export" apps/web/src/modules/finance/hooks/*.ts` — if both export an identically-named symbol, replace those two `export *` lines with explicit named re-exports.

- [ ] **Step 6: Verify with the guard test, then the pipeline**

Run: `cd apps/web && bun test src/modules/__tests__/screen-registry.test.ts`
Expected: 5 pass. A broken-specifier failure here names exactly which path rewrite was missed.
Run: `bunx turbo run typecheck` then `bunx turbo run build`
Expected: green; `next build` output shows per-screen chunks still present (proof the lazy split survived, spec rule 3).

- [ ] **Step 7: Confirm no orphan `screens/` finance files remain**

Run: `find apps/web/src/components/screens -iname "*fee*" -o -iname "*expense*" -o -iname "*billing*"`
Expected: only the deliberate leftovers from File Structure — `reports/FeeReport.tsx`, `dashboard_components/FeeCollection.tsx`, `dashboard_components/FeePieDistribution.tsx`. Anything else was missed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(web): move fee, expense and billing screens into modules/finance"
```

---

### Task 6: Mobile finance module

**Files:**
- Create: `apps/mobile/src/modules/finance/index.ts`, `apps/mobile/src/modules/transport/components/`
- Move: `components/admin/fees/**` (minus `transport/**`), `components/parent/fees/**`, `components/admin/expenses/**`
- Modify: the 4 route files that import them

**Interfaces:**
- Consumes: nothing from Tasks 4–5 beyond naming.
- Produces: `@/modules/finance/components/adminFees/*`, `@/modules/finance/components/parentFees/*`, `@/modules/transport/components/adminFeesTransport/*`.

- [ ] **Step 1: Split the bus-fee UI out to the transport module first**

Spec §3 rules `transport-fee` → `transport`, not `finance`. Mobile currently buries three bus-fee views inside `admin/fees/transport/`, which is exactly the kind of misplacement the restructure exists to fix — so it moves now, not later.

```bash
mkdir -p apps/mobile/src/modules/transport/components
git mv apps/mobile/src/components/admin/fees/transport apps/mobile/src/modules/transport/components/adminFeesTransport
```

- [ ] **Step 2: Move the rest**

```bash
mkdir -p apps/mobile/src/modules/finance/components
git mv apps/mobile/src/components/admin/fees            apps/mobile/src/modules/finance/components/adminFees
git mv apps/mobile/src/components/parent/fees           apps/mobile/src/modules/finance/components/parentFees
git mv apps/mobile/src/components/admin/expenses        apps/mobile/src/modules/finance/components/adminExpenses
```

`adminFees/` keeps its `dialogs/`, `hooks/` and `fees.styles.ts` inside it, so their relative imports survive untouched.

- [ ] **Step 3: Rewrite the importers**

```bash
grep -rln --include=*.ts --include=*.tsx -E "@/components/admin/fees|@/components/parent/fees|@/components/admin/expenses" apps/mobile/src
```

Map `@/components/admin/fees/transport/<x>` → `@/modules/transport/components/adminFeesTransport/<x>` and `@/components/admin/fees/<x>` → `@/modules/finance/components/adminFees/<x>`, likewise `parent/fees` → `finance/components/parentFees` and `admin/expenses` → `finance/components/adminExpenses`. Also fix the now-cross-module imports *inside* `adminFees/` that referenced `./transport/*` — those become `@/modules/transport/components/adminFeesTransport/*`.

- [ ] **Step 4: Barrel**

`apps/mobile/src/modules/finance/index.ts` — export only what non-finance code legitimately consumes:

```ts
export { FeeStatusTab } from "./components/adminFees/FeeStatusTab";
export { StudentFeeStatusTab } from "./components/adminFees/StudentFeeStatusTab";
```

Verify both are real named exports before committing this file (`grep -n "^export" apps/mobile/src/modules/finance/components/adminFees/FeeStatusTab.tsx`). `StudentFeesTab.tsx` stays where it is for now — the `people` slice will consume it through this barrel.

- [ ] **Step 5: Verify**

Run: `cd apps/mobile && bun run typecheck`
Expected: green, or only errors that also existed at the Task 1 baseline (`git stash` the work, re-run, compare — then `git stash pop`).
Run: `cd apps/mobile && bunx expo config --type public > /dev/null && echo ROUTER_OK`
Expected: `ROUTER_OK`. Route files under `src/app/**` were not touched, so expo-router's URL surface must be unchanged.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(mobile): move fee and expense components into modules, split bus fees into transport"
```

---

### Task 7: Boundary lint enforcement

Nothing in this repo currently enforces a boundary: `apps/web/eslint.config.mjs` is Next defaults with ~30 rules disabled, `apps/mobile/eslint.config.js` is bare `eslint-config-expo`, and `apps/server` has **no eslint config at all**. Without this task the finance module reverts within a few sessions.

**Files:**
- Create: `apps/server/eslint.config.mjs`
- Modify: `apps/web/eslint.config.mjs`, `apps/mobile/eslint.config.js`
- Modify: the three app `package.json` files (dev dependency)

**Interfaces:**
- Consumes: the `src/modules/<name>/` layout Tasks 4–6 produced.
- Produces: a `lint` task that fails on cross-module internals, wired into the existing root `turbo run lint`.

- [ ] **Step 1: Install the plugin once at the root**

Run: `bun add -D -W eslint-plugin-boundaries@7.2.0`
Then confirm the real option surface rather than trusting this plan:
`sed -n '1,80p' node_modules/eslint-plugin-boundaries/README.md` and `ls node_modules/eslint-plugin-boundaries/config*` if present. v7 exposes the rule as `boundaries/dependencies` with `default` + `policies`; older majors used `boundaries/element-types`. Adjust Steps 3–5 to whichever the installed README documents, and say in the commit message which version you coded against.

- [ ] **Step 2: Write the server config (new file)**

`apps/server/eslint.config.mjs`:

```js
import js from "@eslint/js";
import tsgo from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

export default [
  js.configs.recommended,
  ...tsgo.configs.recommended,
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "module", pattern: "src/modules/*" },
        { type: "shared", pattern: "src/lib/*" },
        { type: "db", pattern: "src/db/**" },
        { type: "entry", pattern: "src/*.ts" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        2,
        {
          default: "allow",
          policies: [
            // One module may not reach into another module's files.
            {
              from: { element: { type: "module" } },
              disallow: {
                to: { element: { type: "module" }, file: { pathNot: ["index.ts"] } },
              },
              message: "Import another module through its index.ts barrel only.",
            },
          ],
        },
      ],
    },
  },
];
```

Add `"lint": "eslint src"` to `apps/server/package.json` scripts — the server has no lint script today, so `turbo run lint` currently skips it entirely.

- [ ] **Step 3: Add the same element set to web**

In `apps/web/eslint.config.mjs`, add a config object to the exported array (leave all existing rules untouched — this task adds boundaries, it does not re-enable disabled rules):

```js
{
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "module", pattern: "src/modules/*" },
      { type: "ui", pattern: "src/components/ui/*" },
      { type: "layout", pattern: "src/components/layout/*" },
      { type: "shared", pattern: "src/lib/*" },
      { type: "route", pattern: "src/app/**" },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, {
      default: "allow",
      policies: [
        {
          from: { element: { type: "module" } },
          disallow: { to: { element: { type: "module" }, file: { pathNot: ["index.ts"] } } },
          message: "Import another module through its index.ts barrel only.",
        },
      ],
    }],
  },
},
```

Add the matching `import boundaries from "eslint-plugin-boundaries";` at the top. **`src/app/**` is typed `route` and is intentionally exempt** from the barrel rule — spec rule 3 requires lazy screens to address component files directly, so a policy disallowing it would fight the code-splitting design.

- [ ] **Step 4: Same for mobile**

`apps/mobile/eslint.config.js` uses `require`; append the equivalent object with `plugins: { boundaries: require("eslint-plugin-boundaries") }` and the same `boundaries/elements` for `src/modules/*`, `src/components/*`, `src/app/**`.

- [ ] **Step 5: Prove the rule bites**

A violation must be *resolvable* for this to test anything — eslint-plugin-boundaries can only judge an import it can map to a file, and `../people/` does not exist yet. So build a throwaway second module, violate into it, then remove both.

```bash
mkdir -p apps/server/src/modules/probe
printf "export const probeValue = 1;\n" > apps/server/src/modules/probe/internal.ts
printf "export { probeValue } from './internal';\n" > apps/server/src/modules/probe/index.ts
printf "import { probeValue } from '../probe/internal';\nexport const boundaryProbe = probeValue;\n" \
  > apps/server/src/modules/finance/boundary-probe.ts
cd apps/server && bun run lint
```
Expected: **one `boundaries/dependencies` error** on `../probe/internal` — reaching a sibling module's non-barrel file. If it reports nothing, the `pattern`s are not matching the files: fix them against the installed README and re-run. Do not skip this step and do not proceed on an unproven rule.

Then remove the scaffolding and confirm green again:

```bash
rm apps/server/src/modules/finance/boundary-probe.ts
rm -rf apps/server/src/modules/probe
cd /d/per/inkwelly && (cd apps/server && bun run lint)
```
Expected: no errors.

- [ ] **Step 6: Make lint green**

Run: `bunx turbo run lint`
Expected: successful. Real violations the new rule exposes in the finance slice must be fixed properly — by widening that module's `index.ts`, not by adding an eslint-disable or loosening the policy. Report any violation you cannot fix inside the module boundary instead of suppressing it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "lint: enforce module boundaries with eslint-plugin-boundaries across all apps"
```

---

### Task 8: Verify the slice and open the follow-on work

**Files:**
- Modify: `docs/superpowers/specs/2026-09-28-feature-module-restructure-design.md` (status line)
- Create: `docs/superpowers/specs/2026-09-28-module-taxonomy-checklist.md`

- [ ] **Step 1: Full pipeline**

Run: `bunx turbo run typecheck test build lint`
Expected: every task successful. Server tests must be **32 pass / 0 fail**, web guard test **5 pass / 0 fail** (2 registries × 2 assertions + the finance-keys test).

- [ ] **Step 2: Diff review**

Run: `git diff --stat HEAD~7..HEAD`
Expected: the moved files appear as renames (`R` in `git status` / similarity 100% where content was untouched). If a "move" shows as delete + add, that file's content changed more than intended — inspect it.

- [ ] **Step 3: Count what is left on the old layout**

Run: `find apps/web/src/components/screens -type f | wc -l; find apps/server/src/routes apps/server/src/services -type f | wc -l`
Expected: non-zero — 15 modules remain. Record both numbers in the checklist file so the next plan starts from evidence, not guesswork.

- [ ] **Step 4: Write the follow-on checklist**

Create `docs/superpowers/specs/2026-09-28-module-taxonomy-checklist.md` listing all 16 modules from spec §3, each with `done` / `pending` and the file count still in the old layout. `finance` is the only `done`. State plainly that each remaining module needs its own plan, written per superpowers:writing-plans, and that they may be executed in any order because the boundary lint now protects the ones already moved.

- [ ] **Step 5: Mark the spec and commit**

Set `Status: finance slice complete — 15 modules pending` in the spec header.

```bash
git add -A
git commit -m "docs: record finance slice completion and remaining module checklist"
```

---

## Follow-on work (not this plan)

The spec covers 16 modules across 3 apps. This plan delivers one module plus the enforcement that makes the other 15 safe. `attendance`, `people`, `academics`, `assessment`, `timetable`, `communication`, `transport` (rest), `support`, `certificates`, `data-io`, `dashboard`, `auth`, `tenancy`, `platform`, `access-control` each need their own plan. Nothing here should be batched with them — the whole point of the guard test and the lint rules is that one module moves at a time and is provably green before the next starts.
