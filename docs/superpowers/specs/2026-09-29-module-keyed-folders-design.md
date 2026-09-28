# Module-keyed folders for every screen — web and server

**Date:** 2026-09-29
**Status:** approved in chat, awaiting written-spec review
**Spec:** this document. No implementation plan exists yet; it is written by the writing-plans skill after this is approved.

**Goal:** every admin sidebar row gets a file inside a folder named after its module, in both
`apps/web/src/modules/` and `apps/server/src/modules/`, so a module is one place you can open.

**Architecture:** the sidebar module id becomes the folder key at all four layers —
URL (`/students/classes`) ↔ sidebar row ↔ web module folder ↔ server module folder. The move is
purely mechanical: no screen changes behaviour, no export names change, no route path changes.
Where several rows render one component, the rows that differ get a thin entry file and the rows
that do not differ share one folder.

**Tech:** Next.js App Router + Turbopack, React Compiler, Tailwind v4, TanStack Query, bun test,
`tsc --noEmit`; Elysia + Drizzle + GraphQL on the server; eslint-plugin-boundaries 7.2 on the server.

---

## 1. Why

Today a module is a concept in three places and a folder in none of them:

| layer | today |
|---|---|
| URL | `/academics/classes` and `/students/classes` both resolve (committed in `f…` Task 2) |
| sidebar | `adminPanelSections.academics` / `.students` both contain a `classes` row |
| web code | `modules/academics/components/AdminClasses.tsx`; the students copy would be a **second file in the same folder as the first** |
| server code | `modules/academics/classes.routes.ts`; `students.routes.ts` sits in `modules/people/` |

So `students/classes` and `academics/classes` have no natural home, and the two Classes screens
Task 5 is supposed to build would sit next to each other in `academics/components/` — which is
exactly the thing that makes them look like one screen with a flag. Keying folders by module also
means a future contributor can find "the fees code" by opening `fees` on either side of the wire.

## 2. Decisions

| # | question | decision |
|---|---|---|
| 1 | folder key | **sidebar module id** (`students/`, `academics/`, `student-fees/`), not the technical domain (`people/`, `finance/`) |
| 2 | coverage | **only screens that exist now**; `Soon` rows get no file. New files appear when the user asks for that screen |
| 3 | server | **rename to sidebar modules, one file per screen**, same as web |
| 4 | sequencing | **restructure before** the three pending routing tasks |
| 5 | shared bodies | **folder per row where the tab differs** (11 rows over 4 components); the 8 fee rows that render one identical screen share **one** folder |
| 6 | the other window | **wait until its work is committed** — no moves while it holds dirty files |

## 3. The rule

For a live admin row `M/<row>`:

```
apps/web/src/modules/<module-id>/<row-key>/
  index.tsx          the screen, keeping its existing NAMED export
  <Part>.tsx         that screen's sub-components move in beside it
```

- Folder names are the row key verbatim (`bulk-promote`, `academic-years`) — the same string the
  sidebar and the URL already use. No new vocabulary.
- **Exported symbol names do not change.** `AdminClasses` stays a named export called `AdminClasses`;
  only its path moves. Both registries already do
  `dynamic(() => import('@/modules/…').then(m => m.AdminClasses), { loading: LoadingScreen })` and
  that shape survives the move untouched, which keeps every non-dispatcher importer working and the
  diff mechanical. No `export * from` barrels, no default-export churn.
- One screen's private parts move with it: `academics/components/adminClasses/ClassesTableView.tsx`
  → `academics/classes/ClassesTableView.tsx`.
- A thin entry is the only new kind of file, and it is exactly this:

  ```tsx
  // apps/web/src/modules/students/bulk-promote/index.tsx
  import { AdminPromotions } from "../promotions";
  export const StudentsBulkPromote = () => <AdminPromotions initialTab="bulk" />;
  ```

  Its own name (`StudentsBulkPromote`) keeps the registry's `.then(m => m.X)` shape readable. The
  `initialTab` moves out of the dispatcher and into the entry; the dispatcher's `key="bulk-prom"`
  stays where it is, on the case, because that is what controls remount identity.
- Where a row is a thin entry over a shared body, the body lives in the row that owns the default tab.

### Shared bodies, enumerated

