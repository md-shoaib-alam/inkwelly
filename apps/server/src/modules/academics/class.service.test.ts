import { test, expect, describe } from "bun:test";
import {
  PROFILE_COMPLETE_FIELDS,
  completeProfileCondition,
  classCacheKey,
} from "./class.service";
import { profileFieldCount } from "../students";

/**
 * The class roster shows a Completion bar per class and the Students dashboard
 * shows one tenant-wide figure. Both have to mean the same thing, so the class
 * side is written against the dashboard's own function rather than a copy of it.
 */
describe("the class completion bar and the dashboard agree", () => {
  const blank = { dateOfBirth: null, bloodGroup: null, parentId: null, rollNumber: null };

  test("each named field is worth exactly one of the four", () => {
    for (const field of PROFILE_COMPLETE_FIELDS) {
      expect(profileFieldCount({ ...blank, [field]: "x" })).toBe(1);
    }
  });

  test("the four are the whole rule — nothing else counts, and all four is complete", () => {
    expect(PROFILE_COMPLETE_FIELDS).toHaveLength(4);
    expect(profileFieldCount({
      dateOfBirth: "2011-07-08", bloodGroup: "B+", parentId: "p1", rollNumber: "12",
    })).toBe(4);
  });

  test("whitespace is not a filled-in field, which is why the SQL trims", () => {
    expect(profileFieldCount({ ...blank, rollNumber: "   " })).toBe(0);
    for (const clause of completeProfileCondition(PROFILE_COMPLETE_FIELDS).split(" and ")) {
      expect(clause).toContain("btrim(");
    }
  });
});

describe("the completion condition covers every field it claims", () => {
  test("one trimmed, non-blank test per field, all ANDed", () => {
    const sql = completeProfileCondition(["a", "b"]);
    expect(sql).toBe(`coalesce(btrim(s."a"), '') <> '' and coalesce(btrim(s."b"), '') <> ''`);
  });

  test("the Student table still carries all four columns", () => {
    // If a column is renamed the SQL fails at runtime with no useful message, so
    // this catches it here instead.
    const { students } = require("../../db/schema");
    for (const field of PROFILE_COMPLETE_FIELDS) {
      expect(students[field]).toBeDefined();
    }
  });
});

test("the paginated cache key is versioned for the row shape", () => {
  // Rows gained profileCompletePercent. Without the bump, entries written before
  // it would keep serving rows that lack the field for the rest of their TTL.
  const key = classCacheKey({ tenantId: "t1" } as never, "all");
  expect(key.startsWith("classes:paginated:v4:t1:")).toBe(true);
});
