# Class level: rename `Class.grade` to `Class.classLevel`, derive the class name

Date: 2026-10-01
Status: awaiting approval — no code written
Reverses: the earlier approved decision "Names + labels, keep the column" from the Grade→Class rename slice.

## What we are doing and why

In India a school says "Class 10", not "Grade 10". The UI already says Class everywhere (that landed in
`e9c5826`). What still says `grade` is the storage and the wire: the column `Class.grade`, the REST payload
keys, the GraphQL read fields, and the code identifiers that feed them. This slice renames that vocabulary to
`classLevel`, and makes the class **name** a derived value instead of a thing an admin types — because once the
level is called "Class", the name "Class 10" is the same fact written twice.

Four decisions locked with the user:

1. Column name → `classLevel` (not `class`: the table is already `"Class"`, and `class`/`className` carry
   meaning in JS and React that has nothing to do with a school class).
2. Class name field → server derives it; the form input and the `name` request key are removed. The column
   stays, because the unique index, the slug, the default sort and roughly twelve display joins read it.
3. Wire → REST and GraphQL fields are renamed too, and mobile is updated mechanically so nothing silently
   reads `undefined`.
4. Cleanup → `enableGradeSelection` is deleted; the sort option survives under the new key.

## Naming map

| Surface | now | after |
|---|---|---|
| column | `Class.grade` (`schema.ts:211`) | `Class.classLevel`, values untouched (`1`…`12`, `Pre-Nursery`, `Nursery`, `LKG`, `UKG`) |
| indexes | `Class_grade_idx`, `Class_tenantId_grade_idx` | `Class_classLevel_idx`, `Class_tenantId_classLevel_idx` (same definitions) |
| REST write | POST/PUT `/api/classes` body `grade`, `name`, `slug` | body `classLevel`; `name` and `slug` leave the schema. The schema is not `.strict()`, so an old client sending them is ignored rather than rejected with a 400 |
| REST read | row `grade` | row `classLevel` |
| GraphQL | `grade: String!` (`academic.typeDefs.ts:74`), promotion `fromClassGrade`/`toClassGrade` (`promotions.routes.ts:64,67`) | `classLevel: String!`, `fromClassLevel`/`toClassLevel` |
| list filter/sort | `ClassListQuerySchema.grade`, `sortBy` enum `'grade'`, `CLASS_SORT_COLUMNS.grade`, `CLASS_SORT_EXPRESSIONS.grade` | `classLevel` in all four |
| web state/props | `form.grade`, `ClassFilters.grade`, `CLASS_GRADES`, `formatGradeLabel`, `autoClassName` | `classLevel`, `CLASS_LEVELS`, `formatClassLevelLabel`, `autoClassName` deleted |
| server write | `name` from client | `name = deriveClassName(classLevel)` |

## Name derivation

One function, server-side, next to `buildClassSlug` in `apps/server/src/lib/validation/class.ts`:

```ts
/** `"10" -> "Class 10"`; a non-numeric level ("LKG", "Pre-Nursery") is its own name. */
export function deriveClassName(classLevel: string): string {
  return /^\d+$/.test(classLevel) ? `Class ${classLevel}` : classLevel;
}
```

This is the rule the web form already applies (`class-options.ts:107`) and the rule the CSV class importer
already produces (`exports.routes.ts:437`), so no stored row changes shape. Section stays out of the name —
every row is named by level alone and the slug carries the section.

**POST `/api/classes`**: parse `{classLevel, section, …}` → derive `name` → duplicate check on
`(tenantId, derivedName, section)` (now stricter: an admin can no longer dodge the duplicate guard by typing a
different name) → slug = `resolveSlugCollision(buildClassSlug(derivedName, section), taken)` → insert.

**PUT `/api/classes`**: when `classLevel` or `section` is present, recompute `name` from the new level. Re-slug
**only when the stored name or section actually changes** — today `classes.routes.ts:221` re-slugs whenever
`name` is sent, and with a derived name that would make an unrelated capacity edit rewrite the class's URL.
This is the one behavioural trap in the slice and it gets a test.

