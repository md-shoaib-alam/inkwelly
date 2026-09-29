import { test, expect, describe } from "bun:test";
import { buildWhereConditions, type StudentListParams } from "./student.service";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { count } from "drizzle-orm";

/**
 * The status filter is the reason two screens of the same school disagree: a list asked
 * for "all" carries no status condition at all, so it counts students who left. These
 * pins read the compiled SQL rather than the rendered rows, because the difference
 * between `= 'active'` and no condition is invisible until somebody adds a withdrawal.
 */
const compiled = (over: Partial<StudentListParams> = {}) =>
  db
    .select({ n: count() })
    .from(schema.students)
    .where(
      buildWhereConditions("t1", { tenantId: "t1", ...over }),
    )
    .toSQL();

const shape = (q: { sql: string; params: unknown[] }) => ({
  text: q.sql.replace(/\s+/g, " "),
  params: q.params.map(String),
});

describe("the student list status filter", () => {
  test("active narrows to the status column", () => {
    const { text, params } = shape(compiled({ status: "active" }));
    expect(text).toMatch(/"status" = /);
    expect(params).toContain("active");
  });

  test("no status at all defaults to active, not to everything", () => {
    const { text, params } = shape(compiled());
    expect(text).toMatch(/"status" = /);
    expect(params).toContain("active");
  });

  test("all drops the status condition entirely", () => {
    const { text } = shape(compiled({ status: "all" }));
    expect(text).not.toMatch(/"status"/);
  });

  test("inactive means not active, because no row ever stores the word", () => {
    // The option is offered on the roster and on Class Change. Matching it literally
    // returned zero rows, which reads as an empty school rather than a broken filter.
    const { text, params } = shape(compiled({ status: "inactive" }));
    expect(text).toMatch(/"status" <> /);
    expect(params).toContain("active");
    expect(params).not.toContain("inactive");
  });

  test("a withdrawn student is inactive and an active one is not", () => {
    // The guard has to sit on status alone; `deletedAt` is a different kind of gone.
    const { text } = shape(compiled({ status: "inactive" }));
    expect(text).toMatch(/"deletedAt"/);
  });
});
