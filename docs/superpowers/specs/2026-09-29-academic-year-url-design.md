# Academic Year in the URL and Header — Design Spec (Spec 1 of 2)

**Date:** 2026-09-29
**Classification:** architectural (new routing contract + new shared context + server writes)
**Status:** approved design, awaiting user review of this file
**Companion:** Spec 2, "Stamp every year-worthy table with the URL year" — explicitly out of scope here (§9)

**Goal:** Every tenant screen URL carries the school's academic year as the segment right after the tenant slug (`/loadtest-academy/2026-27/academics/academic-years`), a header chip switches it, and no screen renders without one.

**Architecture:** The two-segment `[slug]/[screen]` route tree collapses into one catch-all `[slug]/[...segments]` because Next 16 rejects two differently-named dynamic segments at the same level. `parseRoute` gains a `year` field and stays the single place that decides which screen is open. A new `useActiveAcademicYear()` hook is the only reader of the year; the chip, the dispatcher gate, and the year-stamped screens all read it, and one `academicYearUrl()` builder is the only writer.

**Tech stack:** Next.js ^16.2.11 App Router (Turbopack), React Compiler, TanStack Query, Zustand, Tailwind v4, bun test. Server: Elysia + Drizzle/Postgres, GraphQL resolvers for academic years, REST routes for exams/fees/promotions.

## Global constraints

- Repo root `D:\per\inkwelly`; isolate with a **branch**, never a worktree (hoisted bun linker makes a fresh worktree unrunnable).
- Verify web with `bun run typecheck` + `bun test src/modules/__tests__/ src/lib/__tests__/ src/lib/routing/`. Verify server with `bun run typecheck && bun run lint && bun test`.
- Commits are local; never `git push`. `git commit` never appears without a trailing `-- <paths>`.
- No new dependencies. No Python on this machine (node/bun/sed only).
- Year identity is the **name string**, not the id: `students.academicYear`, `feeStructures.academicYear`, `promotions.academicYear`, `exams.academicYear` are all `text` columns holding the name.
- Admin screen keys stay exactly the 62 the dispatcher already switches on; the year is an added segment, never a replacement for a screen key.

---

## 1. Evidence: what exists today

| Fact | Where |
|---|---|
| Tenant routes stop at three segments | `apps/web/src/app/(authenticated)/[slug]/[screen]/page.tsx`, `[screen]/[detail]/page.tsx` |
| One-segment `/[slug]` handles platform screens and redirects tenant slugs to `/[slug]/dashboard` | `apps/web/src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx:61-79,117-120` |
| The routing contract is pure and imports nothing from the app | `apps/web/src/lib/routing/module-routes.ts` (`parseRoute`, `componentKey`, `qualifiedKey`, `canonicalOwner`) |
| `parseRoute` is called from exactly two places | `tenant-screen-dispatcher.tsx:155`, `app-layout.tsx:74` |
| Redirects-during-render are already the dispatcher's mechanism | `tenant-screen-dispatcher.tsx:162-174,205,259,268,296,323,348` |
| Years are fetched by one hook, tenant-scoped server-side | `apps/web/src/modules/academics/hooks/use-academic-years.ts`, `apps/server/src/modules/academics/academic.resolvers.ts:443-451` |
| Year row shape: `id tenantId name startDate endDate status isCurrent` | `apps/server/src/db/schema.ts:717-731` |
| Unique per tenant on the name | `AcademicYear_tenantId_name_unique` (`schema.ts:728`) |
| Four tables carry the year | `students` (`schema.ts:102`, default `'2024-2025'`), `feeStructures` (:319), `promotions` (:622), `exams` (:684) |
| The year is load-bearing on reads | `exams.routes.ts:142` (`eq(exams.academicYear, student.academicYear)`), `promotions.routes.ts:30`, `fees.routes.ts:921-924` |
| Fee due dates are **string-derived** from the year name | `fees.routes.ts:1035` (`dueDate: \`${academicYear}-04-01\``) and `like(fees.dueDate, \`${academicYear}%\`)` at :924, :1014, :1082, :1101 |
| Student creation never sets the year | `students.routes.ts:358-361` — every new student falls to the `'2024-2025'` default |
| Exam creation invents a year when none is passed | `exams.routes.ts:292-293,405-406` (`\`${currentYear}-${currentYear+1}\``) |
| Tenant creation makes no year | `support/common.resolvers.ts:383-398`, `tenancy/tenants.routes.ts:475-506` |
| The seed makes exactly one year, `2026-2027` | `apps/server/src/db/full_seed_data.ts:9,148` |
| `academic-years` is a real admin key whose label is "Sessions" | `module-nav-config.tsx:447` — the user's example `academics/sessions` is **not** a routable key |
| The header already has an adjacent chip to copy | `header.tsx:178-195` "Date Display Chip" with `<Calendar className="size-3.5 …">` |
| 16 module files consume `academicYears` (besides the hook itself) | `academics/academic-years`, 10 under `assessment/`, 2 under `examinations/`, 2 under `student-fees/fees`, `students/promotions` |
| 43 template-literal URL builders | 29 under `src/modules`, 5 under `src/components/layout` (`header.tsx` ×2, `app-layout.tsx` ×3), 9 in the two dispatchers |

