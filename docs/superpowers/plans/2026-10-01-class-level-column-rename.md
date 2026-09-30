# Class level rename (`Class.grade` → `Class.classLevel`) + server-derived class names — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the class-level vocabulary from `grade` to `classLevel` through the database, the server, both API surfaces, the web app and the mobile app, and make the class **name** a server-derived value so the "Class name" and "Slug" inputs leave the class form.

**Architecture:** One column rename (`Class.grade` → `Class.classLevel`) carried to every reader, with the write path becoming the single author of `Class.name` via `deriveClassName()`. The wire contract (`/api/classes`, `/api/student-profile`, `/api/fees`, GraphQL) renames in the same breath as the column, so no client silently reads `undefined`. Marks-scale `grade` (the `Grade` table, `Submission.grade`, letter grades A+/B) is a different word with the same spelling and is never touched.

**Tech Stack:** Bun, Elysia + Drizzle ORM (Postgres), GraphQL Yoga, Redis-backed `dataCache`, Next.js 15 app router (web), Expo/React Native (mobile), `bun test`, TypeScript `tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-10-01-class-level-column-rename-design.md` (commit `c2baad0`) — read it first; this plan argues from it.

## Global Constraints

- **Typecheck per app, never from the repo root.** `cd apps/server && bun run typecheck`, then `cd apps/web && bun run typecheck`, then `cd apps/mobile && bun run typecheck`. Root `bun run typecheck` runs three `tsc` in parallel and aborts at exit 134 under memory pressure. Never `npx tsc` — `tsc` on npm here is a decoy package.
- **Always pass an absolute path to Grep.** In this session a Bash `cd` moved the working directory and a repo-wide grep silently searched only `apps/server`, producing a false "no matches". `enableGradeSelection` was reported as server-only when the web had a full settings card for it. Every "nothing else references X" claim needs the absolute path plus a positive control (a pattern you know must match).
- **Two windows edit this tree.** Stage explicit paths only (`git add <file> <file>`), never `git add -A`. If `git status --short` shows an unexpected modification in a file this plan touches, stop and report the collision rather than folding it in.
- **No commit step runs without the user's explicit approval for this plan.** The agreed default (spec committed alone, implementation commits gated on verification) stands: finish Tasks 1-7, verify, then ask once, then commit per feature with `git commit -m … -- <paths>` listing both sides of any rename or deletion.
- **Local databases only.** `appdb` (the dev DB `apps/server/.env` points at) and `loadtest`. The remote Render URL (`test_52y1`) is commented out in `.env` and stays untouched. Never edit `.env` to point at it, and never let a script pick it up: `apps/server/.env` holds a commented `DATABASE_URL` first, and a naive first-match regex grabs it. Read only `Bun.env.DATABASE_URL`, or match `^DATABASE_URL`.
- **Marks-scale `grade` is out of bounds.** Never rename: the `Grade` table (`schema.ts:300`), `Submission.grade:357`, `GRADE_RANK`/`GRADE_ORDER` (`reports.routes.ts:13-14`), `loaders.ts` `childGrades`, `exams.routes.ts:77` `EXCLUDED.grade`, `grades.routes.ts:238`, and every letter-grade display (`ledger-templates/*`, `ExamPreviewResultTab`, `marksheet-templates/*`, `GradesTable`, `parentGrades`, `StudentDashboard`).
- **`STUDENTS_YOUNGER_THAN_GRADE` stays as-is** (`students-dashboard.service.ts:470`) — the web alert icon map keys off the literal (`alerts-card.tsx:29`).
- **Server tests need Docker Desktop running.** A 5000 ms route-resolution timeout in `bun test` means Docker is paused, not that this rename broke something.
- **The app is intentionally half-renamed between tasks.** After Task 2 the web posts `grade` to a server expecting `classLevel`. Do not ship, demo or deploy mid-plan; Task 7 is the first point the whole stack agrees.

---

### Task 1: `deriveClassName()` — the single naming rule

**Files:**
- Modify: `apps/server/src/lib/validation/class.ts` (add after `resolveSlugCollision`, before the `─── Writes ───` banner at line 56)
- Test: `apps/server/src/lib/validation/class.test.ts` (new `describe` block)

**Interfaces:**
- Produces: `deriveClassName(classLevel: string): string` — exported from `../../lib/validation/class`, used by Tasks 3, 5 and 6.

- [ ] **Step 1: Write the failing tests**

Append to `apps/server/src/lib/validation/class.test.ts` (it already imports `test, expect, describe` from `bun:test` and helpers from `./class`):

```ts
import { deriveClassName } from './class';

describe('class name derivation', () => {
  test('a numeric level becomes "Class <n>" — the form the whole app already shows', () => {
    expect(deriveClassName('10')).toBe('Class 10');
    expect(deriveClassName('1')).toBe('Class 1');
  });

  test('an early-year level is its own name, with no "Class " prefix', () => {
    expect(deriveClassName('Pre-Nursery')).toBe('Pre-Nursery');
    expect(deriveClassName('Nursery')).toBe('Nursery');
    expect(deriveClassName('LKG')).toBe('LKG');
    expect(deriveClassName('UKG')).toBe('UKG');
  });

  test('the section never enters the name — the slug carries it', () => {
    expect(deriveClassName('5')).not.toContain('A');
    expect(deriveClassName('5')).toBe('Class 5');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd apps/server && bun test src/lib/validation/class.test.ts`
Expected: FAIL — `does not provide an export named 'deriveClassName'` (or `ExportMissing`/`SyntaxError` from the import). Not a silent pass.

- [ ] **Step 3: Write the function**

Insert into `apps/server/src/lib/validation/class.ts` immediately above the `// ─── Writes ───` line (56):

```ts
/**
 * The name a class row carries is the class level in words: `"10" -> "Class 10"`.
 * An early-year level (`LKG`, `Pre-Nursery`) is already a name, so it passes through.
 * Section is deliberately absent — every stored row is named by level alone and the
 * slug is what carries the section.
 */
export function deriveClassName(classLevel: string): string {
  return /^\d+$/.test(classLevel) ? `Class ${classLevel}` : classLevel;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/server && bun test src/lib/validation/class.test.ts`
Expected: PASS, including the 5 pre-existing describes (`class slugs`, `create validation`, `update validation`, `list query`, `teacher assignment`).

- [ ] **Step 5: Commit (gated on user approval)**

```bash
cd /d/per/inkwelly
git add apps/server/src/lib/validation/class.ts apps/server/src/lib/validation/class.test.ts
git commit -m "feat(classes): derive the class name from its level in one server-side rule" -- apps/server/src/lib/validation/class.ts apps/server/src/lib/validation/class.test.ts
```