**CSV class import** (`exports.routes.ts:387-479`): keeps parsing human strings like "Grade 10", "Class 10-A",
"10A" — that parser reads *other people's spreadsheets*, so its accepted tokens are not ours to rename. It
drops the `{grade, name}` pair and stores `{classLevel, deriveClassName(classLevel)}`.

## Removals

- `enableGradeSelection` — `tenantSettings.routes.ts:10`, `tenants.routes.ts:515`, the mobile conditional in
  `AddClassDialog.tsx:126-142` and `classes.tsx:145`, and the tenant-settings type entry. It is never read
  server-side and the web defaults it to a different value than the server does; once the level select is the
  only way to make a class, the flag has no meaning.
- The "Class name" `Input` in `ClassFormDialog.tsx:192-205` plus the `nameTouched` gate (`:93,100`) and
  `onNameChange`.
- `autoClassName` (`class-options.ts:107`) and mobile `getMappedGradeFromName` (`adminClasses/types.ts:17-26`)
  — both exist to translate between the two fields; one field is gone.
- The client-supplied `slug` write branch (`CreateClassSchema:78`, route `:106-116` and `:212-220`). Its only
  purpose was to let an admin hand-name a class; with a derived name the server is the only slug author.

## Deliberately unchanged

- **The `Grade` table (`schema.ts:300`) and `Submission.grade:357`** — marks scale (A+/B/B+), a different
  meaning of the same word. `reports.routes.ts:13-14` (`GRADE_RANK`, `GRADE_ORDER`) and `loaders.ts`
  `childGrades` read those, not class level.
- **`STUDENTS_YOUNGER_THAN_GRADE`** (`students-dashboard.service.ts:470`) — the web alert icon map keys off the
  literal (`alerts-card.tsx:29`); renaming buys no user-visible clarity and risks an orphaned key.
- **Slugs already stored** (`grade-1-a` on rows renamed to `Class 1` last slice). They are live URL keys for
  `/students/classes/<slug>`; rewriting them breaks bookmarks for a cosmetic gain. Slugs are corrected going
  forward, on the next real name change.
- **`formatClassLevelLabel`** keeps its behaviour: `1` renders `Class 1st`, and the stored value stays a bare
  number because it is what data keys off.

## Migration `drizzle/0019_class_level_column.sql`

Hand-written. `drizzle-kit` has no rename detection and would emit drop+add, which deletes the data; the
history (0009-0018) has no rename precedent, so this is the first one.

```sql
ALTER TABLE "Class" RENAME COLUMN "grade" TO "classLevel";
ALTER INDEX "Class_grade_idx" RENAME TO "Class_classLevel_idx";
ALTER INDEX "Class_tenantId_grade_idx" RENAME TO "Class_tenantId_classLevel_idx";
```

The migration does **not** normalize names. In `appdb` the loadtest-academy row `Grade 1 | A | 1` cannot become
`Class 1` — `(tenantId, name, section)` is unique and `Class 1 - A` already exists, so a normalizing `UPDATE`
aborts the whole migration. Names normalize on write instead.

Cache: the row shape changes, so `classes:paginated:v3` → `v4` (`class.service.ts:126` states this rule).

## Files touched