| component | rows | new layout |
|---|---|---|
| `AdminPromotions` | `students/promotions`, `/bulk-promote`, `/graduated` | body + parts in `students/promotions/`; two thin entries |
| `AdminExams` | `examinations/exams`, `/results-entry`, `/published-results` | body in `examinations/exams/`; two thin entries |
| `AdminLeaves` | `leaves/student-leaves`, `/teacher-leaves`, `/staff-leaves` | body in `leaves/student-leaves/`; two thin entries |
| `AdminStaffAttendance` | `employee-attendance/teacher-attendance`, `/staff-attendance` | body in `employee-attendance/teacher-attendance/`; one thin entry |
| `AdminFees` | 8 `student-fees/*` rows + `transport/transport-fee` | **one** folder `student-fees/fees/` for the 8 fee rows, plus one thin entry at `transport/transport-fee/`. All 9 render `<AdminFees />` with no props today, so nine identical files would be noise. Recorded as a deviation, not a shortcut. |
| `AdminClasses` | `academics/classes` + `student-fees/classes` | body in `academics/classes/`; one thin entry in `student-fees/classes/` (different module, so it needs its own folder even though the body is shared) |
| `AdminIamDashboard` | `iam/iam-dashboard`, `/security-pin`, `/seed-defaults` | **one** folder `iam/iam-dashboard/` for all three. Same reasoning and same shape as the fee rows: three live nav rows whose dispatcher cases are stacked fall-throughs onto `<AdminIamDashboard />` with no props. |

**43 live rows → 25 distinct components → 34 folders, of which 9 are thin entries.**

| component | rows it serves |
|---|---|
| `AdminFees` | 9 |
| `AdminIamDashboard` | 3 |
| `AdminPromotions` | 3 |
| `AdminExams` | 3 |
| `AdminLeaves` | 3 |
| `AdminClasses` | 2 |
| `AdminStaffAttendance` | 2 |

### Two things the rule has to answer

- **Hooks.** A hook used by exactly one screen moves into that screen's folder
  (`finance/hooks/use-expenses.ts` → `money-book/expenses/use-expenses.ts`). A hook used by more than
  one screen in a module stays at `modules/<module>/hooks/`. No third case.
- **`modules/students/students/`** is genuinely the path — module `students`, row `students` (the
  All Students CRUD screen). It reads oddly next to `students/classes/`, but renaming the row would
  change the URL, the sidebar key and the permission lookup to fix an aesthetic. The wart stays.

## 4. Web target map

`← rows` lists the sidebar rows that land on that file. Paths are relative to `apps/web/src/modules/`.

| new path | from | rows |
|---|---|---|
| `iam/iam-dashboard/` | `access-control/components/AdminIamDashboard.tsx` | iam: 3 rows, one folder |
| `iam/roles/` | `access-control/components/AdminRoles.tsx` | iam/roles |
| `iam/role-assignments/` | `access-control/components/AdminRoleAssignments.tsx` | iam/role-assignments |
| `iam/permissions-catalog/` | `access-control/components/AdminPermissionsCatalog.tsx` | iam/permissions-catalog |
| `academics/classes/` | `academics/components/AdminClasses.tsx` + `components/adminClasses/*` (5) | academics/classes, student-fees/classes |
| `academics/subjects/` | `AdminSubjects.tsx` + `components/adminSubjects/*` (5) | academics/subjects |
| `academics/academic-years/` | `AdminAcademicYears.tsx` | academics/academic-years |
| `academics/timetable/` | `timetable/components/AdminTimetable.tsx` | academics/timetable |
| `academics/calendar/` | `timetable/components/AdminCalendar.tsx` | academics/calendar |
| `academics/school-settings/` | `tenancy/components/AdminSchoolSettings.tsx` | academics/school-settings |
| `students/students/` | `people/components/AdminStudents.tsx` | students/students |
| `students/promotions/` | `academics/components/AdminPromotions.tsx` + `adminPromotions/*` (9) | students/promotions |
| `students/bulk-promote/` | thin entry → `../promotions` | students/bulk-promote |
| `students/graduated/` | thin entry → `../promotions` | students/graduated |
| `students/certificates/` | `certificates/components/AdminCertificates.tsx` | students/certificates |
| `employees/teachers/` | `people/components/AdminTeachers.tsx` + parts | employees/teachers |
| `employees/staff/` | `people/components/AdminStaff.tsx` + parts | employees/staff |
| `employees/parents/` | `people/components/AdminParents.tsx` + parts | employees/parents |
| `student-attendance/attendance/` | `attendance/components/AdminAttendance.tsx` | student-attendance/attendance |
| `employee-attendance/teacher-attendance/` | `attendance/components/AdminStaffAttendance.tsx` | employee-attendance/teacher-attendance |
| `employee-attendance/staff-attendance/` | thin entry | employee-attendance/staff-attendance |
| `student-fees/fees/` | `finance/components/AdminFees.tsx` + parts | student-fees: 8 fee rows, one folder |
| `student-fees/classes/` | thin entry → `@/modules/academics/classes` | student-fees/classes |
| `student-fees/reports/` | `data-io/components/AdminReports.tsx` | student-fees/reports |
| `transport/transport-fee/` | thin entry → `@/modules/student-fees/fees` | transport/transport-fee |
| `examinations/exams/` | `assessment/components/AdminExams.tsx` | examinations/exams |
| `examinations/results-entry/` | thin entry → `../exams` | examinations/results-entry |
| `examinations/published-results/` | thin entry → `../exams` | examinations/published-results |
| `examinations/print-marksheet/` | `assessment/components/AdminPrintMarksheet.tsx` | examinations/print-marksheet |
| `examinations/admit-cards/` | `certificates/components/AdminAdmitCards.tsx` | examinations/admit-cards |
| `leaves/student-leaves/` | `attendance/components/AdminLeaves.tsx` | leaves/student-leaves |
| `leaves/teacher-leaves/` | thin entry → `../student-leaves` | leaves/teacher-leaves |
| `leaves/staff-leaves/` | thin entry → `../student-leaves` | leaves/staff-leaves |
| `money-book/expenses/` | `finance/components/AdminExpenses.tsx` + `adminExpenses/*` (4) + `finance/hooks/use-expenses.ts` | money-book/expenses |