**Conclusion that shapes the design:** the year is *already* the partition key for the four stamped tables, but nothing in the URL or the UI ever says which year the user means — each screen guesses (`isCurrent`, else `[0]`, else a hardcoded `'2024-2025'`/`'2026-27'`), and the server guesses again on write. Putting the year in the URL removes both guesses.

## 2. Decisions taken with the user

| Question | Answer |
|---|---|
| Which screens must carry a year? | **Every role, every screen** (not only the four year-scoped ones) |
| What happens when a school has no year? | **Redirect to the Academic Years screen** with a banner |
| Should the URL year drive saved data? | **Yes** — "we save the data year wise of every school" |
| How to sequence the work? | **Two specs: URL + chip first, then stamp the remaining tables** |
| Renaming a year that has data? | **Block the rename** |

## 3. Router: one catch-all, `parseRoute` gains `year`

**Why a catch-all is forced, not chosen.** Next 16 refuses `[slug]/[screen]` next to `[slug]/[year]/[screen]` (two differently-named dynamic segments at one level). So `[slug]/[screen]/page.tsx` and `[slug]/[screen]/[detail]/page.tsx` are replaced by a single `apps/web/src/app/(authenticated)/[slug]/[...segments]/page.tsx`, and `[slug]/[screen]/loading.tsx` moves with it. `[...segments]` matches 2+ segments, so it does not collide with the existing `[slug]/page.tsx` (1 segment), which keeps serving platform screens (`/tenants`, `/billing`) that have no tenant and therefore no year.

The catch-all also removes today's ceiling: a four-segment URL like `/loadtest-academy/2026-27/academics/classes` currently 404s because the deepest route is three segments.

**Params.** `params: Promise<{ slug: string; segments: string[] }>`. The page component stays a thin re-export of `TenantScreenDispatcherClient`, and both dispatchers keep using `useParams()` — they now read `segments` instead of `screen`/`detail`.

**`generateMetadata` moves and keeps its exact title format.** From position, not membership: `tail[0]` is the screen word, `tail[1]` the detail word, year excluded. `/slug/exams` and `/slug/2026-27/exams` both yield `Exams | Loadtest Academy | SchoolSaaS`; `/slug/academics/classes` keeps yielding `Classes - Academics | …`. Titles do not gain the year, so no SEO churn.

**Parsing rule — revised from the approved sketch, and why.** The design conversation settled on "shape decides parsing, membership decides validity" with `ACADEMIC_YEAR_SHAPE = /^20\d{2}-(?:\d{2}|\d{4})$/`. That is **wrong for this data**: year names are free text, and the 4-digit/2-digit shape is only a convention — the seed's single year is `2026-2027` (`full_seed_data.ts:9`), exam creation synthesises `2026-2027` (`exams.routes.ts:293`), the user's own example is `2026-27`, and an admin can type anything. **Membership alone decides parsing**: the year is compulsory at index 1, so `segments[0]` is matched against the tenant's own year slugs, and if it matches, it is the year. No shape regex survives into the code; the only shape assumption left is cosmetic (how a slug looks).

The consequence is real and accepted: `parseRoute` now depends on data fetched asynchronously, so no tenant screen can resolve until the years query lands. That is why §6 holds the skeleton through `status === 'loading'` rather than parsing twice.

```
yearSlug(name) = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
```

`academicYears` is already ordered `desc(startDate)` (`academic.resolvers.ts:450`), so a slug collision between two names (`FY 2026` vs `fy-2026`) deterministically picks the newer year. This is documented as a known limitation in §7 rather than solved with a schema change.

**New contract in `module-routes.ts`** (still pure, still importing nothing from the app):

```ts
export type RouteParts = { year: string | null; module: string | null; screen: string };
export type RouteContext = {
  isModuleScreen: (module: string, screen: string) => boolean;
  isTenantRoot: (first: string) => boolean;
  yearSlugs?: string[];          // the tenant's own years, slugged
  exemptWithoutYear?: (first: string) => boolean;  // the gate screen
};
```