---

### Task 2: Column rename — schema, migration 0019, every server read, the wire out

**Files:**
- Modify: `apps/server/src/db/schema.ts:205-226`
- Create: `apps/server/drizzle/0019_*.sql` + `drizzle/meta/*` (generated, then hand-repaired)
- Modify (reads): `src/modules/academics/class.service.ts`, `academic.typeDefs.ts`, `academics-dashboard.service.ts`, `classes.routes.ts` (read side only), `src/modules/students/profile.routes.ts:82`, `students-dashboard.service.ts:327`, `src/modules/student-fees/fees.routes.ts:410`, `src/modules/student-attendance/attendance-dashboard.service.ts:204`, `src/modules/examinations/admitCards.routes.ts:28,120`, `src/modules/data-io/exports.routes.ts:188,479`, `src/modules/students/promotions.routes.ts:64,67`, `src/modules/students/student-update.audit.ts`, `src/graphql/typeDefs/root.typeDefs.ts`, `src/modules/dashboard/dashboard.typeDefs.ts`, `src/db/backfill_student_status_and_gaps.ts:251` (raw SQL), `src/db/seed.ts:168,189`, `src/db/full_seed_data.ts:279-285,326,355,357,502`, `src/db/backfill_class_slugs.ts`
- Test: `src/modules/academics/class.service.test.ts`, `src/lib/validation/class.test.ts:65-70` (list query)
- Modify (flag deletion): `src/modules/tenancy/tenantSettings.routes.ts:10`, `src/modules/tenancy/tenants.routes.ts:515`

**Interfaces:**
- Consumes: `ClassRow` shape from `class.service.ts:19-35`.
- Produces: `schema.classes.classLevel`; `ClassRow.classLevel: string`; REST `GET /api/classes` item `classLevel`; GraphQL `Class.classLevel: String!`; `classFilterOptions.classLevels: [String!]!`; profile wire `classLevel` (was `classGrade`); fees wire `classLevel` (was `classGrade`); promotion wire `fromClassLevel`/`toClassLevel` (were `fromClassGrade`/`toClassGrade`); cache keys `classes:paginated:v4`, `classes:options:v2`, `classes:min:v2`.

- [ ] **Step 1: Confirm the schema file is yours alone before generating anything**

```bash
cd /d/per/inkwelly && git status --short apps/server/src/db/schema.ts apps/server/drizzle
```
Expected: no output. If either path is modified by the other window, STOP and report — `db:generate` would fold their pending schema drift into this migration.

- [ ] **Step 2: Rename the column and its two indexes in `schema.ts`**

`apps/server/src/db/schema.ts:211` → `classLevel: text('classLevel').notNull(),`
`:220` → `gradeIdx: index('Class_classLevel_idx').on(table.classLevel),` (rename the key to `classLevelIdx`)
`:223` → `tenantGradeIdx: index('Class_tenantId_classLevel_idx').on(table.tenantId, table.classLevel),` (rename the key to `tenantClassLevelIdx`)

- [ ] **Step 3: Generate, then repair the migration**

Run: `cd apps/server && bun run db:generate`
Expected: a new `drizzle/0019_*.sql` plus journal/snapshot updates. Open the SQL. It will contain a **data-loss pair** (`ALTER TABLE "Class" DROP COLUMN "grade";` then `ADD COLUMN "classLevel" text NOT NULL;`) because drizzle-kit has no rename detection. Replace the whole file body with exactly:

```sql
ALTER TABLE "Class" RENAME COLUMN "grade" TO "classLevel";
--> statement-breakpoint
ALTER INDEX "Class_grade_idx" RENAME TO "Class_classLevel_idx";
--> statement-breakpoint
ALTER INDEX "Class_tenantId_grade_idx" RENAME TO "Class_tenantId_classLevel_idx";
```

Keep the generated filename, journal entry and `meta/00XX_snapshot.json` (the snapshot is what stops the *next* `db:generate` from re-deriving a drop+add). If the generated file contains any statement beyond the column and those two indexes, delete the file, `git checkout -- apps/server/drizzle`, re-read the schema diff and start over — an unrelated statement in 0019 is a plan violation, not a detail.

- [ ] **Step 4: Rename every typed server read in one scripted pass, then audit**

```bash
cd /d/per/inkwelly/apps/server && grep -rln "schema\.classes\.grade\|classGrade" src --include=*.ts \
  | xargs sed -i 's/schema\.classes\.grade/schema.classes.classLevel/g; s/\bclassGrade\b/classLevel/g'
grep -rn "schema\.classes\.grade\|classGrade" src --include=*.ts
```
Expected: the second grep is empty **and** proven reachable — positive control: `grep -rn "schema.classes.classLevel" src --include=*.ts | head -3` must return lines.

- [ ] **Step 5: Fix the reads sed cannot see (each is a JS property or raw SQL, quote-exact)**

| file:line | now | becomes |
|---|---|---|
| `class.service.ts:24` | `grade: string;` (ClassRow) | `classLevel: string;` |
| `class.service.ts:42` | `grade: sql\`${schema.classes.classLevel}\`` | `classLevel: sql\`${schema.classes.classLevel}\`` |
| `class.service.ts:99` | `if (filters.grade)` / `filters.grade` | `if (filters.classLevel)` / `filters.classLevel` |
| `class.service.ts:132` | `f.grade ?? ''` | `f.classLevel ?? ''` |
| `class.service.ts:214,262` | `grade: schema.classes.classLevel,` / `grade: c.grade,` | key `classLevel:` |
| `class.service.ts:325-330` | `const [grades, …]`, `return { grades, … }` | `[classLevels, …]`, `{ classLevels, … }` |
| `class.service.ts:358` | `columns: { id, name, section, grade, slug }` | `classLevel: true` |
| `validation/class.ts:17` | `grade: 'grade',` in `CLASS_SORT_COLUMNS` | `classLevel: 'classLevel',` |
| `validation/class.ts:115,119` | `grade: z.string()…`, `sortBy` enum `'grade'` | `classLevel: z.string()…`, enum `'classLevel'` |
| `validation/class.ts:77` | `grade: z.string({ required_error: 'Class level is required' })…` | `classLevel:` (message unchanged) |
| `academics-dashboard.service.ts:44,194,247,260` | `.select({ … grade: schema.classes.classLevel })`, `c.grade` | `classLevel` in both |
| `backfill_student_status_and_gaps.ts:251` | raw `sql\`c.grade\`` | `sql\`c."classLevel"\`` — **typecheck will NOT catch this one** |
| `promotions.routes.ts:64,67` | `fromClassGrade: r.fromClass.grade` | `fromClassLevel: r.fromClass.classLevel` (and `toClassLevel`) |
| `admitCards.routes.ts:28,120` | `columns: { … grade: true }` | `classLevel: true` |
| `exports.routes.ts:188,198` | `grade: schema.classes.classLevel` / `'Class Level': c.grade` | `classLevel:` / `c.classLevel` (header text already correct) |
| `seed.ts:168,189` | `` `${c.grade}${c.section}` `` | `` `${c.classLevel}${c.section}` `` |
| `full_seed_data.ts:279-285` | `gradesList` → `classLevels`, `grade: grade` → `classLevel: level`; **keep the literal `name: \`Class ${level}\``** here — `Class.name` is NOT NULL with no default, so dropping it would fail at runtime. Task 6 replaces the literal with `deriveClassName()` |
| `full_seed_data.ts:326,355,357,502` | `c.grade` | `c.classLevel` |

