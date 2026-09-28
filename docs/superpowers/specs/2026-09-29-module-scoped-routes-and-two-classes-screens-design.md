# Module-scoped URLs and the two Classes screens

Date: 2026-09-29
Status: draft for review
Scope: `apps/web` routing + admin sidebar, one new screen, two server fixes in `apps/server`

## Problem

The reference app scopes a screen's URL to its owning module
(`…/academics/classes`) and ships **two genuinely different Classes screens**:

- **Academics → Classes** — the structure editor: create, rename, set capacity,
  assign a class teacher, delete.
- **Students → Classes** — a read-only roster: how many are enrolled, how full
  each class is, filter by grade and section, and a `Manage` jump into the
  structure editor.

This copy has neither property. Its URL is `/{slug}/{screen}` with no module
segment, and the nav key `classes` is shared by the Academics and Student Fees
panels, so both rows open the identical screen. The Students panel has no
Classes row at all.

## Decisions taken

| Question | Choice |
|---|---|
| URL depth | Module segment only. No session segment, no `/school/{code}/{city}` prefix. |
| Build depth | The two Classes screens. The other seven Academics rows stay disabled. |
| The reference's `Completion` bar | Capacity fill (`studentCount / capacity`), relabelled honestly. |
| Key collision | Namespace all three routes. |
| `Medium` / `Vocational` / `Status` columns | Omitted — no database backing. |
| Students panel beyond the Classes row | Untouched. |

## 1. The routing contract

A screen key is either **bare** (`dashboard`, `my-classes`) or
**module-qualified** (`academics/classes`). Qualified keys are how admin module
screens are addressed; bare keys keep working for every other role and for
existing bookmarks.

`src/lib/routing/module-routes.ts` (new) owns the whole contract:

```
parseRoute(segments, isAdmin) -> { module: string | null, screen: string | null }
  /demo-academy/students            -> { module: null,   screen: 'students' }
  /demo-academy/academics/classes   -> { module: 'academics', screen: 'classes' }
  /demo-academy/dashboard           -> { module: null,   screen: 'dashboard' }

qualifiedKey(module, screen) -> 'academics/classes'
canonicalOwner(bareScreen)   -> module id | null   // derived, see below
componentKey(module, screen) -> the bare key the dispatcher switches on
```

**Path length disambiguates.** One segment after the slug is a screen; two is
module + screen. `/demo-academy/students` is the All Students screen while
`/demo-academy/students/classes` is the roster. Nothing else about the URL
changes, so no route folder is added or renamed — `[slug]/[screen]/[detail]`
already matches the two-segment shape.

`canonicalOwner` is **derived from `adminPanelSections`**, which is already
`Record<moduleId, ModuleNavSection[]>`. The owner is the first module in rail
order that contains the key, and it returns `null` for a key that is in no
panel (`dashboard`, `school-subscription`, `tickets`), which is what keeps those
bare. A hand-written second list of module→screen mappings is what would let the
sidebar and the URL disagree, so there isn't one.

`componentKey` exists because most qualified keys share a body with their bare
form and only genuinely different screens need a new one:

```
'academics/classes'    -> 'classes'       // existing AdminClasses
'student-fees/classes' -> 'classes'       // unchanged behaviour
'students/classes'     -> 'class-roster'  // new, see §3
```

This is the load-bearing simplification: the admin branch of the dispatcher
keeps switching on the same ~50 bare keys it uses today, so **no existing case
is edited**. One new case is added. Retargeting all 50 cases to qualified
strings would be a large, risky diff for no behavioural gain.

## 2. Call sites that change

| File | Change |
|---|---|
| `components/layout/app-layout.tsx` | `resolveScreenFromPathname` delegates to `parseRoute`. `navigateTo` accepts a qualified key and builds `/{tenant}/{module}/{screen}`. |
| `…/tenant-screen-dispatcher.tsx` | Uses `parseRoute` on `useParams()` instead of reading `screen` raw; adds `case 'class-roster'`. The tenant-mismatch `redirect()` carries the module segment. |
| `sidebar/module-nav-config.tsx` | `findModuleForScreen` and `getDefaultScreen` return qualified keys. `adminPanelSections` gains one Students row. No other entry edited. |
| `sidebar/ModulePanel.tsx` | Active-row test compares `resolvedScreen` to `qualifiedKey(module.key, entry.key)`. |
| `sidebar/module-sidebar.tsx` | Passes the module id through when navigating a panel row. |
| `lib/routing/module-routes.ts` | New. |

The dashboard launcher (`ModuleGrid`, `FavoritesStrip`) is **not** changed. It
keeps navigating to the bare `card.screen`, and the canonicaliser rewrites the
URL to its qualified form. That is the same path a bookmark takes, so one
mechanism covers both.

