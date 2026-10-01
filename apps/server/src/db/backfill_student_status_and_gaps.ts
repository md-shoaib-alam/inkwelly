import { sql } from "drizzle-orm";
import { db } from "../lib/db";

/**
 * Gives the Students command center something to plot.
 *
 * The local seed gives every student the same admission date, the same status, and — in the
 * load-test tenant — the same date of birth and an empty blood group. Those are not wrong
 * numbers, they are absent ones, and a screen over them is unreadable rather than incorrect:
 * one admissions bar, no withdrawals, one age band, no birthdays. So this spreads the local
 * cohort the way a mid-sized school's own records would be spread.
 *
 * Idempotent by construction: every value is a hash of the student's id (and, for a date of
 * birth, their class's grade) and each `UPDATE` compares the row against the value about to
 * be written. A second run computes the same plan, matches nothing, and reports zeroes.
 * Nothing is derived from a row's current contents, which would make the result depend on
 * how many times the script had already run.
 *
 * Local data only. It rewrites admission history and dates of birth that a real school's
 * records own.
 */

/** Roughly one student in twelve leaves, so the movement chart has a visible second series. */
export const WITHDRAWAL_RATE = 0.08;
/** Graduation is its own per-year event, not a share of the leavers. */
export const GRADUATION_RATE = 0.04;
/** Some records are left with one field blank, which is what makes completeness a number. */
export const PROFILE_GAP_RATE = 0.1;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

/**
 * FNV-1a with a final avalanche, stable across runs and machines unlike `Math.random()`.
 *
 * The mixing matters more than it looks: FNV-1a's low bits are a near-linear function of the
 * input's, so `% 52` on sequential ids hits only half the slots and a grade's birthdays land
 * on 26 of 52 weeks. Every modulus in this file goes through here.
 */
function hash32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function hitsRate(id: string, salt: string, rate: number): boolean {
  return hash32(`${salt}:${id}`) % 10000 < Math.round(rate * 10000);
}

function pick<T>(salt: string, id: string, list: readonly T[]): T | null {
  if (list.length === 0) return null;
  return list[hash32(`${salt}:${id}`) % list.length] ?? null;
}