- [ ] **Step 6: Rename the schema identifiers the seed inserts, and the GraphQL type fields**

`academic.typeDefs.ts:74` → `classLevel: String!`; `root.typeDefs.ts` and `dashboard.typeDefs.ts` class fragments → `classLevel`; the `classFilterOptions` type's `grades: [String!]!` → `classLevels: [String!]!`. Then:

```bash
cd /d/per/inkwelly/apps/server && grep -rn "grades" src/modules/academics/academic.typeDefs.ts src/graphql/typeDefs/root.typeDefs.ts src/modules/dashboard/dashboard.typeDefs.ts
```
Expected: no `grades` left that means class level (marks-scale `grades` resolvers are in `grades.routes.ts` / `dashboard.resolvers.ts` and stay).

- [ ] **Step 7: Delete the dead `enableGradeSelection` on the server**

`src/modules/tenancy/tenantSettings.routes.ts:10` — remove the key from `DEFAULT_SETTINGS`. `src/modules/tenancy/tenants.routes.ts:515` — the tenant-create default becomes `settings: JSON.stringify({})`. Confirm nothing else reads it before deleting:

```bash
cd /d/per/inkwelly/apps/server && grep -rn "enableGradeSelection" src
```
Expected after the edit: no output. Positive control first: `grep -rn "DEFAULT_SETTINGS" src | head -3` must return lines, so an empty result above means "deleted", not "never there". `PUT /tenant-settings` replaces the whole JSON blob (last-writer-wins), so a tenant whose stored blob still carries the key simply never reads it again — no data migration.

- [ ] **Step 8: Bump the three cache keys whose row shape changed**

`class.service.ts:138` `classes:paginated:v3:` → `:v4:`; `:314` `classes:options:v1:` → `:v2:`; `:336` `classes:min:v1:` → `:v2:`. `classes:stats:v1` is aggregate-only and stays `v1`. Without this, entries written before the rename keep serving `grade`-keyed rows for up to five minutes and the screen looks half-migrated.

- [ ] **Step 9: Update the assertions the rename invalidates**

`validation/class.test.ts:28,37,42,54,67` — `grade: 'Class 1st'` → `classLevel: 'Class 1st'`; `:9-11` slug test name `a grade and section become…` → `a class level and section become…` (its expectation `buildClassSlug('  Grade 1 - ', 'B') === 'grade-1-b'` still passes — it is slugifying an arbitrary string, not our vocabulary, so leave the literal); `:42` title → "a missing class level is rejected, because the roster groups on it". `class.service.test.ts` — any `grade` key in a fixture or expectation that reads `ClassRow` becomes `classLevel`; `CLASS_SORT_EXPRESSIONS` keys become `name|classLevel|section|capacity`.

- [ ] **Step 10: Typecheck and test the server**

```bash
cd /d/per/inkwelly/apps/server && bun run typecheck && bun test src/lib/validation src/modules/academics src/modules/students
```
Expected: `tsc --noEmit` silent, tests pass. If a route test times out at 5000 ms, Docker Desktop is paused — start it, do not chase the code.

- [ ] **Step 11: Commit (gated)**

```bash
git add apps/server/src apps/server/drizzle
git commit -m "feat(db): rename Class.grade to Class.classLevel and carry it through the server" -- apps/server/src apps/server/drizzle
```

---

### Task 3: The write path — one vocabulary in, derived name out, and the slug trap

**Files:**
- Modify: `apps/server/src/lib/validation/class.ts:74-96`, `apps/server/src/modules/academics/classes.routes.ts:85-135` (POST) and `:176-230` (PUT), `apps/server/src/modules/data-io/exports.routes.ts:387-479` (the CSV class importer; it needs `import { deriveClassName } from '../../lib/validation/class'`)
- Create: `apps/server/src/modules/academics/classes.routes.test.ts`
- Test: `apps/server/src/lib/validation/class.test.ts`

**Interfaces:**
- Consumes: `deriveClassName(classLevel)` from Task 1, `schema.classes.classLevel` from Task 2, `buildClassSlug`/`resolveSlugCollision`/`takenSlugs`.
- Produces: POST body `{ classLevel, section, medium?, capacity?, isVocational?, isActive?, classTeacherId? }` — `name` and `slug` are gone from `CreateClassSchema`. PUT `{ id, …any subset }`; the server owns `name` and re-slug. Response item shape = Task 2's `GET /api/classes` item.

- [ ] **Step 1: Write the failing tests for the derivation-on-write contract**

```ts
import { CreateClassSchema, UpdateClassSchema } from './class';

describe('class writes own no name', () => {
  test('a create body needs only a level and a section', () => {
    const parsed = CreateClassSchema.parse({ classLevel: '10', section: 'A' });
    expect(parsed.classLevel).toBe('10');
    expect('name' in parsed).toBe(false);
    expect('slug' in parsed).toBe(false);
  });

  test('a client that still sends name and slug is ignored, not rejected', () => {
    const parsed = CreateClassSchema.parse({
      classLevel: '9', section: 'B', name: 'Blue House 9', slug: 'blue-9',
    });
    expect(parsed.classLevel).toBe('9');
    expect((parsed as Record<string, unknown>).name).toBeUndefined();
  });

  test('an early-year level validates with no numeric assumption', () => {
    expect(CreateClassSchema.parse({ classLevel: 'LKG', section: 'A' }).classLevel).toBe('LKG');
  });

  test('a level change alone is a legal patch', () => {
    expect(UpdateClassSchema.parse({ id: 'c1', classLevel: '6' }).classLevel).toBe('6');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/server && bun test src/lib/validation/class.test.ts`
Expected: FAIL on the first (`required_error: 'Class level is required'` fires against `grade`, not `classLevel`, so `classLevel` is unexpected/missing).

