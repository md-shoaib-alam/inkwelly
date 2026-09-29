import { test, expect, describe } from "bun:test";
import { and, count, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import {
  academicOf,
  addressesOf,
  countsOf,
  guardiansOf,
  isTab,
  keySafeRef,
  refConditions,
  summaryOf,
  type StudentRow,
} from "./profile.routes";

/**
 * The profile is addressed by whatever the school has on paper — the student ID on
 * the card, the roll number on the roster, or the internal id every older deep link
 * was built from. All three have to resolve, and all three have to resolve *inside
 * one tenant*. These pins read the compiled SQL instead of rendered rows because a
 * missing tenant condition returns the right shape with somebody else's data.
 */
const compiled = (ref: string, tenantId = "t1") =>
  db
    .select({ id: schema.students.id })
    .from(schema.students)
    .innerJoin(schema.users, eq(schema.students.userId, schema.users.id))
    .where(and(...refConditions(ref, tenantId)))
    .toSQL();

const shape = (q: { sql: string; params: unknown[] }) => ({
  text: q.sql.replace(/\s+/g, " "),
  params: q.params.map(String),
});

describe("the profile ref lookup", () => {
  test("accepts all three spellings of a student", () => {
    const { text, params } = shape(compiled("STU2026120"));
    expect(text).toMatch(/"User"."username" = /);
    expect(text).toMatch(/"Student"."rollNumber" = /);
    expect(text).toMatch(/"Student"."id" = /);
    // The same ref is bound three times; a fourth would mean it leaked into another column.
    expect(params.filter((p) => p === "STU2026120")).toHaveLength(3);
  });

  test("stays inside the caller's tenant", () => {
    // tenantId comes from the JWT, never the query string, but the SQL still has to use it.
    const { text, params } = shape(compiled("STU2026120", "tenant-9"));
    expect(text).toMatch(/"User"."tenantId" = /);
    expect(params).toContain("tenant-9");
  });

  test("does not resolve a student who was deleted", () => {
    const { text } = shape(compiled("STU2026120"));
    expect(text).toMatch(/"Student"."deletedAt" is null/);
  });

  test("takes the ref as a bound parameter, never as SQL text", () => {
    // The ref is user-typed and lands in the path segment of every profile link.
    const hostile = "x' OR 1=1 --";
    const { text, params } = shape(compiled(hostile));
    expect(params).toContain(hostile);
    expect(text).not.toContain(hostile);
  });
});

describe("the profile tab vocabulary", () => {
  test("only the four backed tabs are addressable", () => {
    expect(["summary", "family", "academic", "addresses"].every(isTab)).toBe(true);
  });

  test("an unbacked tab is not a tab, so it can never be requested", () => {
    // Bank details, documents, requests and UDISE+ have no schema behind them. The
    // client renders "not collected yet" for those without a fetch; a typo here would
    // turn that honest frame into a 404 on an endpoint nobody built.
    for (const name of ["bank-details", "documents", "requests", "udise", "fees", "SUMMARY", ""]) {
      expect(isTab(name)).toBe(false);
    }
    expect(isTab(undefined)).toBe(false);
    expect(isTab(7)).toBe(false);
  });
});

describe("the profile cache key", () => {
  test("neutralises the glob characters the write purge matches on", () => {
    // The purge runs `*students*<tenantId>*`. A ref carrying `*` or `:` would let a
    // crafted path segment widen — or collapse — that pattern.
    expect(keySafeRef("a*b:c?d")).toBe("a_b_c_d");
    expect(keySafeRef("STU2026120")).toBe("STU2026120");
    expect(keySafeRef("a/b")).toBe("a_b");
  });

  test("bounds the ref so a long path segment cannot make an unbounded key", () => {
    expect(keySafeRef("z".repeat(500)).length).toBe(128);
  });
});

// The mappers below are pure functions over one joined row, so a stub built from the
// columns each one reads is enough — no database, no container.
const row = (over: Record<string, unknown> = {}) =>
  ({
    id: "s1",
    parentId: null,
    classId: null,
    className: null,
    classSection: null,
    address: null,
    username: "STU2026120",
    rollNumber: "12",
    name: "Ayesha",
    status: "active",
    parentAccountName: null,
    fatherTitle: null,
    fatherFirstName: null,
    fatherMiddleName: null,
    fatherLastName: null,
    fatherMobile: null,
    fatherEducation: null,
    fatherWorkAddress: null,
    parentOccupation: null,
    motherTitle: null,
    motherFirstName: null,
    motherMiddleName: null,
    motherLastName: null,
    motherMobile: null,
    motherOccupation: null,
    motherEducation: null,
    motherWorkAddress: null,
    transportId: null,
    transportRouteName: null,
    ...over,
  }) as unknown as StudentRow;

describe("guardian cards", () => {
  test("a family with nothing recorded produces no cards", () => {
    expect(guardiansOf(row())).toEqual([]);
  });

  test("a mobile alone is still a guardian worth showing", () => {
    const cards = guardiansOf(row({ fatherMobile: "98765" }));
    expect(cards).toHaveLength(1);
    expect(cards[0]?.relation).toBe("father");
    expect(cards[0]?.name).toBeNull();
  });

  test("the four father name parts join into one name", () => {
    const cards = guardiansOf(
      row({ fatherTitle: "Mr", fatherFirstName: "Rahul", fatherMiddleName: "K", fatherLastName: "Sharma" }),
    );
    expect(cards[0]?.name).toBe("Mr Rahul K Sharma");
  });

  test("primary marks the guardian whose name is the login account", () => {
    // The account belongs to whichever parent signed up, and the roster stores both
    // names, so the match is the only evidence of who the login is.
    const cards = guardiansOf(
      row({
        parentAccountName: " Rahul Sharma ",
        fatherFirstName: "Rahul",
        fatherLastName: "Sharma",
        motherFirstName: "Sunita",
      }),
    );
    expect(cards.find((c) => c.relation === "father")?.isPrimary).toBe(true);
    expect(cards.find((c) => c.relation === "mother")?.isPrimary).toBe(false);
  });

  test("nothing is primary when the family has no login", () => {
    const cards = guardiansOf(row({ fatherFirstName: "Rahul", motherFirstName: "Sunita" }));
    expect(cards.every((c) => c.isPrimary === false)).toBe(true);
  });

  test("a guardian without a name is never primary", () => {
    // Matching an empty name against an empty account would mark every card primary.
    expect(guardiansOf(row({ parentAccountName: "", fatherMobile: "98765" }))[0]?.isPrimary).toBe(false);
  });

  test("both parents show when both are recorded", () => {
    const cards = guardiansOf(row({ fatherFirstName: "Rahul", motherFirstName: "Sunita" }));
    expect(cards.map((c) => c.relation)).toEqual(["father", "mother"]);
  });
});

describe("tab counts", () => {
  test("family counts guardians and siblings together", () => {
    expect(countsOf(row(), [1, 2], [3]).family).toBe(3);
    expect(countsOf(row(), [], []).family).toBe(0);
  });

  test("academic is zero until the student actually sits in a class", () => {
    // classId can survive a deleted class row, so the joined name has to agree.
    expect(countsOf(row({ classId: "c1", className: "Five" }), [], []).academic).toBe(1);
    expect(countsOf(row({ classId: "c1", className: null }), [], []).academic).toBe(0);
    expect(countsOf(row(), [], []).academic).toBe(0);
  });

  test("addresses is zero for a blank address, including whitespace", () => {
    expect(countsOf(row({ address: " 12 Ring Road " }), [], []).addresses).toBe(1);
    expect(countsOf(row({ address: "   " }), [], []).addresses).toBe(0);
    expect(countsOf(row({ address: "" }), [], []).addresses).toBe(0);
    expect(countsOf(row(), [], []).addresses).toBe(0);
  });
});

describe("tab payloads", () => {
  // The UI fetches one tab per request, so a tab that answers more than it was asked
  // is a tab the next request will duplicate. These key sets are that boundary.
  test("summary answers the student, not the family", () => {
    const r = row({ fatherFirstName: "Rahul", motherFirstName: "Sunita", address: "12 Ring Road" });
    expect(Object.keys(summaryOf(r)).sort()).toEqual([
      "compliance",
      "contact",
      "identifiers",
      "personal",
      "transport",
    ]);
  });

  test("only the family tab returns guardians", () => {
    expect(summaryOf(row())).not.toHaveProperty("guardians");
    expect(academicOf(row())).not.toHaveProperty("guardians");
    expect(addressesOf(row())).not.toHaveProperty("guardians");
  });

  test("academic returns the enrolment and nothing else", () => {
    const payload = academicOf(row({ classId: "c1", className: "Five", classSection: "A" }));
    expect(Object.keys(payload)).toEqual(["enrolment"]);
    expect(payload.enrolment.className).toBe("Five - A");
  });

  test("addresses returns trimmed entries, and none when the field is blank", () => {
    expect(Object.keys(addressesOf(row({ address: "  12 Ring Road " }))).sort()).toEqual(["entries"]);
    expect(addressesOf(row({ address: "  12 Ring Road " })).entries[0]?.value).toBe("12 Ring Road");
    expect(addressesOf(row({ address: "   " })).entries).toEqual([]);
    expect(addressesOf(row()).entries).toEqual([]);
  });

  test("transport is null rather than an empty object when the student has no assignment", () => {
    // An empty object renders a transport card with no route on it.
    expect(summaryOf(row()).transport).toBeNull();
    expect(summaryOf(row({ transportId: "ta1", transportRouteName: "North loop" })).transport).toMatchObject({
      routeName: "North loop",
    });
  });
});