That is 34 folders: 25 bodies + 9 thin entries, and every one of the 43 live rows appears exactly once
in the `rows` column. `students/classes/` is deliberately absent — no such row exists at HEAD; Task 5
adds the row and the folder together.

Two notes the table makes unavoidable:

- `StudentFees`, `ParentFees` and `ParentAttendance` look like they belong in these folders by their
  names, but they are **student- and parent-role screens** (`case 'fees'` exists three times, once per
  role branch). Role screens do not move (§4 "What does NOT move"), so `finance/` keeps `StudentFees`
  and `communication`/`finance` keep the parent ones. This is the single most likely place for a
  reviewer to say a file moved to the wrong module.
- `student-fees/reports/` and `money-book/expenses/` are the two places where the sidebar row and the
  data's owner disagree. Reports aggregates every table; expenses is a finance table. **The folder
  follows the sidebar anyway**, because one consistent rule is worth more than two exceptions — but
  the server side keeps `data-io/` as its own module rather than folding exports into `student-fees`
  (see §5).

### The basis of this table, and why it matters

Both the module list and every file path in this table were read out of **`HEAD`**, not the working
tree — `git show HEAD:…`. That is not pedantry: the other window's then-uncommitted
`module-nav-config.tsx` was adding `security-pin` and `seed-defaults` as live `iam` rows and giving
them dispatcher cases, so a map taken off disk at the time would have promised two folders for
screens that were `disabled: true` at HEAD.

Their work has since landed as `67bc4ab`, so this table has been **re-run against the new `HEAD`** and
the deltas are recorded rather than assumed:

- `iam/security-pin` and `iam/seed-defaults` are live rows now. They fold into the existing
  `iam/iam-dashboard/` folder (3 rows, 1 component, no props), which is why the folder total stays at
  34 while the row count moved 41 → 43.
- A full `transport` section exists in the nav config (20 rows) but **19 are `disabled: true`**; only
  `transport-fee` is live, and it is already in the map as a thin entry. Do not build folders for the
  disabled rows — §10 covers what happens when one is enabled later.
- New disabled `academics` rows (`board-codes`, `offerings`, `groups`, `teaching-batches`) and new
  disabled `timetable` rows (`timetable-templates`, `timetable-by-class`) also move nothing.
- Verified mechanically: the set of live rows at `HEAD` and the set in this table's `rows` column now
  match exactly, in both directions (`scratch/head-rows.tsv`).

If their window lands more nav rows first, re-run the map before step 1 of §8; a row that arrives
afterwards gets its folder in its own commit, following §10.

### What does NOT move