- **server (~24, incl. 3 test files)** — `db/schema.ts`, `lib/validation/class.ts`,
  `modules/academics/classes.routes.ts`, `class.service.ts`, `academic.typeDefs.ts`,
  `academics-dashboard.service.ts`, `modules/students/promotions.routes.ts`, `profile.routes.ts`,
  `students-dashboard.service.ts`, `modules/student-fees/fees.routes.ts`,
  `modules/student-attendance/attendance.routes.ts` + `attendance-dashboard.service.ts`,
  `modules/examinations/exams.routes.ts` + `admitCards.routes.ts`, `modules/data-io/exports.routes.ts`,
  `db/seed.ts` + `db/full_seed_data.ts` + `db/backfill_class_slugs.ts`,
  `graphql/typeDefs/root.typeDefs.ts`, `modules/dashboard/dashboard.typeDefs.ts`,
  `modules/tenancy/tenantSettings.routes.ts` + `tenants.routes.ts` (flag removal), plus 7 assertions in
  `validation/class.test.ts` and fixes in `class.service.test.ts` / `students-dashboard.service.test.ts`.
  Not touched despite matching the word: `modules/data-io/reports.routes.ts` and `lib/loaders.ts` (marks scale).
- **web (~19)** — the naming map above, concentrated in `lib/class-options.ts`,
  `modules/academics/classes/**` (form, filter panel, badges, table/grid, detail), `graphql/queries.ts`,
  `graphql/types/index.ts`, `modules/tenancy/components/superAdminSchoolDetail/TabRenderers.tsx`, and the
  `class-roster.test.ts` header assertion.
- **mobile (~12)** — mechanical: read the renamed field, drop the name picker and the mapper. Mobile is out of
  the current phase for features, but it typechecks in CI and must not ship a silent `undefined`.

## Verification

1. `cd apps/server && bun run typecheck` then `cd apps/web && bun run typecheck` — per app, never root turbo
   (three parallel `tsc` aborts at exit 134), never `npx tsc` (decoy package).
2. `cd apps/mobile && bun run typecheck`.
3. `cd apps/server && bun test src/lib/validation/class.test.ts src/modules/academics` — the new derivation
   tests go in first and must fail before the rename compiles.
4. Positive-control grep, not an empty search: `grep -rn '\bgrade\b' apps/server/src | grep -v Grade` must
   return only the marks-scale sites (`Grade` table, `Submission`, `GRADE_RANK`/`GRADE_ORDER`).
5. Apply `0019` to `appdb` and `loadtest` (local only), then confirm with a direct query that
   `information_schema.columns` shows `classLevel` and the two indexes under their new names, and that the row
   counts are unchanged (`demo-academy` 20, `loadtest-academy` 41, `loadtest` 40).
6. Live write test against `:4000`: POST a class with `{classLevel:"8",section:"C"}` and read back
   `name === "Class 8"`; PUT a capacity-only edit and assert the slug did **not** move; PUT a classLevel change
   and assert the name followed. Log in through the app's own `verifyPassword` path, not a hand-rolled hash.
7. Browser pass on the Classes screen: create, edit, filter by class level, sort by Class Level, and the class
   detail URL still resolving.
8. `bun run seed` for `demo-academy` and re-check the 20 rows land as `Class 1 … Class 10` with the derived
   names, all users on `test@123`.

## Data scope

Local `appdb` + `loadtest` only. The remote Render database (`test_52y1`, commented out in
`apps/server/.env`) is untouched; "for all schools" is satisfied by the migration applying to every tenant in
one shot, but running it against a shared/production database is a separate explicit decision.

## Known collisions and risks

- Editing the leftover `Grade 1 | A` row now collides with `Class 1 - A`; the honest fix is to delete or
  re-section one of them, and that is the user's data to decide on.
- `sortBy=grade` / `?grade=` requests 400 after the rename. No client sends them once web and mobile are
  updated, and a compatibility alias would keep the second vocabulary alive forever.
- ~40 call sites is enough surface that a missed read shows up as a blank class column rather than an error.
  Step 4's positive-control grep is what catches that class of miss.

## Out of scope (separate, each needs its own approval)

- A real admissions pipeline table (inquiry → approved → rejected). Today admission facts are `Student`
  columns `admissionDate:106` / `admissionNo:107` with rules in `StudentIdSetting:765-780`, and there is no
  `Admission` table by design.
- The prod-only "Class Creation Mode" settings card — no local code implements it.
- The queued "Security: guards + write-path validation" slice.