- [ ] **Step 3: Reshape the write schemas**

`validation/class.ts` `CreateClassSchema` becomes exactly:

```ts
export const CreateClassSchema = z.object({
  section,
  classLevel: z.string({ required_error: 'Class level is required' }).trim().min(1, 'Class level is required').max(40),
  medium: medium.default('English'),
  capacity: capacity.default(40),
  isVocational: z.boolean().default(false),
  isActive: z.boolean().default(true),
  classTeacherId: z.string().nullable().optional(),
});
```

`UpdateClassSchema` stays `CreateClassSchema.partial().extend({ id: … })` — the partial is what lets mobile patch a subset, and the comment above it (`:87-92`) should now say mobile sends `section/classLevel/capacity/classTeacherId`.

- [ ] **Step 4: POST derives the name and the slug**

In `classes.routes.ts:90-128`, after `const data = parsed.data;`:

```ts
const name = deriveClassName(data.classLevel);

const existing = await db.query.classes.findFirst({
  where: and(
    eq(schema.classes.tenantId, tenantId!),
    eq(schema.classes.name, name),
    eq(schema.classes.section, data.section)
  ),
});
if (existing) {
  set.status = 400;
  return { error: `Class "${name} - ${data.section}" already exists for this school` };
}

const taken = await takenSlugs(tenantId);
const slug = resolveSlugCollision(buildClassSlug(name, data.section), taken);
```

Delete the `requested = data.slug?.trim()` branch (`:106-116`) — with a derived name the server is the only slug author. Insert `name, section: data.section, classLevel: data.classLevel, slug, …` unchanged otherwise, and the Posthog `class_created` properties become `name`, `section`, `classLevel: cls.classLevel`.

- [ ] **Step 5: PUT recomputes the name, and re-slugs only on a real change**

Replace `classes.routes.ts:184-226` with:

```ts
const classLevel = data.classLevel ?? cls.classLevel;
const section = data.section ?? cls.section;
const name = deriveClassName(classLevel);

const duplicate = await db.query.classes.findFirst({
  where: and(
    eq(schema.classes.tenantId, tenantId!),
    eq(schema.classes.name, name),
    eq(schema.classes.section, section),
    sql`${schema.classes.id} != ${id}`,
  ),
});
if (duplicate) {
  set.status = 400;
  return { error: `Class "${name} - ${section}" already exists for this school` };
}

// Exactly the keys the caller sent — a mobile edit that knows nothing about
// `medium` must not reset it to the column default. The name always tracks the
// level, so it is written whenever the level or section moved.
const patch: Record<string, unknown> = {};
if (data.classLevel !== undefined) patch.classLevel = data.classLevel;
if (data.section !== undefined) patch.section = data.section;
if (data.medium !== undefined) patch.medium = data.medium;
if (data.capacity !== undefined) patch.capacity = data.capacity;
if (data.isVocational !== undefined) patch.isVocational = data.isVocational;
if (data.isActive !== undefined) patch.isActive = data.isActive;

if (name !== cls.name || section !== cls.section) {
  patch.name = name;
  const taken = await takenSlugs(tenantId, id);
  patch.slug = resolveSlugCollision(buildClassSlug(name, section), taken);
}
```

The guard `if (name !== cls.name || section !== cls.section)` is the whole point of this task. Before it, `:221` re-slugged whenever `name` was sent; with a derived name every PUT would send a name, so editing only the capacity would rewrite the class's URL and break `/students/classes/<slug>` bookmarks and the class detail page.

- [ ] **Step 6: Write the regression tests that prove the slug does not move**

There is no test file for these routes yet — `ls src/modules/academics/*.test.ts` shows only `academic.year-in-use.test.ts` and `class.service.test.ts`. Create `apps/server/src/modules/academics/classes.routes.test.ts` against `classesRoutes` (`classes.routes.ts:33`) using the harness this repo already uses in `src/modules/student-attendance/attendance.routes.test.ts`: a real DB, a hand-minted admin JWT, sentinel values nothing else can reach, and exact-key cleanup.

```ts
import { afterAll, beforeAll, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { classesRoutes } from "./classes.routes";

/**
 * The name is derived and the slug is derived from the name, so a PUT that only
 * moves the capacity must not touch either — otherwise editing a number rewrites
 * the URL that `/students/classes/<slug>` and every bookmark depend on.
 *
 * Sections Z and Z2 no school uses, so these rows can never reach a screen, and
 * they are deleted by exact id afterwards.
 */
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const createdIds: string[] = [];
let admin: { token: string; tenantId: string };

async function call(method: "POST" | "PUT", body: Record<string, unknown>) {
  return classesRoutes.handle(
    new Request(`http://localhost/classes${method === "PUT" ? "" : ""}`, {
      method,
      headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.role, "admin"), eq(schema.users.isActive, true)),
  });
  if (!user?.tenantId) throw new Error("this database needs an active admin user with a tenant");
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  const token = await new SignJWT({
    id: user.id, email: user.email, role: user.role, tenantId: user.tenantId,
    typ: "access", jti: `class-write-${Date.now()}`,
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt(iat).setExpirationTime("5m").sign(secret);
  admin = { token, tenantId: user.tenantId };
});

afterAll(async () => {
  for (const id of createdIds) {
    await db.delete(schema.classes).where(eq(schema.classes.id, id));
  }
});

test("a capacity-only edit keeps the stored name and slug", async () => {
  const res = await call("POST", { classLevel: "91", section: "Z", capacity: 30 });
  expect(res.status).toBe(200);
  // POST answers `{ id, name }` and PUT answers `{ success: true }` — nothing else,
  // so every assertion reads the row back from the database.
  const created = await readClass(((await res.json()) as { id: string }).id);
  expect(created.name).toBe("Class 91");
  expect(created.slug).toBe("class-91-z");

  const put = await call("PUT", { id: created.id, capacity: 44 });
  expect(put.status).toBe(200);
  const after = await readClass(created.id);
  expect(after.capacity).toBe(44);
  expect(after.name).toBe("Class 91");
  expect(after.slug).toBe(created.slug);
});

test("changing the level moves the name and the slug with it", async () => {
  const res = await call("POST", { classLevel: "92", section: "Z" });
  const created = await readClass(((await res.json()) as { id: string }).id);

  await call("PUT", { id: created.id, classLevel: "93" });
  const after = await readClass(created.id);
  expect(after.name).toBe("Class 93");
  expect(after.classLevel).toBe("93");
  expect(after.slug).not.toBe(created.slug);
});