To be explicit about the one value that flows everywhere: the store's
`currentScreen` and the `resolvedScreen` prop both hold the **qualified** key
whenever `parseRoute` found a module (`academics/classes`), and the bare key
otherwise (`dashboard`). `componentKey` is applied only inside the dispatcher,
never stored and never shown in a URL — so the sidebar's active-row test and the
dispatcher's `switch` cannot disagree about which screen is open.

Legacy URLs are not redirected at the router level. A bare key an admin lands on
is resolved, then `router.replace`d to its canonical qualified form, so the
address bar converges without a 308 that would break the client store.

## 3. Students → Classes (new)

`src/modules/academics/components/ClassRoster.tsx`, registered under the
`students/classes` nav row. It lives in `modules/academics` because it renders
class data; the nav module it is reachable from is a routing fact, not an
ownership fact, and `modules/people` is where the student list lives.

Contents, all backed by real columns:

- Aggregate line: `{n} classes · {totalEnrolled} students · avg {x} per class`.
- Search over class name; `All grades` and `All sections` selects.
- Table: Class (name + derived slug line), Grade, Section, Class Teacher,
  Enrolled, **Capacity fill** as a percentage bar.
- `Manage` in the header → `academics/classes`.

Deliberately absent: the Medium filter, the Status column, and the per-row
chevron. `All Students` has no class filter, so a drill-in would land on an
unfiltered list and read as a bug.

The capacity bar is labelled **Capacity fill**, not Completion. The reference's
completion has no backing anywhere in this schema — there is no syllabus,
coverage or per-class progress entity — and calling `24/25 seats` a completion
percentage would be a fabricated metric behind a real-looking bar.

## 4. Server

`apps/server/src/modules/academics/class.service.ts`:

1. **`list` counts students by loading one row per student.** It uses
   `with: { students: { columns: { id: true } } }` and then `.length`, so a
   tenant with 298 enrolled students fetches 298 rows to produce 12 numbers.
   `listPaginated` twenty lines below already does this correctly with
   `SELECT classId, count() … GROUP BY`. This is copying an existing in-repo
   fix, not inventing one.
2. **`totalEnrolled` on the list response.** The roster's aggregate line cannot
   be computed client-side, because the endpoint paginates and page 2 would
   under-report. One tenant-wide `count()` returns the honest number.

Not doing, with reasons:

- **No `search` / `grade` / `section` query params.** The cache key is
  `classes:v1:{tenant}:{teacher}:{all}:{page}:{limit}` with a 300 s TTL. Adding
  filter params without extending that key serves unfiltered rows to a filtered
  request for five minutes — wrong data, silently. Filtering stays client-side
  over the returned page; `limit` caps at 100 and a school has tens of classes.
- **No new columns.** `Class` is `id, tenantId, name, section, grade, capacity`;
  medium, vocational, status and a session id do not exist and are out of scope.
- **No new endpoint.** `GET /api/classes` already returns exactly the roster's
  fields. Note for whoever wires it: the handler returns a **bare array** when
  `page`/`limit` are absent and an **envelope** when present, so the roster
  requests the envelope explicitly.

The in-memory `sortByName` stays. It is a natural sort
(`localeCompare(…, { numeric: true })`), which SQL `ORDER BY name` is not. The
reference sorts `10th, 1st, 2nd` — lexicographic. That is their bug and we will
not copy it.

## 5. Testing

- `modules/__tests__/screen-registry.test.ts` — specifier and key counts move.
- `modules/__tests__/module-nav.test.ts` — contextual sub-links now expect
  qualified keys.
- New `lib/routing/__tests__/module-routes.test.ts`:
  - path length selects bare vs qualified, for admin and non-admin;
  - `classes`' canonical owner is `academics`, so a rail-order change that
    re-pointed a bookmark fails a test instead of shipping;
  - every key in `adminPanelSections` round-trips through `parseRoute`;
  - `componentKey` maps only the three declared pairs.
- New roster assertion: the screen renders no value for medium, vocational or
  status, so a future edit that adds a fabricated column is caught.
- Server: the existing route-resolution test stays green; no route is added,
  moved or renamed.

Verification limit, stated up front: HTTP 200 proves compilation, not rendering.
`dynamic()` means the served HTML is a pre-hydration shell, and this session has
no working browser harness. Pixel parity against the screenshots stays a human
check.

## 6. Deviations from the approved answers

Flagged rather than resolved quietly:

- **"Three distinct routes with three distinct bodies"** was the chosen option
  text. This design ships three routes and **two** bodies. `student-fees/classes`
  keeps opening the structure editor, exactly as it does today. A fee-by-class
  view would need a per-class dues surface that has not been verified to exist;
  inventing one is out of scope. Say so if you want it as a fourth slice.

## 7. Out of scope

The session segment (`2026-27`) in the URL and the header session switcher.
Neither exists in this copy — there is no session in the store, and `Class` has
no `academicYearId`, so a session-scoped URL would need a schema change first.
The seven disabled Academics rows (Board Codes, Offerings, Groups, Teaching
Batches, Templates, By Class, Academics Dashboard) stay `Soon`; none of those
entities exists in the database.