`parseRoute(pathname, ctx)` now consumes `segments` after the tenant root:

1. `ctx.exemptWithoutYear(segments[0])` → `{ year: null, …resolved tail }`. This is the only year-free shape that resolves instead of redirecting.
2. `ctx.yearSlugs?.includes(segments[0])` → `year = segments[0]`, resolve `segments.slice(1)` with today's unchanged module/screen logic.
3. Otherwise → `year = null`, resolve **all** segments as the old screen chain, and the caller redirects to the canonical URL. A bookmarked `/demo-academy/results-entry` therefore still opens Results Entry — it just lands on `/demo-academy/2026-2027/results-entry`.

Case 3 is what makes every existing bookmark and every un-converted link keep working. `year` is `null` only in the two cases the caller treats as "resolve then navigate"; a rendered screen always has a non-null year.

**Callers.** `tenant-screen-dispatcher.tsx:155` and `app-layout.tsx:74` both pass `yearSlugs` and `exemptWithoutYear`. `screenKey = componentKey(route.module, route.screen)` is untouched, so all 62 keys, the staff permission maps and the guard keep working verbatim — and `screen-registry.test.ts` counts stay 77/62 because no `dynamic()` import and no case label changes.

## 4. Year context, and one link builder

New directory `apps/web/src/lib/academic-year/`:

- `academic-year-url.ts` — pure: `yearSlug`, `academicYearUrl(slug, yearSlug, key, detail?, search?)` where `key` may be bare (`results-entry`) or qualified (`academics/classes`), plus `withYearInPath(pathname, yearSlug)` — which `setActiveYear()` uses to swap only segment 1 of the current path, tail and query string intact. Unit-tested with no DOM, matching how `module-routes.ts` is tested.
- `use-active-academic-year.ts` — the only reader:

```ts
{ status: 'loading' | 'empty' | 'ready',
  years: AcademicYear[],           // raw names
  year: AcademicYear | null,       // the one the URL picked
  yearSlug: string | null,
  setActiveYear(slug: string): void }  // router.replace with the same tail
```

It reads the tenant's years, the URL, and `currentTenantSlug` from `useAppStore`, and returns a stable value while `status === 'loading'` so nothing flashes. Two screens' behaviour depend on it from day one: the dispatcher (gate + skeleton) and the chip (display + selection).

**Cache key must become tenant-scoped.** `use-academic-years.ts` invalidates the global `['academic-years']`, so a super admin moving from school A to school B sees A's years until the refetch lands. The chip would render the wrong list in exactly that moment. Change the query key to `['academic-years', currentTenantSlug]` (four invalidation call sites in the same file) and keep `useAcademicYears()` as the single caller.

**Screens stop guessing.** The 15 consuming files other than the academic-years screen itself drop their local `isCurrent || [0] || '<hardcoded>'` derivation and read `useActiveAcademicYear()` instead. Two of them (`assessment/components/adminExams/ExamsHeader.tsx`, `student-fees/fees/adminFees/SetFeesTab.tsx`) carry a year `<Select>` that becomes redundant and is removed; `students/promotions/index.tsx` keeps its `'all'` option because the server explicitly supports `academicYear !== 'all'` (`promotions.routes.ts:30`) — that screen gets "All years" as a *filter* inside the screen while the URL still fixes the write year. `StudentMarksheet.tsx:104` already accepts `?academicYear=`; the query param loses to the URL segment and stays accepted for the banner links that use it.