`modules/<x>/` stays domain-keyed for everything that is not an admin sidebar module: role surfaces
(`TeacherMyClasses`, `StudentMyClasses`, `ParentChildren`, `ParentHomework`, the teacher/student/parent
screens), `auth/`, `platform/`, `dashboard/` (the launcher), `support/`, `communication/`, `tenancy/`
beyond School Settings, and the super-admin people screens. Consequence: `people/`, `attendance/`,
`assessment/`, `certificates/`, `data-io/` and `finance/` **survive as folders holding fewer files**.
They do not vanish, and that is deliberate — a folder named `students/` should not contain a parent's
"my children" screen.

## 5. Server target map

`apps/server/src/modules/`. REST first, GraphQL last, because REST moves are checked by `tsc` while
an SDL mistake is only caught at schema build.

| new module | files in | from |
|---|---|---|
| `students/` | `students.routes.ts`, `student.service.ts`, `promotions.routes.ts` | `people/`, `academics/` |
| `employees/` | `teachers.routes.ts`, `parents.routes.ts`, `staff.routes.ts`, `parent.service.ts`, `teacher.service.ts` | `people/` → **emptied** |
| `academics/` | `classes.routes.ts`, `class.service.ts`, `subjects.routes.ts`, `subject.service.ts` + academic SDL | unchanged minus promotions |
| `student-attendance/` | `attendance.routes.ts` | `attendance/` |
| `employee-attendance/` | `staffAttendance.routes.ts` | `attendance/` |
| `leaves/` | `leaves.routes.ts` | `attendance/` → **emptied** |
| `student-fees/` | `fees.routes.ts`, `fee.service.ts`, `fee-receipt.service.ts`, `fees.types.ts` | `finance/` |
| `money-book/` | expenses SDL (no REST file exists; expenses is GraphQL-only today) | `finance/` |
| `examinations/` | `exams.routes.ts`, `assessments.routes.ts`, `grades.routes.ts`, `submissions.routes.ts` | `assessment/` |
| `homework/` | `homework.routes.ts` | `assessment/` (its own sidebar module) |
| `iam/` | `roles.routes.ts` | `access-control/` |
| `certificates/` | `certificates.routes.ts` | stays; `admitCards.routes.ts` → `examinations/` |
| `data-io/` | `reports.routes.ts`, `exports.routes.ts` | **stays a module of its own** |

`transport/`, `timetable/`, `dashboard/`, `platform/`, `auth/`, `communication/`, `support/`,
`tenancy/` keep their names — each is already either a module id or not a module row.

**`data-io` is the one place the server deliberately does not mirror the web.** Reports and exports
read every table in the schema; filing them under `student-fees/` would make a cross-domain
aggregator look like it belongs to fees. The web folder follows the sidebar (§4), the server folder
follows the data. Stated so nobody has to rediscover the asymmetry.

**GraphQL split.** `academics/academic.{typeDefs,resolvers}.ts` currently covers classes + subjects +
promotions, and `finance/finance.{typeDefs,resolvers}.ts` covers fees + expenses. They split:
promotions/graduation SDL → `students/`, expenses SDL → `money-book/`. Both aggregation files
(`graphql/typeDefs/index.ts`, `graphql/resolvers/index.ts`) gain imports; the merged schema must be
byte-identical in field names, which is verified by the existing route-resolution test plus a
`SDL diff` step in the plan (print the composed schema before and after and diff).

**Route paths and permission strings do not change.** `src/index.ts` rewires 37 module imports; the
URLs it mounts stay identical.

## 6. Guardrails and how they interact

- **server boundary lint** keys on `src/modules/*` globs, not names, so renamed and new folders are
  classified automatically and the barrel rule keeps enforcing. Moving `promotions.routes.ts` out of
  `academics/` means `students/` must import `ClassService` through `academics/index.ts` — which the
  existing rule already requires and the barrel already exports.
- **web has no boundary lint** (deferred task), so web moves are policed only by `tsc` and the
  registry guard. No new mechanism is introduced here.
- **`screen-registry.test.ts`** counts lazy specifiers (69/25) and case keys (60/19) and resolves
  every `@/…` specifier against the filesystem. Case keys must not change during the restructure.
  **Specifier counts rise by 9** (the thin entries) and every specifier text changes; the counts are
  raised inside the plan step that does it, per that file's own rule that a count change is a
  deliberate act and never a side effect.
  Two pre-existing drifts to settle **before** step 1, or the restructure cannot tell its own drift
  from someone else's: `67bc4ab` added two dispatcher cases without touching the test, so the tenant
  case-key count is **62 at `HEAD` against an expected 60** and that test is red on arrival. Raise it
  to 62 as its own commit with the reason in the message.
- **`module-catalogue.test.ts`** and the rail/panel key tests assert sidebar shape, not paths —
  unaffected.