test("a client that still sends a name gets the derived one", async () => {
  const res = await call("POST", { classLevel: "94", section: "Z", name: "Blue House 94", slug: "blue-94" });
  expect(res.status).toBe(200);
  const created = await readClass(((await res.json()) as { id: string }).id);
  expect(created.name).toBe("Class 94");
  expect(created.slug).toBe("class-94-z");
});

test("the same level and section twice is refused by the derived name", async () => {
  await call("POST", { classLevel: "95", section: "Z" });
  const second = await call("POST", { classLevel: "95", section: "Z" });
  expect(second.status).toBe(400);
  expect(((await second.json()) as { error: string }).error).toContain("Class 95 - Z");
});
```

Add the reader above the tests; it registers the id so `afterAll` deletes it:

```ts
async function readClass(id: string) {
  createdIds.push(id);
  const row = await db.query.classes.findFirst({ where: eq(schema.classes.id, id) });
  if (!row) throw new Error(`class ${id} vanished between write and read`);
  return row;
}
```

Two facts about this route group, already checked in the source so they do not have to be rediscovered: `classesRoutes` mounts `requireAuth` and `requirePermission('classes')` itself (`classes.routes.ts:34-35`), so the bearer token in `call()` is the entire setup and no extra `.use()` is needed; the tenant resolves from the token, not an `x-tenant-id` header. Levels 91-95 are outside `CLASS_LEVELS`' 1-12 but inside the zod `max(40)` string, and section `Z` is outside `CLASS_SECTIONS`, so these rows can never reach a real dropdown.

- [ ] **Step 7: Run, verify red then green**

```bash
cd apps/server && bun test src/modules/academics src/lib/validation/class.test.ts
```
Expected after Step 5-6: all pass. Then prove the regression test is real: temporarily drop the `name !== cls.name` guard to `if (true)`, re-run, and confirm the capacity test FAILS on the slug assertion; restore the guard and re-run to green. A test that passes both ways guards nothing.

- [ ] **Step 8: The CSV class import creates classes by the same rule**

`src/modules/data-io/exports.routes.ts:387-479` is a second class-creation path that bypasses the route. Its `getMappedGradeAndName` (`:430-439`) already produces `{ grade, name: \`Class ${n}\` }` — the pair `deriveClassName` now owns. Keep `parseClassString` (`:387-427`) exactly as it is, because it reads **other people's spreadsheets** and must go on accepting "Grade 10", "Class 10-A" and "10A"; those tokens are input tolerance, not our vocabulary. Delete `getMappedGradeAndName` and derive instead:

```ts
const { classLevel: levelRaw, section } = parseClassString(className);
const classLevel = /^\d+$/.test(levelRaw)
  ? levelRaw
  : levelRaw.match(/\d+/)?.[0] ?? levelRaw.trim().replace(/^(nursery|lkg|ukg|pre-nursery)$/i, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
const dbName = deriveClassName(classLevel);
```

The array type at `:442`, the insert values at `:464` and the read at `:479` then carry `classLevel` and `name: dbName`. `:446` keeps accepting a `grade` **column header** in the uploaded sheet for the same input-tolerance reason.

- [ ] **Step 9: Commit (gated)**

```bash
git add apps/server/src/lib/validation/class.ts apps/server/src/modules/academics
git commit -m "feat(classes): the server owns the class name and slug, and a capacity edit no longer moves a URL" -- apps/server/src/lib/validation/class.ts apps/server/src/modules/academics
```

---

### Task 4: Web — vocabulary, the shortened form, and the death of "Class Creation Mode"

**Files:**
- Modify: `apps/web/src/lib/class-options.ts`, `src/lib/types.ts:56`, `src/lib/graphql/queries.ts:155,168,173,178,196`, `src/lib/graphql/types/index.ts:128`
- Modify: `src/components/shared/classes/ClassBadges.tsx`, `ClassesFilterPanel.tsx`, `src/modules/academics/classes/**` (`adminClasses/ClassFormDialog.tsx`, `ClassesTableView.tsx`, `index.tsx`), `src/modules/academics/school-settings/**` (delete `adminSchoolSettings/class-settings-card.tsx`, rewire `adminSchoolSettings/index.tsx:21,73-74,93,115,178-181`, `types.ts:29,41,56,66,79,98,120-133,185-210`)
- Modify (reads): `src/modules/students/classes/{ClassSwitcher,ClassRosterTable,ClassDetail,index}.tsx`, `src/modules/students/students/adminStudents/{types.ts,profile/use-student-profile.ts,profile/AcademicTab.tsx}`, `src/modules/students/graduated/index.tsx`, `src/modules/students/students-dashboard/components/stages-card.tsx:11`, `src/modules/students/promotion/promotions-new/index.tsx:275`, `src/modules/examinations/admit-cards/**` (`index.tsx:214,224,548`, `adminAdmitCards/ClassSelector.tsx:15,25,47`, `GeneratedCardsTable.tsx:66`, `templates/{ClassicQuad,DetailedDual,MinimalTicket,PremiumModern}.tsx`, `templates/types.ts:29`), `src/modules/student-fees/fees/adminFees/{types.ts:25,73,103,119, FeeStatusTab.tsx, payment/StudentSelector.tsx:43, structures/AddFeeStructureDialog.tsx, transport/TransportDialogs.tsx}`, `src/modules/student-attendance/classes/{index.tsx, components/ClassRegisterList.tsx:45}`, `src/modules/assessment/components/adminExams/wizard/{useCreateExamWizard.ts:39,46,60,61, types.ts:51}`, `src/modules/academics/academics-dashboard/components/structure-card.tsx:15`, `src/modules/tenancy/components/superAdminSchoolDetail/{TabRenderers.tsx:298, types.ts:79}`, `src/modules/tenancy/components/superAdminSubscriptions/types.ts:27`

**Interfaces:**
- Consumes: Task 2's wire (`classLevel`, `classLevels`, `classLevel` on profile/fees, `fromClassLevel`).
- Produces: `CLASS_LEVELS`, `formatClassLevelLabel()`, `ClassFilters.classLevel`, `ClassInfo.classLevel`, `ClassLevelBadge`. `autoClassName` no longer exists anywhere.

- [ ] **Step 1: Scripted rename of the four unambiguous identifiers**

```bash
cd /d/per/inkwelly/apps/web && grep -rl "formatGradeLabel\|CLASS_GRADES\|classGrade\|GradeBadge" src --include=*.ts --include=*.tsx \
  | xargs sed -i 's/\bformatGradeLabel\b/formatClassLevelLabel/g; s/\bCLASS_GRADES\b/CLASS_LEVELS/g; s/\bclassGrade\b/classLevel/g'
grep -rn "formatGradeLabel\|CLASS_GRADES\|classGrade" src --include=*.ts --include=*.tsx
```
Expected: second grep empty; positive control `grep -rn "formatClassLevelLabel" src | head -3` returns lines.

Before touching `GradeBadge`, list its uses and confirm each renders a class-level pill (never a letter grade):

```bash
grep -rn "GradeBadge" src --include=*.tsx
```
If every hit is a class row, rename the component and its `grade` prop to `ClassLevelBadge` / `classLevel`. If any hit is a marks pill, leave that file alone and rename only the class-level ones.

- [ ] **Step 2: Finish `lib/class-options.ts` by hand**

`:22` → `{ value: 'classLevel', label: 'Class Level' }`. `ClassFilters.grade:41` → `classLevel?: string`, `defaultClassFilters:55` → `classLevel: ALL`, `classQueryArgs:77` → `if (filters.classLevel && filters.classLevel !== ALL) args.classLevel = filters.classLevel;`. Delete `autoClassName` (`:102-110`) entirely including its doc comment. Rewrite the `formatClassLevelLabel` comment at `:88-91` so it says the stored value stays bare because students, fees and exams key off it. `:1-6` header comment: `CLASS_LEVELS` mirrors `apps/server/src/lib/validation/class.ts`.

- [ ] **Step 3: Replace the class form's two derived fields with nothing**

In `adminClasses/ClassFormDialog.tsx`:
- `ClassFormPayload` (`:33-43`) loses `name` and `slug`; keeps `id?, section, classLevel, medium, capacity, isVocational, isActive`.
- `emptyForm` (`:54-63`) loses `name`, `slug`; `grade` → `classLevel`.
- Delete `previewSlug` (`:65-73`) and the `Input` import if unused elsewhere in the file.
- Seed-from-`initial` (`:80-89`): `classLevel: initial.classLevel, section: initial.section, medium…, capacity…, isVocational…, isActive…`.
- Delete `nameTouched`/`slugTouched` (`:90-94`), `onNameChange` (`:108-111`), and the slug branches; `onClassLevelChange` becomes `const onClassLevelChange = (classLevel: string) => set({ classLevel });` and `onSectionChange` becomes `const onSectionChange = (section: string) => set({ section });`.
- `valid` (`:114-119`) → `!!form.classLevel.trim() && !!form.section.trim() && Number.isFinite(capacity) && capacity >= 1`.
- `submit` (`:121-134`) sends `{ id: initial?.id, section, classLevel: form.classLevel.trim(), medium, capacity, isVocational, isActive }`.
- Delete the **Class name** block (`:192-205`) and the **Slug** block (`:207-223`) including their `<Label>`s and hints. The `htmlFor="class-grade"`/`id="class-grade"` pair (`:156,160`) becomes `class-level`.

The form now reads: Class level, Section, Medium, Max capacity, Vocational, Active. Nothing in it can disagree with the server's derivation.

- [ ] **Step 4: Delete "Class Creation Mode" — the whole card, not just the flag**

`apps/web/src/modules/academics/school-settings/adminSchoolSettings/class-settings-card.tsx` contains exactly one setting (`enableGradeSelection`) and a static mockup; the file is deleted, not edited:

```bash
cd /d/per/inkwelly && git rm apps/web/src/modules/academics/school-settings/adminSchoolSettings/class-settings-card.tsx
```

Then in `adminSchoolSettings/index.tsx`: drop the import (`:21`), `handleToggleGradeSelection` (`:73-75`), the `<ClassSettingsCard …>` JSX (`:178-181`), and `enableGradeSelection` from the two settings payloads (`:93`, `:115`). In `adminSchoolSettings/types.ts`: drop the state field (`:41`, `:79`), the partial type (`:29`, `:66`), the `TOGGLE_GRADE_SELECTION` action (`:56`, `:185-189`), and the reducer plumbing (`:98`, `:120-121`, `:133`, `:197`, `:210`).

Because `PUT /tenant-settings` replaces the whole JSON blob (last-writer-wins), removing the key from the payload is enough — no stored blob migration. A tenant whose blob still carries `enableGradeSelection: true` simply never reads it again.

- [ ] **Step 5: Admit cards and the class selector**

`adminAdmitCards/ClassSelector.tsx`: drop the `enableGradeSelection?` prop (`:15`) and its default (`:25`); `:47` becomes `{c.classLevel}, {c.name} (Section {c.section})`. `examinations/admit-cards/index.tsx`: drop the flag state/plumbing (`:214`, `:224`, `:548`). `templates/types.ts:29` and the four template components + `GeneratedCardsTable.tsx:66` read `card.class.classLevel`.

- [ ] **Step 6: The remaining read sites, one table**

| file:line | becomes |
|---|---|
| `ClassesTableView.tsx:77` | `<ClassLevelBadge classLevel={formatClassLevelLabel(cls.classLevel)} />` |
| `ClassesFilterPanel.tsx:74-79` | `filters.classLevel`, `onChange({ classLevel: v })`, `options.classLevels` |
| `students/classes/ClassSwitcher.tsx:27-40,66` | `CLASS_LEVELS`, `LEVEL_ORDER`, `byLevel`, `group.classLevel` |
| `ClassRosterTable.tsx:62`, `ClassDetail.tsx:239`, `classes/index.tsx:151-154` | `formatClassLevelLabel(cls.classLevel)`, `filters.classLevel` |
| `adminStudents/types.ts:40`, `promotions-new/index.tsx:275`, `superAdminSchoolDetail/types.ts:79`, `superAdminSubscriptions/types.ts:27`, `adminFees/types.ts:103`, `adminExams/types.ts:51` | `classLevel: string` on the class option/interface |
| `profile/use-student-profile.ts:93`, `profile/AcademicTab.tsx:29` | `classLevel` (server key renamed in Task 2 from `classGrade`) |
| `graduated/index.tsx:46-48,140,166` | `numericLevel(level)`, `` `${c.name}-${c.section} (Class ${c.classLevel})` `` |
| `student-attendance/classes/…/ClassRegisterList.tsx:45` | `(c.classLevel && c.classLevel.toLowerCase().includes(q))` |
| `adminFees/payment/StudentSelector.tsx:43` | `` {c.name}-{c.section} (Class ${c.classLevel}) `` — this line still prints **Grade** to the admin |
| `academics-dashboard/components/structure-card.tsx:15` | comment reads `Class.classLevel` |
| `useCreateExamWizard.ts:39,46,60,61` | `c.classLevel` for grouping (leave `selectionMode`/`selectedGrade` local state names — see Task 8 non-goals) |

- [ ] **Step 7: Typecheck and run the web tests**

```bash
cd /d/per/inkwelly/apps/web && bun run typecheck && bun test src/modules/__tests__ src/modules/students/__tests__
```
Expected: clean. `class-roster.test.ts:31` asserts the literal `"Class Level"` header — unchanged, still passes. `class-skeleton.test.ts` compares `<th>` labels; labels did not change, so it stays green. If a test asserts on the `grade` **key**, update the key, not the label.

- [ ] **Step 8: Commit (gated)** — list both sides of the deletion:

```bash
git add apps/web/src apps/web/src/modules/academics/school-settings/adminSchoolSettings/class-settings-card.tsx
git commit -m "feat(web): class level vocabulary, derived names, and Class Creation Mode removed" -- apps/web/src
```

---

### Task 5: Mobile — follow the contract so nothing reads `undefined` in silence

**Files:**
- Modify: `apps/mobile/src/modules/academics/components/adminClasses/{types.ts,AddClassDialog.tsx,ClassDetailDialog.tsx}`, `src/app/(admin)/(tabs)/classes.tsx`, `src/app/(staff)/(tabs)/classes.tsx` (re-export), `src/modules/academics/components/adminPromotions/{utils.ts,types.ts,PromotionsComponent.tsx,BulkPromoteTab.tsx,GraduatedTab.tsx}`, `src/app/(admin)/(tabs)/school-settings.tsx`, `src/modules/tenancy/components/SchoolSettingsModal.tsx`, `src/modules/certificates/components/adminCertificates/{types.ts,printHelper.ts,ViewCertificateDialog.tsx}`

**Interfaces:**
- Consumes: Task 3's POST/PUT body (no `name`, no `slug`) and Task 2's `GET /api/classes` item.
- Produces: nothing other apps depend on.

- [ ] **Step 1: Understand the failure mode before editing.** `api.get<T = any>` (`src/lib/api.ts:334`) and mobile's own `Class`/`ClassOption` interfaces both still declare `grade`, so mobile **typechecks clean and breaks at runtime** — `Grade undefined` in dialogs, and `getNumericGrade(undefined) → 0` collapsing every promotion comparison. Editing the interfaces (`types.ts:5`, `adminPromotions/types.ts:24`) is what makes the rest loud; do those two first and let `tsc` find the remainder.

- [ ] **Step 2: Rename the level, delete the mapper**

`adminClasses/types.ts:5` `grade: string;` → `classLevel: string;`. `:17-26 getMappedGradeFromName` is deleted — its only job was translating a hand-typed name back to a level, and the name is no longer typed anywhere. Rename `getNumericGrade` → `getNumericLevel` in `adminPromotions/utils.ts:14-18` and keep its `if (!…)` guard, which becomes load-bearing.

- [ ] **Step 3: Class create/edit sends the level only**

`src/app/(admin)/(tabs)/classes.tsx`: `[classLevel, setClassLevel]` (`:48`, `:128`, `:325-326`), `setClassLevel(cls.classLevel || '')` (`:139`), and the payload at `:146-161` loses `finalGrade`, the `enableGradeSelection` branch, and `name:` — it becomes `{ section, classLevel: classLevel.trim(), capacity, classTeacherId }` (PUT adds `id`). The error copy at `:148` becomes `'Please select a class level.'`. `:168`'s `classGrade` read becomes `item.classLevel`.

`AddClassDialog.tsx`: `classLevel`/`setClassLevel` props (`:18-19`, `:40-41`), the `enableGradeSelection` prop and its gate deleted (`:25`, `:47`, `:126`) so the level picker always renders, `gradePickerVisible` → `classLevelPickerVisible` (`:57`, `:310-311`, `:340`), and copy `Grade *`/`Select Grade`/`Grade ${…}` → `Class level *`/`Select class level`/`Class ${item}` for numeric rows (`:130`, `:137`, `:314`, `:330`). The name picker stays a picker but stops driving a level (`:247-262`): with the server deriving the name, mobile's create sheet should read as level + section + capacity + teacher.

- [ ] **Step 4: Reads and remaining flags**

`ClassDetailDialog.tsx:64,105-106` → `{selectedClass.classLevel}` with the label `CLASS LEVEL`. `adminPromotions` components → `(Class ${c.classLevel})` (`PromotionsComponent.tsx:473`, `BulkPromoteTab.tsx:105,136`, `GraduatedTab.tsx:121`); `types.ts:9,12` `fromClassGrade`/`toClassGrade` → `fromClassLevel`/`toClassLevel` to match Task 2. Delete the `enableGradeSelection` switch rows and plumbing in `school-settings.tsx:37,53,102,240-251` and `SchoolSettingsModal.tsx:39,57,98,211-219`. `adminCertificates` reads `content.class.classLevel` (`types.ts:11`, `:66`, `printHelper.ts:12`, `ViewCertificateDialog.tsx:94`) — safe, because **nothing in the server writes a Certificate row**, so there are no legacy snapshots to read; the `Class / Grade` display labels at `printHelper.ts:88` and `ViewCertificateDialog.tsx:92` stay (they mean letter grade).

- [ ] **Step 5: Typecheck**

```bash
cd /d/per/inkwelly/apps/mobile && bun run typecheck
```
Expected: clean. Any leftover `.grade` read on a renamed interface is a compile error now — fix it, do not re-widen the type.

- [ ] **Step 6: Commit (gated)**

```bash
git add apps/mobile/src
git commit -m "feat(mobile): follow the classLevel contract and drop the class-name picker" -- apps/mobile/src
```

---

### Task 6: Seed and backfill scripts, then a clean re-seed

**Files:**
- Modify: `apps/server/src/db/seed.ts` (classes insert block, `:168`, `:189`), `src/db/full_seed_data.ts`, `src/db/backfill_class_slugs.ts`

**Interfaces:**
- Consumes: `deriveClassName` (Task 1), `Class.classLevel` (Task 2).

- [ ] **Step 1: Make the seed use the same rule the server uses**

`seed.ts` classes block: import `deriveClassName` from `../lib/validation/class` and insert `classLevel: String(Math.floor(i / 2) + 1)` with `name: deriveClassName(String(Math.floor(i / 2) + 1))` — the seed writes through `db.insert`, bypassing the route, so it must apply the rule itself. `rollNumber: \`${c.classLevel}${c.section}${…}\`` (`:168`) and the subject code (`:189`) follow the renamed key. Same treatment for `full_seed_data.ts:279-285` (`classLevels` list, derived name) and `:326,355,357,502`.

- [ ] **Step 2: Re-seed demo-academy**

```bash
cd /d/per/inkwelly/apps/server && bun run db:migrate && bun run db:seed
```
Expected: the wipe-and-seed completes for `demo-academy` (the tenant-scoped wipe from `e7ff390`, so `loadtest-academy`'s 1,081,424 attendance rows survive).

- [ ] **Step 3: Verify the rows from the database, not the screen**

Write `apps/server/scratch-verify.ts`:

```ts
import postgres from "postgres";
const sql = postgres(Bun.env.DATABASE_URL!, { max: 1 });
const cols = await sql`select column_name from information_schema.columns
  where table_name = 'Class' and table_schema = 'public' order by 1`;
console.log('columns:', cols.map(c => c.column_name).join(', '));
const idx = await sql`select indexname from pg_indexes where tablename = 'Class' order by 1`;
console.log('indexes:', idx.map(i => i.indexname).join(', '));
const rows = await sql`
  select tn.slug tenant, count(*) total,
         count(*) filter (where c.name = 'Class ' || c."classLevel") derived_ok,
         count(*) filter (where c.name like 'Grade%') grade_named
  from "Class" c join "Tenant" tn on tn.id = c."tenantId" group by 1 order by 1`;
console.table(rows);
await sql.end();
```

Run `bun scratch-verify.ts`. Expected: `columns` lists `classLevel` and no `grade`; `indexes` lists `Class_classLevel_idx` and `Class_tenantId_classLevel_idx`; `demo-academy` shows 20 total / 20 `derived_ok` / 0 `grade_named`; `loadtest-academy` keeps its one `grade_named` row (decided: left alone — renaming it collides with the existing `Class 1 - A` on the unique index). Then `rm apps/server/scratch-verify.ts` and confirm `git status --short` is clean of it.

- [ ] **Step 4: Commit (gated)**

```bash
git add apps/server/src/db
git commit -m "feat(db): the seed derives class names from the level like the server does" -- apps/server/src/db
```

---

### Task 7: Prove it end to end

**Files:** none modified unless a check fails.

- [ ] **Step 1: All three apps typecheck, one at a time**

```bash
cd /d/per/inkwelly/apps/server && bun run typecheck; echo "SERVER=$?"
cd /d/per/inkwelly/apps/web && bun run typecheck; echo "WEB=$?"
cd /d/per/inkwelly/apps/mobile && bun run typecheck; echo "MOBILE=$?"
```
Expected: three zeros. A hang or exit 134 means you ran the root script — see Global Constraints.

- [ ] **Step 2: Server tests**

```bash
cd /d/per/inkwelly/apps/server && bun test
```
Expected: pass. Docker Desktop must be running.

- [ ] **Step 3: The exhaustive vocabulary audit, with a positive control**

```bash
cd /d/per/inkwelly && grep -rn "schema\.classes\.grade\|\bclassGrade\b\|autoClassName\|formatGradeLabel\|CLASS_GRADES\|enableGradeSelection" apps --include=*.ts --include=*.tsx; echo "AUDIT_EXIT=$?"
grep -rn "schema\.classes\.classLevel" apps/server/src --include=*.ts | head -3
```
Expected: the first command prints nothing (exit 1). The second must print lines — without it, "nothing found" is not evidence.

Then the raw-SQL blind spot that typecheck cannot see:

```bash
grep -rn 'sql`[^`]*\."grade"\|sql`[^`]*c\.grade' apps/server/src --include=*.ts
```
Expected: nothing. This is what catches `backfill_student_status_and_gaps.ts:251`.

- [ ] **Step 4: Live write test against the running server**

Start it (`cd apps/server && bun run dev`, or reuse the watcher — note a stale non-watch listener on `:4000` serves pre-edit code, so prove the revision by process identity, not by port). Log in as the admin with `test@123`, then:

| call | expected |
|---|---|
| `POST /api/classes {classLevel:"8",section:"C"}` | 201/200, row `name === "Class 8"`, `classLevel === "8"`, slug `class-8-c` |
| `POST /api/classes {classLevel:"LKG",section:"A"}` | `name === "LKG"` |
| `POST` the same level+section twice | 400 `Class "Class 8 - C" already exists for this school` |
| `POST /api/classes {classLevel:"7",section:"A",name:"Blue House 7",slug:"blue"}` | 2xx and the stored name is `Class 7` — the extra keys ignored, proving the schema is not `.strict()` and an old client fails loudly on `classLevel` only |
| `PUT /api/classes {id, capacity:44}` | name and slug unchanged (the Task 3 guard) |
| `PUT /api/classes {id, classLevel:"9"}` | name `Class 9`, slug moved |
| `GET /api/classes?sortBy=classLevel` | 200 ordered; `?sortBy=grade` → 400 (deliberate, no client sends it) |

- [ ] **Step 5: Browser pass on the shipped surface**

`cd apps/web && bun run dev` (one `next dev` on this tree only — a second kills the first). On `/academics/classes`: create a class from the shortened form and confirm no Class name / Slug inputs exist and the row reads `Class 8`; edit capacity and confirm the detail URL does not move; filter by Class level and sort by Class Level; open the class detail page; then `/academics/school-settings` with the Class Creation Mode card gone and the remaining cards intact; `/examinations/admit-cards` generate a card and read the class line. Verify with the network log that the requests are 200 and the payload keys are `classLevel` — rendered text alone is not evidence, since a silent 404 looks exactly like a healthy empty state.

- [ ] **Step 6: Report the residuals honestly**

State plainly: the one `Grade 1 | A` row left in `loadtest-academy`; that the remote Render DB was not migrated; that `apps/mobile` compiles but its screens were not exercised (deferred scope); that the `Certificate` table has no server writer so the mobile certificate reader was renamed against a contract nothing currently produces.

---

### Task 8: Non-goals, deliberately left in the codebase

Recorded so a reviewer does not "helpfully" finish them:

- **Exam wizard local state** — `selectionMode: 'section' | 'grade'`, `selectedGrade`, `handleSelectGrade` (`adminExams/wizard/*`, `CreateExamWizard.tsx:60-61,124`). Class-level vocabulary, but entirely internal to one component boundary, never on the wire, and no admin sees the word. Renaming it is ~6 files of churn with zero user-visible effect.
- **`STUDENTS_YOUNGER_THAN_GRADE`** and the marks-scale `grade` family — see Global Constraints.
- **Stored slugs of the old shape** (`grade-1-a` on rows renamed to `Class 1` last slice). Live URL keys; corrected on the next genuine name/section change, never rewritten in bulk.
- **A real admissions table** (`inquiry → approved → rejected`). Today admission facts are `Student.admissionDate`/`admissionNo` plus `StudentIdSetting`; no `Admission` table exists, by design. Building the pipeline is its own spec.
- **The queued "Security: guards + write-path validation" slice** — separate plan, separate approval.