/** The trailing twelve `YYYY-MM` keys, oldest first, so nothing is ever written in the future. */
export function trailingMonths(today: Date, span = 12): string[] {
  const out: string[] = [];
  for (let back = span - 1; back >= 0; back--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/**
 * A `YYYY-MM-DD` inside `month`, on a day that month really has — day 31 is skipped so a
 * February admission is not pushed into March. In the current month it never runs past today.
 */
export function spreadDate(id: string, salt: string, month: string, today: Date): string | null {
  const parts = month.split("-").map(Number);
  const year = parts[0];
  const mon = parts[1];
  if (!year || !mon) return null;
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const raw = (hash32(`${salt}:day:${id}`) % lastDay) + 1;
  const inCurrentMonth =
    month === `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const day = inCurrentMonth ? Math.min(raw, today.getUTCDate()) : raw;
  return `${month}-${String(day).padStart(2, "0")}`;
}

export type StudentPlan = {
  admissionDate: string | null;
  status: "active" | "withdrawn" | "graduated";
  /** Set only for a leaver: a withdrawal has no column of its own, so `updatedAt` is its date. */
  leftOn: string | null;
  /**
   * The blood group to fill in, or null for the share of records that stay incomplete so
   * completeness is a figure rather than a certainty. Null writes nothing: this only ever
   * adds a value, it never blanks a column a school has already filled.
   */
  bloodGroup: string | null;
  /**
   * A date of birth consistent with the grade the student sits in, or null when the class
   * has no readable grade — a date invented for a class we cannot read would be the worst
   * kind of dummy data, because nothing could contradict it.
   */
  dateOfBirth: string | null;
};

/**
 * The age a grade expects, duplicated here rather than imported.
 *
 * `students-dashboard.service.ts` exports `expectedMinAgeForGrade` and the service owns the
 * real rule; a test pins the two together. The alternative — importing the service — would
 * make `src/db` depend on `src/modules`, which then imports `src/db` again.
 */
function nepAgeFloor(grade: string | number | null | undefined): number | null {
  const g = typeof grade === "number" ? grade : Number.parseInt(String(grade ?? ""), 10);
  if (!Number.isFinite(g) || g < 1 || g > 12) return null;
  return g + 5;
}

/**
 * A date of birth that reads as exactly `age` whole years on `today`.
 *
 * The age sits one to two years above the grade's floor, and `ageYearsOn` at the session
 * start can only ever read lower than it does today — so a backfilled child is never young
 * enough for the dashboard's own `STUDENTS_YOUNGER_THAN_GRADE` alert to fire on. An alert
 * the seed itself created is not an insight.
 *
 * The offset is day-wide rather than weekly: the birthday tile then reads as a list of
 * dates instead of ten children sharing one. Cost is a few thousand one-line `UPDATE`s
 * against localhost, which finishes in well under a minute.
 */
export function birthDateFor(
  id: string,
  grade: string | number | null,
  today: Date,
): string | null {
  const floor = nepAgeFloor(grade);
  if (floor === null) return null;
  const age = floor + 1 + (hash32(`age:${id}`) % 2);
  // Under a year back, so whole years elapsed on `today` is exactly `age`.
  const offset = hash32(`dob:${id}`) % 364;
  const birth = Date.UTC(today.getUTCFullYear() - age, today.getUTCMonth(), today.getUTCDate());
  const d = new Date(birth - offset * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Everything the backfill writes for one student, from their id and their class's grade. */
export function planFor(
  id: string,
  months: string[],
  today: Date,
  grade: string | number | null = null,
): StudentPlan {
  const admissionMonth = pick("adm", id, months);
  const admissionDate = admissionMonth
    ? spreadDate(id, "adm", admissionMonth, today)
    : null;
  const status: StudentPlan["status"] = hitsRate(id, "wd", WITHDRAWAL_RATE)
    ? "withdrawn"
    : hitsRate(id, "gr", GRADUATION_RATE)
      ? "graduated"
      : "active";
  const leftMonth = status === "withdrawn" ? pick("left", id, months) : null;
  const leftOn = leftMonth ? spreadDate(id, "left", leftMonth, today) : null;
  return {
    admissionDate,
    status,
    leftOn,
    dateOfBirth: birthDateFor(id, grade, today),
    bloodGroup: hitsRate(id, "gap", PROFILE_GAP_RATE)
      ? null
      : pick("bg", id, BLOOD_GROUPS),
  };
}

export type Planned = { id: string; plan: StudentPlan };

type Column = "admissionDate" | "status" | "leftOn" | "bloodGroup" | "dateOfBirth";
/** The columns this run owns, and the only ones it writes. */
export const COLUMNS: Column[] = [
  "admissionDate",
  "status",
  "leftOn",
  "bloodGroup",
  "dateOfBirth",
];

/**
 * Ids sharing one planned value, per column.
 *
 * Grouping by the *whole* plan would not help: `admissionDate` alone has ~350 values, so
 * 5,401 students would form nearly as many groups as rows. One group per column value is
 * what turns the run into a few hundred statements.
 */
export function columnGroups(plans: Planned[]): Record<Column, Map<string, string[]>> {
  const out = {
    admissionDate: new Map<string, string[]>(),
    status: new Map<string, string[]>(),
    leftOn: new Map<string, string[]>(),
    bloodGroup: new Map<string, string[]>(),
    dateOfBirth: new Map<string, string[]>(),
  };
  for (const { id, plan } of plans) {
    for (const column of COLUMNS) {
      const value = plan[column];
      if (value === null) continue;
      const bucket = out[column].get(value);
      if (bucket) bucket.push(id);
      else out[column].set(value, [id]);
    }
  }
  return out;
}

/** Keeps one statement's parameter list well inside Postgres' 65,535 ceiling. */
export function chunk<T>(items: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function inList(ids: string[]): ReturnType<typeof sql.join> {
  return sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
}

function rowCount(result: unknown): number {
  const value = (result as { count?: unknown } | null)?.count;
  return typeof value === "number" ? value : 0;
}

export type BackfillResult = {
  scanned: number;
  admissionDates: number;
  statuses: number;
  leftOns: number;
  bloodGroups: number;
  datesOfBirth: number;
  noGrade: number;
};

export async function backfillStudents(today: Date = new Date()): Promise<BackfillResult> {
  const months = trailingMonths(today);
  // The grade comes from `Class`, because a date of birth means nothing on its own — it is
  // only sensible against the grade the child sits in.
  const rows = await db
    .select({ id: sql<string>`s.id`, grade: sql<string | null>`c."classLevel"` })
    .from(sql`"Student" s`)
    .leftJoin(sql`"Class" c`, sql`c.id = s."classId"`)
    .orderBy(sql`s.id`);

  const groups = columnGroups(
    rows.map((r) => ({ id: r.id, plan: planFor(r.id, months, today, r.grade ?? null) })),
  );
  const out: BackfillResult = {
    scanned: rows.length,
    admissionDates: 0,
    statuses: 0,
    leftOns: 0,
    bloodGroups: 0,
    datesOfBirth: 0,
    noGrade: rows.filter((r) => nepAgeFloor(r.grade) === null).length,
  };

  for (const [value, ids] of groups.admissionDate) {
    for (const part of chunk(ids)) {
      out.admissionDates += rowCount(
        await db.execute(sql`
          UPDATE "Student" SET "admissionDate" = ${value}
          WHERE id IN (${inList(part)}) AND "admissionDate" IS DISTINCT FROM ${value}`),
      );
    }
  }

  for (const [value, ids] of groups.status) {
    for (const part of chunk(ids)) {
      out.statuses += rowCount(
        await db.execute(sql`
          UPDATE "Student" SET status = ${value}
          WHERE id IN (${inList(part)}) AND status IS DISTINCT FROM ${value}`),
      );
    }
  }

  // After the status pass, so `status = 'withdrawn'` is true of every id in this group and
  // the guard below cannot fire on a row that is still merely scheduled to leave.
  for (const [value, ids] of groups.leftOn) {
    const stamped = `${value}T00:00:00.000Z`;
    for (const part of chunk(ids)) {
      out.leftOns += rowCount(
        await db.execute(sql`
          UPDATE "Student" SET "updatedAt" = ${stamped}::timestamptz
          WHERE id IN (${inList(part)})
            AND status = 'withdrawn'
            AND "updatedAt" IS DISTINCT FROM ${stamped}::timestamptz`),
      );
    }
  }

  // A null in the plan means "leave this record incomplete", and `columnGroups` drops those
  // ids. The guard goes the other way: only an empty column is filled, so a value a school
  // already recorded is never replaced with one this script invented.
  for (const [value, ids] of groups.bloodGroup) {
    for (const part of chunk(ids)) {
      out.bloodGroups += rowCount(
        await db.execute(sql`
          UPDATE "Student" SET "bloodGroup" = ${value}
          WHERE id IN (${inList(part)})
            AND ("bloodGroup" IS NULL OR "bloodGroup" = '')`),
      );
    }
  }

  // Unlike `bloodGroup`, this one does overwrite: the seed gives every load-test student the
  // same date of birth, which is not a value worth protecting — it is the degenerate age
  // pyramid this pass exists to remove.
  for (const [value, ids] of groups.dateOfBirth) {
    for (const part of chunk(ids)) {
      out.datesOfBirth += rowCount(
        await db.execute(sql`
          UPDATE "Student" SET "dateOfBirth" = ${value}
          WHERE id IN (${inList(part)}) AND "dateOfBirth" IS DISTINCT FROM ${value}`),
      );
    }
  }

  return out;
}

if (import.meta.main) {
  const today = new Date();
  const r = await backfillStudents(today);
  console.log(
    `student backfill: ${r.scanned} row(s) considered as of ${today.toISOString().slice(0, 10)}`,
  );
  console.log(`  admission dates moved : ${r.admissionDates}`);
  console.log(`  statuses set          : ${r.statuses}`);
  console.log(`  withdrawal dates set  : ${r.leftOns}`);
  console.log(`  blood groups filled   : ${r.bloodGroups}`);
  console.log(`  dates of birth set    : ${r.datesOfBirth}`);
  console.log(`  rows with no grade    : ${r.noGrade}`);
}