**Reads and writes the year already governs** (Spec 1's write half — no new columns):

| Table | Read | Write |
|---|---|---|
| `students` | `students.academicYear` on the roster | student creation sets `academicYear` from the URL instead of the `'2024-2025'` default (`students.routes.ts:358`) |
| `exams` | exam lists, marksheet grouping | exam creation passes the URL year instead of `\`${y}-${y+1}\`` (`exams.routes.ts:300,416`) |
| `feeStructures` | structures list + `fee-assign` | add-structure dialog passes the URL year |
| `promotions` | filter, `'all'` allowed | promotion payload passes the URL year |

Where the year is now passed explicitly, the server-side fallbacks stay as a safety net but must not fire for tenant traffic; the spec's acceptance check is that a created exam's `academicYear` equals the URL segment verbatim.

**The sweep is the largest mechanical part, and it was under-counted in the chat design.** Not 7 `navigateTo` sites: **43 template-literal URL builders** (29 under `src/modules`, 5 under `src/components/layout`, 9 in the two dispatchers), all of which produce year-free paths today. Leaving them means a user on `2026-27` who clicks "Manage plan" gets redirected to the *default* year, silently changing context. Every one is retargeted through `academicYearUrl()`. Query strings survive (`?classId=`, `?student=`, `?examId=` appear at `academics/classes/index.tsx:298`, `student-attendance/attendance/index.tsx:122`, `assessment/components/adminExams/useExamsState.ts:320`), so the builder takes a `search` argument and the case-3 redirect re-appends `useSearchParams()`.

The grep guard is precise enough to implement: for every `.ts`/`.tsx` under `src/modules`, `src/components`, `src/app`, a line matching `/(push|replace|redirect)\(\s*`\/[^`]*\$\{(slug|tid|tenantIdentifier|currentTenantSlug|correctSlug|currentUser[? .]*tenantSlug)/` must also contain `academicYearUrl(` on the same expression. Tenant-free platform paths (`/dashboard` for super admins, `/login`, `/billing`) are the only allowed bare literals, listed by file and line in the test itself so an addition is a deliberate act.

## 5. The chip

`[ 📅 2026-27 ▾ ]` in `header.tsx`, immediately after the Date Display Chip (`header.tsx:178`), reusing that chip's class string, the `Calendar` icon, and the same `hidden md:flex` / minimal-mode visibility rules already computed there. It renders `year.name` (verbatim from the DB, not the slug), opens a `Select` of `years`, and picking one calls `setActiveYear(slug)` — a `router.replace` that rewrites **only** segment 1 and keeps the tail and query string, so the back button is not polluted.

Hidden when `status !== 'ready'` (loading or empty), and hidden on the gate screen itself. Rendered for every role, per §2 — students and parents switch which year's grades they see.

`header.tsx` is one of the other window's actively-edited files. See §8.

## 6. The gate, and a default year so the gate cannot lock anyone out

In the dispatcher, after years resolve:

- **`status === 'loading'`** → the existing `<DashboardLoadingScreen/>`. No screen paints without a year.
- **`status === 'empty'` and the user can open `academic-years`** (admin, or staff whose permission map grants it) → `redirect('/[slug]/academic-years')`, which is the §3 case-1 exemption, and that screen shows a banner: "This school has no academic session yet. Add one to open the rest of the portal."
- **`status === 'empty'` and the user cannot** → the requested screen paints with its year-scoped data empty and a non-blocking notice; every year-stamped form submit is disabled with a tooltip. No redirect, because sending them to a screen they cannot open is a loop.
- **`status === 'ready'` and the URL year is missing or unknown** → `redirect` to the canonical URL with the *active* year, preserving tail and query string.

**So a new school is never empty:** both tenant-create sites insert a first year inside the same `db.transaction` as the tenant row (`support/common.resolvers.ts:383`, `tenancy/tenants.routes.ts:475`) — `name: \`${y}-${y+1}\``, `startDate: \`${y}-04-01\``, `endDate: \`${y+1}-03-31\``, `status: 'active'`, `isCurrent: true`. The format matches `full_seed_data.ts:9` and `exams.routes.ts:293`, so pre-existing rows and new rows agree. `isCurrent` clearing already exists per tenant (`academic.resolvers.ts:685-687`), and the insert is inside the tenant's own creation path, so it cannot clash with another tenant's unique index.

**Existing tenants with zero years** get a one-off backfill, `apps/server/src/db/backfill_academic_years.ts` run with `bun run src/db/backfill_academic_years.ts` (plus a `db:backfill:years` script in `apps/server/package.json`), inserting the same default for any tenant lacking a year and printing the count. Idempotent: it selects tenant ids that have no `AcademicYear` row first.

## 7. Rename protection

`updateAcademicYear` (`academic.resolvers.ts:710`) currently `.set(input)` blindly, so renaming `2026-2027` to `2026-27` orphans every `students`/`feeStructures`/`promotions`/`exams` row that carries the old string — and silently breaks fee due dates, whose year is encoded in the value itself (`fees.routes.ts:1035` writes `` `${academicYear}-04-01` `` and reads it back with `like(dueDate, \`${academicYear}%\`)`).

New behaviour, server-side (the guard belongs there, not in the dialog):

1. If `input.name` differs from the stored name, count referencing rows for that tenant across the four tables.
2. Any count > 0 → throw a `GraphQLError` with code `YEAR_IN_USE` and a message naming the tables and counts.
3. `startDate`, `endDate`, `status`, `isCurrent` remain editable in all cases; `deleteAcademicYear` keeps its current behaviour (the four tables hold text, so there is no FK to violate — deletion is a data-integrity question for Spec 2, not a rename question).

The academic-years screen surfaces `YEAR_IN_USE` inline on the edit dialog. The slug-collision caveat from §3 is documented in that screen's help text: two names that slug identically resolve to the newer one.

## 8. Testing

Web (`bun test`, tests colocated as `*.test.ts` under `src/lib/` and `src/modules/__tests__/`):

- `src/lib/routing/academic-year-url.test.ts` — `yearSlug` for `2026-2027`, `2026-27`, `FY 2026`, ` 2026--27 `; `academicYearUrl` with bare and qualified keys, with `detail`, with `search`; `withYearInPath` on a 2-, 3- and 4-segment path.
- `src/lib/routing/module-routes.test.ts` (extend the existing file) — the three parse cases from §3, including that a year-free bookmark resolves to its screen with `year: null`, that `academics/classes` still resolves to `{module:'academics', screen:'classes'}` under a year, and that the gate screen is exempt in both bare and qualified form.
- `screen-registry.test.ts` — **assertion unchanged at 77 specifiers / 62 keys**; if the move changes those numbers, the move is wrong.
- A new `year-stamped-link.test.ts` guard: scan `src/modules/**` and `src/app/**` for template-literal `push`/`redirect`/`replace` targets that are tenant-screen paths and are not built by `academicYearUrl`; fail with the file and line.
- Manual browser verification on `next dev` (:3000), proving each with the **network log**, not rendered text: a bare bookmark 302s to the year; the chip rewrites only segment 1; `/[slug]` lands on `/<year>/dashboard`; `/loadtest-academy/2026-27/academics/academic-years` opens; a four-segment URL that 404s today now opens; a created exam carries the URL year in the POST body.

Server (`bun test`): the four counts behind `YEAR_IN_USE`; a tenant create producing exactly one `isCurrent` year; the backfill script against a fixture tenant. `route-resolution.test.ts` must stay green — it is the proof that no SDL or mount moved.

## 9. Out of scope (Spec 2)

Fifteen tables are year-worthy by meaning but carry no `academicYear` column: `attendance`, `grades`, `staffAttendance`, `leaves`, `assignments`, `submissions`, `assessments`, `assessmentGrades`, `examResults`, `fees`, `feeReceipts`, `feeConcessions`, `timetables`, `events`, `certificates`. Adding and populating those columns, their filters, and a migration for historical rows is a separate spec, planned only after this one ships and is in use. Also out: per-year access control, archiving a closed year, and the pending sidebar tasks #35 (emit qualified keys) and #36 (bookmark convergence) — #36 overlaps §3 case 3 and should be re-scoped after this lands.

## 10. Hazards

- **`header.tsx` is actively edited by a second window in this same tree**, along with `app-layout.tsx`, `ModulePanel.tsx`, `ModuleRail.tsx`, `module-sidebar.tsx` and three dashboard files. `module-nav-config.tsx` and `screen-registry.test.ts` are also shared. The chip and the link-builder sweep therefore touch shared files. Use the established recipe: check `git diff --cached -- <file>` and `git diff -- <file>` before touching, re-read immediately before each Edit, commit only with a trailing `-- <paths>`, verify with `git show --stat HEAD`, and report the surviving unstaged delta instead of resolving collisions quietly.
- `app-layout.tsx:74` is a second `parseRoute` consumer. If it is not updated in the same commit as the dispatcher, the sidebar highlight and the open screen disagree — the exact failure the module-route contract exists to prevent.
- The catch-all changes every tenant URL. Any external link, saved bookmark, or e-mail deep link into the app hits §3 case 3 and pays one redirect. Accepted; it converges rather than breaking.
- A wrong case-3 redirect target would loop. The guard: the redirect only fires when `year` is null *and* the tail is not the exempt screen, and it always re-uses the same tail shape, so the canonical URL is one the parser accepts on the second pass.

## 11. Suggested task order (for the plan)

1. Pure contract: `academic-year-url.ts` + `module-routes.ts` `year` support, with tests green first.
2. Route collapse: `[screen]`/`[detail]` → `[...segments]`, `loading.tsx` and metadata moved, both dispatchers switched; registry counts unchanged.
3. `useActiveAcademicYear()` + tenant-scoped `['academic-years', slug]` cache key.
4. Gate in the dispatcher (four branches of §6) and `/[slug]` → `/<year>/dashboard` in the generic dispatcher.
5. The chip in `header.tsx` (shared file — isolation recipe).
6. The 43-site link-builder sweep + the grep guard test.
7. The 15 screens stop guessing; two pickers removed; writes carry the URL year (four tables).
8. Server: default year at both tenant-create sites, backfill script, `YEAR_IN_USE` rename guard + dialog error surfacing.
9. Full verification: both typechecks, server lint, both test suites, browser pass with network evidence.