- The **staff-guard source guard** from Task 2 asserts `STAFF_FORBIDDEN_SCREENS.has(screenKey)` in the
  dispatcher text. `67bc4ab` reverted Task 2, so that guard is red at `HEAD` today and stays red until
  Task 2 is re-applied on top of the new dispatcher (tracked separately). The restructure does not
  depend on it, but §8's step 1 must not land before that re-apply, or the two red tests get blamed
  on each other.

## 7. Verification, per module commit

1. `cd apps/web && bun run typecheck` — catches every dangling import. A `HeaderProps` mismatch in
   `app-layout.tsx` is the other window's in-flight save: re-run once before investigating.
2. `cd apps/web && bun test src/modules/__tests__/ src/lib/__tests__/`
3. `cd apps/server && bun run typecheck && bun test` — Docker Desktop must be running or the
   route-resolution test fails at 5000 ms for reasons unrelated to the change.
4. `cd apps/server && bun run lint` (boundary rules).
5. `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/demo-academy/<module>/<row>` for
   one moved row. **200 proves compilation only** — `dynamic()` means the served HTML is a
   pre-hydration shell, so a 200 never proves the right screen rendered. Say that in the report.
6. `git show --stat HEAD` — confirm no file the other window owns slipped in.

## 8. Sequencing

**Gate: the other window's work is committed or closed first.** It landed partly as `67bc4ab` and
still holds uncommitted edits in `tenant-screen-dispatcher.tsx`, `generic-slug-dispatcher.tsx`,
`(authenticated)/layout.tsx`, `app-layout.tsx`, `ModuleRail.tsx`, `module-sidebar.tsx` and
`FavoritesStrip.tsx` — several of which are files this restructure moves. `git mv` on a file another
window holds would carry HEAD content to the new path while their whole-file write could resurrect
the old one.

Two things must land before step 1, each as its own commit:

- **0a.** the case-key count raised 60 → 62 (§6), so the restructure starts from a green suite;
- **0b.** Task 2's resolver + staff guard re-applied on top of their new dispatcher, which also
  revives `lib/routing/module-routes.ts` from dead code (§6).

Then one commit per module folder, smallest first, each independently verifiable:

1. `iam/` (4 folders for 6 live rows, 1 server file) — proves the recipe end to end
2. `academics/` — the in-place rename half of it (`components/AdminClasses.tsx` → `classes/index.tsx`)
3. `students/` + `students` server module (people split, promotions out of academics)
4. `employees/`
5. `student-attendance/` + `employee-attendance/` + `leaves/`
6. `student-fees/` (fees + reports + the classes thin entry)
7. `money-book/`
8. `examinations/` + `homework/`
9. GraphQL SDL split (`academic.*` → `students/`, `finance.*` → `money-book/`) with a composed-schema diff
10. Sweep: delete emptied folders, fix any straggler import, re-run §7 across the repo

**After** step 10, the three deferred routing tasks resume in the new shape: Task 3 (sidebar emits
qualified keys), Task 4 (bookmark convergence), Task 5 (the roster — which adds the
`students/classes` row to `adminPanelSections` and creates `students/classes/` as a real body next to
the existing `academics/classes/`. That is the pair this whole restructure exists to make possible.)

## 9. Out of scope

- No new screens, no behaviour change, no visual change. If a screen looks different after a move,
  that is a bug in the move.
- No `Soon` stubs (decision 2). Roughly 30 catalogue modules stay file-less.
- `apps/mobile/` is untouched; it talks GraphQL and its file layout is Expo-router-driven.
- Not giving the 9 fee URLs distinct tabs, and not fixing the fact that they all render one
  indistinguishable `<AdminFees />` today. `StudentFees` (the student-role screen) is not merged with
  it and does not move.
- No web boundary lint.
- The known loose ends carried in from the routing plan stay open: `"profile"` still in
  `PLATFORM_ROUTES`, and the `ModuleGrid`/`header.tsx` work owned by the other window.

## 10. The convention, forward-looking

When a new module screen is asked for: create `modules/<module-id>/<row-key>/index.tsx` on the web,
and `<row-key>.routes.ts` + (if it owns new tables) `<row-key>.service.ts` under the matching server
module folder; register the row in `adminPanelSections` with the same `<row-key>` string the folder
uses; add one `case` to the dispatcher and let `componentKey` route it. If two modules show the same
screen name with different bodies, they are two folders and two components — that is the entire point
of this restructure.
